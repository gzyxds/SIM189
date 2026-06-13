/**
 * 卡世界商品展示页面内容组件
 *
 * 使用服务端预计算元数据（_operator / _tags / _imageUrl），
 * 避免客户端重复解析，提升筛选和渲染性能。
 *
 * 支持运营商、归属地多维度筛选，自动分页加载。
 */

"use client";

import { useState, useMemo, useRef, useEffect, useCallback, useReducer } from "react";
import Link from "next/link";
import Image from "next/image";
import type { KsjProductWithMeta, KsjOperator } from "@/lib/api/ksj";
import { KSJ_OPERATOR_LABEL, getKsjApplyUrl } from "@/lib/api/ksj";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import {
    Signal,
    ArrowLeft,
    ShoppingCart,
    ShieldCheck,
    TrendingUp,
    MapPin,
    RefreshCw,
    Eye,
    ChevronRight,
    Truck,
    Zap,
    Phone,
} from "lucide-react";

/* ========== 类型定义 ========== */

interface KsjContentProps {
    products: KsjProductWithMeta[];
    error: string | null;
}

/* ========== 筛选选项常量 ========== */

const OPERATOR_OPTIONS = [
    { key: "all" as const, label: "全部运营商" },
    ...(["mobile", "telecom", "unicom", "broadcast"] as KsjOperator[]).map((k) => ({
        key: k,
        label: KSJ_OPERATOR_LABEL[k],
    })),
];

/** 激活方式筛选选项 */
const ACTIVATE_OPTIONS = [
    { key: "all", label: "不限" },
    { key: "自助激活", label: "自助激活" },
    { key: "上门激活", label: "上门激活" },
];

/**
 * 更多条件标签筛选
 * 基于商品字段的语义匹配，非数据库字段直接筛选
 */
const TAG_OPTIONS = [
    { key: "all", label: "推荐" },
    { key: "长期卡", label: "长期卡" },
    { key: "低月租", label: "低月租" },
    { key: "流量多", label: "流量多" },
    { key: "可选号", label: "可选号" },
    { key: "送通话", label: "送通话" },
    { key: "省内卡", label: "省内卡" },
];

/**
 * 标签匹配逻辑
 * @param p - 商品数据
 * @param tag - 标签 key
 * @returns 是否匹配
 */
function matchTag(p: KsjProductWithMeta, tag: string): boolean {
    switch (tag) {
        case "长期卡":
            return !!(
                p.package_contract_text?.includes("长期") ||
                p.package_contract_text?.includes("20年")
            );
        case "低月租": {
            const fee = parseInt(p.name.match(/(\d+)元/)?.[1] || "999");
            return fee <= 29;
        }
        case "流量多": {
            const flow = parseInt(p.package_composition?.match(/(\d+)G/)?.[1] || "0");
            return flow >= 150;
        }
        case "可选号":
            return !!(p.pools && p.pools.trim().length > 0);
        case "送通话":
            return p.package_composition?.includes("分钟") ?? false;
        case "省内卡":
            return !!(p.package_attribution && !p.package_attribution.includes("全国"));
        default:
            return true;
    }
}

/* ========== 页面顶部优势区 ========== */

function AdvantagesSection() {
    const items = [
        { icon: ShieldCheck, title: "正规号卡渠道", desc: "直连运营商系统，确保卡品质量和稳定性" },
        { icon: TrendingUp, title: "高额分销佣金", desc: "业内领先的佣金比例，助力合作伙伴收益最大化" },
        { icon: MapPin, title: "覆盖全国多省", desc: "多运营商、多地区卡品，满足不同用户需求" },
        { icon: Truck, title: "京东顺丰包邮", desc: "快速配送，1-3天送达，售后无忧" },
    ];

    return (
        <section className={containerClass("pt-6")} style={SITE_WIDTH_STYLE}>
            <h3 className="mb-3 text-base font-medium text-gray-800 sm:mb-4 sm:text-lg">卡世界号卡供应链优势</h3>
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

function FilterBar({
    activeOperator,
    onOperatorChange,
    activeLocation,
    onLocationChange,
    activeActivate,
    onActivateChange,
    activeTag,
    onTagChange,
    operatorCounts,
    locationOptions,
    locationCounts,
    activateCounts,
    tagCounts,
}: {
    activeOperator: string;
    onOperatorChange: (k: string) => void;
    activeLocation: string;
    onLocationChange: (k: string) => void;
    activeActivate: string;
    onActivateChange: (k: string) => void;
    activeTag: string;
    onTagChange: (k: string) => void;
    operatorCounts: Record<string, number>;
    locationOptions: { key: string; label: string }[];
    locationCounts: Record<string, number>;
    activateCounts: Record<string, number>;
    tagCounts: Record<string, number>;
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
                    label="激活方式"
                    options={ACTIVATE_OPTIONS}
                    activeKey={activeActivate}
                    onChange={onActivateChange}
                    counts={activateCounts}
                />
                <div className="border-t border-gray-50" />
                <FilterRow
                    label="更多条件"
                    options={TAG_OPTIONS}
                    activeKey={activeTag}
                    onChange={onTagChange}
                    counts={tagCounts}
                />
            </div>
        </div>
    );
}

/* ========== 运营商配色 ========== */

/** 运营商角标配色（毛玻璃风格） */
const OPERATOR_OVERLAY: Record<string, string> = {
    mobile: "bg-green-500/80 text-white",
    telecom: "bg-blue-500/80 text-white",
    unicom: "bg-orange-500/80 text-white",
    broadcast: "bg-purple-500/80 text-white",
    unknown: "bg-gray-500/80 text-white",
};

/* ========== 规格参数标签 ========== */

/**
 * 规格参数标签（带图标）
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

/* ========== 辅助文字标签（无图标，小号） ========== */

/**
 * 辅助文字标签
 * 用于展示合约期/配送/年龄等二级信息，比 SpecTag 更轻量
 */
function TextTag({
    value,
    colorClass,
}: {
    value: string;
    colorClass: string;
}) {
    return (
        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] leading-tight font-medium ${colorClass}`}>
            {value}
        </span>
    );
}

/* ========== 商品卡片 ========== */

/** 卡世界商品卡片 */
function KsjProductCard({ product }: { product: KsjProductWithMeta }) {
    const overlayClass =
        OPERATOR_OVERLAY[product._operator] || OPERATOR_OVERLAY.unknown;
    const operatorLabel = KSJ_OPERATOR_LABEL[product._operator];
    const price = product.name.match(/(\d+\.?\d*)元/)?.[1] || "?";

    /* 从套餐组成提取流量/通话信息 */
    const flowMatch = product.package_composition?.match(/(\d+)G/)?.[1];
    const voiceMatch = product.package_composition?.match(/(\d+)分钟/)?.[1];

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-600/20 hover:shadow-lg hover:shadow-blue-600/5 dark:border-gray-800 dark:bg-gray-900">
            {/* 商品图片区域 */}
            <Link href={`/ksj/${product.goods_id}`} className="block">
                <div className="relative overflow-hidden bg-gray-100 p-2 dark:bg-gray-800">
                    {product._imageUrl ? (
                        <div className="relative aspect-square overflow-hidden rounded-lg">
                            <Image
                                src={product._imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 768px) 50vw, 25vw"
                            />
                        </div>
                    ) : (
                        <div className="aspect-square rounded-lg bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50" />
                    )}

                    {/* 运营商标签（左上角毛玻璃） */}
                    <div
                        className={`absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs backdrop-blur-sm ${overlayClass}`}
                    >
                        <Signal className="size-3" />
                        <span className="font-medium">{operatorLabel}</span>
                    </div>
                </div>
            </Link>

            {/* ===== 内容区域（flex-1 确保底部按钮对齐） ===== */}
            <div className="flex flex-1 flex-col p-4 pt-3.5">
                {/* --- 一级：套餐名称 --- */}
                <h3 className="mb-2.5 line-clamp-2 text-sm font-bold leading-snug text-gray-900 dark:text-gray-100">
                    {product.name}
                </h3>

                {/* --- 核心数据：流量 / 通话 / 归属地 --- */}
                <div className="mb-2.5">
                    <div className="flex flex-wrap gap-1.5">
                        {flowMatch && (
                            <SpecTag
                                icon={Zap}
                                value={`${flowMatch}GB通用`}
                                colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                            />
                        )}
                        {voiceMatch && (
                            <SpecTag
                                icon={Phone}
                                value={`${voiceMatch}分钟`}
                                colorClass="bg-green-50 text-green-600 dark:bg-green-950/60 dark:text-green-400"
                            />
                        )}
                        {product.package_attribution && (
                            <SpecTag
                                icon={MapPin}
                                value={product.package_attribution}
                                colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                            />
                        )}
                    </div>
                </div>

                {/* --- 二级信息：合约期 / 配送 / 年龄 --- */}
                {(product.package_contract_text || product.delivery || product.age_limit) && (
                    <div className="mb-2.5 flex flex-wrap gap-1">
                        {product.package_contract_text && (
                            <TextTag
                                value={product.package_contract_text}
                                colorClass="bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400"
                            />
                        )}
                        {product.delivery && (
                            <TextTag
                                value={product.delivery}
                                colorClass="bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400"
                            />
                        )}
                        {product.age_limit && (
                            <TextTag
                                value={product.age_limit}
                                colorClass="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500"
                            />
                        )}
                    </div>
                )}

                {/* --- 三级：描述文本 --- */}
                {product.package_composition && (
                    <p className="mb-2.5 line-clamp-2 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
                        {product.package_composition}
                    </p>
                )}

                {/* 弹性占满剩余空间，将下方按钮推到底部 */}
                <div className="flex-1" />

                {/* 分隔线 */}
                <div className="mb-3 border-t border-gray-100 dark:border-gray-800" />

                {/* --- 行动召唤：价格 + 操作按钮 --- */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex shrink-0 items-baseline gap-1">
                        <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                            ¥{price}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">/月</span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                        <Link
                            href={`/ksj/${product.goods_id}`}
                            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700 transition-colors hover:border-blue-600/30 hover:text-blue-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-blue-500/20 dark:hover:text-blue-400"
                        >
                            <Eye className="size-4" />
                            查看详情
                        </Link>
                        <a
                            href={getKsjApplyUrl(product.goods_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-normal text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md dark:bg-blue-600 dark:hover:bg-blue-500"
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

/* ========== 商品网格（分页加载） ========== */

/** 每页加载数量 */
const PAGE_SIZE = 12;

type VisibleAction = { type: "reset" } | { type: "loadMore"; maxCount: number };
function visibleReducer(state: number, action: VisibleAction): number {
    switch (action.type) {
        case "reset": return PAGE_SIZE;
        case "loadMore": return Math.min(state + PAGE_SIZE, action.maxCount);
    }
}

function ProductGrid({
    products,
    activeOperator,
    activeLocation,
    activeActivate,
    activeTag,
}: {
    products: KsjProductWithMeta[];
    activeOperator: string;
    activeLocation: string;
    activeActivate: string;
    activeTag: string;
}) {
    const filtered = useMemo(() => {
        return products.filter((p) => {
            if (activeOperator !== "all" && p._operator !== activeOperator) return false;
            if (activeLocation !== "all" && p.package_attribution !== activeLocation) return false;
            if (activeActivate !== "all" && p.activate_type !== activeActivate) return false;
            if (activeTag !== "all" && !matchTag(p, activeTag)) return false;
            return true;
        });
    }, [products, activeOperator, activeLocation, activeActivate, activeTag]);

    /* ===== 分页状态 ===== */
    const filterKey = `${activeOperator}-${activeLocation}-${activeActivate}-${activeTag}`;
    const [visibleCount, dispatchVisible] = useReducer(visibleReducer, PAGE_SIZE);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => { dispatchVisible({ type: "reset" }); }, [filterKey]);

    const displayed = filtered.slice(0, visibleCount);
    const hasMore = displayed.length < filtered.length;

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
            { rootMargin: "200px" }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

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
                    <KsjProductCard key={product.id} product={product} />
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

/* ========== 底部 CTA ========== */

function CtaSection() {
    return (
        <section className="bg-linear-to-r from-blue-600 to-blue-700 py-14">
            <div className="mx-auto max-w-2xl px-4 text-center">
                <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
                    立即申请，免费包邮到家！
                </h2>
                <p className="mb-6 text-sm text-blue-100 sm:text-base">
                    正规渠道、运营商官方卡品，零风险体验
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href="/ksj"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-blue-600 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                    >
                        <ShoppingCart className="size-4" />
                        浏览全部号卡
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-all hover:border-white hover:bg-white/10"
                    >
                        返回首页 <ArrowLeft className="size-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ========== 错误页面 ========== */

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

export default function KsjContent({ products, error }: KsjContentProps) {
    const [activeOperator, setActiveOperator] = useState("all");
    const [activeLocation, setActiveLocation] = useState("all");
    const [activeActivate, setActiveActivate] = useState("all");
    const [activeTag, setActiveTag] = useState("all");

    /** 计算统计数据 */
    const {
        operatorCounts,
        locationOptions,
        locationCounts,
        activateCounts,
        tagCounts,
    } = useMemo(() => {
        const opCounts: Record<string, number> = {
            all: products.length,
            mobile: 0,
            telecom: 0,
            unicom: 0,
            broadcast: 0,
        };
        const locCounts: Record<string, number> = { all: products.length };
        const locSet = new Set<string>();
        const actCounts: Record<string, number> = { all: products.length };
        const tgCounts: Record<string, number> = { all: products.length };
        for (const opt of ACTIVATE_OPTIONS) { if (opt.key !== "all") actCounts[opt.key] = 0; }
        for (const opt of TAG_OPTIONS) { if (opt.key !== "all") tgCounts[opt.key] = 0; }

        products.forEach((p) => {
            // 运营商统计
            if (opCounts[p._operator] !== undefined) opCounts[p._operator]++;
            // 归属地统计
            if (p.package_attribution) {
                locSet.add(p.package_attribution);
                locCounts[p.package_attribution] = (locCounts[p.package_attribution] || 0) + 1;
            }
            // 激活方式统计
            if (p.activate_type && actCounts[p.activate_type] !== undefined) {
                actCounts[p.activate_type]++;
            }
            // 标签统计
            for (const opt of TAG_OPTIONS) {
                if (opt.key !== "all" && matchTag(p, opt.key)) tgCounts[opt.key]++;
            }
        });

        const locOpts = [
            { key: "all", label: "全部归属地" },
            ...Array.from(locSet)
                .sort()
                .filter((k) => locCounts[k] > 0)
                .map((k) => ({ key: k, label: k })),
        ];

        return {
            operatorCounts: opCounts,
            locationOptions: locOpts,
            locationCounts: locCounts,
            activateCounts: actCounts,
            tagCounts: tgCounts,
        };
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
                                卡世界大流量卡套餐大全
                            </h1>
                            <p className="mt-1 text-xs text-blue-100 sm:text-sm">
                                正规渠道 · 高额佣金 · 全国包邮 · 共 {products.length} 款在售套餐
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <main>
                <AdvantagesSection />
                <FilterBar
                    activeOperator={activeOperator}
                    onOperatorChange={setActiveOperator}
                    activeLocation={activeLocation}
                    onLocationChange={setActiveLocation}
                    activeActivate={activeActivate}
                    onActivateChange={setActiveActivate}
                    activeTag={activeTag}
                    onTagChange={setActiveTag}
                    operatorCounts={operatorCounts}
                    locationOptions={locationOptions}
                    locationCounts={locationCounts}
                    activateCounts={activateCounts}
                    tagCounts={tagCounts}
                />
                <section className={containerClass("pb-10")} style={SITE_WIDTH_STYLE}>
                    <ProductGrid
                        products={products}
                        activeOperator={activeOperator}
                        activeLocation={activeLocation}
                        activeActivate={activeActivate}
                        activeTag={activeTag}
                    />
                </section>
                <CtaSection />
            </main>
            <Footer />
        </div>
    );
}
