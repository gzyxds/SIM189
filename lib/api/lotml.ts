/**
 * 172号卡（lot-ml）API 服务模块 — 仅供服务端使用
 *
 * 接口文档：见 API对接文档/172号卡/ 目录
 * API基础地址：https://haokaopenapi.lot-ml.com
 * 签名方式：MD5(参数自然排序拼接 + secret)，32位小写
 *
 * ⚠️ 本文件使用了 Node.js 内置模块（node:crypto / node:fs / node:path），
 *    只能在服务端组件（Server Component / Route Handler / Server Action）中 import。
 *    客户端组件（"use client"）请从 @/lib/api/lotml-utils 导入类型和工具函数。
 *
 * ===== 缓存策略 =====
 * 服务端内存缓存，有效期 12 小时。
 * 首次请求从 API 拉取全量商品数据并预计算元数据；
 * 后续请求直接从缓存返回，大幅提升页面加载速度。
 *
 * ===== 办理链接策略 =====
 * 172号卡的"立即办理"链接使用 pudID（16位哈希）而非 productID。
 * pudID 无法从 GetProductsV2 接口获取，采用以下兜底策略：
 * - pudID 映射表（pudid-map.json）有命中时，跳转到精准商品页
 * - 未命中时，跳转到172号卡统一首页（兜底）
 */
import { createHash } from "node:crypto";
import { MemoryCache } from "./cache";
import pudidMapData from "../data/pudid-map.json";

/* ========== 重新导出客户端安全的类型和工具函数 ========== */
// 服务端代码可以直接使用这些导出，与 lotml-utils.ts 保持一致

export type {
  LotMLProduct,
  LotMLProductWithMeta,
  LotMLSku,
  LotMLOperator,
} from "./lotml-utils";

export {
  LOTML_OPERATOR_LABEL,
  mapLotMLOperator,
  parseLotMLPrice,
  parseLotMLFlow,
  parseLotMLVoice,
  parseLotMLDuration,
  parseLotMLTags,
  getLotMLOrderUrlFromMeta,
  LOTML_SHOP_URL,
} from "./lotml-utils";

// 从 lotml-utils 导入类型供本文件内部使用
import type {
  LotMLProduct,
  LotMLProductWithMeta,
} from "./lotml-utils";
import {
  mapLotMLOperator,
  parseLotMLPrice,
  parseLotMLFlow,
  parseLotMLVoice,
  parseLotMLDuration,
  parseLotMLTags,
} from "./lotml-utils";

/* ========== 配置 ========== */

/** 172号卡平台配置（环境变量注入） */
const LOTML_CONFIG = {
  /** 开放API基础地址 */
  baseUrl: "https://haokaopenapi.lot-ml.com",
  /** 代理登录账号 */
  userId: process.env.HAOKA_USER_ID || "",
  /** 签名密钥 */
  secret: process.env.HAOKA_SECRET || "",
  /** 代理推广ID */
  agentId: process.env.HAOKA_AGENT_ID || "1a654e0b341cadd2",
  /** 172号卡商品H5店铺首页（兜底链接） */
  shopUrl: "https://haokawx.lot-ml.com/ProductEn/Index/1a654e0b341cadd2",
  /** 172号卡H5订单办理页基础URL */
  orderBaseUrl: "https://haokawx.lot-ml.com/h5orderEn/index",
};

/* ========== pudID 映射表（构建时打包） ========== */

/** productID → pudID 静态映射（来自 lib/data/pudid-map.json，构建时内联） */
const pudidMap: Record<string, string> = pudidMapData;

/* ========== 接口响应类型 ========== */

/** GetProductsV2 接口响应结构 */
interface ProductListResponse {
  code: number;
  message: string;
  data: LotMLProduct[] | null;
  errs: string | null;
}

/* ========== 缓存 ========== */

/** 模块级缓存实例（服务进程内全局共享，TTL 12 小时） */
const productsCache = new MemoryCache<{
  products: LotMLProductWithMeta[];
  total: number;
}>("172号卡Cache");

/* ========== 签名工具 ========== */

/**
 * 计算 MD5（32位小写），与172号卡签名规范一致
 * @param str - 待加密字符串
 */
function md5(str: string): string {
  return createHash("md5").update(str, "utf8").digest("hex");
}

/**
 * 生成 GetProductsV2 接口签名
 * 规则：MD5(ProductID={v}&Timestamp={v}&user_id={v}{secret})，参数按自然排序
 * @param productID - 商品ID（传空字符串表示获取全部）
 * @param timestamp - 10位时间戳字符串
 */
function signProductList(productID: string, timestamp: string): string {
  const str =
    `ProductID=${productID}&Timestamp=${timestamp}&user_id=${LOTML_CONFIG.userId}` +
    LOTML_CONFIG.secret;
  return md5(str);
}

/* ========== 办理链接生成（服务端专用） ========== */

/**
 * 根据 productID 生成172号卡的立即办理链接（服务端使用 pudID 映射表）
 *
 * 优先级：
 * 1. pudID 映射表命中 → 精准商品H5办理页（/h5orderEn/index?pudID=xxx）
 * 2. 未命中 → 带套餐名称关键词的店铺搜索页（/ProductEn/Index?title=xxx）
 *    用户进入后可直接看到该套餐，点击即可办理
 *
 * @param productID - 172号卡 productID（数字）
 * @param productName - 套餐名称，用于生成搜索页链接（pudID 未命中时使用）
 */
export function getLotMLOrderUrl(productID: number, productName?: string): string {
  const pudID = pudidMap[String(productID)];
  if (pudID) {
    return `${LOTML_CONFIG.orderBaseUrl}?pudID=${pudID}&userid=${LOTML_CONFIG.agentId}`;
  }
  // 兜底：生成带套餐名关键词的搜索链接，让用户能快速定位到对应商品
  if (productName) {
    // 提取套餐名中的关键词（取前20个字符，避免URL过长）
    const keyword = productName.slice(0, 20).trim();
    return `${LOTML_CONFIG.shopUrl}?title=${encodeURIComponent(keyword)}`;
  }
  return LOTML_CONFIG.shopUrl;
}

/* ========== 核心 API 调用 ========== */

/**
 * 调用 GetProductsV2 获取商品列表（全部上架商品）
 * 每分钟不超过10次，建议每天调用几次
 */
async function fetchProductsFromAPI(): Promise<LotMLProduct[]> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const sign = signProductList("", timestamp);

  const formData = new FormData();
  formData.append("user_id", LOTML_CONFIG.userId);
  formData.append("Timestamp", timestamp);
  formData.append("ProductID", "");
  formData.append("user_sign", sign);

  const response = await fetch(
    `${LOTML_CONFIG.baseUrl}/api/order/GetProductsV2`,
    {
      method: "POST",
      body: formData,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`172号卡API请求失败: HTTP ${response.status}`);
  }

  const result = (await response.json()) as ProductListResponse;

  if (result.code !== 0) {
    throw new Error(`172号卡API错误: ${result.message || "未知错误"}`);
  }

  return result.data || [];
}


/**
 * 为商品列表批量预计算元数据
 * 服务端一次性解析，客户端直接使用预计算字段
 * @param products - 原始商品列表
 */
function attachMeta(products: LotMLProduct[]): LotMLProductWithMeta[] {
  return products.map((p) => ({
    ...p,
    _operator: mapLotMLOperator(p.operator),
    _price: parseLotMLPrice(p.productName),
    _flow: parseLotMLFlow(p.productName),
    _voice: parseLotMLVoice(p.productName),
    _duration: parseLotMLDuration(p.PriceTime),
    _tags: parseLotMLTags(p),
    _orderUrl: getLotMLOrderUrl(p.productID, p.productName),
  }));
}

/**
 * 获取172号卡全部在售商品（带缓存）— 仅供服务端调用
 * POST /api/order/GetProductsV2
 *
 * ===== 缓存行为 =====
 * - 首次调用：从 API 拉取全量数据，预计算元数据，缓存 12 小时
 * - 有效期内：直接返回缓存，零网络开销
 * - 过期后：静默刷新缓存
 */
export async function fetchLotMLProducts(): Promise<{
  products: LotMLProductWithMeta[];
  total: number;
}> {
  const userId = LOTML_CONFIG.userId;

  if (!userId || !LOTML_CONFIG.secret) {
    throw new Error(
      "172号卡 API 未配置 (HAOKA_USER_ID / HAOKA_SECRET)，请在 .env 中设置",
    );
  }

  /* ===== 缓存命中 ===== */
  const cached = productsCache.get(userId);
  if (cached) return cached;

  console.log("[172号卡Cache] 缓存失效或首次请求，开始拉取数据");

  /* ===== 从 API 拉取 ===== */
  const rawProducts = await fetchProductsFromAPI();

  /* ===== 仅保留上架商品 ===== */
  const activeProducts = rawProducts
    .filter((p) => p.flag === true)
    /* 按 productID 降序排列（新上架商品在前，无上架时间字段时用 ID 近似） */
    .sort((a, b) => b.productID - a.productID);

  /* ===== 预计算元数据 ===== */
  const productsWithMeta = attachMeta(activeProducts);

  /* ===== 写入缓存 ===== */
  const result = { products: productsWithMeta, total: productsWithMeta.length };
  productsCache.set(result, userId, productsWithMeta.length);

  return result;
}
