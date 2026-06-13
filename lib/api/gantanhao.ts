/**
 * 卡业联盟（感叹号）API 服务模块
 *
 * 接口文档：https://gantanhao.apifox.cn/llms.txt
 * 基础地址：https://server.gantanhao.com/api/api/
 * 认证方式：api_key 参数直传（无需签名/加密）
 * 请求格式：POST + Content-Type: application/json
 *
 * ===== 接口清单 =====
 * 1. selectProduct     — 查询商品列表（分页，pageSize 最大 20）
 * 2. getProductSkuList — 获取多规格产品的 SKU 列表（限频 10 次/分钟）
 * 3. selectNumber      — 选号商品查询可选号码
 * 4. submitOrder       — 提交订单（apiOrderId 全局唯一，不可重复）
 * 5. selectOrder       — 订单查询（支持批量，最多 50 个）
 * 6. getProductCopywriting — 获取产品朋友圈推广文案
 *
 * ===== 缓存策略 =====
 * 服务端内存缓存（MemoryCache），有效期 12 小时。
 * 首次请求从 API 拉取全量商品并预计算元数据；
 * 后续请求直接从缓存返回，零网络开销。
 *
 * ===== 店铺/推广链接 =====
 * 店铺首页：https://h5.gantanhao.com/sZIx
 * 代理申请：https://h5.gantanhao.com/FteA
 */

import { MemoryCache } from "./cache";

/* ========== 类型定义 ========== */

/** 运营商枚举（与项目其他模块保持一致） */
export type GantanhaoOperator = "mobile" | "telecom" | "unicom" | "broadcast" | "unknown";

/** 归属地类型 */
export type GantanhaoLocationType = "全国" | "收货地即归属地" | "随机归属地" | string;

/** 套餐时长类型 */
export type GantanhaoDurationType = "短期" | "1年" | "2年" | "长期" | "未知";

/**
 * 卡业联盟原始商品数据类型
 *
 * 数据来源：POST /api/api/selectProduct
 * codeNumber 是产品唯一编码（提单时使用）
 */
export interface GantanhaoProduct {
    /** 运营商（中文，如 "广电"、"移动"、"电信"、"联通"） */
    type: string;
    /** 商品主标题（如 "80007-广电祥龙卡"） */
    name: string;
    /** 商品副标题（如 "祥龙卡19元包192G通用+通话0.15元/分钟"） */
    subName: string;
    /** 产品编码（唯一标识，提单时使用） */
    codeNumber: string;
    /** 归属地说明（如 "收货地为归属地"） */
    location: string;
    /** 配送方式（如 "京东"） */
    deliveryMethod: string;
    /** 年龄限制（如 "18-70周岁"） */
    ageLimit: string;
    /** 禁发区域（逗号分隔的地址列表） */
    forbiddenArea: string;
    /** 激活参考图片 URL */
    activationImg: string;
    /** 其他备注 */
    otherRemarks: string;
    /** 套餐合约周期（如 "6个月"） */
    packageContract: string;
    /** 激活方式（如 "快递员上门激活"） */
    openCardMethod: string;
    /** 复机方式（如 "拨打10099"） */
    againType: string;
    /** 首充渠道（如 "激活当月快递处充值"） */
    firstChargeChannel: string;
    /** 结算规则 */
    settlementRules: string;
    /** 封面图 URL */
    img: string;
    /** 详情图 URL */
    descImg: string;
    /** 返佣方式：1=月返，2=秒返 */
    rebateType: number;
    /** 是否选号：1=选号，2=不选 */
    isSelectNumber: number;
    /** 佣金（元） */
    commission: string;
    /** 标签（逗号分隔的字符串） */
    tags: string;
    /** 发布时间 */
    entryTime: string;
    /** 发货率（百分比数值） */
    deliveryRate: number;
    /** 发货耗时（小时） */
    deliveryTime: number;
    /** 是否需要验证码：1=需要，2=不需要 */
    needVerificationCode: number;
    /** 是否上传三证：1=需要，2=不需要 */
    needUploadThreeCertificates: number;
    /** 是否在售：1=在售，2=下架 */
    isOnSale: number;
    /** 是否省内产品：1=省内，2=非省内 */
    isProvince: number;
    /** 是否上传第四照（公安码）：1=是，2=否 */
    isPublicSecurityCode: number;
    /** 第四照标题 */
    fourthPhotoTitle: string;
    /** 第四照提示 */
    fourthPhotoPrompt: string;
    /** 第四照查询链接（可能为空） */
    fourthPhotoUrl: string;
    /** 是否为多规格产品（true 时提单需传 productSkuId） */
    isSku: boolean;
}

/**
 * 扩展商品类型，包含服务端预计算的元数据
 *
 * 在服务端一次性完成运营商、归属地、时长、标签的解析，
 * 避免客户端每次渲染都重复解析字符串。
 */
export interface GantanhaoProductWithMeta extends GantanhaoProduct {
    /** 预计算运营商 */
    _provider: GantanhaoOperator;
    /** 预计算归属地 */
    _location: GantanhaoLocationType;
    /** 预计算套餐时长 */
    _duration: GantanhaoDurationType;
    /** 预计算标签列表（含样式类名） */
    _tags: { text: string; className: string }[];
    /** 预计算月租价格（从 subName 中提取） */
    _price: string;
    /** 预计算流量（从 subName 中提取） */
    _flow: string;
    /** 商品办理链接（H5 店铺地址） */
    _orderUrl: string;
}

/** 产品 SKU 规格类型（多规格产品使用） */
export interface GantanhaoSku {
    /** SKU ID（提单时作为 productSkuId 传入） */
    id: number;
    /** 规格名称（如 "30元 1000M 40G+550分钟"） */
    name: string;
    /** 规格描述（如 "规格一"） */
    package_desc: string;
    /** 该规格的佣金（元） */
    commission: string;
    /** 是否为默认规格 */
    is_default: boolean;
}

/** 可选号码类型 */
export interface GantanhaoNumber {
    /** 可选手机号码 */
    mobile: string;
}

/** 订单查询响应类型 */
export interface GantanhaoOrder {
    /** 系统内订单编号 */
    orderNumber: string;
    /** 订单生成时间 */
    entryTime: string;
    /** 订单最后更新时间 */
    lastTime: string;
    /** 发货耗时 */
    fahuohsTime: string | null;
    /**
     * 订单状态
     * 1=待开卡 2=开卡中 3=已发货 4=开卡失败 5=三照异常
     */
    orderStatus: number;
    /**
     * 号码状态
     * 1=未激活 2=已激活 3=激活且充值
     */
    numberStatus: number;
    /** 号码激活时间 */
    activationTime: string | null;
    /**
     * 财务状态
     * 1=待结算 2=已结算 3=数据修正 4=拒绝结算
     */
    financialStatus: number;
    /** 财务原因 */
    financialReason: string | null;
    /** 收件人姓名 */
    recipientName: string;
    /** 收件人电话（脱敏） */
    recipientPhone: string;
    /** 收件人身份证号（脱敏） */
    recipientIdCard: string;
    /** 收件人地址 */
    recipientAddress: string;
    /** 收件人详细地址 */
    recipientDetailAddress: string;
    /** 充值金额 */
    rechargeAmount: number | null;
    /** 开卡号码 */
    productionNumber: string;
    /** 配送方式 */
    deliveryMethod: string;
    /** 物流单号 */
    expressNumber: string;
    /** 备注（含失败原因等） */
    remark: string;
    /** 外部订单号（即提单时的 apiOrderId） */
    downOrderNumber: string;
    /** 身份证人像面 URL */
    picFace: string | null;
    /** 身份证国徽面 URL */
    picBack: string | null;
    /** 手持身份证照片 URL */
    picHand: string | null;
}

/** 提交订单响应类型 */
export interface GantanhaoSubmitOrderResult {
    /** 系统内订单编号 */
    orderNumber: string;
    /** 提单时的外部订单号 */
    apiOrderId: string;
}

/* ========== API 响应结构 ========== */

/** selectProduct 接口响应 */
interface SelectProductResponse {
    code: number;
    msg: string;
    result: {
        data: GantanhaoProduct[];
        total: number;
    };
}

/** getProductSkuList 接口响应 */
interface GetProductSkuListResponse {
    code: number;
    msg: string;
    result: {
        data: GantanhaoSku[];
        total: number;
    };
}

/** selectNumber 接口响应 */
interface SelectNumberResponse {
    code: number;
    msg: string;
    result: GantanhaoNumber[];
}

/** submitOrder 接口响应 */
interface SubmitOrderResponse {
    code: number;
    msg: string;
    result: GantanhaoSubmitOrderResult;
}

/** selectOrder 接口响应 */
interface SelectOrderResponse {
    code: number;
    msg: string;
    result: GantanhaoOrder;
}

/** getProductCopywriting 接口响应（朋友圈推广文案） */
interface GetProductCopywritingResponse {
    code: number;
    msg?: string;
    /** 服务端 500 时返回 message 而非 msg */
    message?: string;
    /** 预写的朋友圈营销文案（含 emoji，可直接复制分享） */
    result?: string;
}

/* ========== 配置 ========== */

/** 卡业联盟 API 基础地址 */
const BASE_URL = "https://server.gantanhao.com/api/api";

/** 卡业联盟 H5 店铺首页（兜底办理链接） */
export const GANTANHAO_SHOP_URL = "https://h5.gantanhao.com/sZIx";

/** 卡业联盟商品详情页基础地址（拼接 codeNumber 使用） */
const GANTANHAO_DETAIL_BASE = "https://h5.gantanhao.com/about2";

/** 推广来源标识（from 参数，固定值） */
const GANTANHAO_FROM = "3@C@@BEtq@?GA;GBGs;BpGB;FoAC;t@ooBsssstGr3@C@@";

/** 分页大小（API 限制单次最大 20） */
const PAGE_SIZE = 20;

/* ========== 缓存配置 ========== */

/** 商品列表缓存实例（TTL 12 小时） */
const productsCache = new MemoryCache<{
    products: GantanhaoProductWithMeta[];
    total: number;
}>("GantanhaoCache");

/* ========== 运营商工具函数 ========== */

/**
 * 根据运营商中文名称映射为枚举值
 * @param type - 运营商中文名（如 "广电"、"移动"）
 */
export function mapGantanhaoOperator(type: string): GantanhaoOperator {
    if (!type) return "unknown";
    if (/移动/.test(type)) return "mobile";
    if (/电信/.test(type)) return "telecom";
    if (/联通/.test(type)) return "unicom";
    if (/广电/.test(type)) return "broadcast";
    return "unknown";
}

/** 运营商中文标签映射 */
export const GANTANHAO_OPERATOR_LABEL: Record<GantanhaoOperator, string> = {
    mobile: "中国移动",
    telecom: "中国电信",
    unicom: "中国联通",
    broadcast: "中国广电",
    unknown: "其他",
};

/* ========== 元数据预计算函数 ========== */

/**
 * 从归属地字段解析归属地类型
 * @param location - 原始 location 字段（如 "收货地为归属地"）
 */
function parseLocation(location: string): GantanhaoLocationType {
    if (!location) return "全国";
    if (/收货地/.test(location)) return "收货地即归属地";
    if (/随机/.test(location)) return "随机归属地";
    return location;
}

/**
 * 从套餐合约周期或副标题推断套餐时长
 * @param contract - packageContract 字段（如 "6个月"）
 * @param subName - 副标题（可能含"长期"等关键词）
 */
function parseDuration(contract: string, subName: string): GantanhaoDurationType {
    const combined = `${contract} ${subName}`;
    if (/长期/.test(combined)) return "长期";
    if (/2年|24个月|24月/.test(combined)) return "2年";
    if (/1年|12个月|12月/.test(combined)) return "1年";
    if (/短期/.test(combined)) return "短期";
    return "未知";
}

/**
 * 从副标题中提取月租价格
 * @param subName - 副标题（如 "祥龙卡19元包192G通用"）
 */
function parsePrice(subName: string): string {
    const match = subName.match(/(\d+(?:\.\d+)?)\s*元/);
    return match ? `${match[1]}元` : "";
}

/**
 * 从副标题中提取流量信息
 * @param subName - 副标题（如 "19元包192G通用"）
 */
function parseFlow(subName: string): string {
    const match = subName.match(/(\d+(?:\.\d+)?)\s*(?:GB|G)/i);
    return match ? `${match[1]}G` : "";
}

/**
 * 生成商品标签列表（含样式类名）
 *
 * 标签来源：运营商、归属地、流量、配送方式、合约时长、选号、返佣方式等
 * @param product - 原始商品数据
 */
function buildTags(product: GantanhaoProduct): { text: string; className: string }[] {
    const tags: { text: string; className: string }[] = [];

    /* ===== 归属地标签 ===== */
    const location = parseLocation(product.location);
    tags.push({
        text: location,
        className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
    });

    /* ===== 流量标签 ===== */
    const flow = parseFlow(product.subName);
    if (flow) {
        tags.push({
            text: flow,
            className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
        });
    }

    /* ===== 通话标签 ===== */
    const voiceMatch = product.subName.match(/(\d+)\s*分钟/);
    if (voiceMatch) {
        tags.push({
            text: `${voiceMatch[1]}分钟`,
            className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
        });
    }

    /* ===== 配送方式标签 ===== */
    if (/京东/.test(product.deliveryMethod)) {
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

    /* ===== 合约时长标签 ===== */
    const duration = parseDuration(product.packageContract, product.subName);
    if (duration !== "未知") {
        tags.push({
            text: duration,
            className: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800",
        });
    }

    /* ===== 选号标签 ===== */
    if (product.isSelectNumber === 1) {
        tags.push({
            text: "可选号",
            className: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800",
        });
    }

    /* ===== 返佣方式标签 ===== */
    if (product.rebateType === 2) {
        tags.push({
            text: "秒返",
            className: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
        });
    }

    /* ===== 年龄限制标签 ===== */
    if (product.ageLimit) {
        tags.push({
            text: product.ageLimit,
            className: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
        });
    }

    return tags;
}

/**
 * 为商品列表批量预计算元数据
 *
 * 服务端一次性解析运营商、归属地、时长、标签等，
 * 客户端直接使用预计算字段，避免重复解析。
 * @param products - 原始商品列表
 */
function attachMeta(products: GantanhaoProduct[]): GantanhaoProductWithMeta[] {
    return products.map((p) => ({
        ...p,
        _provider: mapGantanhaoOperator(p.type),
        _location: parseLocation(p.location),
        _duration: parseDuration(p.packageContract, p.subName),
        _tags: buildTags(p),
        _price: parsePrice(p.subName),
        _flow: parseFlow(p.subName),
        /* 拼接商品专属办理链接：about2?from=推广码&codeNumber=产品编码 */
        _orderUrl: `${GANTANHAO_DETAIL_BASE}?from=${encodeURIComponent(GANTANHAO_FROM)}&codeNumber=${p.codeNumber}`,
    }));
}

/* ========== 通用请求工具 ========== */

/**
 * 获取环境变量中的 API Key
 * @throws 未配置时抛出错误
 */
function getApiKey(): string {
    const apiKey = process.env.GANTANHAO_API_KEY;
    if (!apiKey) {
        throw new Error("卡业联盟 API 未配置 (GANTANHAO_API_KEY)，请在 .env 中设置");
    }
    return apiKey;
}

/**
 * 发送 POST 请求到卡业联盟 API
 *
 * 统一封装请求逻辑，包含错误处理。
 * @param endpoint - 接口路径（如 "selectProduct"）
 * @param body - 请求体（不含 api_key，会自动注入）
 * @returns 解析后的 JSON 响应
 */
async function postRequest<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const apiKey = getApiKey();

    const response = await fetch(`${BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, ...body }),
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`卡业联盟API请求失败 [${endpoint}]: HTTP ${response.status}`);
    }

    const result = (await response.json()) as T;
    return result;
}

/* ========== 核心 API 接口 ========== */

/**
 * 查询商品列表（带缓存）
 * POST /api/api/selectProduct
 *
 * 自动分页获取全部在售商品，预计算元数据后缓存 12 小时。
 * 支持按多种条件筛选，默认获取全部在售商品。
 *
 * ===== 缓存行为 =====
 * - 首次调用：从 API 拉取全量数据，预计算元数据，缓存 12 小时
 * - 有效期内：直接返回缓存，零网络开销
 * - 过期后：静默刷新，新数据替换旧缓存
 *
 * @param options - 可选筛选参数
 * @param options.isOnSale - 是否在售：1=在售，2=下架（默认 1）
 * @param options.rebateType - 返佣类型：1=月返，2=秒返
 * @param options.isProvince - 是否省内产品：1=是，2=否
 * @param options.isSelectNumber - 是否选号：1=是，2=否
 * @param options.isRecommend - 是否推荐商品：1=是
 * @param options.hideLikeProducts - 去除重名产品：1=是（取佣金最高）
 */
export async function fetchGantanhaoProducts(options?: {
    isOnSale?: number;
    rebateType?: number;
    isProvince?: number;
    isSelectNumber?: number;
    isRecommend?: number;
    hideLikeProducts?: number;
}): Promise<{
    products: GantanhaoProductWithMeta[];
    total: number;
}> {
    const apiKey = getApiKey();

    /* ===== 构建缓存键（含筛选条件，不同筛选条件使用不同缓存） ===== */
    const cacheIdentity = `gantanhao-${options?.isOnSale ?? "all"}-${options?.rebateType ?? "all"}-${options?.isRecommend ?? "all"}`;

    /* ===== 缓存命中：直接返回 ===== */
    const cached = productsCache.get(cacheIdentity);
    if (cached) return cached;

    console.log("[GantanhaoCache] 缓存失效或首次请求，开始拉取数据");

    /* ===== 先请求第 1 页，获取总数 ===== */
    const firstPageBody: Record<string, unknown> = {
        page: 1,
        pageSize: PAGE_SIZE,
        isOnSale: options?.isOnSale ?? 1, // 默认只获取在售商品
    };

    // 注入可选筛选参数
    if (options?.rebateType !== undefined) firstPageBody.rebateType = options.rebateType;
    if (options?.isProvince !== undefined) firstPageBody.isProvince = options.isProvince;
    if (options?.isSelectNumber !== undefined) firstPageBody.isSelectNumber = options.isSelectNumber;
    if (options?.isRecommend !== undefined) firstPageBody.isRecommend = options.isRecommend;
    if (options?.hideLikeProducts !== undefined) firstPageBody.hideLikeProducts = options.hideLikeProducts;

    const firstPage = await postRequest<SelectProductResponse>("selectProduct", firstPageBody);

    if (firstPage.code !== 200) {
        throw new Error(`卡业联盟API错误 [selectProduct]: ${firstPage.msg || "未知错误"}`);
    }

    const total = firstPage.result?.total ?? 0;
    const allItems = [...(firstPage.result?.data || [])];

    /* ===== 如果有多页，并发请求剩余页 ===== */
    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages > 1) {
        const remainingPages: Promise<SelectProductResponse>[] = [];
        for (let p = 2; p <= totalPages; p++) {
            remainingPages.push(
                postRequest<SelectProductResponse>("selectProduct", {
                    ...firstPageBody,
                    page: p,
                }),
            );
        }
        const restResults = await Promise.all(remainingPages);
        for (const res of restResults) {
            if (res.code === 200 && res.result?.data) {
                allItems.push(...res.result.data);
            }
        }
    }

    /* ===== 预计算元数据 ===== */
    const productsWithMeta = attachMeta(allItems);

    /* ===== 写入缓存 ===== */
    const result = { products: productsWithMeta, total };
    productsCache.set(result, cacheIdentity, allItems.length);

    return result;
}

/**
 * 获取单个商品详情（通过产品编码查询）
 * POST /api/api/selectProduct
 *
 * @param codeNumber - 产品编码
 * @returns 单个商品详情（含预计算元数据），未找到返回 null
 */
export async function fetchGantanhaoProductByCode(
    codeNumber: string,
): Promise<GantanhaoProductWithMeta | null> {
    const response = await postRequest<SelectProductResponse>("selectProduct", {
        page: 1,
        pageSize: 1,
        productNumber: codeNumber,
    });

    if (response.code !== 200 || !response.result?.data?.length) {
        return null;
    }

    // 单条商品也需要预计算元数据
    const [productWithMeta] = attachMeta(response.result.data);
    return productWithMeta;
}

/**
 * 获取产品 SKU 规格列表（多规格产品使用）
 * POST /api/api/getProductSkuList
 *
 * ⚠️ 限频：每分钟最多 10 次请求
 * 当商品 isSku=true 时，提单前需调用此接口获取 SKU ID
 *
 * @param codeNumber - 产品编码（商品列表中的 codeNumber）
 * @returns SKU 规格列表
 */
export async function fetchGantanhaoSkuList(
    codeNumber: string,
): Promise<GantanhaoSku[]> {
    const response = await postRequest<GetProductSkuListResponse>("getProductSkuList", {
        codeNumber,
    });

    if (response.code !== 200) {
        throw new Error(`卡业联盟API错误 [getProductSkuList]: ${response.msg || "未知错误"}`);
    }

    return response.result?.data || [];
}

/**
 * 获取可选号码列表（选号商品使用）
 * POST /api/api/selectNumber
 *
 * @param productNumber - 产品编码
 * @param province - 归属地省份（如 "山东省"）
 * @param city - 归属地城市（如 "青岛市"）
 * @param searchName - 可选，幸运数字搜索（如 "666"）
 * @param page - 页码（默认 1）
 * @returns 可选号码列表
 */
export async function fetchGantanhaoNumbers(
    productNumber: string,
    province: string,
    city: string,
    searchName?: string,
    page: number = 1,
): Promise<GantanhaoNumber[]> {
    const body: Record<string, unknown> = {
        page,
        productNumber,
        address_province: province,
        address_city: city,
    };

    // 可选搜索关键词
    if (searchName) {
        body.search_name = searchName;
    }

    const response = await postRequest<SelectNumberResponse>("selectNumber", body);

    if (response.code !== 200) {
        throw new Error(`卡业联盟API错误 [selectNumber]: ${response.msg || "未知错误"}`);
    }

    return response.result || [];
}

/**
 * 提交订单
 * POST /api/api/submitOrder
 *
 * ⚠️ apiOrderId 全局唯一，提单后无法再次提交同一编号。
 * 如需重新提交，请使用新的 apiOrderId。
 *
 * @param params - 提单参数
 * @param params.productNumber - 产品编码（必传）
 * @param params.apiOrderId - 订单编号，全局唯一（必传）
 * @param params.receiverName - 收件人姓名（必传）
 * @param params.receiverPhone - 收件人手机号（必传）
 * @param params.receiverIdCard - 收件人身份证号（必传）
 * @param params.receiverProvince - 收件人省份（必传）
 * @param params.receiverCity - 收件人城市（必传）
 * @param params.receiverDistrict - 收件人区/县（必传）
 * @param params.receiverAddress - 收件人详细地址（必传）
 * @param params.selectNumber - 自主选号号码（选号商品可选）
 * @param params.idCardFront - 身份证人像面 URL（可选）
 * @param params.idCardBack - 身份证国徽面 URL（可选）
 * @param params.idCardHand - 手持身份证照片 URL（可选）
 * @param params.fourPhotos - 自定义第四照 URL（可选）
 * @param params.productSkuId - 多规格产品 SKU ID（仅 isSku=true 时需要）
 * @returns 提单结果（含系统订单号和外部订单号）
 */
export async function submitGantanhaoOrder(params: {
    productNumber: string;
    apiOrderId: string;
    receiverName: string;
    receiverPhone: string;
    receiverIdCard: string;
    receiverProvince: string;
    receiverCity: string;
    receiverDistrict: string;
    receiverAddress: string;
    selectNumber?: string;
    idCardFront?: string;
    idCardBack?: string;
    idCardHand?: string;
    fourPhotos?: string;
    productSkuId?: number;
}): Promise<GantanhaoSubmitOrderResult> {
    // 构建请求体（仅包含非空可选参数）
    const body: Record<string, unknown> = {
        productNumber: params.productNumber,
        apiOrderId: params.apiOrderId,
        receiverName: params.receiverName,
        receiverPhone: params.receiverPhone,
        receiverIdCard: params.receiverIdCard,
        receiverProvince: params.receiverProvince,
        receiverCity: params.receiverCity,
        receiverDistrict: params.receiverDistrict,
        receiverAddress: params.receiverAddress,
    };

    // 注入可选参数
    if (params.selectNumber) body.selectNumber = params.selectNumber;
    if (params.idCardFront) body.idCardFront = params.idCardFront;
    if (params.idCardBack) body.idCardBack = params.idCardBack;
    if (params.idCardHand) body.idCardHand = params.idCardHand;
    if (params.fourPhotos) body.fourPhotos = params.fourPhotos;
    if (params.productSkuId !== undefined) body.productSkuId = params.productSkuId;

    const response = await postRequest<SubmitOrderResponse>("submitOrder", body);

    if (response.code !== 200) {
        throw new Error(`卡业联盟提单失败: ${response.msg || "未知错误"}`);
    }

    return response.result;
}

/**
 * 查询订单状态
 * POST /api/api/selectOrder
 *
 * 支持按 apiOrderId（批量逗号分隔，最多 50 个）或收件人手机号查询。
 * 当两者同时传入时，apiOrderId 优先。
 *
 * @param params - 查询参数
 * @param params.apiOrderId - 订单编号（支持逗号分隔批量查询，最多 50 个）
 * @param params.phone - 收件人手机号
 * @returns 订单详情
 */
export async function fetchGantanhaoOrder(params: {
    apiOrderId?: string;
    phone?: string;
}): Promise<GantanhaoOrder> {
    const body: Record<string, unknown> = {};

    if (params.apiOrderId) {
        body.apiOrderId = params.apiOrderId;
    } else if (params.phone) {
        body.phone = params.phone;
    } else {
        throw new Error("卡业联盟订单查询需提供 apiOrderId 或 phone 参数");
    }

    const response = await postRequest<SelectOrderResponse>("selectOrder", body);

    if (response.code !== 200) {
        throw new Error(`卡业联盟API错误 [selectOrder]: ${response.msg || "未知错误"}`);
    }

    return response.result;
}

/* ========== 订单状态工具函数 ========== */

/** 订单状态码 → 中文描述映射 */
export const ORDER_STATUS_LABEL: Record<number, string> = {
    1: "待开卡",
    2: "开卡中",
    3: "已发货",
    4: "开卡失败",
    5: "三照异常",
};

/** 号码状态码 → 中文描述映射 */
export const NUMBER_STATUS_LABEL: Record<number, string> = {
    1: "未激活",
    2: "已激活",
    3: "激活且充值",
};

/** 财务状态码 → 中文描述映射 */
export const FINANCIAL_STATUS_LABEL: Record<number, string> = {
    1: "待结算",
    2: "已结算",
    3: "数据修正",
    4: "拒绝结算",
};

/** 返佣方式码 → 中文描述映射 */
export const REBATE_TYPE_LABEL: Record<number, string> = {
    1: "月返",
    2: "秒返",
};

/* ========== 朋友圈推广文案接口 ========== */

/**
 * 获取产品朋友圈推广文案
 *
 * 接口文档：https://gantanhao.apifox.cn/9004462m0.md
 * @param productNumber - 产品编号（即 codeNumber）
 * @returns 预写的朋友圈营销文案字符串
 */
export async function fetchGantanhaoCopywriting(
    productNumber: string
): Promise<string> {
    const apiKey = getApiKey();

    /* ===== 手动请求：该接口可能对部分商品返回 HTTP 500，需解析实际响应体 ===== */
    const response = await fetch(`${BASE_URL}/getProductCopywriting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, productNumber }),
        cache: "no-store",
    });

    let result: GetProductCopywritingResponse;
    try {
        result = (await response.json()) as GetProductCopywritingResponse;
    } catch {
        throw new Error("该商品暂无推广文案");
    }

    /* ===== 业务错误码（含 HTTP 500 时返回的 message） ===== */
    if (result.code !== 200) {
        const errMsg = result.message || result.msg || "";
        throw new Error(
            errMsg.includes("closed") || errMsg.includes("unavailable")
                ? "该商品暂无推广文案"
                : `卡业联盟API错误 [getProductCopywriting]: ${errMsg || "未知错误"}`
        );
    }

    return result.result || "";
}
