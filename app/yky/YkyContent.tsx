/**
 * 翼卡云商品列表客户端组件
 *
 * 提供四维度筛选（商品分类/运营商/地区/套餐时长）、无限滚动分页加载、空态处理等交互功能。
 * 接收服务端预计算好的商品数据，避免客户端重复解析。
 * 数据来源：翼卡云开放API /openapi/goods/list
 */
"use client";

import { useState, useMemo, useRef, useEffect, useCallback, useReducer } from "react";
import Link from "next/link";
import Image from "next/image";
import type { YkyProductWithMeta, YkyOperator } from "@/lib/api/yky";
import { YKY_OPERATOR_LABEL } from "@/lib/api/yky";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import {
    Signal,
    ShoppingCart,
    ShieldCheck,
    TrendingUp,
    MapPin,
    RefreshCw,
    Eye,
    ChevronRight,
    Star,
    Zap,
    Phone,
    Clock,
    Wifi,
    Sparkles,
    LayoutGrid,
} from "lucide-react";
import ClaimTicker from "@/components/ClaimTicker";

/* ========== Props 类型 ========== */

interface YkyContentProps {
    products: YkyProductWithMeta[];
    error: string | null;
}

/* ========== 筛选选项常量 ========== */

/** 运营商筛选选项 */
const OPERATOR_OPTIONS = [
    { key: "all", label: "全部运营商" },
    ...(["mobile", "telecom", "unicom", "broadcast"] as YkyOperator[]).map((k) => ({
        key: k,
        label: YKY_OPERATOR_LABEL[k],
    })),
];

/** 套餐时长筛选选项 */
const DURATION_OPTIONS = [
    { key: "all", label: "全部时长" },
    { key: "长期", label: "长期" },
    { key: "2年", label: "2年" },
    { key: "1年", label: "1年" },
    { key: "6个月", label: "6个月" },
    { key: "短期", label: "短期" },
];

/** 商品分类筛选选项（对应 API category 字段） */
const CATEGORY_OPTIONS = [
    { key: "all", label: "全部分类", icon: LayoutGrid },
    { key: "dataCard", label: "大流量卡", icon: Signal },
    { key: "fancyNumber", label: "全国靓号", icon: Sparkles },
    { key: "broadband", label: "宽带办理", icon: Wifi },
];

/* ========== 页面顶栏优势 ========== */

/** 页面顶部平台优势介绍 */
function AdvantagesSection() {
    const items = [
        {
            icon: ShieldCheck,
            title: "正规渠道直供",
            desc: "直连运营商渠道，确保卡品质量和稳定性",
        },
        {
            icon: TrendingUp,
            title: "多模式返佣",
            desc: "支持日结秒返/次月返佣/月月返佣，灵活结算",
        },
        {
            icon: MapPin,
            title: "全国多地覆盖",
            desc: "覆盖全国各省市，满足不同地区用户需求",
        },
        {
            icon: ShieldCheck,
            title: "数据不扣量",
            desc: "订单数据实时同步，确保数据准确无误",
        },
    ];

    return (
        <section className={containerClass("pt-6")} style={SITE_WIDTH_STYLE}>
            <h3 className="mb-3 text-base font-medium text-gray-800 sm:mb-4 sm:text-lg">
                翼卡云号卡平台优势
            </h3>
            {/* 移动端双排，桌面端四列 */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {items.map((item) => (
                    <div
                        key={item.title}
                        className="rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                    >
                        <div className="mb-1.5 flex items-center gap-2 text-blue-600 sm:mb-2">
                            <item.icon className="size-4 shrink-0 sm:size-5" />
                            <span className="text-sm font-semibold text-gray-800 sm:text-base">
                                {item.title}
                            </span>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-400 sm:text-sm sm:text-gray-500">
                            {item.desc}
                        </p>
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
    options: { key: string; label: string; icon?: React.ElementType }[];
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
                // 数量为 0 且不是"全部"选项时隐藏
                if (count !== undefined && count === 0 && opt.key !== "all") return null;
                const Icon = opt.icon;

                return (
                    <button
                        key={opt.key}
                        onClick={() => onChange(opt.key)}
                        className={`inline-flex items-center gap-1.5 rounded-md border px-3.5 py-1.5 text-xs transition-all duration-300 ${isActive
                            ? "border-blue-600 bg-blue-600 font-medium text-white shadow-sm shadow-blue-600/20"
                            : "border-transparent bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                            }`}
                    >
                        {Icon && <Icon className="size-3.5 shrink-0" />}
                        {opt.label}
                        {count !== undefined && (
                            <span
                                className={`text-[11px] ${isActive ? "text-white/80" : "text-gray-400"}`}
                            >
                                ({count})
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/** 筛选面板 */
function FilterBar({
    activeCategory,
    onCategoryChange,
    activeOperator,
    onOperatorChange,
    activeRegion,
    onRegionChange,
    activeDuration,
    onDurationChange,
    categoryCounts,
    operatorCounts,
    regionCounts,
    durationCounts,
    regionOptions,
}: {
    activeCategory: string;
    onCategoryChange: (k: string) => void;
    activeOperator: string;
    onOperatorChange: (k: string) => void;
    activeRegion: string;
    onRegionChange: (k: string) => void;
    activeDuration: string;
    onDurationChange: (k: string) => void;
    categoryCounts: Record<string, number>;
    operatorCounts: Record<string, number>;
    regionCounts: Record<string, number>;
    durationCounts: Record<string, number>;
    regionOptions: { key: string; label: string }[];
}) {
    return (
        <div className={containerClass("py-4")} style={SITE_WIDTH_STYLE}>
            <div className="rounded-xl bg-white p-5 shadow-sm">
                {/* 商品分类（大流量卡/全国靓号/宽带办理） */}
                <FilterRow
                    label="商品分类"
                    options={CATEGORY_OPTIONS}
                    activeKey={activeCategory}
                    onChange={onCategoryChange}
                    counts={categoryCounts}
                />
                <div className="border-t border-gray-50" />
                {/* 运营商筛选 */}
                <FilterRow
                    label="运营商"
                    options={OPERATOR_OPTIONS}
                    activeKey={activeOperator}
                    onChange={onOperatorChange}
                    counts={operatorCounts}
                />
                <div className="border-t border-gray-50" />
                {/* 地区筛选（全国 + 动态省份） */}
                <FilterRow
                    label="地区"
                    options={regionOptions}
                    activeKey={activeRegion}
                    onChange={onRegionChange}
                    counts={regionCounts}
                />
                <div className="border-t border-gray-50" />
                {/* 套餐时长筛选 */}
                <FilterRow
                    label="套餐时长"
                    options={DURATION_OPTIONS}
                    activeKey={activeDuration}
                    onChange={onDurationChange}
                    counts={durationCounts}
                />
            </div>
        </div>
    );
}

/* ========== 运营商配色 ========== */

const OPERATOR_OVERLAY: Record<string, string> = {
    mobile: "bg-green-500/80 text-white",
    telecom: "bg-blue-500/80 text-white",
    unicom: "bg-orange-500/80 text-white",
    broadcast: "bg-purple-500/80 text-white",
    unknown: "bg-gray-500/80 text-white",
};

/* ========== 规格参数标签 ========== */

/**
 * 规格参数标签
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
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${colorClass}`}
        >
            <Icon className="size-3.5 shrink-0" />
            <span>{value}</span>
        </span>
    );
}

/* ========== 商品卡片 ========== */

/** 翼卡云商品卡片 */
function YkyProductCard({ product }: { product: YkyProductWithMeta }) {
    const overlayClass =
        OPERATOR_OVERLAY[product._operator] || OPERATOR_OVERLAY.unknown;
    const operatorLabel = YKY_OPERATOR_LABEL[product._operator];
    // 使用优惠月租作为展示价格
    const displayPrice = product.favourMonthFee || product.monthFee;

    return (
        <div className="group relative mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-600/20 hover:shadow-lg hover:shadow-blue-600/5">
            {/* 商品图片区域 */}
            <Link href={`/yky/${product.id}`} className="block">
                <div className="relative overflow-hidden bg-gray-100 p-2">
                    {product.tips ? (
                        <div className="relative aspect-square overflow-hidden rounded-lg">
                            <Image
                                src={product.tips}
                                alt={product.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 768px) 50vw, 25vw"
                            />
                        </div>
                    ) : (
                        <div className="aspect-square rounded-lg bg-linear-to-br from-gray-50 to-gray-100" />
                    )}

                    {/* 运营商标签（左上角毛玻璃） */}
                    <div
                        className={`absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs backdrop-blur-sm ${overlayClass}`}
                    >
                        <Signal className="size-3" />
                        <span className="font-medium">{operatorLabel}</span>
                    </div>

                    {/* 推荐星级（右上角） */}
                    {product.star >= 4 && (
                        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                            <Star className="size-3 fill-white" />
                            {product.star}星
                        </span>
                    )}
                </div>
            </Link>

            {/* 内容区域 */}
            <div className="flex flex-col p-4">
                <Link href={`/yky/${product.id}`} className="flex-1">
                    {/* 套餐名称 */}
                    <h3 className="mb-3 line-clamp-2 text-sm font-bold leading-snug text-gray-800">
                        {product.name}
                    </h3>

                    {/* 规格参数标签 */}
                    <div className="mb-3 h-[52px] overflow-hidden">
                        <div className="flex flex-wrap gap-1.5">
                            {product.commonFlow > 0 && (
                                <SpecTag
                                    icon={Zap}
                                    value={`${product.commonFlow}GB通用`}
                                    colorClass="bg-blue-50 text-blue-600"
                                />
                            )}
                            {product.fixedFlow > 0 && (
                                <SpecTag
                                    icon={Zap}
                                    value={`${product.fixedFlow}GB定向`}
                                    colorClass="bg-indigo-50 text-indigo-600"
                                />
                            )}
                            {product.callDuration > 0 && (
                                <SpecTag
                                    icon={Phone}
                                    value={`${product.callDuration}分钟`}
                                    colorClass="bg-green-50 text-green-600"
                                />
                            )}
                            <SpecTag
                                icon={Clock}
                                value={product._duration}
                                colorClass="bg-orange-50 text-orange-600"
                            />
                        </div>
                    </div>

                    {/* 商品描述 */}
                    {product.des && (
                        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-400">
                            {product.des}
                        </p>
                    )}
                </Link>

                {/* 分隔线 */}
                <div className="mb-3 border-t border-gray-100" />

                {/* 价格 + 操作按钮 */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex shrink-0 items-baseline gap-1">
                        <span className="text-lg font-extrabold text-blue-600">
                            ¥{displayPrice}
                        </span>
                        <span className="text-xs text-gray-400">/月</span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                        <Link
                            href={`/yky/${product.id}`}
                            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700 transition-colors hover:border-blue-600/30 hover:text-blue-600"
                        >
                            <Eye className="size-4" />
                            查看详情
                        </Link>
                        <a
                            href={product._orderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-normal text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
                        >
                            立即办理
                            <ChevronRight className="size-4" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ========== 商品网格 ========== */

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

/** 商品网格组件（带无限滚动分页） */
function ProductGrid({
    products,
    activeCategory,
    activeOperator,
    activeRegion,
    activeDuration,
}: {
    products: YkyProductWithMeta[];
    activeCategory: string;
    activeOperator: string;
    activeRegion: string;
    activeDuration: string;
}) {
    /* ===== 筛选逻辑（4个维度） ===== */
    const filtered = useMemo(() => {
        return products.filter((p) => {
            // 商品分类筛选
            if (activeCategory !== "all" && p._category !== activeCategory) return false;
            // 运营商筛选
            if (activeOperator !== "all" && p._operator !== activeOperator) return false;
            // 地区筛选："all"=不过滤, "全国"=空region, 其他=匹配省份名
            if (activeRegion !== "all") {
                if (activeRegion === "全国" && p._region !== "") return false;
                if (activeRegion !== "全国" && p._region !== activeRegion) return false;
            }
            // 套餐时长筛选
            if (activeDuration !== "all" && p._duration !== activeDuration) return false;
            return true;
        });
    }, [products, activeCategory, activeOperator, activeRegion, activeDuration]);

    /* ===== 分页状态 ===== */
    const filterKey = `${activeCategory}-${activeOperator}-${activeRegion}-${activeDuration}`;
    const [visibleCount, dispatchVisible] = useReducer(visibleReducer, PAGE_SIZE);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // 筛选条件变化时重置分页
    useEffect(() => {
        dispatchVisible({ type: "reset" });
    }, [filterKey]);

    const displayed = filtered.slice(0, visibleCount);
    const hasMore = displayed.length < filtered.length;

    /* ===== 无限滚动 ===== */
    const loadMore = useCallback(() => {
        dispatchVisible({ type: "loadMore", maxCount: filtered.length });
    }, [filtered.length]);

    useEffect(() => {
        if (!hasMore) return;
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) loadMore();
            },
            { rootMargin: "200px" },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    /* ===== 空态 ===== */
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {displayed.map((product) => (
                    <YkyProductCard key={product.id} product={product} />
                ))}
            </div>

            {/* ===== 分页信息栏 ===== */}
            <div className="mt-8">
                {/* 进度条 */}
                <div className="mx-auto mb-4 h-1.5 max-w-xs overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                        className="h-full rounded-full bg-linear-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out dark:from-blue-400 dark:to-blue-500"
                        style={{ width: `${Math.round((displayed.length / filtered.length) * 100)}%` }}
                    />
                </div>

                {hasMore && (
                    <div className="flex flex-col items-center gap-3">
                        {/* 加载状态文字 */}
                        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                            已展示
                            <span className="mx-1 font-semibold text-gray-600 dark:text-gray-300">{displayed.length}</span>
                            件，共
                            <span className="mx-1 font-semibold text-gray-600 dark:text-gray-300">{filtered.length}</span>
                            件
                        </p>
                        {/* 哨兵 + 加载更多按钮 */}
                        <div ref={sentinelRef} className="h-1 w-full" />
                        <button
                            type="button"
                            onClick={loadMore}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:border-blue-500/30 dark:hover:text-blue-400"
                        >
                            <RefreshCw className="size-4" />
                            加载更多（剩余 {filtered.length - displayed.length} 件）
                        </button>
                    </div>
                )}

                {!hasMore && filtered.length > 0 && (
                    <div className="mx-auto mt-3 flex max-w-xs items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 shadow-sm dark:bg-blue-700">
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

/* ========== 统计计数器 ========== */

/**
 * 计算各维度筛选选项的商品数量
 * @param products - 商品列表
 */
function useFilterCounts(products: YkyProductWithMeta[]) {
    return useMemo(() => {
        const categoryCounts: Record<string, number> = { all: products.length };
        const operatorCounts: Record<string, number> = { all: products.length };
        const regionCounts: Record<string, number> = { all: products.length };
        const durationCounts: Record<string, number> = { all: products.length };

        for (const p of products) {
            /* 分类计数 */
            categoryCounts[p._category] = (categoryCounts[p._category] || 0) + 1;
            /* 运营商计数 */
            operatorCounts[p._operator] = (operatorCounts[p._operator] || 0) + 1;
            /* 地区计数：空字符串归类为"全国" */
            const regionKey = p._region || "全国";
            regionCounts[regionKey] = (regionCounts[regionKey] || 0) + 1;
            /* 时长计数 */
            durationCounts[p._duration] = (durationCounts[p._duration] || 0) + 1;
        }

        return { categoryCounts, operatorCounts, regionCounts, durationCounts };
    }, [products]);
}

/**
 * 从商品列表中动态提取地区选项（按商品数降序）
 * @param products - 商品列表
 */
function useRegionOptions(products: YkyProductWithMeta[]) {
    return useMemo(() => {
        const regionMap: Record<string, number> = {};
        for (const p of products) {
            const key = p._region || "全国";
            regionMap[key] = (regionMap[key] || 0) + 1;
        }
        // 构建选项列表：全部 + 全国可发 + 各省份（按数量降序）
        const options: { key: string; label: string }[] = [
            { key: "all", label: "全部地区" },
        ];
        // 全国可发放入首位
        if (regionMap["全国"]) {
            options.push({ key: "全国", label: "全国可发" });
        }
        // 各省份按数量降序排列
        const provinces = Object.entries(regionMap)
            .filter(([key]) => key !== "全国")
            .sort((a, b) => b[1] - a[1])
            .map(([key]) => ({ key, label: key }));
        options.push(...provinces);
        return options;
    }, [products]);
}

/* ========== 底部 CTA ========== */

/** 底部引导区 */
function CtaSection() {
    return (
        <section className="bg-linear-to-r from-blue-600 to-blue-700 py-14">
            <div className="mx-auto max-w-2xl px-4 text-center">
                <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
                    立即申请，免费包邮到家！
                </h2>
                <p className="mb-6 text-sm text-blue-100 sm:text-base">
                    正规渠道、多种返佣模式，零风险体验
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <a
                        href="https://iot.87haoka.cn/s/TpImx3gi"
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
                        返回首页
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ========== 错误状态 ========== */

/** API 错误展示区块 */
function ErrorBanner({ error }: { error: string }) {
    return (
        <div className={containerClass("py-4")} style={SITE_WIDTH_STYLE}>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                <span className="font-semibold">数据加载失败：</span>
                {error}
            </div>
        </div>
    );
}

/* ========== 页面主体 ========== */

/** 翼卡云商品列表页主组件 */
export default function YkyContent({ products, error }: YkyContentProps) {
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeOperator, setActiveOperator] = useState("all");
    const [activeRegion, setActiveRegion] = useState("all");
    const [activeDuration, setActiveDuration] = useState("all");

    const { categoryCounts, operatorCounts, regionCounts, durationCounts } =
        useFilterCounts(products);
    const regionOptions = useRegionOptions(products);

    return (
        <div className="flex min-h-svh flex-col bg-[#f5f7fa]">
            <Header />

            {/* ===== 页面 Banner ===== */}
            <section className="bg-linear-to-br from-blue-600 via-blue-700 to-indigo-700 py-8 sm:py-12">
                <div className={containerClass()} style={SITE_WIDTH_STYLE}>
                    <div className="flex items-center gap-3">
                        <Signal className="size-6 shrink-0 text-blue-200 sm:size-8" />
                        <div>
                            <h1 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                                翼卡云大流量卡套餐大全
                            </h1>
                            <p className="mt-1 text-xs text-blue-100 sm:text-sm">
                                正规渠道直供 · 多模式返佣 · 全国包邮 · 共 {products.length} 款在售套餐
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <main className="flex-1">
                {/* 平台优势 */}
                <AdvantagesSection />
                <ClaimTicker />

                {/* 错误提示 */}
                {error && <ErrorBanner error={error} />}

                {/* 筛选栏 */}
                <FilterBar
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    activeOperator={activeOperator}
                    onOperatorChange={setActiveOperator}
                    activeRegion={activeRegion}
                    onRegionChange={setActiveRegion}
                    activeDuration={activeDuration}
                    onDurationChange={setActiveDuration}
                    categoryCounts={categoryCounts}
                    operatorCounts={operatorCounts}
                    regionCounts={regionCounts}
                    durationCounts={durationCounts}
                    regionOptions={regionOptions}
                />

                {/* 商品网格 */}
                <div className={containerClass("pb-10")} style={SITE_WIDTH_STYLE}>
                    <ProductGrid
                        products={products}
                        activeCategory={activeCategory}
                        activeOperator={activeOperator}
                        activeRegion={activeRegion}
                        activeDuration={activeDuration}
                    />
                </div>
            </main>

            {/* 底部 CTA */}
            <CtaSection />
            <Footer />
        </div>
    );
}
