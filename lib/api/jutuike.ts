/**
 * 聚推客联盟 API 服务模块
 *
 * 接口文档: https://www.jutuike.com/document
 * 平台定位: CPS 联盟推广平台，聚合美团、饿了么、出行、连锁餐饮、
 *          电影、生活服务、电商等多品类活动的推广链接。
 *
 * ===== 缓存策略 =====
 * 服务端内存缓存，有效期 1 小时（3600 秒）。
 * 活动列表数据变动频率低，短 TTL 即可兼顾时效性与性能。
 */

import { MemoryCache } from "./cache";

/* ========== 类型定义 ========== */

/** 活动基本信息（来自活动列表接口） */
export interface JutuikeActivity {
    /** 活动 ID */
    act_id: number;
    /** 活动名称 */
    act_name: string;
    /** 所属分类（cate_name 原始值） */
    cate_name: string;
    /** 活动描述 */
    desc: string;
    /** 活动样例图 */
    img: string;
    /** icon 图标 */
    icon: string;
    /** 佣金比例描述 */
    commission_rate?: string;
    /** 海报（部分活动没有） */
    poster?: string;
    /** 活动介绍 */
    introduce: string;
    /** 归属说明 */
    attribution_explain: string;
    /** 注意事项 */
    note: string;
    /** 结算时间 */
    settlement_time: string;
}

/** 活动列表 API 响应结构 */
interface ActivityListResponse {
    code: number;
    msg: string;
    data: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
        data: JutuikeActivity[];
    };
}

/** 活动转链 API 返回的小程序信息 */
export interface WeAppInfo {
    /** 小程序 ID */
    app_id: string;
    /** 小程序路径 */
    page_path: string;
}

/** 活动转链 API 返回结果 */
export interface ActLinkResult {
    /** 推广短链接（H5，部分活动没有） */
    h5?: string;
    /** 推广长链接（部分活动没有） */
    long_h5?: string;
    /** 小程序信息（部分活动没有） */
    we_app_info?: WeAppInfo;
    /** 小程序码图片地址（部分活动没有） */
    miniCode?: string;
    /** 活动名称 */
    act_name: string;
}

/** 活动转链 API 响应结构 */
interface ActLinkResponse {
    code: number;
    msg: string;
    data: ActLinkResult;
}

/* ========== 常量配置 ========== */

/** API 基础地址 */
const API_BASE = "http://api.jutuike.com/union";

/**
 * CPS 分类标签配置
 * 按用户需求筛选的核心分类，显示名称来源于文档中 cate_name 的合法值
 */
export const CPS_CATEGORIES = [
    { key: "all", label: "全部" },
    { key: "美团", label: "美团" },
    { key: "饿了么", label: "饿了么" },
    { key: "打车出行", label: "出行" },
    { key: "连锁餐饮", label: "连锁餐饮" },
    { key: "电影票", label: "电影" },
    { key: "本地生活", label: "生活服务" },
    { key: "电商", label: "电商" },
] as const;

/** CPS 分类 key 类型 */
export type CpsCategoryKey = (typeof CPS_CATEGORIES)[number]["key"];

/* ========== 缓存配置 ========== */

/** 活动列表缓存（TTL 1 小时） */
const activityCache = new MemoryCache<JutuikeActivity[]>(
    "JutuikeCpsCache",
    60 * 60 * 1000, // 1 小时
);

/* ========== 环境变量校验 ========== */

/** 获取并校验聚推客联盟 API 配置 */
function getConfig(): { apiKey: string; pubId: string } {
    const apiKey = process.env.JUTUIKE_API_KEY;
    const pubId = process.env.JUTUIKE_PUB_ID;

    if (!apiKey || !pubId) {
        throw new Error("聚推客联盟 API 未配置 (JUTUIKE_API_KEY / JUTUIKE_PUB_ID)");
    }

    return { apiKey, pubId };
}

/* ========== 活动列表接口 ========== */

/**
 * 获取聚推客联盟全量活动列表（自动翻页）
 * GET /union/act_list
 *
 * 循环请求所有分页，聚合全量数据后缓存。
 * 文档限制 pageSize 最大 100。
 *
 * ===== 缓存行为 =====
 * - 首次调用：从 API 拉取全量数据，缓存 1 小时
 * - 有效期内：直接返回缓存
 */
export async function fetchAllActivities(): Promise<JutuikeActivity[]> {
    const { apiKey } = getConfig();

    /* ===== 缓存命中 ===== */
    const cached = activityCache.get("all");
    if (cached) return cached;

    console.log("[JutuikeCps] 缓存失效，拉取全量活动列表");

    /* ===== 先请求第 1 页，获取总页数 ===== */
    const firstPage = await fetchActivityPage(apiKey, 1);
    const allItems = [...firstPage.data.data];

    const totalPages = firstPage.data.last_page;
    const total = firstPage.data.total;

    /* ===== 并发请求剩余页 ===== */
    if (totalPages > 1) {
        const promises: Promise<ActivityListResponse>[] = [];
        for (let p = 2; p <= totalPages; p++) {
            promises.push(fetchActivityPage(apiKey, p));
        }
        const restResults = await Promise.all(promises);
        for (const res of restResults) {
            allItems.push(...(res.data.data || []));
        }
    }

    /* ===== 写入缓存 ===== */
    activityCache.set(allItems, "all", total);

    return allItems;
}

/**
 * 请求单页活动列表
 */
async function fetchActivityPage(
    apiKey: string,
    page: number,
    pageSize = 100,
): Promise<ActivityListResponse> {
    const params = new URLSearchParams({ apikey: apiKey });
    params.set("page", String(page));
    params.set("pageSize", String(Math.min(pageSize, 100)));

    const url = `${API_BASE}/act_list?${params.toString()}`;
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
        throw new Error(
            `聚推客联盟活动列表请求失败: HTTP ${response.status}`,
        );
    }

    const result = (await response.json()) as ActivityListResponse;

    if (result.code !== 1) {
        throw new Error(`聚推客联盟 API 错误: ${result.msg || "未知错误"}`);
    }

    return result;
}

/* ========== 活动转链接口 ========== */

/**
 * 获取活动推广链接
 * GET/POST /union/act
 *
 * 通过此接口获取指定活动的推广短链 / 小程序路径。
 * 用户点击链接完成消费后，佣金归因到当前 sid。
 *
 * @param actId - 活动 ID
 * @param sid - 自定义跟单参数（用于订单归因）
 * @returns 推广链接信息
 */
export async function fetchActLink(
    actId: number,
    sid?: string,
): Promise<ActLinkResult> {
    const { apiKey, pubId } = getConfig();

    /* ===== 构造请求参数 ===== */
    const params = new URLSearchParams({
        apikey: apiKey,
        act_id: String(actId),
        sid: sid || pubId,
    });

    const url = `${API_BASE}/act?${params.toString()}`;

    /* ===== 发送请求 ===== */
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`聚推客联盟转链请求失败: HTTP ${response.status}`);
    }

    const result = (await response.json()) as ActLinkResponse;

    if (result.code !== 1) {
        throw new Error(`聚推客联盟转链错误: ${result.msg || "未知错误"}`);
    }

    return result.data;
}
