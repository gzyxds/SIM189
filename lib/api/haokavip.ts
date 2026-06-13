/**
 * 浩卡联盟 API 服务模块
 *
 * 接口文档: https://s.apifox.cn/bed9344f-d4dd-4e23-bf90-8e49e5d63005/doc-5073752
 * 加密方式: AES-256-ECB + PKCS5Padding
 * 密钥: APP_SECRET 的 UTF-8 编码前 32 字节
 * 请求参数: json_data (AES加密后的Base64字符串)
 * 响应: 纯 JSON, data 无需解密
 *
 * ===== 缓存策略 =====
 * 服务端内存缓存，有效期 12 小时（43200 秒）。
 * 首次请求从 API 拉取全量商品数据并预计算元数据；
 * 后续请求直接从缓存返回，大幅提升页面加载速度。
 * 缓存通过模块级变量实现，服务器进程内全局共享。
 * 缓存键包含 appId，避免不同配置的冲突。
 */
import crypto from "crypto";
import { MemoryCache } from "./cache";

/* ========== 类型定义 ========== */

/** 浩卡商品数据类型（来自实际 API 响应） */
export interface HaokaProduct {
  product_id: number;
  product_name: string;
  product_image: string;
  product_link: string;
  proxy_price: string;
  is_recommend: number;
  top_flag: number;
  [key: string]: unknown;
}

/**
 * 扩展商品类型，包含预计算的元数据
 *
 * 在服务端抓取时即完成运营商、归属地、时长、标签的解析，
 * 避免客户端每次渲染都重复解析 product_name。
 */
export interface HaokaProductWithMeta extends HaokaProduct {
  /** 预计算运营商 */
  _provider: Operator;
  /** 预计算归属地 */
  _location: LocationType;
  /** 预计算可发地区 */
  _shipping: string;
  /** 预计算套餐时长 */
  _duration: DurationType;
  /** 预计算标签列表 */
  _tags: { text: string; className: string }[];
}

/** 运营商枚举 */
export type Operator = "mobile" | "telecom" | "unicom" | "broadcast" | "unknown";

/** 归属地/可发地区类型 */
export type LocationType = "全国" | "随机归属地" | "收货地即归属地" | string;

/** 套餐时长类型 */
export type DurationType = "短期" | "1年" | "2年" | "长期" | "未知";

/** API 商品列表响应结构 */
interface ProductListResponse {
  success: boolean;
  message: string;
  code: number;
  data: {
    items: HaokaProduct[];
    pageInfo: {
      total: number;
      currentPage: number;
      totalPage: number;
    };
  };
}

/* ========== 缓存配置 ========== */

/** 模块级缓存实例（同进程内共享，TTL 12 小时） */
const productsCache = new MemoryCache<{
  products: HaokaProductWithMeta[];
  total: number;
}>("HaokaCache");

/* ========== 加密工具 ========== */

/**
 * 派生 AES-256 密钥
 * 使用 APP_SECRET 的 UTF-8 编码的前 32 字节作为密钥
 */
function deriveKey(secret: string): Buffer {
  return Buffer.from(secret, "utf8").subarray(0, 32);
}

/**
 * AES-256-ECB 加密
 * @param data - 要加密的 JSON 可序列化数据
 * @param secret - APP_SECRET
 * @returns Base64 编码的加密字符串
 */
function encrypt(data: unknown, secret: string): string {
  const key = deriveKey(secret);
  const jsonStr = JSON.stringify(data);
  const cipher = crypto.createCipheriv("aes-256-ecb", key, null);
  let encrypted = cipher.update(jsonStr, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

/* ========== 商品数据接口 ========== */

/** 分页大小（API 限制最大 20） */
const PAGE_SIZE = 20;

/**
 * 请求单页商品
 * @param appId APP_ID
 * @param appSecret APP_SECRET
 * @param page 页码（从 1 开始）
 */
async function fetchHaokaPage(
  appId: string,
  appSecret: string,
  page: number,
): Promise<ProductListResponse> {
  const encryptedData = encrypt({ page, page_size: PAGE_SIZE }, appSecret);

  const response = await fetch("https://api.haokavip.com/open/api/product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: appId, json_data: encryptedData }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`浩卡API请求失败: HTTP ${response.status}`);
  }

  const result = (await response.json()) as ProductListResponse;

  if (!result.success) {
    throw new Error(`浩卡API错误: ${result.message || "未知错误"}`);
  }

  return result;
}


/**
 * 为商品列表预计算元数据
 *
 * 在服务端一次性完成所有 product_name 的解析，
 * 客户端直接使用 _provider / _location / _duration / _tags 字段。
 */
function attachMeta(products: HaokaProduct[]): HaokaProductWithMeta[] {
  return products.map((p) => ({
    ...p,
    _provider: mapOperator(p.product_name),
    _location: parseLocation(p.product_name).location,
    _shipping: parseLocation(p.product_name).shipping,
    _duration: parseDuration(p.product_name),
    _tags: parseTags(p.product_name),
  }));
}

/**
 * 获取全部在线商品列表（自动分页获取所有页）
 * POST /open/api/product
 *
 * 请求体: { app_id, json_data: AES加密后的Base64字符串 }
 * 其中 json_data 加密前为: { page, page_size }
 *
 * ===== 缓存行为 =====
 * - 首次调用：从 API 拉取全量数据，预计算元数据，缓存 12 小时
 * - 有效期内：直接返回缓存，零网络开销
 * - 过期后：静默刷新，新数据替换旧缓存
 */
export async function fetchHaokaProducts(): Promise<{
  products: HaokaProductWithMeta[];
  total: number;
}> {
  const appId = process.env.HAOKAVIP_APP_ID;
  const appSecret = process.env.HAOKAVIP_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("浩卡联盟 API 未配置 (HAOKAVIP_APP_ID / HAOKAVIP_APP_SECRET)");
  }

  /* ===== 缓存命中：直接返回 ===== */
  const cached = productsCache.get(appId);
  if (cached) return cached;

  console.log("[HaokaCache] 缓存失效或首次请求，开始拉取数据");

  /* ===== 先请求第 1 页，获取总页数 ===== */
  const firstPage = await fetchHaokaPage(appId, appSecret, 1);
  const totalPage = firstPage.data?.pageInfo?.totalPage || 1;
  const allItems = [...(firstPage.data?.items || [])];

  /* ===== 如果有多页，并发请求剩余页 ===== */
  if (totalPage > 1) {
    const remainingPages: Promise<ProductListResponse>[] = [];
    for (let p = 2; p <= totalPage; p++) {
      remainingPages.push(fetchHaokaPage(appId, appSecret, p));
    }
    const restResults = await Promise.all(remainingPages);
    for (const res of restResults) {
      allItems.push(...(res.data?.items || []));
    }
  }

  /* ===== 预计算元数据 ===== */
  const productsWithMeta = attachMeta(allItems);

  /* ===== 写入缓存 ===== */
  const result = {
    products: productsWithMeta,
    total: firstPage.data?.pageInfo?.total || allItems.length,
  };
  productsCache.set(result, appId, allItems.length);

  return result;
}

/* ========== 运营商工具函数 ========== */

/**
 * 根据商品名称推断运营商
 */
export function mapOperator(productName: string): Operator {
  const name = productName || "";
  if (/移动|mobile/i.test(name)) return "mobile";
  if (/电信|telecom/i.test(name)) return "telecom";
  if (/联通|unicom/i.test(name)) return "unicom";
  if (/广电|broadcast/i.test(name)) return "broadcast";
  return "unknown";
}

/** 运营商中文标签 */
export const OPERATOR_LABEL: Record<Operator, string> = {
  mobile: "中国移动",
  telecom: "中国电信",
  unicom: "中国联通",
  broadcast: "中国广电",
  unknown: "其他",
};

/** 运营商配置（颜色、图标） */
/* ========== 商品名称解析函数 ========== */

/**
 * 从商品名称提取归属地信息
 * @returns { location, shipping }
 *   - location: 归属地标签（随机归属地 / 收货地即归属地 / 具体省份）
 *   - shipping: 可发地区（全国 / 具体省份 / 多省）
 */
export function parseLocation(name: string): { location: LocationType; shipping: string } {
  // 【发全国】→ 全国可发
  if (/发全国/.test(name)) {
    return { location: "随机归属地", shipping: "全国" };
  }
  // 【只发XX】→ 仅发特定省
  const onlyMatch = name.match(/只发([\u4e00-\u9fa5]{1,4})/);
  if (onlyMatch) {
    return { location: onlyMatch[1], shipping: onlyMatch[1] };
  }
  return { location: "收货地即归属地", shipping: "全国" };
}

/**
 * 从商品名称提取套餐时长
 */
export function parseDuration(name: string): DurationType {
  if (/长期/.test(name)) return "长期";
  if (/2年|24个月|24月/.test(name)) return "2年";
  if (/1年|12个月|12月/.test(name)) return "1年";
  if (/短期|短期套餐/.test(name)) return "短期";
  return "未知";
}

/** 生成商品标签列表 */
export function parseTags(name: string): { text: string; className: string }[] {
  const tags: { text: string; className: string }[] = [];

  // 归属地标签
  const { location } = parseLocation(name);
  tags.push({
    text: location,
    className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
  });

  // 流量标签
  const flow = name.match(/\d+(?:\.\d+)?\s*(?:GB|G)/i);
  if (flow) {
    tags.push({
      text: flow[0],
      className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    });
  }

  // 语音标签
  if (/\d+\s*分钟/.test(name)) {
    tags.push({
      text: "含通话",
      className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
    });
  }

  // 配送标签
  if (/京东/.test(name)) {
    tags.push({
      text: "京东快递",
      className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
    });
  } else {
    tags.push({
      text: "免费包邮",
      className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
    });
  }

  // 首月免租
  if (/免租|免月/.test(name)) {
    tags.push({
      text: "首月免租",
      className: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    });
  }

  /* ===== 激活方式 ===== */
  if (/自主激活/.test(name)) {
    tags.push({
      text: "自主激活",
      className: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800",
    });
  } else if (/快递激活/.test(name)) {
    tags.push({
      text: "快递激活",
      className: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800",
    });
  }

  // 先激活后发货
  if (/先激活/.test(name)) {
    tags.push({
      text: "先激活后发货",
      className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800",
    });
  }

  /* ===== 套餐时长 ===== */
  const dur = parseDuration(name);
  if (dur !== "未知") {
    tags.push({
      text: dur,
      className: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800",
    });
  }

  // 年龄限制
  const ageMatch = name.match(/年龄(\d+)-(\d+)/);
  if (ageMatch) {
    tags.push({
      text: `${ageMatch[1]}-${ageMatch[2]}岁`,
      className: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
    });
  }

  return tags;
}

export const OPERATOR_CONFIG: Record<
  Operator,
  { label: string; color: string; border: string; bg: string; text: string }
> = {
  mobile: {
    label: "中国移动",
    color: "green",
    border: "hover:border-green-400",
    bg: "hover:bg-green-50 dark:hover:bg-green-500/5",
    text: "text-green-600 dark:text-green-400",
  },
  telecom: {
    label: "中国电信",
    color: "blue",
    border: "hover:border-blue-400",
    bg: "hover:bg-blue-50 dark:hover:bg-blue-500/5",
    text: "text-blue-600 dark:text-blue-400",
  },
  unicom: {
    label: "中国联通",
    color: "orange",
    border: "hover:border-orange-400",
    bg: "hover:bg-orange-50 dark:hover:bg-orange-500/5",
    text: "text-orange-600 dark:text-orange-400",
  },
  broadcast: {
    label: "中国广电",
    color: "purple",
    border: "hover:border-purple-400",
    bg: "hover:bg-purple-50 dark:hover:bg-purple-500/5",
    text: "text-purple-600 dark:text-purple-400",
  },
  unknown: {
    label: "其他",
    color: "gray",
    border: "hover:border-gray-400",
    bg: "hover:bg-gray-50 dark:hover:bg-gray-500/5",
    text: "text-gray-600 dark:text-gray-400",
  },
};
