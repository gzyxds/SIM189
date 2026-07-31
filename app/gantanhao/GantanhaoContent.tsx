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
import {
    Signal,
    ArrowRight,
    ShoppingCart,
    ShieldCheck,
    TrendingUp,
    MapPin,
    RefreshCw,
    FileText,
    Flame,
    Smartphone,
    SatelliteDish,
    Wifi,
    Radio,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

const OPERATOR_CARD_STYLE: Record<
    string,
    { label: string; text: string; border: string; bg: string; icon: LucideIcon }
> = {
    mobile: { label: "移动", text: "text-green-600", border: "border-green-200", bg: "bg-green-50", icon: Smartphone },
    telecom: { label: "电信", text: "text-blue-600", border: "border-blue-200", bg: "bg-blue-50", icon: SatelliteDish },
    unicom: { label: "联通", text: "text-orange-600", border: "border-orange-200", bg: "bg-orange-50", icon: Wifi },
    broadcast: { label: "广电", text: "text-purple-600", border: "border-purple-200", bg: "bg-purple-50", icon: Radio },
    unknown: { label: "其他", text: "text-gray-600", border: "border-gray-200", bg: "bg-gray-50", icon: Signal },
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

/* ========== 卡业联盟商品卡片（参考卡易卡片设计） ========== */

/** 特色标签渲染（按文本类型着色） */
function GantanhaoFeatureTags({
    tags,
    max = 4,
}: {
    tags: { text: string; className: string }[];
    max?: number;
}) {
    const displayTags = tags.slice(0, max);
    if (displayTags.length === 0) return null;

    /** 根据文本内容选择颜色 */
    const getColorByText = (text: string): string => {
        if (text.includes("流量")) return "bg-blue-50 text-blue-600 border-blue-200";
        if (text.includes("通话")) return "bg-orange-50 text-orange-600 border-orange-200";
        if (text.includes("定向")) return "bg-purple-50 text-purple-600 border-purple-200";
        if (text.includes("长期")) return "bg-green-50 text-green-600 border-green-200";
        if (text.includes("不限") || text.includes("全国")) return "bg-teal-50 text-teal-600 border-teal-200";
        if (text.includes("秒返")) return "bg-red-50 text-red-600 border-red-200";
        if (text.includes("选号")) return "bg-cyan-50 text-cyan-600 border-cyan-200";
        return "bg-gray-50 text-gray-600 border-gray-200";
    };

    return (
        <div className="flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
                <span
                    key={tag.text}
                    className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-medium ${getColorByText(tag.text)}`}
                >
                    {tag.text}
                </span>
            ))}
        </div>
    );
}

/**
 * 卡业联盟商品卡片（参考卡易号卡卡片设计）
 *
 * 移动端：紧凑布局（运营商角标 + 图左文右 + 四列参数条 + 操作栏）
 * PC 端：横向宽卡片（左图右内容 + 参数条 + 条件标签 + 特色标签 + 按钮）
 * 亮点：秒返/热销角标、运营商图标标签、发货率展示
 */
function GantanhaoProductCard({
    product,
    index,
}: {
    product: GantanhaoProductWithMeta;
    index: number;
}) {
    const op = OPERATOR_CARD_STYLE[product._provider] || OPERATOR_CARD_STYLE.unknown;
    const OpIcon = op.icon;

    const price = product._price?.replace("元", "") || "?";
    const flow = product._flow?.replace("G", "") || "0";
    const voiceMatch = product.subName.match(/(\d+)\s*分钟/);
    const voice = voiceMatch ? voiceMatch[1] : "按量";
    const deliveryRate = product.deliveryRate || 0;
    const isMiaoFan = product.rebateType === 2;
    const detailHref = `/gantanhao/${product.codeNumber}`;
    const title = product.name.replace(/^\d+-/, "");
    const hasImage = Boolean(product.img);

    /* 蓝色套餐描述 */
    const planDesc = `月租¥${price} · ${product._flow || "0"}通用${voice !== "按量" ? ` · ${voice}分钟通话` : ""}${product.deliveryMethod ? ` · ${product.deliveryMethod}包邮` : ""}`;

    /* 四列固定参数 */
    const specData: { value: string; unit: string; label: string; valueClass: string }[] = [
        { value: price, unit: "元", label: "月租", valueClass: "text-red-500" },
        { value: flow, unit: "G", label: "通用流量", valueClass: "text-gray-900" },
        { value: voice, unit: voice !== "按量" ? "分钟" : "", label: "通话", valueClass: "text-gray-900" },
        { value: String(deliveryRate), unit: "%", label: "发货率", valueClass: "text-gray-900" },
    ];

    return (
        <article className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            {/* ===== 移动端布局（<sm）：紧凑结构 ===== */}
            <div className="block sm:hidden">
                <div className="p-3">
                    {/* 运营商标签：右上角 */}
                    <span className={`absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${op.text} ${op.bg}`}>
                        <OpIcon className="h-3.5 w-3.5" />
                        {op.label}
                    </span>

                    {/* 秒返/热销角标：左上角 */}
                    {(isMiaoFan || index < 3) && (
                        <span className={`absolute left-3 top-3 z-10 rounded-md px-2 py-0.5 text-xs font-bold text-white ${isMiaoFan ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-red-500"}`}>
                            <Flame className="mr-1 inline-block h-3 w-3 fill-white" />
                            {isMiaoFan ? "秒返" : "热销"}
                        </span>
                    )}

                    {/* 图片 + 标题区 */}
                    <div className="flex gap-3">
                        <Link href={detailHref} className="relative h-[90px] w-[90px] shrink-0 overflow-hidden rounded-lg">
                            {hasImage && (
                                <img
                                    src={product.img}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            )}
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-gray-900 dark:text-gray-100">
                                <Link href={detailHref} className="hover:text-blue-600">
                                    {title}
                                </Link>
                            </h3>
                            <p className="mt-1 line-clamp-1 text-[13px] text-gray-600 dark:text-gray-400">
                                {planDesc}
                            </p>
                            {/* 特色标签 */}
                            <div className="mt-2">
                                <GantanhaoFeatureTags tags={product._tags} max={4} />
                            </div>
                        </div>
                    </div>

                    {/* 四列参数条 */}
                    <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800">
                        {specData.map((s) => (
                            <div key={s.label} className="flex flex-col items-center">
                                <span className={`text-sm font-bold ${s.valueClass}`}>
                                    {s.value}
                                    {s.unit && <span className="text-[10px] font-normal text-gray-400">{s.unit}</span>}
                                </span>
                                <span className="mt-0.5 text-[10px] text-gray-400">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* 操作栏 */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {product.ageLimit || "不限年龄"}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Link
                                href={detailHref}
                                className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-normal text-gray-500 hover:border-blue-300 hover:text-blue-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-blue-400 dark:hover:text-blue-400"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                查看详情
                            </Link>
                            <a
                                href={product._orderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-normal text-white hover:bg-blue-700 active:scale-95"
                            >
                                立即办理
                                <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* 底部分割线 */}
                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-[10px] text-gray-400 dark:border-gray-800">
                        <span>{product._location}</span>
                        {deliveryRate > 0 && (
                            <span className="flex items-center gap-1">
                                <RefreshCw className="h-3 w-3" />
                                发货率{deliveryRate}%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== PC 端布局（≥sm）：左右结构 ===== */}
            <div className="hidden sm:block">
                <div className="flex flex-row">
                    {/* 左侧图片区 */}
                    <div className="relative w-5/12 shrink-0 lg:w-2/5">
                        <Link href={detailHref} className="block bg-white p-3 dark:bg-gray-900">
                            <div className="relative h-full overflow-hidden rounded-lg">
                                {hasImage && (
                                    <img
                                        src={product.img}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                    />
                                )}
                            </div>
                        </Link>
                        {/* 秒返/热销角标 */}
                        {(isMiaoFan || index < 3) && (
                            <span className={`absolute left-3 top-3 z-10 rounded-md px-2 py-0.5 text-[10px] font-bold text-white ${isMiaoFan ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-red-500"}`}>
                                <Flame className="mr-1 inline-block h-3 w-3 fill-white" />
                                {isMiaoFan ? "秒返" : "热销"}
                            </span>
                        )}
                        {/* 运营商标签 */}
                        <span className={`absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${op.text} ${op.bg}`}>
                            <OpIcon className="h-3 w-3" />
                            {op.label}
                        </span>
                    </div>

                    {/* 右侧内容区 */}
                    <div className="flex flex-1 flex-col p-4 xl:p-5">
                        {/* 标题 + 发货率 */}
                        <div className="mb-2 flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 lg:text-base dark:text-gray-100">
                                <Link href={detailHref} className="hover:text-blue-600">
                                    {title}
                                </Link>
                            </h3>
                            {deliveryRate > 0 && (
                                <span className="shrink-0 whitespace-nowrap text-[10px] text-gray-400 lg:text-xs">
                                    发货率 {deliveryRate}%
                                </span>
                            )}
                        </div>

                        {/* 套餐描述 */}
                        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                            {planDesc}
                        </p>

                        {/* 四列参数条 */}
                        <div className="mb-3 grid grid-cols-4 gap-2 rounded-xl bg-gray-50 p-2.5 dark:bg-gray-800">
                            {specData.map((s) => (
                                <div key={s.label} className="flex flex-col items-center">
                                    <span className={`text-sm font-bold lg:text-base ${s.valueClass}`}>
                                        {s.value}
                                        {s.unit && <span className="text-[10px] font-normal text-gray-400">{s.unit}</span>}
                                    </span>
                                    <span className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{s.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* 条件标签 */}
                        <div className="mb-2 flex flex-wrap gap-1.5">
                            {product.ageLimit && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:bg-green-500/20 dark:text-green-300">
                                    <ShieldCheck className="h-3 w-3" />
                                    {product.ageLimit}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-600 dark:bg-orange-500/20 dark:text-orange-300">
                                <MapPin className="h-3 w-3" />
                                {product._location}
                            </span>
                            {product.isSelectNumber === 1 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300">
                                    可选号
                                </span>
                            )}
                        </div>

                        {/* 特色标签 */}
                        <div className="mb-3">
                            <GantanhaoFeatureTags tags={product._tags} max={8} />
                        </div>

                        {/* 底部按钮 */}
                        <div className="mt-auto flex items-center gap-2.5 border-t border-gray-100 pt-2.5 dark:border-gray-800">
                            <a
                                href={product._orderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-normal text-white transition-colors hover:bg-blue-700 lg:px-5 lg:py-2"
                            >
                                立即办理
                                <ArrowRight className="h-4 w-4" />
                            </a>
                            <Link
                                href={detailHref}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-700 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-blue-400 dark:hover:text-blue-400 lg:px-4 lg:py-2"
                            >
                                <FileText className="h-4 w-4" />
                                查看详情
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </article>
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
            <div className="grid items-start gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-5">
                {displayed.map((product, i) => (
                    <GantanhaoProductCard key={product.codeNumber} product={product} index={i} />
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
