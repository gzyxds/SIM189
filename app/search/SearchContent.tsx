/**
 * 全局搜索页客户端交互组件 — 三栏排行榜式布局
 *
 * 设计参考 search.astro 三栏布局：
 * - 左侧边栏（lg+）：榜单类型 / 运营商分类 / 特色榜单
 * - 中间主区域：排行榜标题栏 + 移动端筛选 + 商品网格 + 分页
 * - 右侧边栏（xl+）：统计面板 / 快捷筛选 / 温馨提示
 *
 * 数据来源：服务端组件 page.tsx 已将 6 大平台商品统一映射为 UnifiedProduct 格式。
 */
"use client";

import { useState, useMemo, useEffect, useCallback, useReducer } from "react";
import Link from "next/link";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import type { UnifiedProduct, PlatformKey, UnifiedOperator } from "./types";
import {
    Search,
    Signal,
    Star,
    Zap,
    Phone,
    Clock,
    X,
    AlertTriangle,
    TrendingUp,
    Info,
    ChevronDown,
} from "lucide-react";

/* ========== 类型定义 ========== */

interface SearchContentProps {
    products: UnifiedProduct[];
    totalCount: number;
    platformErrors: string[];
    randomSeed: number;
}

/* ========== 排行榜分类 Tab 配置 ========== */

interface TabConfig {
    key: string;
    label: string;
    mode: "all" | "recommend" | "operator";
    operatorFilter?: UnifiedOperator;
    dotColor?: string;
    mobileDot?: string;
    badgeColor?: string;
}

const RANKING_TABS: TabConfig[] = [
    { key: "all", label: "今日榜单", mode: "all", badgeColor: "text-blue-500 bg-blue-50" },
    { key: "recommend", label: "热销榜单", mode: "recommend", badgeColor: "text-red-500 bg-red-50" },
];

const OPERATOR_TABS: TabConfig[] = [
    { key: "mobile", label: "中国移动", mode: "operator", operatorFilter: "mobile", dotColor: "bg-green-500 ring-2 ring-green-200", mobileDot: "bg-green-500 ring-green-200" },
    { key: "telecom", label: "中国电信", mode: "operator", operatorFilter: "telecom", dotColor: "bg-blue-500 ring-2 ring-blue-200", mobileDot: "bg-blue-500 ring-blue-200" },
    { key: "unicom", label: "中国联通", mode: "operator", operatorFilter: "unicom", dotColor: "bg-orange-500 ring-2 ring-orange-200", mobileDot: "bg-orange-500 ring-orange-200" },
    { key: "broadcast", label: "中国广电", mode: "operator", operatorFilter: "broadcast", dotColor: "bg-purple-500 ring-2 ring-purple-200", mobileDot: "bg-purple-500 ring-purple-200" },
];

/* ========== 快捷标签配置 ========== */

interface QuickTagConfig { key: string; label: string; icon?: React.ElementType; iconColor?: string }

const FEATURED_TAGS: QuickTagConfig[] = [
    { key: "big_flow", label: "大流量卡榜单", icon: Zap, iconColor: "text-blue-500" },
    { key: "flow_100", label: "100G大流量", icon: Signal, iconColor: "text-cyan-500" },
    { key: "has_voice", label: "带通话榜单", icon: Phone, iconColor: "text-green-500" },
    { key: "voice_100", label: "100分钟+", icon: Phone, iconColor: "text-emerald-500" },
    { key: "long_term", label: "长期卡榜单", icon: Clock, iconColor: "text-orange-500" },
    { key: "short_term", label: "短期体验卡", icon: Clock, iconColor: "text-rose-500" },
    { key: "price_9", label: "9元体验卡", icon: Star, iconColor: "text-amber-500" },
];

const MOBILE_QUICK_TAGS = [
    { key: "all", label: "全部" },
    { key: "long_term", label: "长期卡" },
    { key: "short_term", label: "短期体验" },
    { key: "price_9", label: "9元体验" },
    { key: "low_price", label: "19元以下" },
    { key: "price_29", label: "29元档" },
    { key: "big_flow", label: "200G以上" },
    { key: "flow_100", label: "100G+" },
    { key: "has_voice", label: "带通话" },
    { key: "voice_100", label: "100分钟+" },
];

const RIGHT_QUICK_TAGS = [
    { key: "all", label: "全部" },
    { key: "long_term", label: "长期卡" },
    { key: "short_term", label: "短期体验" },
    { key: "price_9", label: "9元体验" },
    { key: "low_price", label: "19元以下" },
    { key: "price_29", label: "29元档" },
    { key: "big_flow", label: "200G以上" },
    { key: "flow_100", label: "100G+" },
    { key: "has_voice", label: "带通话" },
    { key: "voice_100", label: "100分钟+" },
];

/* ========== 平台角标配色 ========== */

const PLATFORM_BADGE: Record<PlatformKey, { label: string; className: string }> = {
    haoka: { label: "浩卡", className: "bg-red-500 text-white" },
    lotml: { label: "172", className: "bg-blue-500 text-white" },
    linxi: { label: "林夕", className: "bg-teal-500 text-white" },
    ksj: { label: "卡世界", className: "bg-orange-500 text-white" },
    yky: { label: "翼卡云", className: "bg-indigo-500 text-white" },
    gongchuang: { label: "共创", className: "bg-pink-500 text-white" },
    gantanhao: { label: "卡业", className: "bg-amber-500 text-white" },
};

/** 运营商配色 */
const OPERATOR_STYLE: Record<string, { badge: string; dot: string }> = {
    mobile: { badge: "bg-green-100 text-green-700", dot: "bg-green-500" },
    telecom: { badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
    unicom: { badge: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
    broadcast: { badge: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
    unknown: { badge: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
};

const OPERATOR_LABEL: Record<string, string> = {
    mobile: "移动", telecom: "电信", unicom: "联通", broadcast: "广电", unknown: "其他",
};

/** 榜单标题映射 */
const RANK_TITLES: Record<string, string> = {
    all: "今日榜单", recommend: "热销榜单",
    mobile: "中国移动榜单", telecom: "中国电信榜单",
    unicom: "中国联通榜单", broadcast: "中国广电榜单",
};

const TAG_TITLES: Record<string, string> = {
    long_term: "长期卡", short_term: "短期体验卡", price_9: "9元体验卡",
    low_price: "19元以下", price_29: "29元档", big_flow: "200G大流量",
    flow_100: "100G大流量", has_voice: "带通话", voice_100: "100分钟+",
};

/* ========== 分页配置 ========== */

const PAGE_SIZE = 18;
type VisibleAction = { type: "reset" } | { type: "loadMore"; maxCount: number };
function visibleReducer(state: number, action: VisibleAction): number {
    switch (action.type) {
        case "reset": return PAGE_SIZE;
        case "loadMore": return Math.min(state + PAGE_SIZE, action.maxCount);
    }
}

/* ========== 工具函数 ========== */

function matchSearch(product: UnifiedProduct, query: string): boolean {
    if (!query.trim()) return true;
    const tokens = query.trim().toLowerCase().split(/\s+/);
    const name = product.name.toLowerCase();
    return tokens.every((token) => name.includes(token));
}

function matchQuickTag(product: UnifiedProduct, tagKey: string): boolean {
    switch (tagKey) {
        case "all": return true;
        case "long_term": return product.duration === "长期";
        case "short_term": return product.duration !== "长期" && product.duration !== "" && product.duration !== "未知";
        case "price_9": return product.price > 0 && product.price <= 9;
        case "low_price": return product.price > 0 && product.price <= 19;
        case "price_29": return product.price >= 25 && product.price <= 35;
        case "big_flow": return product.flow >= 200;
        case "flow_100": return product.flow >= 100;
        case "has_voice": return product.voice > 0;
        case "voice_100": return product.voice >= 100;
        default: return true;
    }
}

function seededRandom(seed: number, index: number): number {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
}

function shuffle<T>(arr: T[], seed: number): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed, i) * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/* ========== 排行榜卡片组件 ========== */

/**
 * 排行榜卡片 — 文本优先的极简设计
 *
 * 信息层级：元信息行（运营商·平台·归属地·排名）→ 套餐名称 → 核心参数 → 价格 + 办理
 */
function RankingCard({ product, rank }: { product: UnifiedProduct; rank: number }) {
    const platformBadge = PLATFORM_BADGE[product.platform];
    const opStyle = OPERATOR_STYLE[product.operator] || OPERATOR_STYLE.unknown;
    const operatorLabel = OPERATOR_LABEL[product.operator] || "其他";

    /* 排名文本 */
    let rankEl: React.ReactNode = null;
    if (rank === 1) rankEl = <span className="text-[11px] font-bold text-amber-500">No.1</span>;
    else if (rank === 2) rankEl = <span className="text-[11px] font-bold text-gray-400">No.2</span>;
    else if (rank === 3) rankEl = <span className="text-[11px] font-bold text-amber-700">No.3</span>;
    else if (rank <= 12) rankEl = <span className="text-[11px] font-medium text-gray-300">{`No.${rank}`}</span>;

    return (
        <div className="group flex flex-col overflow-hidden rounded-lg border border-gray-100 bg-white transition-all duration-200 hover:border-gray-200 hover:shadow-lg hover:shadow-black/[0.04]">
            <div className="flex flex-1 flex-col p-5">
                {/* 元信息行 */}
                <div className="flex flex-wrap items-center gap-x-1.5 text-[12px]">
                    <span className={`font-medium ${opStyle.badge.replace(/rounded-md|px-1\.5/g, "").trim()}`}>
                        {operatorLabel}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-400">{platformBadge?.label}</span>
                    {product.region && (
                        <>
                            <span className="text-gray-300">·</span>
                            <span className="text-gray-400">{product.region}</span>
                        </>
                    )}
                    {rankEl && (
                        <>
                            <span className="mx-0.5 text-gray-200">|</span>
                            {rankEl}
                        </>
                    )}
                </div>

                {/* 套餐名称 */}
                <h3 className="mt-3 mb-3 line-clamp-2 text-[15px] font-medium leading-snug text-gray-900 transition-colors group-hover:text-blue-600">
                    {product.name}
                </h3>

                {/* 核心参数 */}
                <div className="mb-4 flex min-h-[20px] items-center gap-2 text-[13px] text-gray-400">
                    {product.flow > 0 && <span className="font-medium text-gray-700">{product.flow}GB</span>}
                    {product.flow > 0 && (product.voice > 0 || (product.duration && product.duration !== "未知")) && (
                        <span className="h-3 w-px bg-gray-200" />
                    )}
                    {product.voice > 0 && <span className="font-medium text-gray-700">{product.voice}分钟</span>}
                    {product.voice > 0 && product.duration && product.duration !== "未知" && (
                        <span className="h-3 w-px bg-gray-200" />
                    )}
                    {product.duration && product.duration !== "未知" && (
                        <span className="font-medium text-gray-700">{product.duration}</span>
                    )}
                </div>

                {/* 弹性占位 */}
                <div className="flex-1" />

                {/* 价格 + 办理 */}
                <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-3">
                    {product.price > 0 ? (
                        <span className="text-lg font-bold text-gray-900">
                            {product.price}<span className="text-xs font-normal text-gray-400">元/月</span>
                        </span>
                    ) : (
                        <span className="text-sm text-gray-400">面议</span>
                    )}
                    <Link
                        href={product.detailUrl}
                        className="text-[12px] font-medium text-blue-600 hover:underline"
                    >
                        查看详情 →
                    </Link>
                </div>
            </div>
        </div>
    );
}

/* ========== SEO 选购指南区块 ========== */

function SeoGuideSection() {
    return (
        <section className="bg-white py-10 md:py-14">
            <div className={containerClass()} style={SITE_WIDTH_STYLE}>
                <article>
                    <h2 className="mb-6 text-center text-xl font-bold text-gray-800 sm:text-2xl">
                        流量卡怎么选？2026年手机流量卡选购指南
                    </h2>
                    <p className="mb-8 text-center text-sm text-gray-500">
                        覆盖电信/移动/联通/广电四大运营商，从价格、流量、时长、网速四大维度帮你避坑
                    </p>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                                <Star className="size-3.5" /> 价格选型
                            </div>
                            <h3 className="mb-2 text-sm font-bold text-gray-800">月租预算决定套餐档位</h3>
                            <ul className="space-y-1.5 text-xs leading-relaxed text-gray-500">
                                <li>· <strong className="text-gray-700">9-19元档</strong>：学生党、备用机首选，流量100-200G</li>
                                <li>· <strong className="text-gray-700">29元档</strong>：性价比黄金价位，流量150-200G+通话</li>
                                <li>· <strong className="text-gray-700">39元以上</strong>：大流量+高速率，适合主卡用户</li>
                            </ul>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                                <Signal className="size-3.5" /> 运营商对比
                            </div>
                            <h3 className="mb-2 text-sm font-bold text-gray-800">四大运营商各有优势</h3>
                            <ul className="space-y-1.5 text-xs leading-relaxed text-gray-500">
                                <li>· <strong className="text-gray-700">电信</strong>：覆盖广、网速稳定，星卡系列口碑好</li>
                                <li>· <strong className="text-gray-700">移动</strong>：用户基数大，花卡系列性价比高</li>
                                <li>· <strong className="text-gray-700">联通</strong>：套餐灵活，流量单价低</li>
                                <li>· <strong className="text-gray-700">广电</strong>：新兴运营商，192G超大流量套餐</li>
                            </ul>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                                <AlertTriangle className="size-3.5" /> 避坑指南
                            </div>
                            <h3 className="mb-2 text-sm font-bold text-gray-800">办卡前必看的防坑要点</h3>
                            <ul className="space-y-1.5 text-xs leading-relaxed text-gray-500">
                                <li>· 确认是<strong className="text-gray-700">通用流量</strong>还是定向流量</li>
                                <li>· 看清<strong className="text-gray-700">合约期</strong>，长期卡更稳定但受限</li>
                                <li>· 关注<strong className="text-gray-700">限速阈值</strong>，超量后是否降速</li>
                                <li>· 只选<strong className="text-gray-700">正规渠道</strong>办理，拒绝物联卡</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 rounded-xl bg-gray-50 p-5 sm:p-6">
                        <h3 className="mb-3 text-sm font-bold text-gray-700">常见问题：流量卡哪个好？</h3>
                        <div className="space-y-3 text-xs leading-relaxed text-gray-500">
                            <p><strong className="text-gray-700">学生党推荐：</strong>优先选择19元档套餐，如电信星卡19元版、广电福兔卡等，流量充足且月租低，适合日常上网、刷视频使用。支持双卡双待，搭配主卡通话两不误。</p>
                            <p><strong className="text-gray-700">上班族推荐：</strong>建议选择29-39元档的长期套餐流量卡，流量150-200G以上，不限速全国通用，适合日常办公、视频会议、户外直播等场景。优先选电信或联通，网速和稳定性更有保障。</p>
                            <p><strong className="text-gray-700">如何避免踩坑：</strong>务必通过正规渠道办理，确认是实名制手机卡而非物联卡。关注套餐的通用流量占比，避免虚标偷跑。合约期建议选1-2年，既能享受优惠价又不影响后续携号转网。</p>
                        </div>
                    </div>
                </article>
            </div>
        </section>
    );
}

/* ========== 底部 CTA ========== */

function CtaSection() {
    return (
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-14">
            <div className="mx-auto max-w-2xl px-4 text-center">
                <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">立即申请，免费包邮到家！</h2>
                <p className="mb-6 text-sm text-blue-100 sm:text-base">正规渠道、7天无理由退换，零风险体验</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-blue-600 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl">
                        <Star className="size-4" /> 浏览首页精选
                    </Link>
                    <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-all hover:border-white hover:bg-white/10">
                        返回首页
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ========== 主入口 ========== */

export default function SearchContent({
    products, totalCount, platformErrors, randomSeed,
}: SearchContentProps) {
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTabKey, setActiveTabKey] = useState("all");
    const [quickTag, setQuickTag] = useState("all");
    const [visibleCount, dispatchVisible] = useReducer(visibleReducer, PAGE_SIZE);

    /* 搜索防抖 300ms */
    useEffect(() => {
        const timer = setTimeout(() => setSearchQuery(searchInput), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    /* Tab 切换 */
    const handleTabClick = useCallback((key: string) => {
        setActiveTabKey(key);
        setQuickTag("all");
        dispatchVisible({ type: "reset" });
    }, []);

    /* Tag 切换 */
    const handleTagClick = useCallback((key: string) => {
        setQuickTag(key);
        setActiveTabKey("all");
        dispatchVisible({ type: "reset" });
    }, []);

    /* 当前 Tab 配置 */
    const activeTab = useMemo(
        () => [...RANKING_TABS, ...OPERATOR_TABS].find((t) => t.key === activeTabKey) || RANKING_TABS[0],
        [activeTabKey],
    );

    /* 筛选 + 排序后的商品 */
    const rankedProducts = useMemo(() => {
        let filtered = products;
        if (activeTab.mode === "operator" && activeTab.operatorFilter) {
            filtered = filtered.filter((p) => p.operator === activeTab.operatorFilter);
        } else if (activeTab.mode === "recommend") {
            filtered = filtered.filter((p) => {
                const goodPrice = p.price >= 9 && p.price <= 39;
                const goodFlow = p.flow >= 80;
                return goodPrice || goodFlow;
            });
        }
        filtered = filtered.filter((p) => matchSearch(p, searchQuery));
        filtered = filtered.filter((p) => matchQuickTag(p, quickTag));
        return shuffle(filtered, randomSeed);
    }, [products, activeTab, searchQuery, quickTag, randomSeed]);

    /* 分页 */
    useEffect(() => { dispatchVisible({ type: "reset" }); }, [rankedProducts.length]);
    const displayed = rankedProducts.slice(0, visibleCount);
    const hasMore = displayed.length < rankedProducts.length;
    const remaining = rankedProducts.length - displayed.length;

    /* 榜单标题 */
    const rankTitle = useMemo(() => {
        const base = RANK_TITLES[activeTabKey] || "今日榜单";
        return quickTag !== "all" ? `${base} · ${TAG_TITLES[quickTag] || ""}` : base;
    }, [activeTabKey, quickTag]);

    return (
        <div className="flex min-h-svh flex-col bg-[#f5f7fa]">
            <Header />

            {/* ===== Hero Banner ===== */}
            <section className="relative overflow-hidden bg-gray-50 pb-16 pt-[100px] md:pb-20 md:pt-[120px]">
                {/* 背景装饰光晕 */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl" />
                </div>

                <div className="container relative z-10 mx-auto px-4" style={SITE_WIDTH_STYLE}>
                    <div className="mx-auto max-w-3xl text-center">
                        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-semibold text-blue-600 backdrop-blur-sm">
                            <Zap className="size-4" /> 七大平台 · 实时聚合
                        </span>
                        <h1 className="mb-4 text-3xl font-black leading-tight text-gray-900 sm:text-4xl md:text-5xl">
                            号卡精选榜单
                        </h1>
                        <p className="mb-8 text-base text-gray-600 sm:text-lg md:text-xl">
                            聚合 {totalCount} 款官方授权号卡套餐，全网比价，一目了然
                        </p>

                        {/* 搜索框 */}
                        <div className="relative mx-auto w-full max-w-xl">
                            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="搜索套餐名称，如：电信星卡、联通王卡..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white py-4 pl-12 pr-12 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:shadow-md focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400 focus:outline-none"
                                aria-label="搜索套餐名称"
                            />
                            {searchInput && (
                                <button
                                    onClick={() => { setSearchInput(""); setSearchQuery(""); }}
                                    className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* 快捷统计 */}
                        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
                            <span><strong className="text-base font-bold text-blue-600">{totalCount}</strong> 款套餐</span>
                            <span className="h-3 w-px bg-gray-200" />
                            <span><strong className="text-base font-bold text-blue-600">4</strong> 大运营商</span>
                            <span className="h-3 w-px bg-gray-200" />
                            <span><strong className="text-base font-bold text-blue-600">19元</strong> 起</span>
                        </div>
                    </div>

                    {platformErrors.length > 0 && (
                        <p className="mt-6 text-center text-xs text-gray-400">
                            部分平台加载失败：{platformErrors.join("、")}，数据可能不完整
                        </p>
                    )}
                </div>

                {/* 底部波浪分隔 */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                        <path d="M0 60V20C240 0 480 40 720 30C960 20 1200 0 1440 20V60H0Z" fill="#f9fafb" />
                    </svg>
                </div>
            </section>

            {/* ===== 主体三栏布局 ===== */}
            <main className="relative flex-1 bg-gray-50/50 pb-24 pt-14 lg:pb-36 lg:pt-20">
                {/* 背景装饰 */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-500/[0.02] via-transparent to-transparent" />

                <div className="mx-auto px-4 md:px-6" style={SITE_WIDTH_STYLE}>
                    <div className="flex flex-col gap-8 lg:flex-row">

                        {/* ===== 左侧边栏（lg+） ===== */}
                        <aside className="hidden shrink-0 lg:block lg:w-60">
                            <div className="sticky top-28 space-y-6">
                                {/* 榜单类型 */}
                                <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
                                        <Star className="size-4 text-amber-500" /> 榜单类型
                                    </h3>
                                    <nav className="space-y-1">
                                        {RANKING_TABS.map((tab) => {
                                            const isActive = activeTabKey === tab.key && quickTag === "all";
                                            return (
                                                <button key={tab.key} type="button" onClick={() => handleTabClick(tab.key)}
                                                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold ${tab.badgeColor}`}>
                                                        {tab.key === "recommend" ? "HOT" : "NEW"}
                                                    </span>
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </div>

                                {/* 运营商分类 */}
                                <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
                                        <Signal className="size-4 text-blue-500" /> 运营商
                                    </h3>
                                    <nav className="space-y-1">
                                        {OPERATOR_TABS.map((tab) => {
                                            const isActive = activeTabKey === tab.key && quickTag === "all";
                                            return (
                                                <button key={tab.key} type="button" onClick={() => handleTabClick(tab.key)}
                                                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${isActive ? "bg-blue-50 font-medium text-blue-600" : "text-gray-600 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    <span className={`h-3 w-3 shrink-0 rounded-full ${tab.dotColor}`} />
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </div>

                                {/* 特色榜单 */}
                                <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
                                        <ChevronDown className="size-4 text-blue-500" /> 特色榜单
                                    </h3>
                                    <nav className="space-y-1">
                                        {FEATURED_TAGS.map((tag) => {
                                            const isActive = quickTag === tag.key;
                                            const TagIcon = tag.icon;
                                            return (
                                                <button key={tag.key} type="button" onClick={() => handleTagClick(tag.key)}
                                                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${isActive ? "bg-blue-50 font-medium text-blue-600" : "text-gray-600 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    {TagIcon && <TagIcon className={`size-4 ${isActive ? "text-blue-500" : tag.iconColor}`} />}
                                                    {tag.label}
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </div>
                            </div>
                        </aside>

                        {/* ===== 中间主区域 ===== */}
                        <div className="min-w-0 flex-1">
                            {/* 榜单标题栏 */}
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-gray-900">{rankTitle}</h2>
                                    <span className="rounded-full bg-gray-100/80 px-3 py-1 text-xs font-medium text-gray-400">
                                        共 {rankedProducts.length} 款
                                    </span>
                                </div>
                                {searchQuery && (
                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                                        &quot;{searchQuery}&quot;
                                    </span>
                                )}
                            </div>

                            {/* ===== 移动端筛选面板（lg 以下） ===== */}
                            <div className="mb-5 space-y-4 lg:hidden">
                                {/* 榜单类型 */}
                                <div>
                                    <h4 className="mb-2 text-xs font-semibold text-gray-400">榜单类型</h4>
                                    <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-1">
                                        {RANKING_TABS.map((tab) => {
                                            const isActive = activeTabKey === tab.key && quickTag === "all";
                                            return (
                                                <button key={tab.key} type="button" onClick={() => handleTabClick(tab.key)}
                                                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all ${isActive ? "bg-blue-600 text-white" : "border border-gray-200 bg-white text-gray-600"
                                                        }`}
                                                >
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                {/* 运营商 */}
                                <div>
                                    <h4 className="mb-2 text-xs font-semibold text-gray-400">运营商</h4>
                                    <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-1">
                                        {OPERATOR_TABS.map((tab) => {
                                            const isActive = activeTabKey === tab.key && quickTag === "all";
                                            return (
                                                <button key={tab.key} type="button" onClick={() => handleTabClick(tab.key)}
                                                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs transition-all ${isActive ? "bg-blue-600 text-white" : "border border-gray-200 bg-white text-gray-600"
                                                        }`}
                                                >
                                                    <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-white" : `${tab.mobileDot || "bg-gray-400"} ring-2 ring-offset-1`}`} />
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                {/* 特色榜单 */}
                                <div>
                                    <h4 className="mb-2 text-xs font-semibold text-gray-400">特色榜单</h4>
                                    <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-1">
                                        {MOBILE_QUICK_TAGS.map((tag) => {
                                            const isActive = quickTag === tag.key;
                                            return (
                                                <button key={tag.key} type="button" onClick={() => handleTagClick(tag.key)}
                                                    className={`shrink-0 rounded-full px-4 py-2 text-xs transition-all ${isActive ? "bg-blue-600 font-medium text-white" : "border border-gray-200 bg-white text-gray-600"
                                                        }`}
                                                >
                                                    {tag.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* 空态 */}
                            {rankedProducts.length === 0 && (
                                <div className="flex flex-col items-center rounded-lg bg-white py-20 text-center shadow-sm">
                                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                                        <Search className="size-8 text-gray-300" />
                                    </div>
                                    <p className="text-lg font-semibold text-gray-500">暂无符合条件的套餐</p>
                                    <p className="mt-2 text-sm text-gray-400">请尝试切换榜单分类或搜索关键词</p>
                                </div>
                            )}

                            {/* 排行榜网格 */}
                            {rankedProducts.length > 0 && (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                    {displayed.map((product, index) => (
                                        <RankingCard
                                            key={`${product.platform}-${product.id}`}
                                            product={product}
                                            rank={index + 1}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* 加载更多 */}
                            {rankedProducts.length > 0 && (
                                <div className="mt-14 flex flex-col items-center gap-4">
                                    {hasMore ? (
                                        <button type="button"
                                            onClick={() => dispatchVisible({ type: "loadMore", maxCount: rankedProducts.length })}
                                            className="inline-flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-10 py-3.5 text-sm font-semibold text-gray-600 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/30 hover:text-blue-600 hover:shadow-md active:scale-[0.98]"
                                        >
                                            <ChevronDown className="size-4" />
                                            加载更多（还有 {remaining} 款）
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                                            已展示全部商品
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ===== 右侧边栏（xl+） ===== */}
                        <aside className="hidden shrink-0 xl:block xl:w-72">
                            <div className="sticky top-28 space-y-6">
                                {/* 统计面板 */}
                                <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                                    <h3 className="mb-4 text-sm font-bold text-gray-800">榜单统计</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">已展示</span>
                                            <span className="font-bold text-gray-900">{displayed.length} 款</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">共收录</span>
                                            <span className="font-bold text-gray-900">{rankedProducts.length} 款</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                                                style={{ width: rankedProducts.length > 0 ? `${Math.round((displayed.length / rankedProducts.length) * 100)}%` : "0%" }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 快捷筛选 */}
                                <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                                    <h3 className="mb-4 text-sm font-bold text-gray-800">快捷筛选</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {RIGHT_QUICK_TAGS.map((tag) => {
                                            const isActive = quickTag === tag.key;
                                            return (
                                                <button key={tag.key} type="button" onClick={() => handleTagClick(tag.key)}
                                                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${isActive ? "bg-blue-600 text-white" : "border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
                                                        }`}
                                                >
                                                    {tag.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 温馨提示 */}
                                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-5">
                                    <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-800">
                                        <Info className="size-4" /> 温馨提示
                                    </h3>
                                    <p className="text-xs leading-relaxed text-blue-700/70">
                                        所有号卡均为官方正规套餐，支持线上办理、全国包邮。下单前请仔细阅读套餐说明，确保符合办理条件。
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            {/* ===== SEO 选购指南 ===== */}
            <SeoGuideSection />

            {/* ===== 底部 CTA ===== */}
            <CtaSection />
            <Footer />
        </div>
    );
}
