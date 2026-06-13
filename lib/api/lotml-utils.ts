/**
 * 172号卡（lot-ml）纯客户端工具模块
 *
 * 本文件仅包含不依赖任何 Node.js 内置模块的类型定义和纯函数，
 * 可安全地在客户端组件（"use client"）中 import。
 *
 * 需要在服务端调用 API 的函数（fetchLotMLProducts 等）
 * 请从 @/lib/api/lotml 导入，只在服务端组件中使用。
 */

/* ========== 类型定义 ========== */

/** 套餐办理区域 */
export interface LotMLSku {
  /** 办理区域ID */
  SkuID: number;
  /** 办理区域名称 */
  SkuName: string;
  /** 办理区域具体描述 */
  Desc: string;
}

/** 172号卡商品套餐（来自 GetProductsV2 API） */
export interface LotMLProduct {
  /** 商品ID */
  productID: number;
  /** 商品套餐名称 */
  productName: string;
  /** 商品套餐主图 URL */
  mainPic: string;
  /** 归属地 */
  area: string;
  /** 禁发区域（逗号分隔省份） */
  disableArea: string;
  /** 商品套餐详情图 URL */
  littlepicture: string;
  /** 商品套餐资料介绍地址 */
  netAddr: string;
  /** 状态：true=上架中, false=已下架 */
  flag: boolean;
  /** 选号支持：0=不支持, 1=收货地不是归属地, 2=收货地是归属地 */
  numberSel: number;
  /** 运营商：电信/联通/移动/广电 */
  operator: string;
  /** 返佣类型：秒返/次月返 */
  BackMoneyType: string;
  /** 套餐说明 */
  Taocan: string;
  /** 结算规则 */
  Rule: string;
  /** 最小办理年龄 */
  Age1: number;
  /** 最大办理年龄 */
  Age2: number;
  /** 套餐优惠时间：半年/一年/两年/二十年/官方可查长期 等 */
  PriceTime: string;
  /** 套餐办理区域列表 */
  Skus: LotMLSku[];
  [key: string]: unknown;
}

/**
 * 扩展商品类型，包含预计算元数据
 *
 * 服务端解析完成后客户端直接使用，避免重复计算。
 */
export interface LotMLProductWithMeta extends LotMLProduct {
  /** 预计算运营商枚举 */
  _operator: LotMLOperator;
  /** 预计算月租价格（数字） */
  _price: number;
  /** 预计算月流量文本 */
  _flow: string;
  /** 预计算语音通话文本 */
  _voice: string;
  /** 预计算套餐时长 */
  _duration: string;
  /** 预计算标签列表 */
  _tags: { text: string; className: string }[];
  /** 预计算办理链接 */
  _orderUrl: string;
}

/** 运营商枚举 */
export type LotMLOperator = "mobile" | "telecom" | "unicom" | "broadcast" | "unknown";

/* ========== 运营商工具 ========== */

/** 运营商中文标签映射 */
export const LOTML_OPERATOR_LABEL: Record<LotMLOperator, string> = {
  mobile: "中国移动",
  telecom: "中国电信",
  unicom: "中国联通",
  broadcast: "中国广电",
  unknown: "其他",
};

/**
 * 将 API 返回的运营商字段映射到枚举
 * @param operator - API 返回的 operator 字段
 */
export function mapLotMLOperator(operator: string): LotMLOperator {
  if (!operator) return "unknown";
  if (operator.includes("移动")) return "mobile";
  if (operator.includes("电信")) return "telecom";
  if (operator.includes("联通")) return "unicom";
  if (operator.includes("广电")) return "broadcast";
  return "unknown";
}

/* ========== 套餐名称解析工具（纯函数） ========== */

/**
 * 从套餐名称中提取月租价格（数字）
 * @param name - 套餐名称
 */
export function parseLotMLPrice(name: string): number {
  const m = name.match(/(\d+\.?\d*)元/);
  return m ? parseFloat(m[1]) : 0;
}

/**
 * 从套餐名称中提取月流量文本（如 "100GB"）
 * @param name - 套餐名称
 */
export function parseLotMLFlow(name: string): string {
  return name.match(/\d+(?:\.\d+)?\s*(?:GB|G|MB)/i)?.[0]?.trim() || "";
}

/**
 * 从套餐名称中提取语音通话时长（如 "500分钟"）
 * @param name - 套餐名称
 */
export function parseLotMLVoice(name: string): string {
  return name.match(/\d+\s*分钟/)?.[0]?.trim() || "";
}

/**
 * 将 PriceTime 字段统一为套餐时长标签
 * @param priceTime - API 返回的 PriceTime 字段
 */
export function parseLotMLDuration(priceTime: string): string {
  if (!priceTime) return "未知";
  if (priceTime.includes("半年")) return "6个月";
  if (priceTime.includes("一年")) return "1年";
  if (priceTime.includes("两年") || priceTime.includes("二年")) return "2年";
  if (priceTime.includes("二十年")) return "20年";
  if (priceTime.includes("长期")) return "长期";
  return priceTime;
}

/**
 * 为商品生成彩色标签列表
 * @param product - 172号卡商品对象
 */
export function parseLotMLTags(
  product: LotMLProduct,
): { text: string; className: string }[] {
  const tags: { text: string; className: string }[] = [];

  // 返佣类型
  if (product.BackMoneyType === "秒返") {
    tags.push({ text: "秒返佣金", className: "bg-green-50 text-green-600 border-green-100" });
  } else if (product.BackMoneyType === "次月返") {
    tags.push({ text: "次月返佣", className: "bg-blue-50 text-blue-600 border-blue-100" });
  }

  // 套餐时长
  const duration = parseLotMLDuration(product.PriceTime);
  if (duration && duration !== "未知") {
    tags.push({ text: duration, className: "bg-purple-50 text-purple-600 border-purple-100" });
  }

  // 选号支持
  if (product.numberSel === 1) {
    tags.push({ text: "可选号", className: "bg-orange-50 text-orange-600 border-orange-100" });
  } else if (product.numberSel === 2) {
    tags.push({ text: "收货地归属", className: "bg-cyan-50 text-cyan-600 border-cyan-100" });
  }

  // 归属地
  if (product.area) {
    tags.push({ text: product.area, className: "bg-gray-50 text-gray-600 border-gray-100" });
  }

  // 套餐流量（从名称提取）
  const flow = parseLotMLFlow(product.productName);
  if (flow) {
    tags.push({ text: flow, className: "bg-indigo-50 text-indigo-600 border-indigo-100" });
  }

  return tags;
}

/**
 * 根据 productID 生成办理链接（客户端版本）
 * 直接使用预计算的 _orderUrl 字段，无需在客户端查 pudidMap
 * @param product - 含 _orderUrl 的扩展商品对象
 */
export function getLotMLOrderUrlFromMeta(product: LotMLProductWithMeta): string {
  return product._orderUrl;
}

/** 172号卡店铺兜底首页 */
export const LOTML_SHOP_URL =
  "https://haokawx.lot-ml.com/ProductEn/Index/1a654e0b341cadd2";
