/**
 * pudID 映射表抓取脚本（改进版）
 *
 * 策略：
 * 1. 通过 GetProductsV2 API 获取全部 productID 和 productName
 * 2. 访问172号卡店铺 /ProductEn/Shop/{agentId} 页面（已知含商品列表）
 * 3. 调用 /ProductEn/Index2/{agentId} 接口（带完整浏览器模拟）
 * 4. 对未命中商品，访问各商品的 H5 订单页尝试获取 pudID
 *
 * ======= 使用方法 =======
 *   node scripts/scrape-pudid.mjs
 * 或（推荐，自动读取 .env）：
 *   npm run scrape:pudid
 *
 * 输出文件：lib/data/pudid-map.json
 */

import { createHash } from "node:crypto";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* ========== 加载 .env ========== */
try {
  const envPath = join(__dirname, "..", ".env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
    console.log("[ENV] 已加载 .env 文件");
  }
} catch (e) {
  console.warn("[ENV] 加载 .env 失败:", e.message);
}

/* ========== 配置 ========== */
const USER_ID = process.env.HAOKA_USER_ID || "";
const SECRET = process.env.HAOKA_SECRET || "";
const AGENT_ID = process.env.HAOKA_AGENT_ID || "1a654e0b341cadd2";
const BASE_API = "https://haokaopenapi.lot-ml.com";
const BASE_SHOP = "https://haokawx.lot-ml.com";
const OUTPUT_PATH = join(__dirname, "..", "lib", "data", "pudid-map.json");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/* ========== 工具函数 ========== */

/**
 * 计算 MD5（32位小写）
 * @param {string} str
 */
function md5(str) {
  return createHash("md5").update(str, "utf8").digest("hex");
}

/**
 * 生成 GetProductsV2 签名
 * @param {string} productID
 * @param {string} timestamp
 */
function signProductList(productID, timestamp) {
  return md5(
    `ProductID=${productID}&Timestamp=${timestamp}&user_id=${USER_ID}${SECRET}`
  );
}

/**
 * 延迟
 * @param {number} ms
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ========== Step 1：获取全部 productID ========== */

/**
 * 调用 GetProductsV2 获取全部在售商品
 * @returns {Promise<{productID: number, productName: string}[]>}
 */
async function fetchAllProducts() {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const sign = signProductList("", timestamp);

  const form = new FormData();
  form.append("user_id", USER_ID);
  form.append("Timestamp", timestamp);
  form.append("ProductID", "");
  form.append("user_sign", sign);

  console.log("[Step 1] 调用 GetProductsV2 获取商品列表...");
  const res = await fetch(`${BASE_API}/api/order/GetProductsV2`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`GetProductsV2 HTTP ${res.status}`);

  const json = await res.json();
  if (json.code !== 0) throw new Error(`GetProductsV2 错误: ${json.message}`);

  const products = (json.data || []).filter((p) => p.flag);
  console.log(`[Step 1] 获取到 ${products.length} 个在售商品`);
  return products.map((p) => ({ productID: p.productID, productName: p.productName }));
}

/* ========== Step 2：抓取店铺首页 HTML 中的初始商品数据 ========== */

/**
 * 抓取店铺 ProductEn/Shop 页面（含初始加载的商品列表，可能有 pudID）
 * @returns {Promise<Record<string, string>>}
 */
async function scrapeShopPage() {
  console.log("\n[Step 2] 抓取店铺 Shop 页面...");
  const map = {};

  const urls = [
    `${BASE_SHOP}/ProductEn/Shop/${AGENT_ID}`,
    `${BASE_SHOP}/ProductEn/Index/${AGENT_ID}`,
  ];

  for (const url of urls) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const html = await res.text();

    // 从 HTML 中查找 pudID 模式（16位十六进制）
    const pudIdMatches = [...html.matchAll(/pudID=([0-9a-f]{16})/gi)];
    // 同时查找 productID
    const productIdMatches = [...html.matchAll(/productID['":\s]+(\d+)/gi)];

    console.log(
      `  ${url.slice(-30)}: pudID=${pudIdMatches.length} productID=${productIdMatches.length}`
    );

    // 尝试在相同上下文中关联 pudID 和 productID
    for (const m of pudIdMatches) {
      const context = html.slice(Math.max(0, m.index - 300), m.index + 300);
      const pidMatch = context.match(/productID['":\s]+(\d+)/i);
      if (pidMatch) {
        map[pidMatch[1]] = m[1];
      }
    }
  }

  console.log(`[Step 2] 从 HTML 提取 ${Object.keys(map).length} 个映射`);
  return map;
}

/* ========== Step 3：通过 Index2 接口尝试获取 pudID ========== */

/**
 * 尝试调用 Index2 获取 pudID（需要有效 session，可能失败）
 * @returns {Promise<Record<string, string>>}
 */
async function scrapeViaIndex2() {
  console.log("\n[Step 3] 尝试通过 Index2 接口获取 pudID...");
  const map = {};

  // 通过访问多个不同资源来尝试建立 session
  const initUrls = [
    `${BASE_SHOP}/ProductEn/Index/${AGENT_ID}`,
    `${BASE_SHOP}/ProductEn/Shop/${AGENT_ID}`,
  ];

  const cookieJar = {};

  for (const url of initUrls) {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
    });
    const newCookies = res.headers.getSetCookie?.() ?? [];
    for (const cookie of newCookies) {
      const [pair] = cookie.split(";");
      const eqIdx = pair.indexOf("=");
      if (eqIdx > -1) {
        cookieJar[pair.slice(0, eqIdx).trim()] = pair.slice(eqIdx + 1).trim();
      }
    }
    await sleep(200);
  }

  const cookieStr = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join("; ");
  console.log(`  Cookie: ${cookieStr ? cookieStr.slice(0, 60) : "(空)"}`);

  const params = [
    { title: "", PriceTime: "", LiuLiang: "", Tonghua: "", Province: "", City: "", redbook: "" },
    { title: "", PriceTime: "", LiuLiang: "", Tonghua: "", Province: "全部", City: "全部", redbook: "" },
  ];

  for (const param of params) {
    const body = new URLSearchParams(param);
    const res = await fetch(`${BASE_SHOP}/ProductEn/Index2/${AGENT_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA,
        Referer: `${BASE_SHOP}/ProductEn/Index/${AGENT_ID}`,
        Origin: BASE_SHOP,
        ...(cookieStr ? { Cookie: cookieStr } : {}),
      },
      body: body.toString(),
    });

    const json = await res.json().catch(() => null);
    if (!json || json.code !== 0 || !Array.isArray(json.data) || json.data.length === 0) {
      console.log(`  Index2 (${JSON.stringify(param).slice(0, 50)}): 无数据`);
      continue;
    }

    console.log(`  Index2 成功: ${json.data.length} 条`);
    for (const item of json.data) {
      if (item.tuiPath && item.productID) {
        const m = String(item.tuiPath).match(/pudID=([0-9a-f]+)/i);
        if (m) map[String(item.productID)] = m[1];
      }
    }

    if (Object.keys(map).length > 0) break;
    await sleep(300);
  }

  console.log(`[Step 3] Index2 获取 ${Object.keys(map).length} 个映射`);
  return map;
}

/* ========== Step 4：从 H5 订单跳转页提取 pudID ========== */

/**
 * 尝试通过 H5 跳转规律推导 pudID
 * 思路：某些商品的 netAddr 末尾 ID 与 pudID 可能有关联
 * @param {number} productID
 * @param {string} productName
 * @returns {Promise<string|null>}
 */
async function tryExtractPudidFromPage(productID, productName) {
  // 尝试访问已知可能包含 pudID 的页面
  const testUrls = [
    `${BASE_SHOP}/ProductEn/Shop/${AGENT_ID}/${productID}`,
  ];

  for (const url of testUrls) {
    try {
      const res = await fetch(url, {
        redirect: "manual",
        headers: { "User-Agent": UA },
      });

      if (res.status === 302) {
        const location = res.headers.get("location") || "";
        const m = location.match(/pudID=([0-9a-f]{16})/i);
        if (m) return m[1];
      }

      if (res.status === 200) {
        const html = await res.text();
        const m = html.match(/pudID=([0-9a-f]{16})/i);
        if (m) return m[1];
      }
    } catch {
      // 忽略单个请求失败
    }
  }
  return null;
}

/* ========== 主流程 ========== */

async function main() {
  if (!USER_ID || !SECRET) {
    console.error("❌ 缺少环境变量 HAOKA_USER_ID / HAOKA_SECRET");
    process.exit(1);
  }

  console.log(`\n=== 172号卡 pudID 映射表抓取脚本 ===`);
  console.log(`代理ID: ${AGENT_ID}`);
  console.log(`输出: ${OUTPUT_PATH}\n`);

  // Step 1
  let products;
  try {
    products = await fetchAllProducts();
  } catch (e) {
    console.error("❌ 获取商品列表失败:", e.message);
    process.exit(1);
  }

  const pudidMap = {};

  // Step 2: 从 HTML 提取
  const htmlMap = await scrapeShopPage();
  Object.assign(pudidMap, htmlMap);

  // Step 3: Index2 接口
  const idx2Map = await scrapeViaIndex2();
  Object.assign(pudidMap, idx2Map);

  // Step 4: 对未命中的商品，尝试从页面提取
  const missed = products.filter((p) => !pudidMap[String(p.productID)]);
  if (missed.length > 0 && missed.length <= 50) {
    console.log(`\n[Step 4] 对 ${missed.length} 个未命中商品进行单独抓取...`);
    let recovered = 0;
    for (const { productID, productName } of missed) {
      const pudID = await tryExtractPudidFromPage(productID, productName);
      if (pudID) {
        pudidMap[String(productID)] = pudID;
        recovered++;
        console.log(`  ✓ productID=${productID} → ${pudID}`);
      }
      await sleep(100);
    }
    console.log(`[Step 4] 补充 ${recovered} 个`);
  }

  // 统计
  const total = products.length;
  const matched = products.filter((p) => pudidMap[String(p.productID)]).length;

  console.log(`\n=== 结果 ===`);
  console.log(`商品总数: ${total}`);
  console.log(`匹配数:   ${matched}`);
  console.log(`覆盖率:   ${total > 0 ? ((matched / total) * 100).toFixed(1) : 0}%`);

  if (matched === 0) {
    console.log(`\n⚠️  pudID 映射表为空！`);
    console.log(`   172号卡的 pudID 只能从店铺内部接口获取（需要浏览器 Session）。`);
    console.log(`   建议使用 Playwright 运行浏览器自动化脚本来抓取。`);
    console.log(`   当前已采用搜索页兜底方案（用户点击"立即办理"将跳转到带关键词的搜索结果页）。`);
  }

  // 写入文件（即使为空也写入，防止文件不存在导致服务端 warn 频繁出现）
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(pudidMap, null, 2), "utf-8");
  console.log(`\n✅ 映射表已写入: ${OUTPUT_PATH} (${Object.keys(pudidMap).length} 条)`);
}

main().catch((e) => {
  console.error("❌ 异常:", e.message);
  process.exit(1);
});
