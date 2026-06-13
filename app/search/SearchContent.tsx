/**
 * 全局搜索页客户端交互组件 — 排行榜式布局
 *
 * 设计思路：
 * - 顶部保留搜索框 Banner
 * - 下方采用排行榜分类 Tab（热销榜/推荐榜/中国移动/中国电信/中国联通/中国广电）
 * - 每个分类下以紧凑排行榜卡片网格展示商品（无图纯文字布局）
 * - 卡片带排名角标、运营商标签、平台角标、规格标签
 * - 支持关键词搜索 + Tab 切换 + 无限滚动分页
 *
 * 数据来源：服务端组件 page.tsx 已将 6 大平台商品统一映射为 UnifiedProduct 格式。
 */
"use client";

import { useState, useMemo, useRef, useEffect, useCallback, useReducer } from "react";
import Link from "next/link";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import type { UnifiedProduct, PlatformKey, UnifiedOperator } from "./types";
import {
    Search,
    Signal,
    Flame,
    Star,
    Zap,
    Phone,
    Clock,
    Eye,
    ChevronRight,
    X,
    AlertTriangle,
    Trophy,
    Crown,
    Medal,
    TrendingUp,
    ThumbsUp,
} from "lucide-react";

/* ========== 类型定义 ========== */

interface SearchContentProps {
    /** 全站统一商品列表 */
    products: UnifiedProduct[];
    /** 商品总数 */
    totalCount: number;
    /** 加载失败的平台列表 */
    platformErrors: string[];
    /** 随机种子（服务端生成，确保 SSR 水合一致） */
    randomSeed: number;
}

/** 排行榜分类 Tab 配置 */
interface RankingTab {
    key: string;
    label: string;
    icon: React.ElementType;
    /** 排序/筛选逻辑标识 */
    mode: "operator" | "all";
    /** 运营商筛选值（仅 mode=operator 时有效） */
    operatorFilter?: UnifiedOperator;
    /** 标签配色 */
    accentClass: string;
    /** 图标配色 */
    iconClass: string;
}

/* ========== 排行榜分类 Tab 配置 ========== */

/** 排行榜分类列表 */
const RANKING_TABS: RankingTab[] = [
    {
        key: "all",
        label: "全部套餐",
        icon: Flame,
        mode: "all",
        accentClass: "from-orange-500 to-red-500",
        iconClass: "text-orange-500",
    },
    {
        key: "recommend",
        label: "套餐推荐",
        icon: ThumbsUp,
        mode: "all",
        accentClass: "from-blue-500 to-indigo-500",
        iconClass: "text-blue-500",
    },
    {
        key: "mobile",
        label: "中国移动",
        icon: Signal,
        mode: "operator",
        operatorFilter: "mobile",
        accentClass: "from-green-500 to-emerald-500",
        iconClass: "text-green-500",
    },
    {
        key: "telecom",
        label: "中国电信",
        icon: Signal,
        mode: "operator",
        operatorFilter: "telecom",
        accentClass: "from-blue-500 to-cyan-500",
        iconClass: "text-blue-500",
    },
    {
        key: "unicom",
        label: "中国联通",
        icon: Signal,
        mode: "operator",
        operatorFilter: "unicom",
        accentClass: "from-orange-500 to-amber-500",
        iconClass: "text-orange-500",
    },
    {
        key: "broadcast",
        label: "中国广电",
        icon: Signal,
        mode: "operator",
        operatorFilter: "broadcast",
        accentClass: "from-purple-500 to-violet-500",
        iconClass: "text-purple-500",
    },
];

/* ========== 平台角标配色 ========== */

/** 平台角标颜色映射 */
const PLATFORM_BADGE: Record<PlatformKey, { label: string; className: string }> = {
    haoka: { label: "浩卡", className: "bg-red-500/90 text-white" },
    lotml: { label: "172", className: "bg-blue-500/90 text-white" },
    linxi: { label: "林夕", className: "bg-teal-500/90 text-white" },
    ksj: { label: "卡世界", className: "bg-orange-500/90 text-white" },
    yky: { label: "翼卡云", className: "bg-indigo-500/90 text-white" },
    gongchuang: { label: "共创", className: "bg-pink-500/90 text-white" },
};

/** 运营商样式配色（与 ProductCard 保持一致） */
const OPERATOR_STYLE: Record<string, { badge: string; dot: string; overlay: string }> = {
    mobile: {
        badge: "bg-green-100 text-green-700",
        dot: "bg-green-500",
        overlay: "bg-green-500/80 text-white",
    },
    telecom: {
        badge: "bg-blue-100 text-blue-700",
        dot: "bg-blue-500",
        overlay: "bg-blue-500/80 text-white",
    },
    unicom: {
        badge: "bg-orange-100 text-orange-700",
        dot: "bg-orange-500",
        overlay: "bg-orange-500/80 text-white",
    },
    broadcast: {
        badge: "bg-purple-100 text-purple-700",
        dot: "bg-purple-500",
        overlay: "bg-purple-500/80 text-white",
    },
    unknown: {
        badge: "bg-gray-100 text-gray-600",
        dot: "bg-gray-400",
        overlay: "bg-gray-500/80 text-white",
    },
};

/** 运营商中文标签 */
const OPERATOR_LABEL: Record<string, string> = {
    mobile: "移动",
    telecom: "电信",
    unicom: "联通",
    broadcast: "广电",
    unknown: "其他",
};

/* ========== 排名角标组件 ========== */

/**
 * 排名角标 — 根据排名位置显示不同样式
 * @param rank - 排名（从 1 开始）
 */
function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <span className="inline-flex items-center gap-1 rounded-br-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 text-[10px] font-bold text-white shadow-md sm:rounded-br-xl sm:px-3 sm:py-1.5 sm:text-[11px]">
                <Crown className="size-3 fill-white" /> 推荐
            </span>
        );
    }
    if (rank === 2) {
        return (
            <span className="inline-flex items-center gap-1 rounded-br-lg bg-gradient-to-r from-gray-400 to-gray-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm sm:rounded-br-xl sm:px-3 sm:py-1.5 sm:text-[11px]">
                <Medal className="size-3" /> TOP2
            </span>
        );
    }
    if (rank === 3) {
        return (
            <span className="inline-flex items-center gap-1 rounded-br-lg bg-gradient-to-r from-amber-600 to-amber-700 px-2 py-1 text-[10px] font-bold text-white shadow-sm sm:rounded-br-xl sm:px-3 sm:py-1.5 sm:text-[11px]">
                <Trophy className="size-3" /> TOP3
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm sm:gap-1 sm:px-2">
            NO.{rank}
        </span>
    );
}

/* ========== 规格标签（与现有 SpecTag 一致） ========== */

/**
 * 规格参数标签（带图标），与 YkyProductCard / LotMLProductCard 保持一致
 * @param icon - 图标组件
 * @param value - 参数值
 * @param colorClass - 背景与文字颜色类
 */
function SpecTag({
    icon: Icon,
    value,
    colorClass,
}: {
    icon: React.ElementType;
    value: string;
    colorClass: string;
}) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${colorClass}`}
        >
            <Icon className="size-3 shrink-0" />
            <span>{value}</span>
        </span>
    );
}

/* ========== 排行榜卡片组件 ========== */

/**
 * 排行榜卡片 — 5列网格专用
 *
 * 设计要点（与现有 ProductCard / YkyProductCard / LotMLProductCard 保持一致）：
 * - 卡片微投影 + 悬停上浮，营造层次感
 * - 运营商标签色系贯穿，快速识别品牌
 * - 规格标签 SpecTag 风格统一
 * - 分隔线 + 价格行 + 双按钮布局
 * - rounded-lg 微圆角（项目规范）
 */
function RankingCard({
    product,
    rank,
}: {
    product: UnifiedProduct;
    rank: number;
}) {
    const platformBadge = PLATFORM_BADGE[product.platform];
    const opStyle = OPERATOR_STYLE[product.operator] || OPERATOR_STYLE.unknown;
    const operatorLabel = OPERATOR_LABEL[product.operator] || "其他";

    return (
        <div
            className="group flex flex-col overflow-hidden rounded-lg border border-gray-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-gray-300/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_28px_rgba(0,0,0,0.04)]"
        >
            {/* ===== 内容区域 ===== */}
            <div className="flex flex-1 flex-col p-3 sm:p-4">
                <Link href={product.detailUrl} className="flex-1">
                    {/* 头部行：排名角标 + 运营商标签 + 平台角标 */}
                    <div className="mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        {/* 排名角标 */}
                        <RankBadge rank={rank} />
                        {/* 运营商标签（圆角药丸 + 色点） */}
                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:gap-1.5 sm:px-2.5 sm:text-[11px] ${opStyle.badge}`}
                        >
                            <span className={`inline-block size-1.5 rounded-full ${opStyle.dot}`} />
                            {operatorLabel}
                        </span>
                        {/* 平台角标 */}
                        {platformBadge && (
                            <span
                                className={`ml-auto inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 ${platformBadge.className}`}
                            >
                                {platformBadge.label}
                            </span>
                        )}
                    </div>

                    {/* 套餐名称 */}
                    <h3 className="mb-2 line-clamp-2 min-h-[2.4rem] text-xs font-semibold leading-snug text-gray-900 sm:text-sm sm:leading-snug">
                        {product.name}
                    </h3>

                    {/* 价格 */}
                    <div className="mb-2.5 flex items-baseline gap-0.5">
                        {product.price > 0 ? (
                            <>
                                <span className="text-xl font-extrabold leading-none tracking-tight text-blue-600 sm:text-[26px]">
                                    ¥{product.price}
                                </span>
                                <span className="text-xs text-gray-400">/月</span>
                            </>
                        ) : (
                            <span className="text-base font-bold text-gray-500">面议</span>
                        )}
                    </div>

                    {/* 规格参数标签（SpecTag 风格，与现有页面一致） */}
                    <div className="mb-2.5 flex flex-wrap gap-1.5">
                        {product.flow > 0 && (
                            <SpecTag
                                icon={Zap}
                                value={`${product.flow}GB`}
                                colorClass="bg-blue-50 text-blue-600"
                            />
                        )}
                        {product.voice > 0 && (
                            <SpecTag
                                icon={Phone}
                                value={`${product.voice}分钟`}
                                colorClass="bg-green-50 text-green-600"
                            />
                        )}
                        <SpecTag
                            icon={Clock}
                            value={product.duration}
                            colorClass="bg-orange-50 text-orange-600"
                        />
                    </div>

                    {/* 归属地 + 返佣标签行 */}
                    <div className="flex flex-wrap items-center gap-1">
                        {product.region && (
                            <span className="inline-flex items-center rounded-full bg-blue-600/4 px-2 py-0.5 text-[10px] font-medium text-blue-600/80">
                                {product.region}
                            </span>
                        )}
                        {product.commissionType && (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                                💰 {product.commissionType}
                            </span>
                        )}
                    </div>
                </Link>

                {/* 分隔线 */}
                <div className="my-2.5 border-t border-gray-100" />

                {/* 操作按钮（查看详情 + 立即办理） */}
                <div className="flex flex-col gap-1.5 sm:flex-row">
                    <Link
                        href={product.detailUrl}
                        className="inline-flex items-center justify-center gap-1 rounded-full border border-gray-300 bg-white px-2 py-2 text-[11px] font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 sm:flex-1 sm:py-1.5 sm:text-xs"
                    >
                        <Eye className="size-3.5" />
                        查看详情
                    </Link>
                    {product.orderUrl ? (
                        <a
                            href={product.orderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 rounded-full bg-blue-600 px-2 py-2 text-[11px] font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md sm:flex-1 sm:py-1.5 sm:text-xs"
                        >
                            立即办理
                            <ChevronRight className="size-3.5" />
                        </a>
                    ) : (
                        <Link
                            href={product.detailUrl}
                            className="inline-flex items-center justify-center gap-1 rounded-full bg-blue-600 px-2 py-2 text-[11px] font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md sm:flex-1 sm:py-1.5 sm:text-xs"
                        >
                            立即办理
                            <ChevronRight className="size-3.5" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ========== 商品网格（点击加载分页） ========== */

/** 每页加载数量（默认12个） */
const PAGE_SIZE = 15;

/** visibleCount reducer */
type VisibleAction = { type: "reset" } | { type: "loadMore"; maxCount: number };
function visibleReducer(state: number, action: VisibleAction): number {
    switch (action.type) {
        case "reset":
            return PAGE_SIZE;
        case "loadMore":
            return Math.min(state + PAGE_SIZE, action.maxCount);
    }
}

/** 排行榜商品网格组件 */
function RankingGrid({ products }: { products: UnifiedProduct[] }) {
    const [visibleCount, dispatchVisible] = useReducer(visibleReducer, PAGE_SIZE);

    /* 商品列表变化时重置分页 */
    useEffect(() => {
        dispatchVisible({ type: "reset" });
    }, [products]);

    const displayed = products.slice(0, visibleCount);
    const hasMore = displayed.length < products.length;
    const remaining = products.length - displayed.length;

    /* 加载更多 */
    const loadMore = useCallback(() => {
        dispatchVisible({ type: "loadMore", maxCount: products.length });
    }, [products.length]);

    /* 空态 */
    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center py-16 text-center">
                <Search className="mb-4 size-12 text-gray-200" />
                <p className="text-base font-medium text-gray-500">暂无符合条件的套餐</p>
                <p className="mt-1 text-sm text-gray-400">请尝试切换分类或搜索关键词</p>
            </div>
        );
    }

    return (
        <>
            {/* 排行榜网格 */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
                {displayed.map((product, index) => (
                    <RankingCard
                        key={`${product.platform}-${product.id}`}
                        product={product}
                        rank={index + 1}
                    />
                ))}
            </div>

            {/* ===== 分页信息栏 ===== */}
            <div className="mt-8 flex flex-col items-center gap-4">
                {/* 进度条 */}
                <div className="w-full max-w-xs">
                    <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                        <span>已展示 <strong className="text-gray-700">{displayed.length}</strong> 件</span>
                        <span>共 <strong className="text-gray-700">{products.length}</strong> 件</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                            style={{
                                width: `${Math.round((displayed.length / products.length) * 100)}%`,
                            }}
                        />
                    </div>
                </div>

                {/* 加载更多按钮 */}
                {hasMore && (
                    <button
                        type="button"
                        onClick={loadMore}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md active:scale-[0.98]"
                    >
                        <TrendingUp className="size-4" />
                        加载更多（还有 {remaining} 件）
                    </button>
                )}

                {/* 已全部加载 */}
                {!hasMore && products.length > 0 && (
                    <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-2.5">
                        <span className="inline-block size-2 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium text-blue-700">
                            已展示全部 <strong>{products.length}</strong> 件商品
                        </span>
                    </div>
                )}
            </div>
        </>
    );
}

/* ========== 分类标签快速筛选 ========== */

/** 快捷标签筛选项 */
const QUICK_TAGS = [
    { key: "all", label: "全部套餐" },
    { key: "long_term", label: "长期卡" },
    { key: "low_price", label: "19元以下" },
    { key: "big_flow", label: "200G以上" },
    { key: "has_voice", label: "带通话" },
    { key: "has_commission", label: "有返佣" },
];

/* ========== 关键词搜索匹配 ========== */

/**
 * 关键词搜索（大小写不敏感，支持空格分词 AND 匹配）
 * @param product - 商品
 * @param query - 搜索关键词
 */
function matchSearch(product: UnifiedProduct, query: string): boolean {
    if (!query.trim()) return true;
    const tokens = query.trim().toLowerCase().split(/\s+/);
    const name = product.name.toLowerCase();
    return tokens.every((token) => name.includes(token));
}

/* ========== 快捷标签匹配 ========== */

/**
 * 判断商品是否匹配快捷标签
 * @param product - 商品
 * @param tagKey - 标签 key
 */
function matchQuickTag(product: UnifiedProduct, tagKey: string): boolean {
    switch (tagKey) {
        case "all":
            return true;
        case "long_term":
            return product.duration === "长期";
        case "low_price":
            return product.price > 0 && product.price <= 19;
        case "big_flow":
            return product.flow >= 200;
        case "has_voice":
            return product.voice > 0;
        case "has_commission":
            return !!product.commissionType;
        default:
            return true;
    }
}

/* ========== 随机排序 ========== */

/**
 * 种子化伪随机数生成器 — 确保 SSR 与客户端水合一致
 * @param seed - 随机种子
 * @param index - 索引
 */
function seededRandom(seed: number, index: number): number {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
}

/**
 * 种子化 Fisher-Yates 洗牌 — 根据种子产生确定性的随机打乱
 * @param arr - 商品数组
 * @param seed - 随机种子
 */
function shuffle<T>(arr: T[], seed: number): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed, i) * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/* ========== 底部 CTA ========== */

/** 底部引导区 */
function CtaSection() {
    return (
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-14">
            <div className="mx-auto max-w-2xl px-4 text-center">
                <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
                    立即申请，免费包邮到家！
                </h2>
                <p className="mb-6 text-sm text-blue-100 sm:text-base">
                    正规渠道、7天无理由退换，零风险体验
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-blue-600 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                    >
                        <Star className="size-4" />
                        浏览首页精选
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-all hover:border-white hover:bg-white/10"
                    >
                        返回首页
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ========== 统计摘要条 ========== */

/** 统计摘要条 — 显示当前分类的关键数据 */
function StatsBar({ products }: { products: UnifiedProduct[] }) {
    const stats = useMemo(() => {
        const total = products.length;
        const avgPrice = total > 0
            ? (products.filter((p) => p.price > 0).reduce((s, p) => s + p.price, 0) /
                Math.max(products.filter((p) => p.price > 0).length, 1)).toFixed(0)
            : "0";
        const maxFlow = total > 0 ? Math.max(...products.map((p) => p.flow), 0) : 0;
        const longCount = products.filter((p) => p.duration === "长期").length;
        return { total, avgPrice, maxFlow, longCount };
    }, [products]);

    return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-500">
            <span>
                共 <strong className="text-gray-700">{stats.total}</strong> 款
            </span>
            <span className="h-3 w-px bg-gray-200" />
            <span>
                均价 <strong className="text-gray-700">¥{stats.avgPrice}</strong>/月
            </span>
            <span className="h-3 w-px bg-gray-200" />
            <span>
                最高 <strong className="text-blue-600">{stats.maxFlow}G</strong> 流量
            </span>
            <span className="h-3 w-px bg-gray-200" />
            <span>
                长期卡 <strong className="text-green-600">{stats.longCount}</strong> 款
            </span>
        </div>
    );
}

/* ========== SEO 选购指南区块 ========== */

/**
 * 流量卡选购指南 — SEO 内容区块
 *
 * 覆盖关键词：流量卡怎么选、流量卡避坑指南、流量卡哪个好、
 * 长期套餐、不限速、运营商对比等痛点型/问题型长尾词
 */
function SeoGuideSection() {
    return (
        <section className={containerClass("py-10 md:py-14")} style={SITE_WIDTH_STYLE}>
            <article>
                {/* 标题区 */}
                <h2 className="mb-6 text-center text-xl font-bold text-gray-800 sm:text-2xl">
                    流量卡怎么选？2026年手机流量卡选购指南
                </h2>
                <p className="mb-8 text-center text-sm text-gray-500">
                    覆盖电信/移动/联通/广电四大运营商，从价格、流量、时长、网速四大维度帮你避坑
                </p>

                {/* 三列要点卡片 */}
                <div className="grid gap-4 sm:grid-cols-3">
                    {/* 要点 1 */}
                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                            <Star className="size-3.5" />
                            价格选型
                        </div>
                        <h3 className="mb-2 text-sm font-bold text-gray-800">
                            月租预算决定套餐档位
                        </h3>
                        <ul className="space-y-1.5 text-xs leading-relaxed text-gray-500">
                            <li>· <strong className="text-gray-700">9-19元档</strong>：学生党、备用机首选，流量100-200G</li>
                            <li>· <strong className="text-gray-700">29元档</strong>：性价比黄金价位，流量150-200G+通话</li>
                            <li>· <strong className="text-gray-700">39元以上</strong>：大流量+高速率，适合主卡用户</li>
                        </ul>
                    </div>

                    {/* 要点 2 */}
                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                            <Signal className="size-3.5" />
                            运营商对比
                        </div>
                        <h3 className="mb-2 text-sm font-bold text-gray-800">
                            四大运营商各有优势
                        </h3>
                        <ul className="space-y-1.5 text-xs leading-relaxed text-gray-500">
                            <li>· <strong className="text-gray-700">电信</strong>：覆盖广、网速稳定，星卡系列口碑好</li>
                            <li>· <strong className="text-gray-700">移动</strong>：用户基数大，花卡系列性价比高</li>
                            <li>· <strong className="text-gray-700">联通</strong>：套餐灵活，流量单价低</li>
                            <li>· <strong className="text-gray-700">广电</strong>：新兴运营商，192G超大流量套餐</li>
                        </ul>
                    </div>

                    {/* 要点 3 */}
                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                            <AlertTriangle className="size-3.5" />
                            避坑指南
                        </div>
                        <h3 className="mb-2 text-sm font-bold text-gray-800">
                            办卡前必看的防坑要点
                        </h3>
                        <ul className="space-y-1.5 text-xs leading-relaxed text-gray-500">
                            <li>· 确认是<strong className="text-gray-700">通用流量</strong>还是定向流量</li>
                            <li>· 看清<strong className="text-gray-700">合约期</strong>，长期卡更稳定但受限</li>
                            <li>· 关注<strong className="text-gray-700">限速阈值</strong>，超量后是否降速</li>
                            <li>· 只选<strong className="text-gray-700">正规渠道</strong>办理，拒绝物联卡</li>
                        </ul>
                    </div>
                </div>

                {/* 底部 FAQ 式文本（覆盖问题型长尾词） */}
                <div className="mt-8 rounded-xl bg-gray-50 p-5 sm:p-6">
                    <h3 className="mb-3 text-sm font-bold text-gray-700">
                        常见问题：流量卡哪个好？
                    </h3>
                    <div className="space-y-3 text-xs leading-relaxed text-gray-500">
                        <p>
                            <strong className="text-gray-700">学生党推荐：</strong>
                            优先选择19元档套餐，如电信星卡19元版、广电福兔卡等，流量充足且月租低，适合日常上网、刷视频使用。支持双卡双待，搭配主卡通话两不误。
                        </p>
                        <p>
                            <strong className="text-gray-700">上班族推荐：</strong>
                            建议选择29-39元档的长期套餐流量卡，流量150-200G以上，不限速全国通用，适合日常办公、视频会议、户外直播等场景。优先选电信或联通，网速和稳定性更有保障。
                        </p>
                        <p>
                            <strong className="text-gray-700">如何避免踩坑：</strong>
                            务必通过正规渠道办理，确认是实名制手机卡而非物联卡。关注套餐的通用流量占比，避免虚标偷跑。合约期建议选1-2年，既能享受优惠价又不影响后续携号转网。
                        </p>
                    </div>
                </div>
            </article>
        </section>
    );
}

/* ========== 主入口 ========== */

/** 全局搜索页客户端主组件 — 排行榜式布局 */
export default function SearchContent({
    products,
    totalCount,
    platformErrors,
    randomSeed,
}: SearchContentProps) {
    /* ===== 搜索状态 ===== */
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    /* ===== 排行榜分类 Tab ===== */
    const [activeTabKey, setActiveTabKey] = useState("all");

    /* ===== 快捷标签筛选 ===== */
    const [quickTag, setQuickTag] = useState("all");

    /* ===== 搜索防抖（300ms） ===== */
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    /* ===== 当前激活的 Tab 配置 ===== */
    const activeTab = useMemo(
        () => RANKING_TABS.find((t) => t.key === activeTabKey) || RANKING_TABS[0],
        [activeTabKey],
    );

    /* ===== 经过 Tab 筛选 + 搜索 + 快捷标签 + 排序后的商品 ===== */
    const rankedProducts = useMemo(() => {
        let filtered = products;

        /* 1. Tab 运营商筛选 */
        if (activeTab.mode === "operator" && activeTab.operatorFilter) {
            filtered = filtered.filter((p) => p.operator === activeTab.operatorFilter);
        }

        /* 2. 关键词搜索 */
        filtered = filtered.filter((p) => matchSearch(p, searchQuery));

        /* 3. 快捷标签筛选 */
        filtered = filtered.filter((p) => matchQuickTag(p, quickTag));

        /* 4. 随机排序 */
        return shuffle(filtered, randomSeed);
    }, [products, activeTab, searchQuery, quickTag, randomSeed]);

    /* ===== 各 Tab 商品数量统计 ===== */
    const tabCounts = useMemo(() => {
        const base = products.filter((p) => matchSearch(p, searchQuery));
        const counts: Record<string, number> = {};
        for (const tab of RANKING_TABS) {
            if (tab.mode === "operator" && tab.operatorFilter) {
                counts[tab.key] = base.filter((p) => p.operator === tab.operatorFilter).length;
            } else {
                counts[tab.key] = base.length;
            }
        }
        return counts;
    }, [products, searchQuery]);

    return (
        <div className="flex min-h-svh flex-col bg-[#f5f7fa]">
            <Header />

            {/* ===== Banner + 搜索框 ===== */}
            <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 py-6 sm:py-10 lg:py-12">
                <div className={containerClass()} style={SITE_WIDTH_STYLE}>
                    <div className="flex flex-col gap-4">
                        {/* 标题区 */}
                        <div className="flex items-center gap-3">
                            <Search className="size-6 shrink-0 text-blue-200 sm:size-8" />
                            <div>
                                <h1 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                                    全站号卡搜索
                                </h1>
                                <p className="mt-1 text-xs text-blue-100 sm:text-sm">
                                    聚合6大平台 · 共 {totalCount} 款套餐一键搜索对比
                                </p>
                            </div>
                        </div>
                        {/* 搜索输入框 */}
                        <div className="relative w-full max-w-2xl">
                            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="搜索套餐名称，如：电信29元185G、联通长期卡..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="h-11 w-full rounded-xl border-0 bg-white/95 pl-12 pr-10 text-sm text-gray-800 shadow-lg backdrop-blur-sm placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30 sm:h-12"
                                aria-label="搜索套餐名称"
                            />
                            {searchInput && (
                                <button
                                    onClick={() => {
                                        setSearchInput("");
                                        setSearchQuery("");
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== 平台加载失败提示 ===== */}
            {platformErrors.length > 0 && (
                <div className={containerClass("py-2")} style={SITE_WIDTH_STYLE}>
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                        <AlertTriangle className="size-4 shrink-0" />
                        <span>
                            以下平台数据加载失败：{platformErrors.join("、")}
                            ，已展示其他平台商品
                        </span>
                    </div>
                </div>
            )}

            <main className="flex-1">
                {/* ===== 排行榜分类 Tab 栏 ===== */}
                <div className={containerClass("pt-5 pb-3")} style={SITE_WIDTH_STYLE}>
                    {/* 移动端横向滚动，桌面端 flex-wrap */}
                    <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible">
                        {RANKING_TABS.map((tab) => {
                            const isActive = activeTabKey === tab.key;
                            const count = tabCounts[tab.key] || 0;
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTabKey(tab.key)}
                                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-300 sm:px-4 sm:py-2 sm:text-sm ${isActive
                                        ? `bg-gradient-to-r ${tab.accentClass} text-white shadow-md shadow-blue-600/10`
                                        : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
                                        }`}
                                >
                                    <TabIcon className={`size-3 sm:size-3.5 ${isActive ? "text-white" : tab.iconClass}`} />
                                    <span className="whitespace-nowrap">{tab.label}</span>
                                    <span
                                        className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${isActive
                                            ? "bg-white/25 text-white"
                                            : "bg-gray-100 text-gray-400"
                                            }`}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ===== 快捷标签 + 统计摘要 ===== */}
                <div className={containerClass("pb-3")} style={SITE_WIDTH_STYLE}>
                    <div className="flex flex-col gap-2.5 rounded-xl bg-white px-3 py-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
                        {/* 左侧：快捷标签 */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {QUICK_TAGS.map((tag) => {
                                const isActive = quickTag === tag.key;
                                return (
                                    <button
                                        key={tag.key}
                                        onClick={() => setQuickTag(tag.key)}
                                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all sm:px-3 sm:text-xs ${isActive
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                                            }`}
                                    >
                                        {tag.label}
                                    </button>
                                );
                            })}
                        </div>
                        {/* 右侧：统计摘要 */}
                        <StatsBar products={rankedProducts} />
                    </div>
                </div>

                {/* ===== 排行榜标题栏 ===== */}
                <div className={containerClass("pb-2")} style={SITE_WIDTH_STYLE}>
                    <div className="flex items-center gap-2">
                        <activeTab.icon className={`size-5 ${activeTab.iconClass}`} />
                        <h2 className="text-lg font-bold text-gray-800">{activeTab.label}</h2>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                            TOP {rankedProducts.length}
                        </span>
                        {searchQuery && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                                &quot;{searchQuery}&quot;
                            </span>
                        )}
                    </div>
                </div>

                {/* ===== 排行榜商品网格 ===== */}
                <div className={containerClass("pb-10")} style={SITE_WIDTH_STYLE}>
                    <RankingGrid products={rankedProducts} />
                </div>
            </main>

            {/* ===== SEO 选购指南区块 ===== */}
            <SeoGuideSection />

            {/* ===== 底部 CTA ===== */}
            <CtaSection />
            <Footer />
        </div>
    );
}
