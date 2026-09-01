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
    ArrowRight,
    FileText,
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
        /* 移动端单排横向滑动（隐藏滚动条），桌面端恢复自动换行 */
        <div className="scrollbar-hide flex flex-nowrap items-center gap-2 overflow-x-auto py-2 sm:flex-wrap sm:overflow-visible">
            <span className="relative mr-1 flex shrink-0 items-center pl-3 text-sm font-medium text-gray-600 before:absolute before:left-0 before:top-1/2 before:h-3.5 before:w-[3px] before:-translate-y-1/2 before:rounded-sm before:bg-blue-600">
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
                        className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-md border px-3.5 py-1.5 text-xs transition-all duration-300 ${isActive
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
            <div className="rounded-xl bg-white p-3 shadow-sm sm:p-5">
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

/* ========== 运营商配色（卡片右上角白底标签）========== */

const OPERATOR_CARD_STYLE: Record<string, { label: string; text: string; border: string; bg: string; icon: React.ElementType }> = {
    mobile: { label: "移动", text: "text-green-600", border: "border-green-200", bg: "bg-green-50", icon: Signal },
    telecom: { label: "电信", text: "text-blue-600", border: "border-blue-200", bg: "bg-blue-50", icon: Wifi },
    unicom: { label: "联通", text: "text-orange-600", border: "border-orange-200", bg: "bg-orange-50", icon: Zap },
    broadcast: { label: "广电", text: "text-purple-600", border: "border-purple-200", bg: "bg-purple-50", icon: LayoutGrid },
    unknown: { label: "其他", text: "text-gray-600", border: "border-gray-200", bg: "bg-gray-50", icon: Signal },
};

/* ========== 规格参数单元 ========== */

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
                <span className={`text-base leading-none font-bold tabular-nums sm:text-xl lg:text-2xl ${valueClass}`}>
                    {value}
                </span>
                {unit && (
                    <span className={`text-[9px] leading-none font-semibold sm:text-[11px] ${valueClass} opacity-70`}>
                        {unit}
                    </span>
                )}
            </span>
            <span className="mt-1 text-[9px] leading-none whitespace-nowrap text-gray-400 sm:text-[11px]">
                {label}
            </span>
        </div>
    );
}

/* ========== 商品卡片 ========== */

/** 特色标签数据结构 */
interface FeatureTag {
    text: string;
}

/**
 * 根据标签文字内容分配颜色样式
 * 统一移动端和 PC 端的标签颜色逻辑
 * @param text - 标签文字
 */
function getTagColorClass(text: string): string {
    if (text.includes("秒返") || text.includes("日结") || text.includes("即返") || text.includes("返佣")) return "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/50";
    if (text.includes("热销")) return "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/50";
    if (text.includes("免上传") || text.includes("免费") || text.includes("送")) return "bg-green-50 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/50";
    if (text.includes("低月租")) return "bg-green-50 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/50";
    if (text.includes("流量") && !text.includes("定向")) return "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/50";
    if (text.includes("定向")) return "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/50";
    if (text.includes("长期")) return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/50";
    if (text.includes("首年") || text.includes("两年")) return "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/50";
    if (text.includes("语音") || text.includes("通话")) return "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/50";
    if (text.includes("选号")) return "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/50";
    if (text.includes("验证码")) return "bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/50";
    if (text.includes("短期") || text.includes("6个月")) return "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/50";
    if (text.includes("全国") || text.includes("不限")) return "bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/50";
    return "bg-gray-50 text-gray-600 border-gray-200 dark:bg-dark-3 dark:text-dark-5 dark:border-dark-3";
}

/** 销量格式化：11980 → "1.2 万" */
function formatSales(sales: number): string {
    if (sales >= 10000) return `${(sales / 10000).toFixed(1)}万`;
    if (sales >= 1000) return `${(sales / 1000).toFixed(1)}千`;
    return String(sales);
}

/**
 * 从 tagsSelect 提取年龄要求
 * 翼卡云列表接口不返回 limitRule，年龄标签包含在 tagsSelect 中
 * 如 "18-65周岁" → "18-65岁"
 */
function extractAgeLimit(product: YkyProductWithMeta): string {
    const fromTag = (product.tagsSelect ?? [])
        .map((t) => t.label ?? "")
        .find((l) => /\d+\s*-\s*\d+\s*周岁/.test(l));
    if (fromTag) return fromTag.replace(/周岁/, "岁");
    return "";
}

/**
 * 从商品数据提取特色标签（参考 KayiContent 丰富的标签体系）
 * 
 * 来源：
 * - 结算模式（秒返/日结/月月返佣）
 * - 便利性（免上传照片/免验证码/支持选号）
 * - 价格/流量/语音特征
 * - 套餐时长/销量热度
 * - tagsSelect 原始标签
 */
function extractFeatureTags(product: YkyProductWithMeta): FeatureTag[] {
    const tags: FeatureTag[] = [];
    const displayPrice = product.favourMonthFee || product.monthFee;
    const commonFlow = product.commonFlow || 0;
    const fixedFlow = product.fixedFlow || 0;
    const callDuration = product.callDuration || 0;
    const sales = product.sales || 0;
    const duration = product._duration || "";

    /* ---- 便利性 ---- */
    // 免上传照片
    if (Number(product.uploadPhoto) === 0) {
        tags.push({ text: "免上传照片" });
    }
    // 免验证码
    if (Number(product.smsCode) === 0) {
        tags.push({ text: "免验证码" });
    }
    // 支持选号
    if (Number(product.selectNumber) > 0) {
        tags.push({ text: "支持选号" });
    }

    /* ---- 价格特征 ---- */
    if (displayPrice > 0 && displayPrice <= 39) {
        tags.push({ text: "低月租" });
    }

    /* ---- 流量特征 ---- */
    const totalFlow = commonFlow + fixedFlow;
    if (totalFlow >= 300) {
        tags.push({ text: "超大流量" });
    } else if (totalFlow >= 150) {
        tags.push({ text: "大额流量" });
    } else if (totalFlow >= 60) {
        tags.push({ text: "大流量" });
    }

    /* ---- 定向流量 ---- */
    if (fixedFlow > 0) {
        tags.push({ text: "含定向流量" });
    }

    /* ---- 语音 ---- */
    if (callDuration >= 200) {
        tags.push({ text: "长语音" });
    }

    /* ---- 套餐时长 ---- */
    if (duration.includes("长期")) {
        tags.push({ text: "长期有效" });
    }
    if (duration.includes("2 年") || duration.includes("2 年期")) {
        tags.push({ text: "两年优惠" });
    }
    if (duration.includes("1 年") || duration.includes("1 年期")) {
        tags.push({ text: "首年优惠" });
    }
    if (duration.includes("6个月") || duration.includes("短期")) {
        tags.push({ text: "短期优惠" });
    }

    /* ---- 热度 ---- */
    if (sales >= 500) {
        tags.push({ text: "热销" });
    }

    /* ---- tagsSelect 原始标签（排除年龄、主推等已在别处展示的） ---- */
    (product.tagsSelect ?? [])
        .map((t) => t.label)
        .filter((l) => l && !/\d+\s*-\s*\d+\s*周岁/.test(l) && l !== "主推" && l !== "推荐")
        .forEach((l) => {
            if (!tags.some((t) => t.text === l)) {
                tags.push({ text: l });
            }
        });

    /* ---- 预计算 _tags ---- */
    (product._tags ?? []).forEach((t) => {
        if (!tags.some((tag) => tag.text === t.text)) {
            tags.push({ text: t.text });
        }
    });

    return tags.slice(0, 8);
}

/**
 * 翼卡云商品卡片
 *
 * PC 端：横向宽卡片（左图右内容）
 * 移动端：上下结构参考 KayiContent 设计风格
 */
function YkyProductCard({ product, index }: { product: YkyProductWithMeta; index: number }) {
    const op = OPERATOR_CARD_STYLE[product._operator] || OPERATOR_CARD_STYLE.unknown;
    const OpIcon = op.icon;
    
    const displayPrice = product.favourMonthFee || product.monthFee;
    const ageLimit = useMemo(() => extractAgeLimit(product), [product]);
    const featureTags = useMemo(() => extractFeatureTags(product), [product]);
    const hasImage = Boolean(product.tips);
    const isRecommended = product.star >= 4;
    const detailHref = `/yky/${product.id}`;

    /* 套餐描述 */
    const planDesc = `月租¥${displayPrice} · ${product.commonFlow || 0}G 通用${(product.fixedFlow || 0) > 0 ? `+${product.fixedFlow}G 定向` : ""}${(product.callDuration || 0) > 0 ? ` · ${product.callDuration}分钟通话` : ""} · ${product._duration}`;

    return (
        <article className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-dark-2 dark:ring-dark-3">
            {/* ===== 移动端布局（<sm）：上下结构===== */}
            <div className="block sm:hidden">
                <div className="p-3">
                    {/* 运营商标签：右上角 */}
                    <span className={`absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${op.text} ${op.bg}`}>
                        <OpIcon className="h-3.5 w-3.5" />
                        {op.label}
                    </span>

                    {/* 推荐星级角标：左上角 */}
                    {isRecommended && (
                        <span className="absolute left-3 top-3 z-10 rounded-md px-2 py-0.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500">
                            <Star className="mr-1 inline-block h-3 w-3 fill-white" />
                            {product.star}星推荐
                        </span>
                    )}

                    {/* 图片 + 标题区 */}
                    <div className="flex gap-3">
                        <Link href={detailHref} className="relative h-[90px] w-[90px] shrink-0 overflow-hidden rounded-lg">
                            {hasImage && (
                                <img
                                    src={product.tips}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            )}
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-gray-900">
                                <Link href={detailHref} className="hover:text-blue-600">
                                    {product.name}
                                </Link>
                            </h3>
                            <p className="mt-1 line-clamp-1 text-[13px] text-gray-600">
                                {planDesc}
                            </p>
                            {/* 特色标签 */}
                            {featureTags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {featureTags.slice(0, 5).map((tag) => (
                                        <span
                                            key={tag.text}
                                            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium border ${getTagColorClass(tag.text)}`}
                                        >
                                            {tag.text}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4 列参数条 */}
                    <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-xl bg-gray-50 p-2.5 dark:bg-dark-3">
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-red-500">¥{displayPrice}</span>
                            <span className="mt-0.5 text-[10px] text-gray-400 dark:text-dark-5">月租费用</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{product.commonFlow || 0}G</span>
                            <span className="mt-0.5 text-[10px] text-gray-400 dark:text-dark-5">通用流量</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{product.fixedFlow || 0}G</span>
                            <span className="mt-0.5 text-[10px] text-gray-400 dark:text-dark-5">定向流量</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{product.callDuration || 0}分</span>
                            <span className="mt-0.5 text-[10px] text-gray-400 dark:text-dark-5">通话分钟</span>
                        </div>
                    </div>

                    {/* 操作栏：左侧地区 + 右侧按钮 */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                        {/* 左侧：商品实际发货地区（API numberRegionName，空=快递配送，与PC端一致） */}
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3.5 w-3.5 text-orange-500" />
                            {product._region || "快递配送"}
                        </span>
                        {/* 右侧：操作按钮 */}
                        <div className="flex items-center gap-1.5">
                            {/* 查看详情 */}
                            <Link
                                href={detailHref}
                                className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-normal text-gray-500 hover:border-blue-300 hover:text-blue-600 dark:border-dark-4 dark:text-dark-5 dark:hover:border-blue-400 dark:hover:text-blue-400"
                            >
                                <Eye className="h-3.5 w-3.5" />
                                查看详情
                            </Link>
                            {/* 立即办理 */}
                            <a
                                href={product._orderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-normal text-white hover:bg-blue-700 active:scale-95"
                            >
                                立即办理
                                <ChevronRight className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* 底部分割线 */}
                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-[10px] text-gray-400 dark:border-dark-3 dark:text-dark-5">
                        <span>{product._duration || "长期"}</span>
                        {product.sales > 0 && (
                            <span className="flex items-center gap-1">
                                <RefreshCw className="h-3 w-3" />
                                {formatSales(product.sales)}人领取
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== PC 端布局（≥sm）：左右结构===== */}
            <div className="hidden sm:block">
                <div className="flex flex-row">
                    {/* 左侧图片区 */}
                    <div className="relative w-5/12 shrink-0 lg:w-2/5">
                        <Link href={detailHref} className="block bg-white p-3 dark:bg-dark-2">
                            <div className="relative h-full overflow-hidden rounded-lg">
                                {hasImage && (
                                    <img
                                        src={product.tips}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                    />
                                )}
                            </div>
                        </Link>
                        {/* 推荐星级角标 */}
                        {isRecommended && (
                            <span className="absolute left-3 top-3 z-10 rounded-md px-2 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500">
                                <Star className="mr-1 inline-block h-3 w-3 fill-white" />
                                推荐
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
                        {/* 标题 */}
                        <div className="mb-2 flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 lg:text-base">
                                <Link href={detailHref} className="hover:text-blue-600">
                                    {product.name}
                                </Link>
                            </h3>
                            {product.sales > 0 && (
                                <span className="shrink-0 text-[10px] whitespace-nowrap text-gray-400 lg:text-xs">
                                    已售 {formatSales(product.sales)}
                                </span>
                            )}
                        </div>

                        {/* 套餐描述 */}
                        <p className="mb-3 text-sm text-gray-600">
                            {planDesc}
                        </p>

                        {/* 4 列参数条（参考 KayiContent PC 端设计） */}
                        <div className="mb-3 grid grid-cols-4 gap-2 rounded-xl bg-gray-50 p-2.5 dark:bg-dark-3">
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-bold text-red-500 lg:text-base">¥{displayPrice}</span>
                                <span className="mt-0.5 text-[10px] text-gray-500 dark:text-dark-5">月租</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 lg:text-base">{product.commonFlow || 0}G</span>
                                <span className="mt-0.5 text-[10px] text-gray-500 dark:text-dark-5">通用流量</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 lg:text-base">{product.fixedFlow || 0}G</span>
                                <span className="mt-0.5 text-[10px] text-gray-500 dark:text-dark-5">定向流量</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 lg:text-base">{product.callDuration || 0}分</span>
                                <span className="mt-0.5 text-[10px] text-gray-500 dark:text-dark-5">通话分钟</span>
                            </div>
                        </div>

                        {/* 条件标签 */}
                        <div className="mb-2 flex flex-wrap gap-1.5">
                            {ageLimit && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:bg-green-500/20 dark:text-green-300">
                                    <ShieldCheck className="h-3 w-3" />
                                    {ageLimit}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-600 dark:bg-orange-500/20 dark:text-orange-300">
                                <MapPin className="h-3 w-3" />
                                {product._region || "快递配送"}
                            </span>
                        </div>

                        {/* 特色标签（与移动端一致的颜色区分） */}
                        {featureTags.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-1.5">
                                {featureTags.slice(0, 8).map((tag) => (
                                    <span
                                        key={tag.text}
                                        className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium border ${getTagColorClass(tag.text)}`}
                                    >
                                        {tag.text}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* 底部按钮 */}
                        <div className="mt-auto flex items-center gap-2.5 border-t border-gray-100 pt-2.5 dark:border-dark-3">
                            {/* 立即办理 */}
                            <a
                                href={product._orderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-normal text-white transition-colors hover:bg-blue-700 lg:px-5 lg:py-2 lg:text-sm"
                            >
                                立即办理
                                <ArrowRight className="h-4 w-4" />
                            </a>
                            {/* 查看详情 */}
                            <Link
                                href={detailHref}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-700 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-dark-4 dark:bg-dark-3 dark:text-dark-5 dark:hover:border-blue-400 dark:hover:text-blue-600 lg:px-4 lg:py-2 lg:text-sm"
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
            {/* 横向卡片网格（参考 KayiContent 设计：移动端单列，lg 起两列） */}
            <div className="grid items-start gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-5">
                {displayed.map((product, i) => (
                    <YkyProductCard key={product.id} product={product} index={i} />
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

/** API 错误展示区块（参考 KayiContent 全页替换错误态） */
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
                                翼卡云大流量卡套餐大全
                            </h1>
                            <p className="mt-1 text-xs text-blue-100 sm:text-sm">
                                正规渠道直供 · 多模式返佣 · 全国包邮 · 共 {products.length} 款在售套餐
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <main>
                {/* 平台优势 */}
                <AdvantagesSection />
                <ClaimTicker />

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
                <section className={containerClass("pb-10")} style={SITE_WIDTH_STYLE}>
                    <ProductGrid
                        products={products}
                        activeCategory={activeCategory}
                        activeOperator={activeOperator}
                        activeRegion={activeRegion}
                        activeDuration={activeDuration}
                    />
                </section>

                {/* 底部 CTA */}
                <CtaSection />
            </main>

            <Footer />
        </div>
    );
}
