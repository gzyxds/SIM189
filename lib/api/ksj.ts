/**
 * 卡世界号卡 API 服务模块
 *
 * 对接卡世界号卡管理系统后台管理 API（ksjhaoka.com）获取号卡商品数据。
 * 接口文档: https://docs.apipost.net/docs/42ef729430e0000?locale=zh-cn（密码: 862390）
 *
 * 注意：本模块对接的是后台管理 API（/api/admin/store/sale），
 *       与文档中描述的公开 API（/api/index/goods/*）是两套不同的系统。
 *       后台管理 API 返回更丰富的数据（含佣金、状态、渠道等管理字段）。
 *
 * API 端点: GET /api/admin/store/sale?sign=<RSA加密参数>
 * 认证方式: JWT Token (HS256)，通过 Authorization Header（bearer 前缀）+ Cookie 双重传递
 * 签名方式: RSA 公钥加密（PKCS1 v1.5），将请求参数 JSON 序列化后加密为 sign 参数
 * Token 有效期: 319 天
 * 缓存策略: 服务端内存缓存，有效期 12 小时
 *
 * 图片基础 URL: https://ksj-oss.ksjhaoka.com/{相对路径}
 * 店铺地址: https://ym.ksjhaoka.com/?s=1sLLMhzr642829
 */
import * as crypto from "crypto";
import { MemoryCache } from "./cache";

/* ========== RSA 公钥（从卡世界前端 JS 提取） ========== */

/** 卡世界 RSA 公钥，用于请求参数签名 */
const KSJ_RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAwo5nKH5S5/7N1E+XE5U+
mccsSVmuVIyABF1NFQcad9kbH92vy4+aS52lfbCwRJ1niBf9QGGzWsMmKwMI2CP8
nkWXOAug6Aqud7NrLCiLDMAyYQOaUH6/eBG35Pb1pkSTgQ2mX/7OYe4pI7fHUc8Oy
lS1Gop3jufC6hoB6FXAz2FTBEUhNa7yyl5sKO9YAjrLk7rbSHqS4M+T9CjS0c0ORj
R8tPSqgMAdxpNNdPfzpm7h7jxCYQfid/Z+tG6YYluDFtvKJhbG/Y4C/q+jlxZ4Dit
tnGVwGuCXUQ8ZkRKEsCRjLIvpDGycyLJY6S8RvliVG19sc0hYlUw9uzfxvmxqPMLv
xxuqN6AOnV2aYGm+Rj1t8zBbq7PBwrEAFagElc+7WYsRrL74kDkQZK+Rg7XbQkwg
atErZZmqcENFQhfp7uBqRn7RZvg2pux6W9q3b9qmZD0Wy/QNQfRsluZB/ItHXZVou
JaC11tu30E1yLmBhPK/l0ixwEEloOk34gVror+j+7Ta9e6RqOL9p5W7EnN0imytso
/Pe307OvNUfsWtgyturSvmFuWtq+uBco0BdqtQiXluqfLUdZ6UChHOTd4ulyb/XE3
vmoGr1qP1b7pi83dDTBBPVG+pF3T1auL5AG7Hyu0i1ImAZqr5BwfVSSI34FqLnllu
TcJwD66QeBBOyrsCAwEAAQ==
-----END PUBLIC KEY-----`;

/* ========== 类型定义 ========== */

/** 卡世界运营商类型 */
export type KsjOperator = "mobile" | "telecom" | "unicom" | "broadcast" | "unknown";

/** 卡世界商品原始数据类型（来自 API /api/admin/store/sale） */
export interface KsjProduct {
    /** 内部记录ID */
    id: number;
    /** 商品ID（唯一标识） */
    goods_id: number;
    /** 商品完整名称 */
    name: string;
    /** 商品简称 */
    short_name: string;
    /** 运营商分类文本（广电/电信/联通/移动） */
    category_text: string;
    /** 运营商分类ID */
    category_id: string;
    /** 代理佣金（元） */
    agent_brokerage: number;
    /** 佣金类型: 1=次月返 2=日结 */
    brokerage_type: number;
    /** 佣金类型文本 */
    brokerage_type_text: string;
    /** 套餐组成详情 */
    package_composition: string;
    /** 归属地 */
    package_attribution: string;
    /** 不发地区 */
    forbidden_area: string;
    /** 快递方式 */
    delivery: string;
    /** 激活方式（上门激活/自主激活/快递激活） */
    activate_type: string;
    /** 年龄限制（如 "18-65岁"） */
    age_limit: string;
    /** 年龄规则数组 */
    age_rule: string[];
    /** 合约期文本（如 "12个月合约"） */
    package_contract_text: string;
    /** 合约期原始值 */
    package_contract: string;
    /** 结算规则 */
    commission: string;
    /** 首充渠道 */
    initial_charge_channel: string;
    /** 注销方式 */
    logout_mode: string;
    /** 停机复机方式 */
    backstop_machine: string;
    /** 商品状态: 1=上架 */
    status: number;
    /** 平台状态: 1=正常 */
    platform_status: number;
    /** 商品主图（相对路径） */
    main_img: string;
    /** 商品展示图（相对路径） */
    img: string;
    /** 海报图片数组 */
    poster: string[];
    /** 商品详情HTML */
    detail: string;
    /** 店铺ID */
    store_id: string;
    /** 号池类型 */
    pools: string;
    /** 商品类型文本（站内） */
    types: string;
    /** 上架时间 */
    created_time: string;
    /** 更新时间 */
    update_time: string;
    /** 排序权重 */
    sort: number;
    /** 备注 */
    remark: string;
}

/**
 * 扩展商品类型，包含预计算的元数据
 *
 * 在服务端获取数据时即完成运营商、标签等解析，
 * 避免客户端每次渲染都重复解析。
 */
export interface KsjProductWithMeta extends KsjProduct {
    /** 预计算运营商 */
    _operator: KsjOperator;
    /** 预计算标签列表 */
    _tags: { text: string; className: string }[];
    /** 预计算完整图片URL */
    _imageUrl: string;
    /** 预计算主图URL */
    _mainImageUrl: string;
}

/** API 响应结构（code=0 表示成功） */
interface KsjApiResponse {
    code: number;
    message: string;
    data: {
        list: KsjProduct[];
        pagination: {
            total: number;
            per_page: number;
            current_page: number;
            last_page: number;
        };
    };
}

/** 请求参数类型（用于生成 RSA 签名） */
interface KsjRequestParams {
    status: number;
    keyword: null;
    current: number;
    size: number;
    sort: string;
    city_id: number;
    get_type: string;
    goods_query_sort: string;
    category_id: string;
    goods_query_active: string;
    label: string;
    goods_query_settlement: string;
    timestamp: number;
}

/* ========== 缓存配置 ========== */

/** 模块级缓存实例（同进程内共享，TTL 12 小时） */
const productsCache = new MemoryCache<{
    products: KsjProductWithMeta[];
    total: number;
}>("KsjCache");

/* ========== 图片 URL 工具 ========== */

/** 卡世界 OSS 图片基础 URL */
const KSJ_IMAGE_BASE = "https://ksj-oss.ksjhaoka.com";

/** 卡世界店铺基础 URL（商品办理页面） */
const KSJ_STORE_BASE = "https://ym.ksjhaoka.com";

/**
 * 将相对图片路径转为完整 URL
 *
 * @param path - 相对路径（如 "images/product/202601/31/xxx.png"）
 * @returns 完整图片 URL
 */
function resolveImageUrl(path: string): string {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${KSJ_IMAGE_BASE}/${path}`;
}

/**
 * 生成商品办理页面 URL
 *
 * 格式: https://ym.ksjhaoka.com/show?id={goods_id}&s={store_id}
 * store_id 从环境变量 KSJ_STORE_ID 读取
 *
 * @param goodsId - 商品 goods_id
 * @returns 完整办理页面 URL
 */
export function getKsjApplyUrl(goodsId: number): string {
    const storeId = process.env.KSJ_STORE_ID || "1sLLMhzr642829";
    return `${KSJ_STORE_BASE}/show?id=${goodsId}&s=${storeId}`;
}

/* ========== 运营商映射 ========== */

/**
 * 根据 category_text 推断运营商
 *
 * @param categoryText - 运营商中文文本
 * @returns 运营商枚举值
 */
export function mapKsjOperator(categoryText: string): KsjOperator {
    switch (categoryText) {
        case "移动": return "mobile";
        case "电信": return "telecom";
        case "联通": return "unicom";
        case "广电": return "broadcast";
        default: return "unknown";
    }
}

/** 运营商中文标签 */
export const KSJ_OPERATOR_LABEL: Record<KsjOperator, string> = {
    mobile: "中国移动",
    telecom: "中国电信",
    unicom: "中国联通",
    broadcast: "中国广电",
    unknown: "其他",
};

/** 运营商样式配置（用于卡片/标签配色） */
export const KSJ_OPERATOR_STYLE: Record<
    KsjOperator,
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

/* ========== 元数据预计算 ========== */

/**
 * 为商品列表预计算元数据
 *
 * 在服务端一次性完成运营商、标签、图片URL的解析，
 * 客户端直接使用预计算字段。
 */
function attachMeta(products: KsjProduct[]): KsjProductWithMeta[] {
    return products.map((p) => {
        const operator = mapKsjOperator(p.category_text);

        /* ===== 标签列表 ===== */
        const tags: { text: string; className: string }[] = [];

        // 归属地标签
        if (p.package_attribution) {
            tags.push({
                text: p.package_attribution,
                className: "bg-green-50 text-green-700 border-green-200",
            });
        }

        // 套餐组成（截取流量信息）
        if (p.package_composition) {
            const flowMatch = p.package_composition.match(/\d+G/);
            if (flowMatch) {
                tags.push({
                    text: flowMatch[0],
                    className: "bg-blue-50 text-blue-700 border-blue-200",
                });
            }
            const voiceMatch = p.package_composition.match(/\d+分钟/);
            if (voiceMatch) {
                tags.push({
                    text: voiceMatch[0],
                    className: "bg-purple-50 text-purple-700 border-purple-200",
                });
            }
        }

        // 快递方式标签
        if (p.delivery) {
            tags.push({
                text: p.delivery,
                className: "bg-orange-50 text-orange-700 border-orange-200",
            });
        }

        // 合约期标签
        if (p.package_contract_text) {
            tags.push({
                text: p.package_contract_text,
                className: "bg-teal-50 text-teal-700 border-teal-200",
            });
        }

        // 年龄限制标签
        if (p.age_limit) {
            tags.push({
                text: p.age_limit,
                className: "bg-gray-50 text-gray-500 border-gray-200",
            });
        }

        // 佣金类型标签
        if (p.brokerage_type_text) {
            tags.push({
                text: p.brokerage_type_text,
                className: "bg-amber-50 text-amber-700 border-amber-200",
            });
        }

        return {
            ...p,
            _operator: operator,
            _tags: tags,
            _imageUrl: resolveImageUrl(p.img),
            _mainImageUrl: resolveImageUrl(p.main_img),
        };
    });
}

/* ========== RSA 签名工具 ========== */

/**
 * 生成卡世界 API 请求签名
 *
 * 签名流程（与前端 JS 一致）：
 * 1. 将请求参数 JSON 序列化
 * 2. 使用 RSA 公钥加密（PKCS1 v1.5）
 * 3. Base64 编码后 URI 解码
 *
 * @param params - 请求参数对象（包含 timestamp）
 * @returns 签名字符串
 */
function generateKsjSign(params: KsjRequestParams): string {
    const jsonStr = JSON.stringify(params);
    const encrypted = crypto.publicEncrypt(
        { key: KSJ_RSA_PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
        Buffer.from(jsonStr, "utf8")
    );
    // 与前端 decodeURI(base64) 一致
    return decodeURIComponent(encrypted.toString("base64"));
}

/* ========== 超时与网络工具 ========== */

/** 单次请求超时时间（毫秒） */
const FETCH_TIMEOUT_MS = 15000;

/**
 * 带超时的 fetch 请求
 *
 * 使用 AbortController 在指定时间内中断请求，
 * 防止 Vercel Serverless 函数因外部 API 响应慢而超时挂起。
 *
 * @param url - 请求地址
 * @param options - fetch 选项
 * @param timeoutMs - 超时毫秒数，默认 15000
 * @returns Response 对象
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } catch (err: unknown) {
        // 区分超时 / DNS / 网络等不同错误类型
        if (err instanceof DOMException && err.name === "AbortError") {
            throw new Error(
                `请求超时（${timeoutMs / 1000}s），卡世界 API 响应过慢`
            );
        }
        if (err instanceof TypeError) {
            // TypeError: fetch failed 通常是 DNS 解析失败或网络不可达
            const cause = (err as TypeError & { cause?: { code?: string } })
                .cause;
            const code = cause?.code || "";
            if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
                throw new Error(
                    `DNS 解析失败，无法连接 ksjhaoka.com（错误码: ${code}）`
                );
            }
            if (code === "ECONNREFUSED" || code === "ECONNRESET") {
                throw new Error(
                    `连接被拒绝或重置（错误码: ${code}）`
                );
            }
            if (code === "CERT_HAS_EXPIRED" || code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
                throw new Error(
                    `SSL 证书验证失败（错误码: ${code}）`
                );
            }
            throw new Error(
                `网络请求失败: ${err.message}${code ? `（错误码: ${code}）` : ""}`
            );
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

/* ========== 商品数据接口 ========== */

/**
 * 请求卡世界商品列表（单页）
 *
 * GET /api/admin/store/sale?sign=<RSA加密参数>
 * 使用 JWT Token 认证（Authorization: bearer + Cookie）
 *
 * @param token - JWT Token
 * @param currentPage - 当前页码（从 1 开始）
 * @param pageSize - 每页数量（API 限制最大 100）
 * @returns 商品列表及分页信息
 */
async function fetchKsjRaw(
    token: string,
    currentPage: number = 1,
    pageSize: number = 100
): Promise<KsjApiResponse> {
    /* ===== 构建请求参数 ===== */
    const params: KsjRequestParams = {
        status: 1,
        keyword: null,
        current: currentPage,
        size: pageSize, // API 限制最大 100 条/页
        sort: "+id",
        city_id: 0,
        get_type: "supply",
        goods_query_sort: "",
        category_id: "",
        goods_query_active: "",
        label: "",
        goods_query_settlement: "",
        timestamp: Math.floor(Date.now() / 1000),
    };

    /* ===== 生成 RSA 签名 ===== */
    const sign = generateKsjSign(params);
    const url =
        "https://ksjhaoka.com/api/admin/store/sale?sign=" +
        encodeURIComponent(sign);

    /* ===== 发送请求（带超时保护 + 模拟浏览器头） ===== */
    const response = await fetchWithTimeout(url, {
        method: "GET",
        headers: {
            Accept: "application/json, text/plain, */*",
            // 注意：卡世界使用小写 "bearer" 前缀
            Authorization: `bearer ${token}`,
            Cookie: `vue_admin_template_token=${token}`,
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
            Referer: "https://ksjhk.com/",
            Origin: "https://ksjhk.com",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`卡世界API请求失败: HTTP ${response.status}（第${currentPage}页）`);
    }

    const result = (await response.json()) as KsjApiResponse;

    // code === 10 表示登录失效
    if (result.code === 10) {
        throw new Error(`卡世界API错误: ${result.message || "登录失效，请重新登录"}`);
    }

    // code === 0 表示成功
    if (result.code !== 0) {
        throw new Error(`卡世界API错误: ${result.message || "未知错误"}`);
    }

    return result;
}

/**
 * 获取全部卡世界在线商品列表
 *
 * ===== 缓存行为 =====
 * - 首次调用：从 API 拉取全量数据，预计算元数据，缓存 12 小时
 * - 有效期内：直接返回缓存，零网络开销
 * - 过期后：自动刷新
 *
 * @returns 包含预计算元数据的商品列表及总数
 */
export async function fetchKsjProducts(): Promise<{
    products: KsjProductWithMeta[];
    total: number;
}> {
    const token = process.env.KASJ_API_TOKEN;

    if (!token) {
        throw new Error("卡世界 API 未配置 (KASJ_API_TOKEN)");
    }

    /* ===== 缓存命中：直接返回 ===== */
    const cached = productsCache.get(token);
    if (cached) return cached;

    console.log("[KsjCache] 缓存失效或首次请求，开始拉取数据");

    /* ===== 循环拉取所有分页数据（最大 5 页，防止 Vercel 函数超时） ===== */
    const MAX_PAGES = 5;
    const allProducts: KsjProduct[] = [];
    let currentPage = 1;
    let lastPage = 1; // 默认 1 页，首页响应后更新

    do {
        const result = await fetchKsjRaw(token, currentPage);
        const pageList = result.data?.list || [];
        allProducts.push(...pageList);

        const pagination = result.data?.pagination;
        lastPage = pagination?.last_page ?? 1;

        console.log(
            `[KsjCache] 第 ${currentPage}/${lastPage} 页，本页 ${pageList.length} 条，累计 ${allProducts.length} 条`
        );

        currentPage++;
    } while (currentPage <= lastPage && currentPage <= MAX_PAGES);

    if (currentPage <= lastPage) {
        console.warn(
            `[KsjCache] 已达最大页数限制（${MAX_PAGES} 页），剩余 ${lastPage - MAX_PAGES} 页未加载`
        );
    }

    console.log(`[KsjCache] 全量拉取完成，共 ${allProducts.length} 条商品`);

    /* ===== 过滤仅上架商品（status === 1 且 platform_status === 1） ===== */
    const onlineProducts = allProducts.filter(
        (p) => p.status === 1 && p.platform_status === 1
    );

    /* ===== 预计算元数据 ===== */
    const productsWithMeta = attachMeta(onlineProducts);

    /* ===== 写入缓存 ===== */
    const cacheResult = {
        products: productsWithMeta,
        total: onlineProducts.length,
    };
    productsCache.set(cacheResult, token, onlineProducts.length);

    return cacheResult;
}

/**
 * 根据商品ID查找单个商品
 *
 * @param goodsId - 商品ID（goods_id字段）
 * @returns 商品数据或 null
 */
export async function fetchKsjProductById(
    goodsId: number
): Promise<KsjProductWithMeta | null> {
    const { products } = await fetchKsjProducts();
    return products.find((p) => p.goods_id === goodsId) || null;
}
