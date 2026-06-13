/**
 * pudID 映射表抓取脚本（Playwright 版）
 *
 * 原理：
 *   172号卡店铺的商品列表通过 /ProductEn/Index2/{agentId} AJAX 接口渲染，
 *   该接口在服务端通过 ASP.NET InProc Session 进行身份验证，
 *   必须由真实浏览器在访问首页后触发，才能建立有效 Session。
 *
 *   本脚本使用 Playwright 控制真实 Chromium 浏览器：
 *   1. 访问店铺首页，建立 Session
 *   2. 拦截 /ProductEn/Index2 的 AJAX 响应
 *   3. 从响应的 tuiPath 字段提取 pudID
 *   4. 切换筛选条件（省份/城市 = 全部）获取所有商品
 *   5. 将 productID → pudID 映射保存到 lib/data/pudid-map.json
 *
 * ======= 使用方法 =======
 *   npm run scrape:pudid:playwright
 *
 * ======= 更新时机 =======
 *   172号卡后台新增/下架商品时重新运行即可
 *
 * 输出：lib/data/pudid-map.json
 */

import { createHash } from "node:crypto";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ⚠️ 必须在 import playwright 之前设置（ES module import 是静态提升的，
//    但 PLAYWRIGHT_BROWSERS_PATH 在 chromium.launch() 时才读取，此处设置有效）
if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  // 默认使用项目内的 .playwright 目录，避免写入受限的 AppData
  process.env.PLAYWRIGHT_BROWSERS_PATH = join(__dirname, "..", ".playwright");
}

// 动态导入 playwright（确保环境变量先行设置）
const { chromium } = await import("playwright");

/* ========== 加载 .env ========== */
try {
  const envPath = join(__dirname, "..", ".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (k && !process.env[k]) process.env[k] = v;
    }
    console.log("[ENV] 已加载 .env 文件");
  }
} catch (e) {
  console.warn("[ENV] .env 加载失败:", e.message);
}

/* ========== 配置 ========== */
const USER_ID = process.env.HAOKA_USER_ID || "";
const SECRET = process.env.HAOKA_SECRET || "";
const AGENT_ID = process.env.HAOKA_AGENT_ID || "1a654e0b341cadd2";
const BASE_API = "https://haokaopenapi.lot-ml.com";
const BASE_SHOP = "https://haokawx.lot-ml.com";
const OUTPUT_PATH = join(__dirname, "..", "lib", "data", "pudid-map.json");

if (!USER_ID || !SECRET) {
  console.error("❌ 缺少环境变量 HAOKA_USER_ID / HAOKA_SECRET");
  process.exit(1);
}

/* ========== 工具函数 ========== */

/**
 * MD5（32位小写）
 * @param {string} str
 */
const md5 = (str) => createHash("md5").update(str, "utf8").digest("hex");

/**
 * 生成 GetProductsV2 接口签名
 * @param {string} productID
 * @param {string} timestamp
 */
const signProductList = (productID, timestamp) =>
  md5(`ProductID=${productID}&Timestamp=${timestamp}&user_id=${USER_ID}${SECRET}`);

/** 延迟 ms 毫秒 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ========== Step 1：获取全部 productID ========== */

/**
 * 调用开放 API 获取全部在售商品
 * @returns {Promise<number[]>}
 */
async function fetchAllProductIDs() {
  const ts = Math.floor(Date.now() / 1000).toString();
  const form = new FormData();
  form.append("user_id", USER_ID);
  form.append("Timestamp", ts);
  form.append("ProductID", "");
  form.append("user_sign", signProductList("", ts));

  console.log("[Step 1] 调用 GetProductsV2 获取商品列表...");
  const res = await fetch(`${BASE_API}/api/order/GetProductsV2`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message);

  const ids = (json.data || []).filter((p) => p.flag).map((p) => p.productID);
  console.log(`[Step 1] 获取到 ${ids.length} 个在售商品`);
  return ids;
}

/* ========== Step 2：Playwright 抓取 pudID ========== */

/**
 * 使用 Playwright 打开店铺页，拦截 Index2 AJAX 响应，提取全量 pudID 映射
 *
 * @param {number[]} productIDs - 全部 productID（用于统计覆盖率）
 * @returns {Promise<Record<string, string>>} productID(string) → pudID
 */
async function scrapePudidWithPlaywright(productIDs) {
  console.log("\n[Step 2] 启动 Playwright Chromium...");
  console.log(`  浏览器路径: ${process.env.PLAYWRIGHT_BROWSERS_PATH}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "zh-CN",
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  /** productID(string) → pudID 映射 */
  const pudidMap = {};

  /**
   * 拦截 /ProductEn/Index2/ 响应，解析 tuiPath 字段提取 pudID
   */
  page.on("response", async (response) => {
    if (!response.url().includes("/ProductEn/Index2/")) return;
    try {
      const json = await response.json();
      if (json.code !== 0 || !Array.isArray(json.data)) return;

      let count = 0;
      for (const item of json.data) {
        if (!item.productID || !item.tuiPath) continue;
        const m = String(item.tuiPath).match(/pudID=([0-9a-f]+)/i);
        if (m) {
          pudidMap[String(item.productID)] = m[1];
          count++;
        }
      }
      if (count > 0) {
        process.stdout.write(
          `\r  [拦截] 累计 ${Object.keys(pudidMap).length}/${productIDs.length} 条  `
        );
      }
    } catch {
      // 忽略非 JSON 响应
    }
  });

  // 访问店铺首页，建立有效 Session
  console.log(`[Step 2] 访问店铺首页...`);
  await page.goto(`${BASE_SHOP}/ProductEn/Index/${AGENT_ID}`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await sleep(2000);
  console.log(`\n  初始加载完成，已获取 ${Object.keys(pudidMap).length} 条`);

  // 通过 JS 调用 triggerSelectFunction() 切换到"全国/全部"加载全部商品
  try {
    await page.evaluate(() => {
      const prov = document.getElementById("Province");
      const city = document.getElementById("City");
      if (prov) prov.innerHTML = "全部";
      if (city) city.innerHTML = "全部";
      // 触发商品列表重新加载
      if (typeof triggerSelectFunction === "function") {
        triggerSelectFunction();
      }
    });
    // 等待 Index2 响应回来
    await page.waitForResponse(
      (r) => r.url().includes("/ProductEn/Index2/"),
      { timeout: 10000 }
    ).catch(() => null);
    await sleep(2000);
    console.log(`  切换"全国/全部"后，已获取 ${Object.keys(pudidMap).length} 条`);
  } catch (e) {
    console.warn("  切换筛选条件时出错（可忽略）:", e.message);
  }

  // 多次滚动到底部触发懒加载，加载更多商品
  console.log("[Step 2b] 滚动加载更多商品...");
  for (let i = 0; i < 15; i++) {
    const before = Object.keys(pudidMap).length;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(1200);
    const after = Object.keys(pudidMap).length;
    const coverage = productIDs.length > 0
      ? ((after / productIDs.length) * 100).toFixed(1)
      : "0";
    process.stdout.write(`\r  滚动 ${i + 1}/15  覆盖率: ${coverage}%  (${after}/${productIDs.length})  `);
    // 覆盖率达到 95% 以上提前停止
    if (after >= productIDs.length * 0.95 && i >= 3) break;
    // 连续 3 次没有新数据也停止
    if (before === after && i >= 5) break;
  }
  console.log(); // 换行

  await browser.close();
  console.log("[Step 2] 浏览器已关闭");
  return pudidMap;
}

/* ========== 主流程 ========== */

async function main() {
  console.log("\n=== 172号卡 pudID 映射表抓取脚本（Playwright 版）===");
  console.log(`代理ID: ${AGENT_ID}`);
  console.log(`输出:   ${OUTPUT_PATH}\n`);

  // Step 1：获取商品列表
  let productIDs;
  try {
    productIDs = await fetchAllProductIDs();
  } catch (e) {
    console.error("❌ 获取商品列表失败:", e.message);
    process.exit(1);
  }

  // 读取已有映射表（支持增量更新）
  let existingMap = {};
  if (existsSync(OUTPUT_PATH)) {
    try {
      existingMap = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
      const existCount = Object.keys(existingMap).length;
      if (existCount > 0) {
        console.log(`[增量] 已有映射表 ${existCount} 条，将与新数据合并`);
      }
    } catch {
      console.warn("[增量] 读取已有映射表失败，将全量重新抓取");
    }
  }

  // Step 2：Playwright 抓取
  let newMap = {};
  try {
    newMap = await scrapePudidWithPlaywright(productIDs);
  } catch (e) {
    console.error("❌ Playwright 抓取失败:", e.message);
    process.exit(1);
  }

  // 合并（新数据优先，保留旧数据中新抓取未覆盖的）
  const merged = { ...existingMap, ...newMap };

  // 统计结果
  const total = productIDs.length;
  const matched = productIDs.filter((id) => merged[String(id)]).length;
  const coverage = total > 0 ? ((matched / total) * 100).toFixed(1) : "0";

  console.log(`\n=== 抓取完成 ===`);
  console.log(`商品总数:   ${total}`);
  console.log(`已匹配:     ${matched}`);
  console.log(`覆盖率:     ${coverage}%`);
  console.log(`映射表条数: ${Object.keys(merged).length}`);

  const unmatched = productIDs.filter((id) => !merged[String(id)]);
  if (unmatched.length > 0) {
    console.log(
      `\n未命中 (${unmatched.length} 个):`,
      unmatched.slice(0, 10).join(", "),
      unmatched.length > 10 ? "..." : ""
    );
    console.log("  → 这些商品点击「立即办理」将跳转到带关键词的搜索结果页");
  }

  // 写入文件
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2), "utf-8");
  console.log(`\n✅ 映射表已写入: ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error("❌ 脚本异常:", e.message);
  process.exit(1);
});
