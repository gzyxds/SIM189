/**
 * 翼卡云 API 服务模块 — 仅供服务端使用
 *
 * 接口文档：https://s.apifox.cn/1518a853-66c1-47d5-bd54-0050c28e62f1/doc-8877391
 * 对接地址：https://iot.87haoka.cn
 * 认证方式：Header 签名（MD5 32位小写）
 * 签名算法：appID + apiVersion + traceID + timestamp + API密钥 → MD5
 *
 * ⚠️ 本文件使用了 Node.js 内置模块（node:crypto），
 *    只能在服务端组件（Server Component / Route Handler / Server Action）中 import。
 *
 * ===== 缓存策略 =====
 * 服务端内存缓存，有效期 12 小时。
 * 首次请求从 API 拉取全量商品数据并预计算元数据；
 * 后续请求直接从缓存返回，大幅提升页面加载速度。
 */

import { createHash, randomBytes } from "node:crypto";
import { MemoryCache } from "./cache";

/* ========== 类型定义 ========== */

/** 翼卡云商品数据类型（来自 /openapi/goods/list 响应） */
export interface YkyProduct {
    /** 商品ID */
    id: number;
    /** 运营商分类类型（1=移动, 2=电信, 3=联通, 4=广电） */
    operatorType: number;
    /** 商品名称 */
    name: string;
    /** 商品编码 */
    code: string;
    /** 商品描述 */
    des: string;
    /** 推荐星级 */
    star: number;
    /** 售价(元) */
    price: number;
    /** 是否需要短信验证码 0=否 1=是 */
    smsCode: number;
    /** 选号模式 0=不支持 1=全国归属地 2=固定归属地 3=收货归属地 4=省内随机 5=省内自选 6=全国选号 */
    selectNumber: number;
    /** 号码归属地编码 */
    numberRegion: string;
    /** 上传照片模式 0=无需 1=需要 */
    uploadPhoto: string;
    /** 结算模式 1=日结秒返 2=次月返佣 3=月月返佣 4=下单即返 */
    settleMode: string;
    /** 订单模板 */
    orderTemplate: number;
    /** 商品主图URL */
    tips: string;
    /** 商品详情图列表 */
    details: string[];
    /** 销量 */
    sales: number;
    /** 通话时长(分钟) */
    callDuration: number;
    /** 通用流量(GB) */
    commonFlow: number;
    /** 定向流量(GB) */
    fixedFlow: number;
    /** 月租(元) */
    monthFee: number;
    /** 优惠月租(元) */
    favourMonthFee: number;
    /** 优惠期限(月) */
    favourTerm: number;
    /** 商品标签ID列表 */
    tags: number[];
    /** 商品标签字典 */
    tagsSelect: YkyTagOption[];
    /** 动态表单 */
    form: YkyFormItem[] | null;
    /** 配送动态表单 */
    deliveryForms: YkyDeliveryForm[] | null;
    /** 商品分类（1=流量卡, 4=宽带, 5=靓号） */
    category: number;
    /** 省份编码（"uniArea"=全国, 其他为省份编码如"440000"） */
    provinceCode: string;
    /** 号码归属地省份名称（空字符串表示全国） */
    numberRegionName: string;
    /** 时间戳 */
    timestamp: number;
    /** 追踪ID */
    traceID: string;
}

/** 商品标签字典选项 */
interface YkyTagOption {
    key: number;
    label: string;
    value: number;
    valueType: string;
    type: string;
    listClass: string;
}

/** 动态表单项 */
interface YkyFormItem {
    uuid: string;
    label: string;
    required: string;
}

/** 配送动态表单 */
interface YkyDeliveryForm {
    forms: YkyFormItem[];
    status: string;
}

/** 翼卡云商品详情类型（来自 /openapi/goods/details 响应） */
export interface YkyProductDetail extends YkyProduct {
    /** 分享话术 */
    shareName: string;
    /** 海报ID */
    posterId: number;
    /** 主题背景色 */
    backgroundColor: string;
    /** 结算要求 */
    compliance: string;
    /** 达标佣金(元) */
    commission: number;
    /** 月返佣金（仅 settleMode=3 时有效） */
    monthCommission: YkyMonthCommission[];
}

/** 月返佣金项 */
interface YkyMonthCommission {
    month: number;
    commission: number;
}

/**
 * 扩展商品类型，包含预计算的元数据
 *
 * 在服务端抓取时即完成运营商、月租、流量、语音、时长、标签的解析，
 * 避免客户端每次渲染都重复解析。
 */
export interface YkyProductWithMeta extends YkyProduct {
    /** 预计算运营商枚举 */
    _operator: YkyOperator;
    /** 预计算总流量（通用+定向）文本 */
    _totalFlow: string;
    /** 预计算语音通话文本 */
    _voice: string;
    /** 预计算套餐时长文本 */
    _duration: string;
    /** 预计算标签列表 */
    _tags: { text: string; className: string }[];
    /** 预计算结算模式文本 */
    _settleText: string;
    /** 预计算办理链接（跳转店铺） */
    _orderUrl: string;
    /** 预计算商品分类枚举（dataCard/broadband/fancyNumber/other） */
    _category: string;
    /** 预计算地区名称（空字符串=全国可发） */
    _region: string;
}

/** 运营商枚举 */
export type YkyOperator = "mobile" | "telecom" | "unicom" | "broadcast" | "unknown";

/** API 列表响应结构 */
interface YkyListResponse {
    code: number;
    message: string;
    data: YkyProduct[];
    timestamp: number;
    traceID: string;
}

/** API 详情响应结构 */
interface YkyDetailResponse {
    code: number;
    message: string;
    data: YkyProductDetail;
    timestamp: number;
    traceID: string;
}

/* ========== 配置 ========== */

/** 翼卡云平台配置（环境变量注入） */
const YKY_CONFIG = {
    /** API 基础地址 */
    baseUrl: "https://iot.87haoka.cn",
    /** 应用ID */
    appId: process.env.YKY_APP_ID || "11777",
    /** API密钥 */
    apiSecret: process.env.YKY_API_SECRET || "xCUPTRAAprxHGKjKoKHwnqsuEmmLhWsu",
    /** API版本号，固定值 */
    apiVersion: "2.0.0",
    /** 销售渠道码 */
    channelCode: process.env.YKY_CHANNEL_CODE || "TpImx3gi",
    /** 店铺首页 */
    shopUrl: "https://iot.87haoka.cn/s/TpImx3gi",
};

/* ========== 签名工具 ========== */

/**
 * 生成32位小写16进制随机字符串（traceID）
 */
function generateTraceId(): string {
    return randomBytes(16).toString("hex");
}

/**
 * 计算 MD5 签名（32位小写）
 * 签名算法：appID + apiVersion + traceID + timestamp + API密钥 → MD5
 */
function generateSign(
    appId: string,
    apiVersion: string,
    traceId: string,
    timestamp: string,
    apiSecret: string,
): string {
    const raw = `${appId}${apiVersion}${traceId}${timestamp}${apiSecret}`;
    return createHash("md5").update(raw, "utf8").digest("hex");
}

/**
 * 构建签名请求头
 */
function buildHeaders(): Record<string, string> {
    const { appId, apiVersion, apiSecret } = YKY_CONFIG;
    const traceId = generateTraceId();
    // 生成当前10位时间戳
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const sign = generateSign(appId, apiVersion, traceId, timestamp, apiSecret);

    return {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        appID: appId,
        apiVersion,
        timestamp,
        traceID: traceId,
        sign,
    };
}

/* ========== 工具函数 ========== */

/**
 * 将运营商分类类型映射到枚举
 * @param operatorType - API 返回的 operatorType
 */
export function mapYkyOperator(operatorType: number): YkyOperator {
    const map: Record<number, YkyOperator> = {
        1: "mobile",
        2: "telecom",
        3: "unicom",
        4: "broadcast",
    };
    return map[operatorType] || "unknown";
}

/** 运营商中文标签 */
export const YKY_OPERATOR_LABEL: Record<YkyOperator, string> = {
    mobile: "中国移动",
    telecom: "中国电信",
    unicom: "中国联通",
    broadcast: "中国广电",
    unknown: "其他",
};

/** 选号模式文本映射 */
const SELECT_NUMBER_LABEL: Record<number, string> = {
    0: "不支持选号",
    1: "全国归属地",
    2: "固定归属地",
    3: "收货归属地",
    4: "省内随机",
    5: "省内自选",
};

/** 结算模式文本映射 */
const SETTLE_MODE_LABEL: Record<string, string> = {
    "1": "日结秒返",
    "2": "次月返佣",
    "3": "月月返佣",
    "4": "下单即返",
};

/**
 * 从商品数据中提取语音通话文本
 * @param product - 商品对象
 */
export function parseYkyVoice(product: YkyProduct): string {
    if (product.callDuration > 0) {
        return `${product.callDuration}分钟`;
    }
    return "";
}

/**
 * 计算总流量文本（通用+定向）
 * @param product - 商品对象
 */
export function parseYkyTotalFlow(product: YkyProduct): string {
    const total = product.commonFlow + product.fixedFlow;
    if (total > 0) {
        // 大于 1000 的显示为 G，否则显示 GB
        return `${total}GB`;
    }
    return "";
}

/**
 * 从商品数据中提取套餐时长文本
 * @param product - 商品对象
 */
export function parseYkyDuration(product: YkyProduct): string {
    // 从描述中提取时长信息
    const text = (product.des || "") + (product.name || "");
    if (/长期/.test(text)) return "长期";
    if (/永久/.test(text)) return "长期";
    if (/4年|四年/.test(text)) return "4年";
    if (/2年|二年|24个月|24月/.test(text)) return "2年";
    if (/1年|一年|12个月|12月/.test(text)) return "1年";
    if (/半年|6个月/.test(text)) return "6个月";
    if (/短期|短期套餐/.test(text)) return "短期";
    return "以套餐为准";
}

/**
 * 为商品生成彩色标签列表
 * @param product - 翼卡云商品对象
 */
export function parseYkyTags(product: YkyProduct): { text: string; className: string }[] {
    const tags: { text: string; className: string }[] = [];

    /* ===== 流量标签 ===== */
    const totalFlow = parseYkyTotalFlow(product);
    if (totalFlow) {
        tags.push({
            text: totalFlow,
            className: "bg-blue-50 text-blue-700 border-blue-200",
        });
    }

    /* ===== 语音标签 ===== */
    const voice = parseYkyVoice(product);
    if (voice) {
        tags.push({
            text: "含通话",
            className: "bg-purple-50 text-purple-700 border-purple-200",
        });
    }

    /* ===== 套餐时长 ===== */
    const duration = parseYkyDuration(product);
    if (duration && duration !== "以套餐为准") {
        tags.push({
            text: duration,
            className: "bg-teal-50 text-teal-700 border-teal-200",
        });
    }

    /* ===== 结算模式 ===== */
    const settleText = SETTLE_MODE_LABEL[product.settleMode];
    if (settleText) {
        tags.push({
            text: settleText,
            className: "bg-green-50 text-green-700 border-green-200",
        });
    }

    /* ===== 选号支持 ===== */
    if (product.selectNumber > 0) {
        tags.push({
            text: "可选号",
            className: "bg-orange-50 text-orange-700 border-orange-200",
        });
    }

    /* ===== 标签字典 ===== */
    if (product.tagsSelect && product.tagsSelect.length > 0) {
        for (const tagOpt of product.tagsSelect.slice(0, 3)) {
            if (tagOpt.label) {
                tags.push({
                    text: tagOpt.label,
                    className: "bg-gray-50 text-gray-600 border-gray-200",
                });
            }
        }
    }

    /* ===== 需要照片 ===== */
    if (product.uploadPhoto !== "0") {
        tags.push({
            text: "需上传照片",
            className: "bg-amber-50 text-amber-700 border-amber-200",
        });
    }

    /* ===== 免费包邮 ===== */
    tags.push({
        text: "免费包邮",
        className: "bg-orange-50 text-orange-700 border-orange-200",
    });

    return tags;
}

/**
 * 获取结算模式文本
 * @param settleMode - 结算模式值
 */
export function getSettleModeText(settleMode: string): string {
    return SETTLE_MODE_LABEL[settleMode] || "次月返佣";
}

/**
 * 获取选号模式文本
 * @param selectNumber - 选号模式值
 */
export function getSelectNumberText(selectNumber: number): string {
    return SELECT_NUMBER_LABEL[selectNumber] || "不支持选号";
}

/**
 * 生成翼卡云商品的立即办理链接
 *
 * 翼卡云 H5 店铺使用 hash 路由，商品详情路由格式为：
 *   /shop#/pages/goods/index?goodsId={id}&promoCode={code}
 * 直接传入商品 ID 和推广码即可跳转到对应商品下单页。
 *
 * @param productId - 商品ID
 */
export function getYkyOrderUrl(productId: number): string {
    return `https://iot.87haoka.cn/shop#/pages/goods/index?goodsId=${productId}&promoCode=${YKY_CONFIG.channelCode}`;
}

/* ========== 缓存 ========== */

/** 模块级缓存实例（服务进程内全局共享，TTL 12 小时） */
const productsCache = new MemoryCache<{
    products: YkyProductWithMeta[];
    total: number;
}>("翼卡云Cache");

/**
 * 将 API 分类值映射为内部枚举
 * 1=流量卡, 4=宽带, 5=靓号
 */
function mapCategory(category: number): string {
    switch (category) {
        case 1: return "dataCard";
        case 4: return "broadband";
        case 5: return "fancyNumber";
        default: return "other";
    }
}

/**
 * 为商品列表批量预计算元数据
 * 服务端一次性解析，客户端直接使用预计算字段
 * @param products - 原始商品列表
 */
function attachMeta(products: YkyProduct[]): YkyProductWithMeta[] {
    return products.map((p) => ({
        ...p,
        _operator: mapYkyOperator(p.operatorType),
        _totalFlow: parseYkyTotalFlow(p),
        _voice: parseYkyVoice(p),
        _duration: parseYkyDuration(p),
        _tags: parseYkyTags(p),
        _settleText: getSettleModeText(p.settleMode),
        _orderUrl: getYkyOrderUrl(p.id),
        _category: mapCategory(p.category),
        _region: p.numberRegionName || "",
    }));
}

/* ========== 核心 API 调用 ========== */

/**
 * 调用翼卡云接口获取在售商品列表
 * POST /openapi/goods/list
 *
 * 无需请求参数，所有认证信息通过 Header 传递。
 */
async function fetchProductsFromAPI(): Promise<YkyProduct[]> {
    const { baseUrl } = YKY_CONFIG;

    const response = await fetch(`${baseUrl}/openapi/goods/list`, {
        method: "POST",
        headers: buildHeaders(),
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`翼卡云API请求失败: HTTP ${response.status}`);
    }

    const result = (await response.json()) as YkyListResponse;

    /* ===== code=0 表示成功 ===== */
    if (result.code !== 0) {
        throw new Error(`翼卡云API错误: ${result.message || "未知错误"}`);
    }

    return result.data || [];
}

/**
 * 调用翼卡云接口获取指定商品详细信息
 * POST /openapi/goods/details
 *
 * @param productId - 商品ID
 */
export async function fetchYkyProductDetail(
    productId: number,
): Promise<YkyProductDetail> {
    const { baseUrl } = YKY_CONFIG;

    /* ===== 构建 x-www-form-urlencoded 请求体 ===== */
    const params = new URLSearchParams();
    params.append("id", String(productId));

    const response = await fetch(`${baseUrl}/openapi/goods/details`, {
        method: "POST",
        headers: buildHeaders(),
        body: params.toString(),
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`翼卡云API请求失败: HTTP ${response.status}`);
    }

    const result = (await response.json()) as YkyDetailResponse;

    /* ===== code=0 表示成功 ===== */
    if (result.code !== 0) {
        throw new Error(`翼卡云API错误: ${result.message || "未知错误"}`);
    }

    return result.data;
}

/**
 * 获取翼卡云全部在售商品（带缓存）— 仅供服务端调用
 * POST /openapi/goods/list
 *
 * ===== 缓存行为 =====
 * - 首次调用：从 API 拉取全量数据，预计算元数据，缓存 12 小时
 * - 有效期内：直接返回缓存，零网络开销
 * - 过期后：静默刷新缓存
 */
export async function fetchYkyProducts(): Promise<{
    products: YkyProductWithMeta[];
    total: number;
}> {
    const appId = YKY_CONFIG.appId;

    if (!appId || !YKY_CONFIG.apiSecret) {
        throw new Error(
            "翼卡云 API 未配置 (YKY_APP_ID / YKY_API_SECRET)，请在 .env 中设置",
        );
    }

    /* ===== 缓存命中 ===== */
    const cached = productsCache.get(appId);
    if (cached) return cached;

    console.log("[翼卡云Cache] 缓存失效或首次请求，开始拉取数据");

    /* ===== 从 API 拉取 ===== */
    const rawProducts = await fetchProductsFromAPI();

    /* ===== 预计算元数据 ===== */
    const productsWithMeta = attachMeta(rawProducts);

    /* ===== 写入缓存 ===== */
    const result = { products: productsWithMeta, total: productsWithMeta.length };
    productsCache.set(result, appId, productsWithMeta.length);

    return result;
}
