/**
 * 卡易号卡平台商品展示页面客户端组件
 *
 * 路由：/kayi
 * 使用服务端预计算元数据（_provider / _price / _flow / _tags），
 * 避免客户端重复解析字符串，提升筛选和渲染性能。
 *
 * 数据来源：卡易号卡平台 API /openapi/goods/list
 */

"use client";

import { useState, useMemo, useRef, useEffect, useCallback, useReducer } from "react";
import Link from "next/link";
import type {
    KayiProductWithMeta,
    KayiOperator,
} from "@/lib/api/kayi";
import { KAYI_OPERATOR_LABEL, KAYI_SHOP_URL } from "@/lib/api/kayi";
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

interface KayiContentProps {
    products: KayiProductWithMeta[];
    error: string | null;
}

/** 商品携带的筛选维度（从预计算字段读取） */
interface ProductMeta {
    provider: KayiOperator;
    price: number;
    flow: number;
}

/* ========== 筛选选项常量 ========== */

const OPERATOR_OPTIONS = [
    { key: "all" as const, label: "全部运营商" },
    ...(["mobile", "telecom", "unicom", "broadcast"] as KayiOperator[]).map((k) => ({
        key: k,
        label: KAYI_OPERATOR_LABEL[k],
    })),
];

const PRICE_TIERS = [
    { key: "all", label: "全部月租" },
    { key: "lt30", label: "≤29元" },
    { key: "30to60", label: "30-59元" },
    { key: "gte60", label: "≥60元" },
];

const FLOW_TIERS = [
    { key: "all", label: "全部流量" },
    { key: "gte100", label: "≥100G" },
    { key: "gte200", label: "≥200G" },
    { key: "gte300", label: "≥300G" },
];

/* ========== 运营商配色（卡片左上角白底标签） ========== */

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

/** 卡易平台优势展示区 */
function AdvantagesSection() {
    const items = [
        { icon: ShieldCheck, title: "正规运营商渠道", desc: "直连运营商官方渠道，确保卡品质量和稳定性" },
        { icon: TrendingUp, title: "高额返佣", desc: "达标佣金丰厚，部分商品支持秒返/日结" },
        { icon: MapPin, title: "覆盖全国各省", desc: "商品覆盖全国各省市，满足不同地区用户需求" },
        { icon: ShoppingCart, title: "支持选号办理", desc: "部分商品支持自主选号，用户体验更优" },
    ];

    return (
        <section className={containerClass("pt-6")} style={SITE_WIDTH_STYLE}>
            <h3 className="mb-3 text-base font-medium text-gray-800 sm:mb-4 sm:text-lg">卡易号卡平台优势</h3>
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
        <div className="py-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:py-2">
            {/* 维度标题：移动端独立成行，sm 起与选项同排 */}
            <span className="relative mb-1.5 flex items-center pl-2.5 text-xs font-medium text-gray-600 before:absolute before:left-0 before:top-1/2 before:h-3 before:w-[3px] before:-translate-y-1/2 before:rounded-sm before:bg-blue-600 sm:mr-1 sm:mb-0 sm:pl-3 sm:text-sm sm:before:h-3.5">
                {label}
            </span>

            {/* 选项：移动端横向滚动不换行（隐藏滚动条），sm 起自动换行 */}
            <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
                {options.map((opt) => {
                    const isActive = activeKey === opt.key;
                    const count = counts?.[opt.key];
                    if (count !== undefined && count === 0 && opt.key !== "all") return null;

                    return (
                        <button
                            key={opt.key}
                            onClick={() => onChange(opt.key)}
                            className={`shrink-0 rounded-full border px-3 py-1 text-[11px] whitespace-nowrap transition-all duration-300 sm:rounded-md sm:px-3.5 sm:py-1.5 sm:text-xs ${isActive
                                ? "border-blue-600 bg-blue-600 font-medium text-white shadow-sm shadow-blue-600/20"
                                : "border-transparent bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                                }`}
                        >
                            {opt.label}
                            {count !== undefined && (
                                <span className={`ml-1 text-[10px] sm:text-[11px] ${isActive ? "text-white/80" : "text-gray-400"}`}>
                                    ({count})
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/** 卡易筛选栏（运营商 / 月租 / 流量） */
function FilterBar({
    activeOperator,
    onOperatorChange,
    activePrice,
    onPriceChange,
    activeFlow,
    onFlowChange,
    operatorCounts,
    priceCounts,
    flowCounts,
}: {
    activeOperator: string;
    onOperatorChange: (k: string) => void;
    activePrice: string;
    onPriceChange: (k: string) => void;
    activeFlow: string;
    onFlowChange: (k: string) => void;
    operatorCounts: Record<string, number>;
    priceCounts: Record<string, number>;
    flowCounts: Record<string, number>;
}) {
    return (
        <div className={containerClass("py-4")} style={SITE_WIDTH_STYLE}>
            <div className="rounded-xl bg-white p-3 shadow-sm sm:p-5">
                <FilterRow
                    label="运营商"
                    options={OPERATOR_OPTIONS}
                    activeKey={activeOperator}
                    onChange={onOperatorChange}
                    counts={operatorCounts}
                />
                <div className="border-t border-gray-100 sm:border-gray-50" />
                <FilterRow
                    label="月租"
                    options={PRICE_TIERS}
                    activeKey={activePrice}
                    onChange={onPriceChange}
                    counts={priceCounts}
                />
                <div className="border-t border-gray-100 sm:border-gray-50" />
                <FilterRow
                    label="流量"
                    options={FLOW_TIERS}
                    activeKey={activeFlow}
                    onChange={onFlowChange}
                    counts={flowCounts}
                />
            </div>
        </div>
    );
}

/* ========== 商品卡片 ========== */

/**
 * 规格参数单元
 *
 * 数值与单位分离排版：数值大号加粗、单位小号弱化，视觉重心落在数字上。
 */
function SpecCell({
    value,
    unit,
    label,
    valueClass,
}: {
    value: string;
    unit?: string;
    label: string;
    valueClass: string;
}) {
    return (
        <div className="flex min-w-0 flex-col items-center justify-center">
            <span className="flex items-baseline gap-px whitespace-nowrap">
                <span className={`text-[15px] leading-none font-bold tabular-nums sm:text-lg lg:text-xl ${valueClass}`}>
                    {value}
                </span>
                {unit && (
                    <span className={`text-[9px] leading-none font-semibold sm:text-[10px] ${valueClass} opacity-70`}>
                        {unit}
                    </span>
                )}
            </span>
            <span className="mt-1 text-[9px] leading-none whitespace-nowrap text-gray-400 sm:text-[10px]">
                {label}
            </span>
        </div>
    );
}

/** 规格项数据结构 */
interface SpecItem {
    value: string;
    unit?: string;
    label: string;
    valueClass: string;
}

/**
 * 从 tagsSelect 提取年龄要求
 *
 * 列表接口不返回 limitRule，`_ageLimit` 恒为空；实测 tagsSelect 中
 * 年龄标签（如 "18-65周岁"）覆盖率 100%，是列表页唯一的年龄来源。
 */
function extractAgeLimit(product: KayiProductWithMeta): string {
    const fromTag = (product.tagsSelect ?? [])
        .map((t) => t.label ?? "")
        .find((l) => /\d+\s*-\s*\d+\s*周岁/.test(l));
    if (fromTag) return fromTag.replace(/周岁/, "岁");
    return product._ageLimit || "";
}

/** 判断是否为平台主推商品（tagsSelect 含「主推」标签，实测 8/69） */
function isFeatured(product: KayiProductWithMeta): boolean {
    return (product.tagsSelect ?? []).some((t) => t.label === "主推");
}

/**
 * 从商品名提取发货地域限制
 *
 * 卡易将地域限制写在名称尾部，如「福建电信专属卡【49元220G+480分钟】仅发厦门 福州」。
 */
function extractShippingScope(name: string): { title: string; scope: string } {
    const match = name.match(/(仅发|限发)\s*([^【】]+)$/);
    if (match) {
        return {
            title: name.slice(0, match.index).trim(),
            scope: `${match[1]}${match[2].trim().replace(/\s+/g, "、")}`,
        };
    }
    return { title: name, scope: "" };
}

/** 销量格式化：11980 → "1.2万" */
function formatSales(sales: number): string {
    if (sales >= 10000) return `${(sales / 10000).toFixed(1)}万`;
    if (sales >= 1000) return `${(sales / 1000).toFixed(1)}千`;
    return String(sales);
}

/** 特色标签配色 */
const TAG_VARIANT_STYLES: Record<FeatureTag["variant"], string> = {
    red: "border-red-200 bg-red-50 text-red-600",
    orange: "border-orange-200 bg-orange-50 text-orange-600",
    green: "border-emerald-200 bg-emerald-50 text-emerald-600",
    blue: "border-blue-200 bg-blue-50 text-blue-600",
    purple: "border-purple-200 bg-purple-50 text-purple-600",
    gray: "border-gray-200 bg-gray-50 text-gray-600",
};

/** 特色标签数据结构 */
interface FeatureTag {
    text: string;
    variant: "red" | "orange" | "green" | "blue" | "purple" | "gray";
}

/**
 * 综合 API 字段提取特色标签
 *
 * 来源：
 * - 结算模式（settleMode=1/4 → 秒返/日结）
 * - 上传照片（uploadPhoto=0 → 免上传照片）
 * - 流量/语音/价格特征
 * - 地域限制（scope → 本地专属）
 * - 销量（≥1000 → 热销）
 * - tagsSelect 原始标签（排除年龄、主推）
 */
function extractFeatureTags(product: KayiProductWithMeta): FeatureTag[] {
    const tags: FeatureTag[] = [];
    const price = Number(product._price) || 0;
    const commonFlow = product.commonFlow || 0;
    const fixedFlow = product.fixedFlow || 0;
    const callDuration = product.callDuration || 0;
    const sales = product.sales || 0;
    const { scope } = extractShippingScope(product.name);

    // 结算优势
    if (product.settleMode === 1 || product.settleMode === 4) {
        tags.push({ text: product._settleModeLabel || "秒返", variant: "red" });
    }
    // 便利性
    if (Number(product.uploadPhoto) === 0) {
        tags.push({ text: "免上传照片", variant: "green" });
    }
    // 流量
    const totalFlow = commonFlow + fixedFlow;
    if (totalFlow >= 300) {
        tags.push({ text: "超大流量", variant: "purple" });
    } else if (totalFlow >= 150) {
        tags.push({ text: "大额流量", variant: "blue" });
    } else if (totalFlow >= 60) {
        tags.push({ text: "大流量", variant: "blue" });
    }
    // 定向流量
    if (fixedFlow > 0) {
        tags.push({ text: "含定向流量", variant: "purple" });
    }
    // 语音
    if (callDuration >= 200) {
        tags.push({ text: "长语音", variant: "orange" });
    }
    // 价格
    if (price > 0 && price <= 39) {
        tags.push({ text: "低月租", variant: "green" });
    }
    // 地域
    if (scope) {
        tags.push({ text: "本地专属", variant: "orange" });
    }
    // 销量
    if (sales >= 500) {
        tags.push({ text: "热销", variant: "red" });
    }

    // tagsSelect 原始标签（排除年龄、主推）
    (product.tagsSelect ?? [])
        .map((t) => t.label)
        .filter((l) => l && !/\d+\s*-\s*\d+\s*周岁/.test(l) && l !== "主推")
        .forEach((l) => {
            if (!tags.some((t) => t.text === l)) {
                tags.push({ text: l, variant: "gray" });
            }
        });

    return tags.slice(0, 6);
}

/**
 * 卡易商品卡片
 *
 * 参考 DuoduoProductDetail.astro 右侧布局节奏：
 * 标题/销量 → 套餐描述 → 4 列参数条 → 标签行（条件+特色合并） → 底部双按钮
 */
function KayiProductCard({ product, index }: { product: KayiProductWithMeta; index: number }) {
    const op = OPERATOR_CARD_STYLE[product._provider] || OPERATOR_CARD_STYLE.unknown;
    const OpIcon = op.icon;

    const price = product._price || "?";
    const { title, scope } = extractShippingScope(product.name.replace(/^\d+-/, ""));
    const ageLimit = extractAgeLimit(product);
    const featured = isFeatured(product);
    const detailHref = `/kayi/${product.id}`;
    const featureTags = extractFeatureTags(product);

    /* 蓝色套餐描述 */
    const planDesc = `月租¥${price} · ${product.commonFlow || 0}G通用${(product.fixedFlow || 0) > 0 ? `+${product.fixedFlow}G定向` : ""}${(product.callDuration || 0) > 0 ? ` · ${product.callDuration}分钟通话` : ""}`;

    /* 4 列固定参数 */
    const specData: SpecItem[] = [
        { value: price, label: "月租", valueClass: "text-red-500" },
        { value: String(product.commonFlow || 0), unit: "G", label: "通用流量", valueClass: "text-gray-900" },
        { value: String(product.fixedFlow || 0), unit: "G", label: "定向流量", valueClass: "text-gray-900" },
        { value: String(product.callDuration || 0), unit: "分钟", label: "通话分钟", valueClass: "text-gray-900" },
    ];

    return (
        <article className="group relative flex flex-row overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            {/* ===== 左区：商品图 ===== */}
            <Link
                href={detailHref}
                className="relative block w-[35%] shrink-0 bg-white p-2 sm:w-5/12 sm:p-3 lg:w-2/5 lg:bg-linear-to-br lg:from-gray-50 lg:to-gray-100"
            >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-100">
                    {product.tips ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={product.tips}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
                            <Signal className="size-6 text-gray-300" />
                        </div>
                    )}
                </div>

                {/* 热销/主推角标：图片左上角 */}
                {(featured || index < 3) && (
                    <span
                        className={`absolute left-2 top-2 z-10 inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[9px] font-bold text-white shadow-md sm:left-3 sm:top-3 sm:text-[10px] ${
                            featured ? "bg-linear-to-r from-orange-500 to-red-500" : "bg-red-500"
                        }`}
                    >
                        <Flame className="size-2.5" />
                        {featured ? "主推" : "热销"}
                    </span>
                )}

                {/* 运营商角标：图片右上角 */}
                <span
                    className={`absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[10px] font-semibold shadow-sm sm:right-3 sm:top-3 ${op.text} ${op.border} ${op.bg}`}
                >
                    <OpIcon className="size-3" />
                    {op.label}
                </span>
            </Link>

            {/* ===== 右区：套餐信息 ===== */}
            <div className="flex min-w-0 flex-1 flex-col p-3 lg:p-4">
                {/* 标题 + 销量 */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-[13px] font-bold leading-tight text-gray-900 sm:text-sm lg:text-base">
                        <Link href={detailHref} className="transition-colors hover:text-blue-600">
                            {title}
                        </Link>
                    </h3>
                    {product.sales > 0 && (
                        <span className="shrink-0 text-[10px] whitespace-nowrap text-gray-400">
                            已售 {formatSales(product.sales)}
                        </span>
                    )}
                </div>

                {/* 套餐描述 */}
                <p className="mt-1 line-clamp-1 text-[11px] font-medium text-blue-600 sm:text-xs">
                    {planDesc}
                </p>

                {/* 4 列参数条 */}
                <div className="mt-2.5 grid grid-cols-4 rounded-xl bg-gray-50 px-2 py-2.5 sm:py-3">
                    {specData.map((item) => (
                        <SpecCell
                            key={item.label}
                            value={item.value}
                            unit={item.unit}
                            label={item.label}
                            valueClass={item.valueClass}
                        />
                    ))}
                </div>

                {/* 标签行：办理条件 + 特色标签 合并为连续流 */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {ageLimit && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-[11px] font-medium text-green-600">
                            <ShieldCheck className="size-3" />
                            {ageLimit}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-[11px] font-medium text-orange-600">
                        <MapPin className="size-3" />
                        {scope || "快递配送"}
                    </span>
                    {featureTags.map((tag) => (
                        <span
                            key={tag.text}
                            className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium ${TAG_VARIANT_STYLES[tag.variant]}`}
                        >
                            {tag.text}
                        </span>
                    ))}
                </div>

                {/* 底部按钮：立即办理 + 查看详情 */}
                <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-2.5">
                    <a
                        href={product._orderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/cta inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 px-3 py-2 text-[11px] font-semibold text-white transition-all hover:shadow-md hover:shadow-blue-600/30 sm:text-xs"
                    >
                        立即办理
                        <ArrowRight className="size-3.5 transition-transform duration-300 group-hover/cta:translate-x-0.5" />
                    </a>
                    <Link
                        href={detailHref}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-[11px] font-semibold text-gray-700 transition-all hover:border-blue-300 hover:text-blue-600 sm:text-xs"
                    >
                        <FileText className="size-3.5" />
                        查看详情
                    </Link>
                </div>
            </div>
        </article>
    );
}

/* ========== 商品网格（分页加载） ========== */

/** 每页加载数量 */
const PAGE_SIZE = 12;

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

/** 卡易商品卡片网格（含筛选 + 无限滚动） */
function ProductGrid({
    products,
    activeOperator,
    activePrice,
    activeFlow,
}: {
    products: KayiProductWithMeta[];
    activeOperator: string;
    activePrice: string;
    activeFlow: string;
}) {
    /* ===== 筛选逻辑 ===== */
    const filtered = useMemo(() => {
        return products.filter((p) => {
            if (activeOperator !== "all" && p._provider !== activeOperator) return false;
            const price = Number(p._price) || 0;
            if (activePrice === "lt30" && !(price <= 29)) return false;
            if (activePrice === "30to60" && !(price >= 30 && price <= 59)) return false;
            if (activePrice === "gte60" && !(price >= 60)) return false;
            const flow = p.commonFlow || 0;
            if (activeFlow === "gte100" && !(flow >= 100)) return false;
            if (activeFlow === "gte200" && !(flow >= 200)) return false;
            if (activeFlow === "gte300" && !(flow >= 300)) return false;
            return true;
        });
    }, [products, activeOperator, activePrice, activeFlow]);

    /* ===== 分页状态 ===== */
    const filterKey = `${activeOperator}-${activePrice}-${activeFlow}`;
    const [visibleCount, dispatchVisible] = useReducer(visibleReducer, PAGE_SIZE);
    const sentinelRef = useRef<HTMLDivElement>(null);

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
            {/* 横向卡片网格（参考 KayiProductGrid.astro：移动端单列横卡，lg 起两列） */}
            <div className="grid items-start gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-5">
                {displayed.map((product, i) => (
                    <KayiProductCard key={product.id} product={product} index={i} />
                ))}
            </div>

            {/* ===== 分页信息栏 ===== */}
            <div className="mt-8">
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
function getProductMeta(product: KayiProductWithMeta): ProductMeta {
    return {
        provider: product._provider,
        price: Number(product._price) || 0,
        flow: product.commonFlow || 0,
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
                        href={KAYI_SHOP_URL}
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

export default function KayiContent({ products, error }: KayiContentProps) {
    const [activeOperator, setActiveOperator] = useState("all");
    const [activePrice, setActivePrice] = useState("all");
    const [activeFlow, setActiveFlow] = useState("all");

    /** 计算各维度统计数据 */
    const { operatorCounts, priceCounts, flowCounts } = useMemo(() => {
        const opCounts: Record<string, number> = {
            all: products.length,
            mobile: 0,
            telecom: 0,
            unicom: 0,
            broadcast: 0,
        };
        const prCounts: Record<string, number> = { all: products.length, lt30: 0, "30to60": 0, gte60: 0 };
        const flCounts: Record<string, number> = { all: products.length, gte100: 0, gte200: 0, gte300: 0 };

        products.forEach((p) => {
            const meta = getProductMeta(p);
            if (opCounts[meta.provider] !== undefined) opCounts[meta.provider]++;

            if (meta.price <= 29) prCounts.lt30++;
            else if (meta.price >= 30 && meta.price <= 59) prCounts["30to60"]++;
            else if (meta.price >= 60) prCounts.gte60++;

            if (meta.flow >= 100) flCounts.gte100++;
            if (meta.flow >= 200) flCounts.gte200++;
            if (meta.flow >= 300) flCounts.gte300++;
        });

        return { operatorCounts: opCounts, priceCounts: prCounts, flowCounts: flCounts };
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
                                卡易号卡平台大流量卡套餐大全
                            </h1>
                            <p className="mt-1 text-xs text-blue-100 sm:text-sm">
                                正规运营商渠道 · 高额返佣 · 全国包邮 · 共 {products.length} 款在售套餐
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
                    activePrice={activePrice}
                    onPriceChange={setActivePrice}
                    activeFlow={activeFlow}
                    onFlowChange={setActiveFlow}
                    operatorCounts={operatorCounts}
                    priceCounts={priceCounts}
                    flowCounts={flowCounts}
                />
                <section className={containerClass("pb-10")} style={SITE_WIDTH_STYLE}>
                    <ProductGrid
                        products={products}
                        activeOperator={activeOperator}
                        activePrice={activePrice}
                        activeFlow={activeFlow}
                    />
                </section>
                <CtaSection />
            </main>
            <Footer />
        </div>
    );
}
