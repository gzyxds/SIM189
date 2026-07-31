/**
 * 卡易号卡平台（kayi123.com）API 服务模块
 *
 * 接口文档：https://s.apifox.cn/1cad9662-1cd9-48af-9649-cd23d7c9be7a/llms.txt
 * 对接地址：https://www.kayi123.com
 * 认证方式：请求头签名（appID + apiVersion + traceID + timestamp + API密钥 拼接后 md5）
 * 请求格式：列表/详情均为 POST；详情接口使用 application/x-www-form-urlencoded
 *
 * ===== 接口清单 =====
 * 1. /openapi/goods/list     — 获取在售商品列表（基本信息）
 * 2. /openapi/goods/details  — 获取指定商品详细信息（含佣金、注意事项、限制规则等）
 *
 * ===== 缓存策略 =====
 * 服务端内存缓存（MemoryCache），有效期 12 小时。
 * - 列表：首次拉取全量商品预计算元数据后缓存；
 * - 详情：按商品 id 单独缓存，失败不致命。
 *
 * ===== 平台/推广链接 =====
 * 专属店铺（渠道码 NZnxCXK0）：https://www.kayi123.com/s/NZnxCXK0
 * 订单查询：https://www.kayi123.com/shop#/pages/order/search/index?promoCode=NZnxCXK0
 */

import crypto from "crypto";
import { MemoryCache } from "./cache";

/* ========== 类型定义 ========== */

/** 运营商枚举（与项目其他模块保持一致） */
export type KayiOperator = "mobile" | "telecom" | "unicom" | "broadcast" | "unknown";

/** 商品标签字典选项（tagsSelect 项） */
export interface KayiTagOption {
    key: number;
    label: string;
    value: number;
    valueType?: string;
    type?: string;
    listClass?: string;
}

/** 下单限制规则 */
export interface KayiLimitRule {
    /** 年龄限制，如 ["18","28"] */
    age: string[];
    /** 反诈过滤 */
    fraudFilter?: boolean;
    /** 不发货地址关键词（接口可能为「字符串」换行/逗号分隔，或「字符串数组」） */
    noShippingKeyword: string | string[];
    /** 不发货地区 */
    noShippingRegion: string[];
    /** 只发货地区 */
    onlyShippingRegion: string[];
    /** 下单检查周期 */
    person?: { count?: number; cycle?: number };
}

/** 多规格信息（specMode=2 时有效） */
export interface KayiSpec {
    uuid: string;
    status?: number;
    name?: string;
    description?: string;
    commission?: string | number;
    costPrice?: string | number;
    acceptFee?: string | number;
    image?: string;
}

/** 卡易原始商品类型（列表 + 详情通用，详情字段为可选） */
export interface KayiProduct {
    /** 对接商品ID（接口唯一标识，用作路由与查找主键） */
    id: number;
    /** 商品营运商分类：1移动 2联通 3电信 4广电 */
    operatorType: number;
    /** 商品名称 */
    name: string;
    /** 商品编码（部分商品为空，不可作为主键） */
    code: string;
    /** 商品描述（如 "29元200G通用+300分钟"） */
    des: string;
    /** 推荐星级 */
    star: number;
    /** 售价(元) */
    price: number;
    /** 是否需要短信验证码，0否；1是 */
    smsCode: number;
    /** 选号模式，0不支持；1全国归属地；2固定归属地；3收货归属地；4省内随机；5省内自选 */
    selectNumber: number;
    /** 下单模板 */
    orderTemplate: number;
    /** 商品主图 URL */
    tips: string;
    /** 商品详情图列表（资费/套餐资料图） */
    details: string[];
    /** 销量 */
    sales: number;
    /** 通话时长（分钟） */
    callDuration: number;
    /** 通用流量（GB） */
    commonFlow: number;
    /** 定向流量（GB） */
    fixedFlow: number;
    /** 月租(元) */
    monthFee: number;
    /** 优惠月租(元) */
    favourMonthFee: number;
    /** 优惠期限（月） */
    favourTerm: number;
    /** 商品标签（id 数组） */
    tags: number[];
    /** 商品标签字典选项 */
    tagsSelect: KayiTagOption[];
    /** 结算模式，1日结秒返；2次月返佣；3月月返佣；4下单即返 */
    settleMode: number;
    /** 号码归属地市编码 */
    numberRegion: string;
    /** 上传照片模式，0无需上传；1需要上传 */
    uploadPhoto: string;
    /* ========== 详情接口专有字段（列表接口可能缺失） ========== */
    /** 分享话术 */
    shareName?: string;
    /** 达标佣金(元) */
    commission?: number;
    /** 月返佣金（settleMode=3 时有效） */
    monthCommission?: { commission: string; month: string }[];
    /** 注意事项（html 格式，渲染时做去标签处理） */
    matter?: string;
    /** 结算要求（纯文本） */
    compliance?: string;
    /** 主题背景色 */
    backgroundColor?: string;
    /** 海报ID */
    posterId?: number;
    /** 下单限制规则 */
    limitRule?: KayiLimitRule;
    /** 省市区编码名称 */
    provinceCode?: string;
    /** 证件验证，1是 */
    certNoMode?: number;
    /** 是否线下自提，1是 */
    isOffline?: number;
    /** 是否开启下单备注 */
    orderRemark?: number;
    /** 规格模式，1单规格，2多规格，3动态多规格 */
    specMode?: number;
    /** 多规格信息 */
    specs?: KayiSpec[];
    /** 商品状态，1上架中，其他已下架 */
    status?: number;
    /** 首次发布时间 */
    createdAt?: string;
}

/**
 * 扩展商品类型，包含服务端预计算的元数据
 */
export interface KayiProductWithMeta extends KayiProduct {
    /** 预计算运营商 */
    _provider: KayiOperator;
    /** 预计算展示月租（优惠月租优先，单位元，数字字符串） */
    _price: string;
    /** 预计算流量文本（如 "200G" / "200G+50G定向"） */
    _flow: string;
    /** 预计算通话文本（如 "300分钟"） */
    _call: string;
    /** 预计算标签列表（含样式类名） */
    _tags: { text: string; className: string }[];
    /** 预计算结算模式中文 */
    _settleModeLabel: string;
    /** 预计算归属地/选号文本 */
    _location: string;
    /** 商品办理链接（渠道专属店铺） */
    _orderUrl: string;
    /** 禁发区域（已规整，单行文本；无则空串） */
    _forbiddenArea: string;
    /** 年龄限制文本（如 "18-28岁"；无则空串） */
    _ageLimit: string;
}

/* ========== 配置 ========== */

/** 卡易号卡平台对接地址 */
const BASE_URL = "https://www.kayi123.com";

/** API 版本号（固定值） */
const API_VERSION = "2.0.0";

/** 卡易专属店铺首页（兜底办理链接，渠道码 NZnxCXK0） */
export const KAYI_SHOP_URL = "https://www.kayi123.com/s/NZnxCXK0";

/** 销售渠道推广码（promoCode），优先读环境变量 */
const KAYI_PROMO_CODE = process.env.KAYI_CHANNEL || "NZnxCXK0";

/**
 * 构造单个商品的办理页地址
 *
 * 格式：https://www.kayi123.com/shop#/pages/goods/index?goodsId={id}&promoCode={渠道码}
 * goodsId 即列表/详情接口返回的商品 id；无 id 时回退到店铺首页。
 */
export function buildKayiOrderUrl(goodsId: string | number | undefined | null): string {
    const id = String(goodsId ?? "").trim();
    if (!id) return KAYI_SHOP_URL;
    return `${BASE_URL}/shop#/pages/goods/index?goodsId=${encodeURIComponent(id)}&promoCode=${encodeURIComponent(KAYI_PROMO_CODE)}`;
}

/**
 * 卡易平台订单查询地址（携带渠道推广码）
 *
 * 格式：https://www.kayi123.com/shop#/pages/order/search/index?promoCode={渠道码}
 */
export const KAYI_ORDER_QUERY_URL = `${BASE_URL}/shop#/pages/order/search/index?promoCode=${encodeURIComponent(KAYI_PROMO_CODE)}`;

/** 缓存有效期（毫秒），默认 12 小时 */
const CACHE_TTL = 12 * 60 * 60 * 1000;

/** 结算模式中文映射 */
const SETTLE_MODE_LABEL: Record<number, string> = {
    1: "日结秒返",
    2: "次月返佣",
    3: "月月返佣",
    4: "下单即返",
};

/* ========== 缓存实例 ========== */

/** 列表缓存 */
const listCache = new MemoryCache<{ products: KayiProductWithMeta[]; total: number }>("KayiListCache", CACHE_TTL);

/** 详情缓存（按商品 id 区分） */
const detailCache = new MemoryCache<KayiProductWithMeta>("KayiDetailCache", CACHE_TTL);

/* ========== 认证 ========== */

/**
 * 读取环境变量中的对接参数
 * @throws 缺失时抛出错误
 */
function getCredentials() {
    const appId = process.env.KAYI_APP_ID;
    const apiKey = process.env.KAYI_API_KEY;
    const channel = process.env.KAYI_CHANNEL;
    if (!appId || !apiKey) {
        throw new Error("卡易号卡平台未配置（KAYI_APP_ID / KAYI_API_KEY），请在 .env 中设置");
    }
    return { appId, apiKey, channel: channel || "NZnxCXK0" };
}

/**
 * 生成签名请求头
 *
 * 签名算法：将 appID + apiVersion + traceID + timestamp + API密钥 顺序拼接，
 * 再对拼接字符串做 32 位小写 md5。
 */
function buildSignedHeaders() {
    const { appId, apiKey } = getCredentials();
    const apiVersion = API_VERSION;
    const timestamp = String(Math.floor(Date.now() / 1000));
    const traceID = crypto.randomBytes(16).toString("hex");
    const raw = appId + apiVersion + traceID + timestamp + apiKey;
    const sign = crypto.createHash("md5").update(raw).digest("hex");

    return {
        appID: appId,
        apiVersion,
        timestamp,
        traceID,
        sign,
    };
}

/* ========== 运营商工具 ========== */

/** operatorType → 运营商枚举映射（已用真实数据校验：1移动 2联通 3电信 4广电） */
export function mapKayiOperator(operatorType: number): KayiOperator {
    switch (operatorType) {
        case 1:
            return "mobile";
        case 2:
            return "unicom";
        case 3:
            return "telecom";
        case 4:
            return "broadcast";
        default:
            return "unknown";
    }
}

/** 运营商中文标签映射 */
export const KAYI_OPERATOR_LABEL: Record<KayiOperator, string> = {
    mobile: "中国移动",
    telecom: "中国电信",
    unicom: "中国联通",
    broadcast: "中国广电",
    unknown: "其他",
};

/** 选号模式 → 文本 */
function mapSelectNumber(selectNumber: number): string {
    switch (selectNumber) {
        case 1:
            return "全国归属地选号";
        case 2:
            return "固定归属地选号";
        case 3:
            return "收货地归属选号";
        case 4:
            return "省内随机";
        case 5:
            return "省内自选";
        default:
            return "随机归属地";
    }
}

/* ========== 元数据预计算 ========== */

/** 将换行/逗号分隔的禁发关键词规整为单行逗号文本 */
function normalizeForbiddenArea(rule?: KayiLimitRule): string {
    if (!rule) return "";
    const parts: string[] = [];
    /* noShippingKeyword 接口可能为「字符串」(换行/逗号分隔) 或「字符串数组」，统一归一化后处理 */
    const raw = rule.noShippingKeyword;
    const keywords: string[] =
        typeof raw === "string"
            ? raw.split(/[\n,，]/)
            : Array.isArray(raw)
              ? raw
              : [];
    keywords.forEach((k) => {
        k.split(/[\n,，]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((s) => parts.push(s));
    });
    if (Array.isArray(rule.noShippingRegion) && rule.noShippingRegion.length) {
        parts.push(...rule.noShippingRegion);
    }
    if (Array.isArray(rule.onlyShippingRegion) && rule.onlyShippingRegion.length) {
        parts.push(`仅发${rule.onlyShippingRegion.join("、")}`);
    }
    // 去重
    return Array.from(new Set(parts)).join("、");
}

/** 年龄限制文本 */
function buildAgeLimit(rule?: KayiLimitRule): string {
    const age = Array.isArray(rule?.age) ? rule!.age : [];
    if (!age.length) return "";
    const nums = age.map((a) => Number(a)).filter((n) => !Number.isNaN(n));
    if (nums.length === 2) return `${nums[0]}-${nums[1]}岁`;
    if (nums.length === 1) return `${nums[0]}岁`;
    return "";
}

/** 生成商品标签列表（含样式类名） */
function buildTags(p: KayiProduct, provider: KayiOperator): { text: string; className: string }[] {
    const tags: { text: string; className: string }[] = [];

    /* 运营商标签 */
    tags.push({
        text: KAYI_OPERATOR_LABEL[provider],
        className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    });

    /* 流量标签 */
    if (p.commonFlow > 0) {
        const text = p.fixedFlow > 0 ? `${p.commonFlow}G+${p.fixedFlow}G定向` : `${p.commonFlow}G`;
        tags.push({
            text,
            className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
        });
    }

    /* 通话标签 */
    if (p.callDuration > 0) {
        tags.push({
            text: `${p.callDuration}分钟`,
            className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
        });
    }

    /* 选号标签 */
    if (p.selectNumber > 0) {
        tags.push({
            text: "可选号",
            className: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800",
        });
    }

    /* 结算模式标签 */
    const settle = SETTLE_MODE_LABEL[p.settleMode];
    if (settle) {
        const isInstant = p.settleMode === 1 || p.settleMode === 4;
        tags.push({
            text: settle,
            className: isInstant
                ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
        });
    }

    /* 佣金标签 */
    const commission = p.commission ?? 0;
    if (commission > 0) {
        tags.push({
            text: `佣金¥${commission}`,
            className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
        });
    }

    /* 标签字典（tagsSelect.label）补充 */
    if (p.tagsSelect?.length) {
        p.tagsSelect.slice(0, 2).forEach((t) => {
            if (t.label && !tags.some((x) => x.text === t.label)) {
                tags.push({
                    text: t.label,
                    className: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
                });
            }
        });
    }

    return tags;
}

/** 规整 details 为字符串数组（接口偶发返回字符串或 null，避免渲染时 .map 崩溃） */
function normalizeDetails(d: unknown): string[] {
    if (Array.isArray(d)) return d.filter((x) => typeof x === "string") as string[];
    if (typeof d === "string" && d.trim()) return [d];
    return [];
}

/** 为单个商品预计算元数据 */
function attachMeta(p: KayiProduct): KayiProductWithMeta {
    const provider = mapKayiOperator(p.operatorType);
    const displayPrice = p.favourMonthFee > 0 ? p.favourMonthFee : p.monthFee;
    const flow =
        p.commonFlow > 0
            ? p.fixedFlow > 0
                ? `${p.commonFlow}G+${p.fixedFlow}G定向`
                : `${p.commonFlow}G`
            : "";
    const call = p.callDuration > 0 ? `${p.callDuration}分钟` : "";
    const location = p.selectNumber > 0 ? mapSelectNumber(p.selectNumber) : "全国随机归属地";

    return {
        ...p,
        details: normalizeDetails(p.details),
        _provider: provider,
        _price: String(displayPrice || p.monthFee || "?"),
        _flow: flow,
        _call: call,
        _tags: buildTags(p, provider),
        _settleModeLabel: SETTLE_MODE_LABEL[p.settleMode] || "未知",
        _location: location,
        _orderUrl: buildKayiOrderUrl(p.id),
        _forbiddenArea: normalizeForbiddenArea(p.limitRule),
        _ageLimit: buildAgeLimit(p.limitRule),
    };
}

/* ========== 通用请求 ========== */

/**
 * 发送签名请求到卡易平台
 * @param path 接口路径（如 /openapi/goods/list）
 * @param body 请求体
 * @param isForm 是否使用 form-urlencoded（详情接口为 true）
 */
async function signedRequest<T>(
    path: string,
    body: Record<string, unknown>,
    isForm = false,
): Promise<T> {
    const headers = buildSignedHeaders();
    const init: RequestInit = {
        method: "POST",
        headers: {
            ...headers,
            "Content-Type": isForm
                ? "application/x-www-form-urlencoded; charset=UTF-8"
                : "application/json",
        },
        cache: "no-store",
    };
    if (isForm) {
        init.body = new URLSearchParams(
            Object.entries(body).map(([k, v]) => [k, String(v)]),
        ).toString();
    } else {
        init.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}${path}`, init);
    if (!res.ok) {
        throw new Error(`卡易平台API请求失败 [${path}]: HTTP ${res.status}`);
    }
    return (await res.json()) as T;
}

/* ========== 核心 API 接口 ========== */

interface ListResponse {
    code: number;
    message: string;
    data: KayiProduct[];
    timestamp: number;
    traceID: string;
}

interface DetailResponse {
    code: number;
    message: string;
    data: KayiProduct;
    timestamp: number;
    traceID: string;
}

/**
 * 获取在售商品列表（带缓存）
 * POST /openapi/goods/list
 */
export async function fetchKayiProducts(): Promise<{
    products: KayiProductWithMeta[];
    total: number;
}> {
    const cacheKey = "all";
    const cached = listCache.get(cacheKey);
    if (cached) return cached;

    console.log("[Kayi] 缓存失效或首次请求，开始拉取商品列表");
    const resp = await signedRequest<ListResponse>("/openapi/goods/list", {});

    if (resp.code !== 0) {
        throw new Error(`卡易平台API错误 [list]: ${resp.message || "未知错误"}`);
    }

    const products = (resp.data || []).map(attachMeta);
    const result = { products, total: products.length };
    listCache.set(result, cacheKey, products.length);
    return result;
}

/**
 * 获取单个商品详情（带缓存，失败返回 null）
 *
 * 策略：以【列表接口】返回的完整结构化字段（月租/流量/通话/标签/选号 等）为基座，
 * 再用【详情接口】返回的数据做字段级覆盖，从而补全列表缺失的字段
 * （commission / compliance / matter / limitRule / status / specs 等）。
 *
 * 这样即使详情接口偶发失败或返回稀疏数据，详情页也能从列表拿到正确信息，
 * 不会出现「商品未找到」或关键字段空白的问题。
 *
 * POST /openapi/goods/details（form-urlencoded, body: { id }）
 */
export async function fetchKayiProductDetail(
    id: string | number,
): Promise<KayiProductWithMeta | null> {
    const key = String(id);
    const cached = detailCache.get(key);
    if (cached) return cached;

    /* 基座：列表接口（字段最全、最稳定） */
    let base: KayiProductWithMeta | null = null;
    try {
        const list = await fetchKayiProducts();
        base = list.products.find((p) => String(p.id) === key) ?? null;
    } catch {
        base = null;
    }

    /* 详情：补全列表缺失字段 */
    let detail: KayiProduct | null = null;
    try {
        const resp = await signedRequest<DetailResponse>(
            "/openapi/goods/details",
            { id: key },
            true,
        );
        if (resp.code === 0 && resp.data) detail = resp.data;
    } catch {
        detail = null;
    }

    /* 合并：详情覆盖列表；列表兜底，保证不空白 */
    const merged: KayiProduct | null = base
        ? { ...base, ...(detail ?? {}) }
        : (detail ?? (base as unknown as KayiProduct | null));

    if (!merged) return null;

    try {
        const product = attachMeta(merged);
        detailCache.set(product, key, 1);
        return product;
    } catch (e) {
        /* 元数据计算异常时降级返回列表基座（已含完整 _ 预计算字段），避免整页报错 */
        console.error("[Kayi] attachMeta 异常，降级使用列表基座元数据:", e);
        return base ?? null;
    }
}

/** 结算模式中文映射导出 */
export function kayiSettleModeLabel(mode: number): string {
    return SETTLE_MODE_LABEL[mode] || "未知";
}
