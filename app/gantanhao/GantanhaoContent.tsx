/**
 * 卡业联盟商品展示页面客户端组件
 *
 * 路由：/gantanhao
 * 使用服务端预计算元数据（_provider / _location / _duration / _tags），
 * 避免客户端重复解析字符串，提升筛选和渲染性能。
 *
 * 数据来源：卡业联盟 API /api/api/selectProduct
 */

"use client";

import { useState, useMemo, useRef, useEffect, useCallback, useReducer } from "react";
import Link from "next/link";
import type {
    GantanhaoProductWithMeta,
    GantanhaoOperator,
    GantanhaoDurationType,
} from "@/lib/api/gantanhao";
import { GANTANHAO_OPERATOR_LABEL, GANTANHAO_SHOP_URL } from "@/lib/api/gantanhao";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import { Button } from "@/components/ui/button";
import {
    Signal,
    ArrowRight,
    ShoppingCart,
    ShieldCheck,
    TrendingUp,
    MapPin,
    RefreshCw,
    Eye,
    ChevronRight,
    Star,
} from "lucide-react";
import ClaimTicker from "@/components/ClaimTicker";

/* ========== 类型定义 ========== */

interface GantanhaoContentProps {
    products: GantanhaoProductWithMeta[];
    error: string | null;
}

/** 商品携带的筛选维度（从预计算字段读取） */
interface ProductMeta {
    provider: GantanhaoOperator;
    location: string;
    duration: string;
}

/* ========== 筛选选项常量 ========== */

const OPERATOR_OPTIONS = [
    { key: "all" as const, label: "全部运营商" },
    ...(["mobile", "telecom", "unicom", "broadcast"] as GantanhaoOperator[]).map((k) => ({
        key: k,
        label: GANTANHAO_OPERATOR_LABEL[k],
    })),
];

const DURATION_OPTIONS = [
    { key: "all" as const, label: "全部时长" },
    { key: "长期" as GantanhaoDurationType, label: "长期" },
    { key: "2年" as GantanhaoDurationType, label: "2年" },
    { key: "1年" as GantanhaoDurationType, label: "1年" },
];

/* ========== 运营商配色 ========== */

const OPERATOR_STYLE: Record<string, { badge: string; dot: string }> = {
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

/* ========== 页面顶栏优势 ========== */

/** 卡业联盟平台优势展示区 */
function AdvantagesSection() {
    const items = [
        { icon: ShieldCheck, title: "正规运营商渠道", desc: "直连运营商官方渠道，确保卡品质量和稳定性" },
        { icon: TrendingUp, title: "秒返佣金", desc: "部分商品支持秒返佣金，资金回笼更高效" },
        { icon: MapPin, title: "覆盖全国各省", desc: "商品覆盖全国各省市，满足不同地区用户需求" },
        { icon: ShoppingCart, title: "支持选号办理", desc: "部分商品支持自主选号，用户体验更优" },
    ];

    return (
        <section className={containerClass("pt-6")} style={SITE_WIDTH_STYLE}>
            <h3 className="mb-3 text-base font-medium text-gray-800 sm:mb-4 sm:text-lg">卡业联盟平台优势</h3>
            {/* 移动端双排，桌面端四列 */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {items.map((item) => (
                    <div key={item.title} className="rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-5">
                        <div className="mb-1.5 flex items-center gap-2 text-blue-600 sm:mb-2">
                            <item.icon className="size-4 shrink-0 sm:size-5" />
                            <span className="text-sm font-semibold text-gray-800 sm:text-base">{item.title}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-400 sm:text-sm sm:text-gray-500">{item.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

/* ========== 筛选栏 ========== */

/** 通用筛选行组件 */
function FilterRow({
    label,
    options,
    activeKey,
    onChange,
    counts,
}: {
    label: string;
    options: { key: string; label: string }[];
    activeKey: string;
    onChange: (key: string) => void;
    counts?: Record<string, number>;
}) {
    return (
        <div className="flex flex-wrap items-center gap-2 py-2">
            <span className="relative mr-1 flex items-center pl-3 text-sm font-medium text-gray-600 before:absolute before:left-0 before:top-1/2 before:h-3.5 before:w-[3px] before:-translate-y-1/2 before:rounded-sm before:bg-blue-600">
                {label}
            </span>
            {options.map((opt) => {
                const isActive = activeKey === opt.key;
                const count = counts?.[opt.key];
                if (count !== undefined && count === 0 && opt.key !== "all") return null;

                return (
                    <button
                        key={opt.key}
                        onClick={() => onChange(opt.key)}
                        className={`rounded-md border px-3.5 py-1.5 text-xs transition-all duration-300 ${isActive
                            ? "border-blue-600 bg-blue-600 font-medium text-white shadow-sm shadow-blue-600/20"
                            : "border-transparent bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                            }`}
                    >
                        {opt.label}
                        {count !== undefined && (
                            <span className={`ml-1 text-[11px] ${isActive ? "text-white/80" : "text-gray-400"}`}>
                                ({count})
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/** 卡业联盟筛选栏（运营商 / 归属地 / 套餐时长） */
function FilterBar({
    activeOperator,
    onOperatorChange,
    activeLocation,
    onLocationChange,
    activeDuration,
    onDurationChange,
    operatorCounts,
    locationOptions,
    locationCounts,
}: {
    activeOperator: string;
    onOperatorChange: (k: string) => void;
    activeLocation: string;
    onLocationChange: (k: string) => void;
    activeDuration: string;
    onDurationChange: (k: string) => void;
    operatorCounts: Record<string, number>;
    locationOptions: { key: string; label: string }[];
    locationCounts: Record<string, number>;
}) {
    return (
        <div className={containerClass("py-4")} style={SITE_WIDTH_STYLE}>
            <div className="rounded-xl bg-white p-5 shadow-sm">
                <FilterRow
                    label="运营商"
                    options={OPERATOR_OPTIONS}
                    activeKey={activeOperator}
                    onChange={onOperatorChange}
                    counts={operatorCounts}
                />
                <div className="border-t border-gray-50" />
                <FilterRow
                    label="归属地"
                    options={locationOptions}
                    activeKey={activeLocation}
                    onChange={onLocationChange}
                    counts={locationCounts}
                />
                <div className="border-t border-gray-50" />
                <FilterRow
                    label="套餐时长"
                    options={DURATION_OPTIONS}
                    activeKey={activeDuration}
                    onChange={onDurationChange}
                />
            </div>
        </div>
    );
}

/* ========== 卡业联盟商品卡片 ========== */

/** 商品标签列表（圆角药丸样式） */
function GantanhaoProductTags({
    tags,
    max = 4,
}: {
    tags: { text: string; className: string }[];
    max?: number;
}) {
    const displayTags = tags.slice(0, max);
    if (displayTags.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-0.5 sm:gap-1">
            {displayTags.map((tag, i) => (
                <span
                    key={i}
                    className={`inline-block rounded-full border px-2 py-px text-[10px] leading-relaxed font-medium ${tag.className}`}
                >
                    {tag.text}
                </span>
            ))}
        </div>
    );
}

/**
 * 卡业联盟商品卡片
 *
 * 针对卡业联盟数据结构定制的商品卡片组件：
 * - 封面图（img 字段）
 * - 运营商色系标签（_provider 预计算）
 * - 月租价格（_price 预计算）
 * - 佣金展示（commission 字段）
 * - 标签列表（_tags 预计算）
 */
function GantanhaoProductCard({ product }: { product: GantanhaoProductWithMeta }) {
    const prov = product._provider;
    const opStyle = OPERATOR_STYLE[prov] || OPERATOR_STYLE.unknown;
    const price = product._price || "?";
    // 是否秒返
    const isMiaoFan = product.rebateType === 2;

    return (
        <div className="group flex flex-col overflow-hidden rounded-lg border border-gray-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-gray-300/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_28px_rgba(0,0,0,0.04)] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
            {/* ===== 图片区域 ===== */}
            <Link href={`/gantanhao/${product.codeNumber}`} className="block">
                {product.img ? (
                    <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100/50 p-2 sm:p-3">
                        <img
                            src={product.img}
                            alt={product.name}
                            className="h-full w-full rounded-lg object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                        />
                        {/* 秒返角标 */}
                        {isMiaoFan && (
                            <span className="absolute left-0 top-0 inline-flex items-center gap-1 rounded-br-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 text-[10px] font-bold text-white shadow-md sm:rounded-br-xl sm:px-3 sm:py-1.5 sm:text-[11px]">
                                <Star className="size-3 fill-white" /> 秒返
                            </span>
                        )}
                    </div>
                ) : (
                    /* 无图片占位 */
                    <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                        <span className="text-xs text-gray-400">暂无图片</span>
                    </div>
                )}
            </Link>

            {/* ===== 内容区域 ===== */}
            <div className="flex flex-1 flex-col p-3 sm:p-4">
                <Link href={`/gantanhao/${product.codeNumber}`} className="flex-1">
                    {/* 运营商标签 */}
                    <div className="mb-2 flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:text-[11px] ${opStyle.badge}`}>
                            <span className={`inline-block size-1.5 rounded-full ${opStyle.dot}`} />
                            {GANTANHAO_OPERATOR_LABEL[prov]}
                        </span>
                        {/* 选号标签 */}
                        {product.isSelectNumber === 1 && (
                            <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-600">
                                可选号
                            </span>
                        )}
                    </div>

                    {/* 标题（取 name 去除产品编码前缀） */}
                    <h3 className="mb-1.5 line-clamp-2 text-xs font-semibold leading-snug text-gray-900 sm:mb-2 sm:text-sm">
                        {product.name.replace(/^\d+-/, "")}
                    </h3>

                    {/* 副标题（简要套餐信息） */}
                    <p className="mb-2 line-clamp-1 text-[11px] text-gray-400 sm:text-xs">
                        {product.subName}
                    </p>

                    {/* 价格 + 佣金 */}
                    <div className="mb-2 flex items-baseline gap-2 sm:mb-3">
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-xl font-extrabold leading-none tracking-tight text-blue-600 sm:text-[28px]">
                                ¥{price.replace("元", "")}
                            </span>
                            <span className="text-xs text-gray-400">/月</span>
                        </div>
                        {/* 佣金信息 */}
                        {product.commission && (
                            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                                佣金¥{product.commission}
                            </span>
                        )}
                    </div>

                    {/* 标签（使用预计算数据） */}
                    <GantanhaoProductTags tags={product._tags} max={4} />
                </Link>

                {/* 分隔线 */}
                <div className="my-2 border-t border-gray-100 sm:my-3" />

                {/* ===== 操作按钮 ===== */}
                <div className="flex gap-1.5 sm:gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-gray-200 text-xs hover:border-gray-300 hover:bg-gray-50"
                        asChild
                    >
                        <Link href={`/gantanhao/${product.codeNumber}`}>
                            <Eye className="size-3.5" />
                            详情
                        </Link>
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 bg-blue-600 text-xs font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow-md"
                        asChild
                    >
                        <a href={product._orderUrl} target="_blank" rel="noopener noreferrer">
                            立即办理 <ChevronRight className="size-3.5" />
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ========== 商品网格（分页加载） ========== */

/** 每页加载数量 */
const PAGE_SIZE = 12;

/** visibleCount reducer：dispatch 稳定引用，无卸载后 setState 问题 */
type VisibleAction = { type: "reset" } | { type: "loadMore"; maxCount: number };
function visibleReducer(state: number, action: VisibleAction): number {
    switch (action.type) {
        case "reset":
            return PAGE_SIZE;
        case "loadMore":
            return Math.min(state + PAGE_SIZE, action.maxCount);
    }
}

/** 卡业联盟商品卡片网格（含筛选 + 无限滚动） */
function ProductGrid({
    products,
    activeOperator,
    activeLocation,
    activeDuration,
}: {
    products: GantanhaoProductWithMeta[];
    activeOperator: string;
    activeLocation: string;
    activeDuration: string;
}) {
    /* ===== 筛选逻辑 ===== */
    const filtered = useMemo(() => {
        return products.filter((p) => {
            const meta = getProductMeta(p);
            if (activeOperator !== "all" && meta.provider !== activeOperator) return false;
            if (activeLocation !== "all" && meta.location !== activeLocation) return false;
            if (activeDuration !== "all" && meta.duration !== activeDuration) return false;
            return true;
        });
    }, [products, activeOperator, activeLocation, activeDuration]);

    /* ===== 分页状态 ===== */
    const filterKey = `${activeOperator}-${activeLocation}-${activeDuration}`;
    const [visibleCount, dispatchVisible] = useReducer(visibleReducer, PAGE_SIZE);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // 筛选条件变化时重置分页
    useEffect(() => {
        dispatchVisible({ type: "reset" });
    }, [filterKey]);

    const displayed = filtered.slice(0, visibleCount);
    const hasMore = displayed.length < filtered.length;

    /* ===== IntersectionObserver 自动加载更多 ===== */
    const loadMore = useCallback(() => {
        dispatchVisible({ type: "loadMore", maxCount: filtered.length });
    }, [filtered.length]);

    useEffect(() => {
        if (!hasMore) return;
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    loadMore();
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    /* ===== 空状态 ===== */
    if (filtered.length === 0) {
        return (
            <div className="flex flex-col items-center py-20 text-center">
                <Signal className="mb-4 size-12 text-gray-300" />
                <p className="text-base font-medium text-gray-500">暂无符合条件的套餐</p>
                <p className="mt-1 text-sm text-gray-400">请尝试调整筛选条件</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayed.map((product) => (
                    <GantanhaoProductCard key={product.codeNumber} product={product} />
                ))}
            </div>

            {/* ===== 分页信息栏 ===== */}
            <div className="mt-8">
                {/* 进度条 */}
                <div className="mx-auto mb-4 h-1.5 max-w-xs overflow-hidden rounded-full bg-gray-100">
                    <div
                        className="h-full rounded-full bg-linear-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${Math.round((displayed.length / filtered.length) * 100)}%` }}
                    />
                </div>

                {hasMore && (
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-center text-xs text-gray-400">
                            已展示
                            <span className="mx-1 font-semibold text-gray-600">{displayed.length}</span>
                            件，共
                            <span className="mx-1 font-semibold text-gray-600">{filtered.length}</span>
                            件
                        </p>
                        {/* 哨兵 + 加载更多按钮 */}
                        <div ref={sentinelRef} className="h-1 w-full" />
                        <button
                            type="button"
                            onClick={loadMore}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 hover:shadow-md"
                        >
                            <RefreshCw className="size-4" />
                            加载更多（剩余 {filtered.length - displayed.length} 件）
                        </button>
                    </div>
                )}

                {!hasMore && filtered.length > 0 && (
                    <div className="mx-auto mt-3 flex max-w-xs items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 shadow-sm">
                        <span className="inline-block size-2 rounded-full bg-white/70" />
                        <span className="text-sm font-medium text-white">
                            已展示全部
                            <span className="mx-1 font-semibold">{filtered.length}</span>
                            件商品
                        </span>
                    </div>
                )}
            </div>
        </>
    );
}

/* ========== 商品元数据工具 ========== */

/** 从预计算字段提取筛选维度 */
function getProductMeta(product: GantanhaoProductWithMeta): ProductMeta {
    return {
        provider: product._provider,
        location: product._location,
        duration: product._duration,
    };
}

/* ========== 底部 CTA ========== */

/** 底部号召行动区域 */
function CtaSection() {
    return (
        <section className="bg-linear-to-r from-blue-600 to-blue-700 py-14">
            <div className="mx-auto max-w-2xl px-4 text-center">
                <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
                    立即申请，免费包邮到家！
                </h2>
                <p className="mb-6 text-sm text-blue-100 sm:text-base">
                    正规渠道、7天无理由退换，零风险体验
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <a
                        href={GANTANHAO_SHOP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-blue-600 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                    >
                        <ShoppingCart className="size-4" />
                        免费申请号卡
                    </a>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-all hover:border-white hover:bg-white/10"
                    >
                        返回首页 <ArrowRight className="size-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ========== 错误页面 ========== */

/** 数据加载失败时的错误展示 */
function ErrorPage({ message }: { message: string }) {
    return (
        <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
            <Header />
            <main className="flex flex-1 items-center justify-center">
                <div className="text-center">
                    <Signal className="mx-auto mb-4 size-12 text-red-300" />
                    <h2 className="mb-1 text-lg font-semibold text-gray-700">数据加载失败</h2>
                    <p className="text-sm text-gray-400">{message}</p>
                </div>
            </main>
            <Footer />
        </div>
    );
}

/* ========== 主入口 ========== */

export default function GantanhaoContent({ products, error }: GantanhaoContentProps) {
    const [activeOperator, setActiveOperator] = useState("all");
    const [activeLocation, setActiveLocation] = useState("all");
    const [activeDuration, setActiveDuration] = useState("all");

    /** 计算各维度统计数据（运营商 / 归属地） */
    const { operatorCounts, locationOptions, locationCounts } = useMemo(() => {
        const opCounts: Record<string, number> = {
            all: products.length,
            mobile: 0,
            telecom: 0,
            unicom: 0,
            broadcast: 0,
        };
        const locCounts: Record<string, number> = { all: products.length };
        const locSet = new Set<string>();

        products.forEach((p) => {
            const meta = getProductMeta(p);
            // 运营商计数
            if (opCounts[meta.provider] !== undefined) opCounts[meta.provider]++;
            // 归属地计数
            locSet.add(meta.location);
            locCounts[meta.location] = (locCounts[meta.location] || 0) + 1;
        });

        const locOpts = [
            { key: "all", label: "全部归属地" },
            ...Array.from(locSet)
                .sort()
                .filter((k) => locCounts[k] > 0)
                .map((k) => ({ key: k, label: k })),
        ];

        return { operatorCounts: opCounts, locationOptions: locOpts, locationCounts: locCounts };
    }, [products]);

    if (error) return <ErrorPage message={error} />;

    return (
        <div className="min-h-screen bg-[#f5f7fa]">
            <Header />

            {/* ===== 页面 Banner ===== */}
            <section className="bg-linear-to-br from-blue-600 via-blue-700 to-indigo-700 py-8 sm:py-12">
                <div className={containerClass()} style={SITE_WIDTH_STYLE}>
                    <div className="flex items-center gap-3">
                        <Signal className="size-6 shrink-0 text-blue-200 sm:size-8" />
                        <div>
                            <h1 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                                卡业联盟大流量卡套餐大全
                            </h1>
                            <p className="mt-1 text-xs text-blue-100 sm:text-sm">
                                正规运营商渠道 · 秒返佣金 · 全国包邮 · 共 {products.length} 款在售套餐
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <main>
                <AdvantagesSection />
                <ClaimTicker />
                <FilterBar
                    activeOperator={activeOperator}
                    onOperatorChange={setActiveOperator}
                    activeLocation={activeLocation}
                    onLocationChange={setActiveLocation}
                    activeDuration={activeDuration}
                    onDurationChange={setActiveDuration}
                    operatorCounts={operatorCounts}
                    locationOptions={locationOptions}
                    locationCounts={locationCounts}
                />
                <section className={containerClass("pb-10")} style={SITE_WIDTH_STYLE}>
                    <ProductGrid
                        products={products}
                        activeOperator={activeOperator}
                        activeLocation={activeLocation}
                        activeDuration={activeDuration}
                    />
                </section>
                <CtaSection />
            </main>
            <Footer />
        </div>
    );
}
