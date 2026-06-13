/**
 * 林夕通信（号卡极团系统）API 服务模块 — 仅供服务端使用
 *
 * 接口文档：见 API对接文档/林夕通信/ 目录
 * 接口规范：号卡极团系统开放接口
 * API基础地址：https://h5.vip12300.cn
 * 认证方式：apiuser + apipwd（原始密钥MD5加密后传输）
 * Content-Type：application/x-www-form-urlencoded
 *
 * ⚠️ 本文件使用了 Node.js 内置模块（node:crypto），
 *    只能在服务端组件（Server Component / Route Handler / Server Action）中 import。
 *
 * ===== 缓存策略 =====
 * 服务端内存缓存，有效期 12 小时。
 * 首次请求从 API 拉取全量商品数据并预计算元数据；
 * 后续请求直接从缓存返回，大幅提升页面加载速度。
 */
import { createHash } from "node:crypto";
import { MemoryCache } from "./cache";

/* ========== 类型定义 ========== */

/** 林夕通信商品数据类型（来自号卡极团系统 API） */
export interface LinxiProduct {
  /** 产品ID */
  id: string;
  /** 主图URL */
  shop_img: string;
  /** 商品名称 */
  shop_name: string;
  /** 商品描述（月租+流量+通话等） */
  shop_des: string;
  /** 标签（逗号分隔） */
  shop_tag: string;
  /** 运营商名称（中国电信/中国移动/中国联通/中国广电） */
  shop_yys: string;
  /** 选号ID */
  shop_number: string;
  /** 资费链接 */
  shop_link: string;
  /** 资料（HTML格式） */
  shop_rule: string;
  /** 可发货省份 */
  shop_provinces: string;
  /** 是否需要照片 0=不需要 */
  shop_photos: string;
  /** 结算周期 0=次月返 1=秒返 2=月月返 */
  shop_money: string;
  /** 创建时间 */
  s_time: string;
  /** 最小限制年龄 */
  min_age: string | null;
  /** 最大限制年龄 */
  max_age: string | null;
  /** 佣金金额 */
  shop_bkge: number;
  /** 序号 */
  shop_sort: string;
  /** 月月返秒返金额 */
  first_bkge: number;
  /** 月月返共计返利月数 */
  rebate_num: string;
  /** 选号默认归属省 */
  gsd_province: string | null;
  /** 选号默认归属市 */
  gsd_city: string | null;
  /** 禁发关键词（命中即禁） */
  Prohibited: string;
}

/**
 * 扩展商品类型，包含预计算的元数据
 *
 * 在服务端抓取时即完成运营商、归属地、时长、标签的解析，
 * 避免客户端每次渲染都重复解析。
 */
export interface LinxiProductWithMeta extends LinxiProduct {
  /** 预计算运营商枚举 */
  _operator: LinxiOperator;
  /** 预计算月租价格（数字） */
  _price: number;
  /** 预计算月流量文本（如 "100GB"） */
  _flow: string;
  /** 预计算语音通话文本（如 "500分钟"） */
  _voice: string;
  /** 预计算套餐时长 */
  _duration: string;
  /** 预计算标签列表 */
  _tags: { text: string; className: string }[];
  /** 预计算办理链接（跳转店铺首页） */
  _orderUrl: string;
}

/** 运营商枚举 */
export type LinxiOperator = "mobile" | "telecom" | "unicom" | "broadcast" | "unknown";

/* ========== 配置 ========== */

/** 林夕通信平台配置（环境变量注入） */
const LINXI_CONFIG = {
  /** 号卡极团系统 API 基础地址 */
  baseUrl: "https://h5.vip12300.cn",
  /** 对接账号 */
  apiUser: process.env.LINXI_API_USER || "",
  /** 对接密钥（原始值，代码内自动 MD5 加密） */
  apiPwd: process.env.LINXI_API_PWD || "",
  /** 代理 UID（办理链接参数） */
  uid: "SGpiazRLQVZSREk9",
  /** 办理订单页面基础 URL */
  orderBaseUrl: "https://vip.777haoka.cn/order/index",
  /** H5 店铺首页（兜底链接） */
  shopUrl: "https://h5.vip12300.cn/index?k=SGpiazRLQVZSREk9",
};

/**
 * 根据商品 ID 生成林夕通信的立即办理链接
 * 格式：https://vip.777haoka.cn/order/index?uid={uid}&pid={productId}
 * @param productId - 商品ID
 */
export function getLinxiOrderUrl(productId: string | number): string {
  return `${LINXI_CONFIG.orderBaseUrl}?uid=${LINXI_CONFIG.uid}&pid=${productId}`;
}

/* ========== 运营商工具 ========== */

/** 运营商中文标签映射 */
export const LINXI_OPERATOR_LABEL: Record<LinxiOperator, string> = {
  mobile: "中国移动",
  telecom: "中国电信",
  unicom: "中国联通",
  broadcast: "中国广电",
  unknown: "其他",
};

/**
 * 将 API 返回的运营商字段映射到枚举
 * @param shopYys - API 返回的 shop_yys 字段（如 "中国电信"）
 */
export function mapLinxiOperator(shopYys: string): LinxiOperator {
  if (!shopYys) return "unknown";
  if (shopYys.includes("移动")) return "mobile";
  if (shopYys.includes("电信")) return "telecom";
  if (shopYys.includes("联通")) return "unicom";
  if (shopYys.includes("广电")) return "broadcast";
  return "unknown";
}

/* ========== 套餐名称解析工具 ========== */

/**
 * 从商品名称/描述中提取月租价格（数字）
 * @param text - 商品名称或描述
 */
export function parseLinxiPrice(text: string): number {
  const m = text.match(/(\d+\.?\d*)元/);
  return m ? parseFloat(m[1]) : 0;
}

/**
 * 从商品名称/描述中提取月流量文本（如 "100GB"）
 * @param text - 商品名称或描述
 */
export function parseLinxiFlow(text: string): string {
  return text.match(/\d+(?:\.\d+)?\s*(?:GB|G|MB)/i)?.[0]?.trim() || "";
}

/**
 * 从商品名称/描述中提取语音通话时长（如 "500分钟"）
 * @param text - 商品名称或描述
 */
export function parseLinxiVoice(text: string): string {
  return text.match(/\d+\s*分钟/)?.[0]?.trim() || "";
}

/**
 * 从商品名称/描述中提取套餐时长标签
 * @param text - 商品名称或描述
 */
export function parseLinxiDuration(text: string): string {
  if (!text) return "未知";
  if (/长期/.test(text)) return "长期";
  if (/半年|6个月/.test(text)) return "6个月";
  if (/2年|二年|24个月|24月/.test(text)) return "2年";
  if (/1年|一年|12个月|12月/.test(text)) return "1年";
  if (/4年|四年/.test(text)) return "4年";
  return "标准套餐";
}

/**
 * 为商品生成彩色标签列表
 * @param product - 林夕通信商品对象
 */
export function parseLinxiTags(
  product: LinxiProduct,
): { text: string; className: string }[] {
  const tags: { text: string; className: string }[] = [];

  /* ===== 返佣类型 ===== */
  if (product.shop_money === "1") {
    tags.push({ text: "秒返佣金", className: "bg-green-50 text-green-600 border-green-100" });
  } else if (product.shop_money === "2") {
    tags.push({ text: "月月返佣", className: "bg-blue-50 text-blue-600 border-blue-100" });
  } else {
    tags.push({ text: "次月返佣", className: "bg-blue-50 text-blue-600 border-blue-100" });
  }

  /* ===== 归属地信息 ===== */
  if (product.gsd_province) {
    tags.push({
      text: `归属${product.gsd_province}`,
      className: "bg-cyan-50 text-cyan-600 border-cyan-100",
    });
  }

  /* ===== 流量 ===== */
  const flow = parseLinxiFlow(product.shop_des || product.shop_name);
  if (flow) {
    tags.push({
      text: flow,
      className: "bg-indigo-50 text-indigo-600 border-indigo-100",
    });
  }

  /* ===== 套餐时长 ===== */
  const duration = parseLinxiDuration(product.shop_des || product.shop_name);
  if (duration && duration !== "标准套餐") {
    tags.push({
      text: duration,
      className: "bg-purple-50 text-purple-600 border-purple-100",
    });
  }

  /* ===== 需要照片 ===== */
  if (product.shop_photos !== "0" && product.shop_photos) {
    tags.push({
      text: "需照片",
      className: "bg-amber-50 text-amber-600 border-amber-100",
    });
  }

  /* ===== 选号信息 ===== */
  if (product.shop_number) {
    tags.push({
      text: "可选号",
      className: "bg-orange-50 text-orange-600 border-orange-100",
    });
  }

  /* ===== 商品标签 ===== */
  if (product.shop_tag) {
    // shop_tag 是逗号分隔的标签
    const tagItems = product.shop_tag.split(",").filter(Boolean).slice(0, 3);
    for (const t of tagItems) {
      const trimmed = t.trim();
      if (trimmed) {
        tags.push({
          text: trimmed,
          className: "bg-gray-50 text-gray-600 border-gray-100",
        });
      }
    }
  }

  return tags;
}

/* ========== MD5 工具 ========== */

/**
 * 计算 MD5（32位小写）
 * 号卡极团系统约定：apipwd 需经过 MD5 加密后传输
 * @param str - 待加密字符串
 */
function md5(str: string): string {
  return createHash("md5").update(str, "utf8").digest("hex");
}

/* ========== 缓存 ========== */

/** 模块级缓存实例（服务进程内全局共享，TTL 12 小时） */
const productsCache = new MemoryCache<{
  products: LinxiProductWithMeta[];
  total: number;
}>("林夕通信Cache");


/**
 * 为商品列表批量预计算元数据
 * 服务端一次性解析，客户端直接使用预计算字段
 * @param products - 原始商品列表
 */
function attachMeta(products: LinxiProduct[]): LinxiProductWithMeta[] {
  return products.map((p) => ({
    ...p,
    _operator: mapLinxiOperator(p.shop_yys),
    _price: parseLinxiPrice(p.shop_des || p.shop_name),
    _flow: parseLinxiFlow(p.shop_des || p.shop_name),
    _voice: parseLinxiVoice(p.shop_des || p.shop_name),
    _duration: parseLinxiDuration(p.shop_des || p.shop_name),
    _tags: parseLinxiTags(p),
    /* 生成带 uid + pid 的精准办理链接 */
    _orderUrl: getLinxiOrderUrl(p.id),
  }));
}

/* ========== 核心 API 调用 ========== */

/**
 * 调用号卡极团系统查询套餐接口获取全部商品列表
 * POST /order/api/haoteam/getlist
 */
async function fetchProductsFromAPI(): Promise<LinxiProduct[]> {
  const { baseUrl, apiUser, apiPwd } = LINXI_CONFIG;

  /* ===== 构建 x-www-form-urlencoded 请求体 ===== */
  const params = new URLSearchParams();
  params.append("apiuser", apiUser);
  // 号卡极团系统约定：apipwd 需 MD5 加密后传输
  params.append("apipwd", md5(apiPwd));

  const response = await fetch(`${baseUrl}/order/api/haoteam/getlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: params.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`林夕通信API请求失败: HTTP ${response.status}`);
  }

  const result = await response.json();

  /* ===== API 直接返回数组，需校验 ===== */
  if (!Array.isArray(result)) {
    // 可能是错误响应对象
    if (result && typeof result === "object" && "code" in result && result.code !== 200) {
      throw new Error(`林夕通信API错误: ${result.msg || result.message || "未知错误"}`);
    }
    return [];
  }

  return result as LinxiProduct[];
}

/**
 * 获取林夕通信全部在售商品（带缓存）— 仅供服务端调用
 * POST /order/api/haoteam/getlist
 *
 * ===== 缓存行为 =====
 * - 首次调用：从 API 拉取全量数据，预计算元数据，缓存 12 小时
 * - 有效期内：直接返回缓存，零网络开销
 * - 过期后：静默刷新缓存
 */
export async function fetchLinxiProducts(): Promise<{
  products: LinxiProductWithMeta[];
  total: number;
}> {
  const apiUser = LINXI_CONFIG.apiUser;

  if (!apiUser || !LINXI_CONFIG.apiPwd) {
    throw new Error(
      "林夕通信 API 未配置 (LINXI_API_USER / LINXI_API_PWD)，请在 .env 中设置",
    );
  }

  /* ===== 缓存命中 ===== */
  const cached = productsCache.get(apiUser);
  if (cached) return cached;

  console.log("[林夕通信Cache] 缓存失效或首次请求，开始拉取数据");

  /* ===== 从 API 拉取 ===== */
  const rawProducts = await fetchProductsFromAPI();

  /* ===== 预计算元数据 ===== */
  const productsWithMeta = attachMeta(rawProducts);

  /* ===== 写入缓存 ===== */
  const result = { products: productsWithMeta, total: productsWithMeta.length };
  productsCache.set(result, apiUser, productsWithMeta.length);

  return result;
}
