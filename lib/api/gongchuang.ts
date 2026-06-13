/**
 * 共创号卡 API 服务模块
 *
 * 对接共创号卡系统（haoka.kakatx.com）获取号卡商品数据。
 * 接口文档: https://apifox.com/apidoc/shared/78cd043d-6ebf-419c-b368-583343ccc54a/api-207134228
 *
 * API 端点: POST /haoka/api/order/getProductList
 * 签名方式: MD5(参数按 key 排序拼接 + &key=SECRET)
 * 缓存策略: 服务端内存缓存，有效期 12 小时（43200 秒）
 *
 * 账号信息:
 *   用户名: 流量派
 *   秘钥: 44d2c975b2d6f76c190f82f5dbeffa05
 */
import crypto from "crypto";
import { MemoryCache } from "./cache";

/* ========== 类型定义 ========== */

/** 共创号卡运营商枚举 */
export type GongchuangOperator = "mobile" | "telecom" | "unicom" | "broadcast" | "unknown";

/** 共创号卡商品原始数据类型（来自 API /haoka/api/order/getProductList） */
export interface GongchuangProduct {
    /** 商品ID */
    goods_id: number;
    /** 商品名称 */
    goods_name: string;
    /** 号卡类型: 1移动 2电信 3联通 4广电 */
    goods_type: number;
    /** 归属地 */
    belonging: string;
    /** 套餐月租 */
    price: string;
    /** 原套餐费 */
    line_price: string;
    /** 商品主图URL */
    imageUrl: string;
    /** 通话时长 */
    callDuration: string;
    /** 通用流量 */
    flowsA: string;
    /** 定向流量 */
    flowsB: string;
    /** 优惠详情（HTML） */
    summary: string;
    /** 商品详情（HTML） */
    content: string;
    /** 商品状态: 1上架 2下架 */
    status: number;
    /** 是否需要身份证号: 1是 0否 */
    isCardId: number;
    /** 是否需要身份证照片: 1是 0否 */
    isCardPhoto: number;
    /** 佣金 */
    commitionPrice: string;
    /** 是否需要选号: 1是 0否 */
    isSelectNumber: number;
    /** 年龄区间，格式: 18-60 */
    age: string;
    /** 禁发区域 */
    regionText: string;
    /** 创建时间（秒级时间戳） */
    createTime: number;
    /** 快递方式 */
    express: string;
    /** 首充链接 */
    pay_url: string;
    /** 优惠日期 */
    yhq: string;
    /** 合约期 */
    hyq: string;
    /** 首月资费方式 */
    firstMonthFee: string;
    /** 定向软件 */
    soft: string;
    /** 推广渠道 */
    channel: string;
    /** 注销方式 */
    del: string;
    /** 复机方式 */
    fjfs: string;
    /** 结算规则 */
    jsgz: string;
    /** 激活方式 */
    jhfs: string;
    /** 实名步骤图URL */
    smbz: string;
    /** 套餐详情图URL */
    tcxq: string;
    /** 佣金类型: 1佣金次月 2佣金日结 */
    comType: number;
    /** 产品类型: 0号卡 1宽带 */
    cardType: number;
}

/**
 * 扩展商品类型，包含预计算的元数据
 *
 * 在服务端获取数据时即完成运营商、流量、归属地等解析，
 * 避免客户端每次渲染都重复解析。
 */
export interface GongchuangProductWithMeta extends GongchuangProduct {
    /** 预计算运营商 */
    _operator: GongchuangOperator;
    /** 预计算通用流量显示文本 */
    _flow: string;
    /** 预计算通话时长显示文本 */
    _voice: string;
    /** 预计算标签列表 */
    _tags: { text: string; className: string }[];
    /** 预计算套餐时长 */
    _duration: string;
    /** 预计算佣金类型文本 */
    _comTypeLabel: string;
}

/** API 商品列表响应结构 */
interface GongchuangResponse {
    code: number;
    msg: string;
    data: GongchuangProduct[];
}

/* ========== 缓存配置 ========== */

/** 模块级缓存实例（同进程内共享，TTL 12 小时） */
const productsCache = new MemoryCache<{
    products: GongchuangProductWithMeta[];
    total: number;
}>("GongchuangCache");

/* ========== 签名工具 ========== */

/**
 * 生成 MD5 签名
 *
 * 签名算法（共创号卡平台规范）:
 * 1. 获取所有 post 参数（剔除 sign 字段）
 * 2. 按 key 的 ASCII 码递增排序
 * 3. 组合为 key=value&key=value 格式
 * 4. 尾部拼接 &secret=秘钥值
 * 5. 计算 MD5 返回 32 位小写
 *
 * 文档来源: https://apifox.com/apidoc/shared/78cd043d-6ebf-419c-b368-583343ccc54a
 * 示例: address=XXX&area=下城区&...&timestamp=1700548777&username=六六&secret=f9b5e539575601e5f239004a0a576d0d
 *
 * @param params - 请求参数对象（不含 sign）
 * @param secret - API 秘钥
 * @returns 32 位小写 MD5 签名
 */
function generateSign(params: Record<string, string | number>, secret: string): string {
    // 按 key 字母自然排序（ASCII 递增）
    const sortedKeys = Object.keys(params).sort();

    // 拼接为 key=value&key=value&secret=SECRET 格式
    const signStr = sortedKeys.map((k) => `${k}=${params[k]}`).join("&") + `&secret=${secret}`;

    // MD5 32 位小写
    return crypto.createHash("md5").update(signStr, "utf8").digest("hex");
}

/* ========== 商品数据接口 ========== */

/**
 * 请求共创号卡商品列表
 *
 * POST /haoka/api/order/getProductList
 *
 * @param username - API 用户名
 * @param secret - API 秘钥
 * @param goodsId - 商品ID（传空字符串获取全部）
 */
async function fetchGongchuangRaw(
    username: string,
    secret: string,
    goodsId: number | "" = "",
): Promise<GongchuangResponse> {
    /** 生成 10 位时间戳 */
    const timestamp = String(Math.floor(Date.now() / 1000));

    const params: Record<string, string | number> = {
        username,
        goods_id: goodsId,
        timestamp,
    };
    const sign = generateSign(params, secret);

    const response = await fetch("https://haoka.kakatx.com/haoka/api/order/getProductList", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, sign }),
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`共创号卡API请求失败: HTTP ${response.status}`);
    }

    const result = (await response.json()) as GongchuangResponse;

    // code === 1 表示成功
    if (result.code !== 1) {
        throw new Error(`共创号卡API错误: ${result.msg || "未知错误"}`);
    }

    return result;
}

/* ========== 元数据预计算 ========== */

/**
 * 根据 goods_type 推断运营商
 *
 * goods_type: 1移动 2电信 3联通 4广电
 */
export function mapGongchuangOperator(goodsType: number, goodsName?: string): GongchuangOperator {
    switch (goodsType) {
        case 1: return "mobile";
        case 2: return "telecom";
        case 3: return "unicom";
        case 4: return "broadcast";
        default: {
            // 兜底：从商品名称推断
            const name = goodsName || "";
            if (/移动|mobile/i.test(name)) return "mobile";
            if (/电信|telecom/i.test(name)) return "telecom";
            if (/联通|unicom/i.test(name)) return "unicom";
            if (/广电|broadcast/i.test(name)) return "broadcast";
            return "unknown";
        }
    }
}

/** 运营商中文标签 */
export const GONGCHUANG_OPERATOR_LABEL: Record<GongchuangOperator, string> = {
    mobile: "中国移动",
    telecom: "中国电信",
    unicom: "中国联通",
    broadcast: "中国广电",
    unknown: "其他",
};

/** 佣金类型标签 */
function getComTypeLabel(comType: number): string {
    return comType === 2 ? "佣金日结" : "佣金次月";
}

/**
 * 为商品列表预计算元数据
 *
 * 在服务端一次性完成所有字段的解析，
 * 客户端直接使用 _operator / _flow / _voice / _tags / _duration / _comTypeLabel 字段。
 */
function attachMeta(products: GongchuangProduct[]): GongchuangProductWithMeta[] {
    return products.map((p) => {
        const operator = mapGongchuangOperator(p.goods_type, p.goods_name);

        /* ===== 流量文本 ===== */
        const flowParts: string[] = [];
        if (p.flowsA && p.flowsA !== "0") flowParts.push(`${p.flowsA}G通用`);
        if (p.flowsB && p.flowsB !== "0") flowParts.push(`${p.flowsB}G定向`);
        const flow = flowParts.join("+") || "";

        /* ===== 通话时长文本 ===== */
        const voice = p.callDuration && p.callDuration !== "0"
            ? `${p.callDuration}分钟`
            : "";

        /* ===== 套餐时长 ===== */
        let duration = "未知";
        if (p.yhq) {
            if (/长期/.test(p.yhq)) duration = "长期";
            else duration = p.yhq;
        }
        if (duration === "未知" && p.hyq) {
            duration = p.hyq;
        }

        /* ===== 标签列表 ===== */
        const tags: { text: string; className: string }[] = [];

        // 归属地标签
        if (p.belonging) {
            tags.push({
                text: p.belonging,
                className: "bg-green-50 text-green-700 border-green-200",
            });
        }

        // 流量标签
        if (flow) {
            tags.push({
                text: flow,
                className: "bg-blue-50 text-blue-700 border-blue-200",
            });
        }

        // 通话标签
        if (voice) {
            tags.push({
                text: "含通话",
                className: "bg-purple-50 text-purple-700 border-purple-200",
            });
        }

        // 快递标签
        if (p.express) {
            tags.push({
                text: p.express,
                className: "bg-orange-50 text-orange-700 border-orange-200",
            });
        } else {
            tags.push({
                text: "免费包邮",
                className: "bg-orange-50 text-orange-700 border-orange-200",
            });
        }

        // 套餐时长标签
        if (duration !== "未知") {
            tags.push({
                text: duration,
                className: "bg-teal-50 text-teal-700 border-teal-200",
            });
        }

        // 年龄限制
        if (p.age) {
            tags.push({
                text: `${p.age}岁`,
                className: "bg-gray-50 text-gray-500 border-gray-200",
            });
        }

        /* ===== 佣金类型标签 ===== */
        const comTypeLabel = getComTypeLabel(p.comType);

        return {
            ...p,
            _operator: operator,
            _flow: flow,
            _voice: voice,
            _tags: tags,
            _duration: duration,
            _comTypeLabel: comTypeLabel,
        };
    });
}

/**
 * 获取全部共创号卡在线商品列表
 *
 * ===== 缓存行为 =====
 * - 首次调用：从 API 拉取全量数据，预计算元数据，缓存 12 小时
 * - 有效期内：直接返回缓存，零网络开销
 * - 过期后：自动刷新
 *
 * @returns 包含预计算元数据的商品列表及总数
 */
export async function fetchGongchuangProducts(): Promise<{
    products: GongchuangProductWithMeta[];
    total: number;
}> {
    const username = process.env.GONGCHUANG_USERNAME;
    const secret = process.env.GONGCHUANG_SECRET;

    if (!username || !secret) {
        throw new Error("共创号卡 API 未配置 (GONGCHUANG_USERNAME / GONGCHUANG_SECRET)");
    }

    /* ===== 缓存命中：直接返回 ===== */
    const cached = productsCache.get(username);
    if (cached) return cached;

    console.log("[GongchuangCache] 缓存失效或首次请求，开始拉取数据");

    /* ===== 请求全部商品（goods_id 传空字符串） ===== */
    const result = await fetchGongchuangRaw(username, secret, "");

    const allProducts = result.data || [];

    /* ===== 过滤仅上架商品（status === 1） ===== */
    const onlineProducts = allProducts.filter((p) => p.status === 1);

    /* ===== 预计算元数据 ===== */
    const productsWithMeta = attachMeta(onlineProducts);

    /* ===== 写入缓存 ===== */
    const cacheResult = {
        products: productsWithMeta,
        total: onlineProducts.length,
    };
    productsCache.set(cacheResult, username, onlineProducts.length);

    return cacheResult;
}

/* ========== 运营商 UI 配置 ========== */

/** 运营商样式配置（用于卡片/标签配色） */
export const GONGCHUANG_OPERATOR_STYLE: Record<
    GongchuangOperator,
    { badge: string; dot: string }
> = {
    mobile: {
        badge: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
        dot: "bg-green-500 dark:bg-green-400",
    },
    telecom: {
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
        dot: "bg-blue-500 dark:bg-blue-400",
    },
    unicom: {
        badge: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
        dot: "bg-orange-500 dark:bg-orange-400",
    },
    broadcast: {
        badge: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400",
        dot: "bg-purple-500 dark:bg-purple-400",
    },
    unknown: {
        badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        dot: "bg-gray-400 dark:bg-gray-500",
    },
};
