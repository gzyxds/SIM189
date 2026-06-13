"use client";

/**
 * FAQ 常见问题页面 — 客户端交互组件
 *
 * 提供搜索、分类筛选、热门问题展示、折叠面板、底部操作栏等功能。
 * 数据来源：朋科技 H5 客服页面 / lib/data/faq.ts
 *
 * 布局：
 * - 顶部：搜索框 + 页面标题
 * - 主体：分类标签导航 + 问题列表（折叠面板）
 *   - 桌面端：左侧分类导航列表（300px）| 右侧问题列表（弹性填充）
 *   - 移动端：顶部横向分类滚动标签 | 下方问题列表
 * - 底部：操作栏（意见反馈 | 在线客服 | 客服热线）+ 服务时间
 */
import React, { useState, useMemo } from "react";
import {
    Search,
    Sparkles,
    Filter,
    ChevronDown,
    MessageSquare,
    MessageCircle,
    Phone,
    Clock,
    ArrowUp,
    type LucideIcon,
} from "lucide-react";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import {
    FAQS,
    FAQ_CATEGORIES,
    ALL_CATEGORIES,
    HOT_FAQS,
    getFaqsByCategory,
    searchFaqs,
    type FaqItem,
} from "@/lib/data/faq";

/* ========== 单个 FAQ 折叠项 ========== */

/**
 * 单条 FAQ 折叠展示组件
 * @param idx - 序号
 * @param faq - FAQ 数据
 * @param isOpen - 是否展开
 * @param onToggle - 切换回调
 */
function FaqAccordionItem({
    idx,
    faq,
    isOpen,
    onToggle,
}: {
    idx: number;
    faq: FaqItem;
    isOpen: boolean;
    onToggle: () => void;
}) {
    const cfg = FAQ_CATEGORIES[faq.category];

    return (
        <div
            className={`group overflow-hidden rounded-md border transition-all duration-300 ${isOpen
                    ? "border-blue-200 bg-gradient-to-br from-blue-50/60 to-white"
                    : "border-gray-100 bg-white hover:border-blue-100"
                }`}
        >
            {/* 问题按钮 */}
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left sm:gap-4 sm:px-5 sm:py-4 md:px-6 md:py-5"
            >
                {/* 序号徽章 */}
                <span
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm text-xs font-bold transition-all duration-200 ${isOpen
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                        }`}
                >
                    {idx + 1}
                </span>

                {/* 问题文字 */}
                <span
                    className={`flex-1 text-sm font-medium leading-relaxed transition-colors duration-200 md:text-base ${isOpen ? "text-blue-700" : "text-gray-800 group-hover:text-blue-600"
                        }`}
                >
                    {faq.q}
                </span>

                {/* 展开图标 */}
                <span
                    className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${isOpen
                            ? "rotate-180 bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                        }`}
                >
                    <ChevronDown className="size-4" />
                </span>
            </button>

            {/* 答案区域 — CSS grid 过渡实现平滑展开 */}
            <div
                className="grid transition-all duration-300 ease-in-out"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
                <div className="overflow-hidden">
                    <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 md:px-6 md:pb-6">
                        <div className="flex items-start gap-3 rounded bg-white/70 p-4 backdrop-blur-sm">
                            {cfg && (
                                <div
                                    className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded ${cfg.bg}`}
                                >
                                    <cfg.icon className={`size-4 ${cfg.color}`} />
                                </div>
                            )}
                            {/* 答案内容（支持 HTML 换行标签） */}
                            <p
                                className="text-sm leading-relaxed text-gray-600"
                                dangerouslySetInnerHTML={{ __html: faq.a }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ========== 分类标签按钮 ========== */

/**
 * 分类选择标签按钮
 * 复用于移动端和桌面端，统一视觉风格
 */
function CategoryTab({
    cat,
    isActive,
    count,
    onClick,
}: {
    cat: string;
    isActive: boolean;
    count: number;
    onClick: () => void;
}) {
    const cfg = FAQ_CATEGORIES[cat];

    /** 为特殊分类（热门/全部）准备默认图标和描述 */
    const isSpecial = cat === "热门问题" || cat === "全部";
    const iconComp: LucideIcon = isSpecial ? Sparkles : (cfg?.icon ?? Sparkles);
    const iconActiveColor = isSpecial ? "text-white" : "text-white";
    const iconInactiveColor = isSpecial ? "text-yellow-500" : (cfg?.color ?? "text-gray-400");
    const iconBg = isSpecial ? "bg-yellow-50" : (cfg?.bg ?? "bg-gray-100");
    const desc = isSpecial ? (cat === "热门问题" ? "用户最关心的问题" : "浏览全部问题") : cfg?.desc ?? "";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-md border px-4 py-2.5 text-left transition-all duration-200 ${isActive
                    ? "border-blue-200 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm"
                    : "border-gray-100 bg-white text-gray-700 hover:border-blue-100 hover:bg-blue-50"
                }`}
        >
            {/* 图标 */}
            <div
                className={`flex size-7 shrink-0 items-center justify-center rounded transition-all ${isActive ? "bg-white/20" : iconBg
                    }`}
            >
                {React.createElement(iconComp, {
                    className: `size-4 ${isActive ? iconActiveColor : iconInactiveColor}`,
                })}
            </div>

            {/* 文字 + 描述 */}
            <div className="min-w-0 flex-1">
                <p
                    className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-800"}`}
                >
                    {cat}
                </p>
                <p
                    className={`mt-0.5 truncate text-xs ${isActive ? "text-white/80" : "text-gray-400"}`}
                >
                    {desc}
                </p>
            </div>

            {/* 数量徽章 */}
            <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}
            >
                {count}
            </span>
        </button>
    );
}

/* ========== 底部操作栏 ========== */

/** 底部操作栏配置 */
interface ActionItem {
    label: string;
    icon: LucideIcon;
    /** 点击行为：modal → 打开客服弹窗 | tel → 拨打电话 | feedback → 意见反馈 */
    action: "modal" | "tel" | "feedback";
    href?: string;
}

const BOTTOM_ACTIONS: ActionItem[] = [
    {
        label: "意见反馈",
        icon: MessageSquare,
        action: "feedback",
    },
    {
        label: "在线客服",
        icon: MessageCircle,
        action: "modal",
    },
    {
        label: "客服热线",
        icon: Phone,
        action: "tel",
        href: "tel:400-xxx-xxxx",
    },
];

/** 客服工作时间 */
const SERVICE_HOURS = "09:00 - 18:00（工作日）";

/* ========== 主组件 ========== */

/** FAQ 常见问题页面内容组件 */
export default function FaqContent() {
    /* ===== 状态管理 ===== */
    const [searchKeyword, setSearchKeyword] = useState("");
    const [activeCategory, setActiveCategory] = useState("热门问题");
    const [openIndex, setOpenIndex] = useState<number>(-1);

    /** 根据搜索关键词和分类筛选后的 FAQ 列表 */
    const filteredFaqs = useMemo(() => {
        /* 先按搜索框过滤 */
        const searched = searchFaqs(searchKeyword);

        /* 再按分类过滤（搜索模式下非"全部"时同时按分类筛选） */
        if (activeCategory === "热门问题") {
            /* 热门问题标签：在搜索结果中仅展示热门项 */
            return searched.filter((f) => f.isHot);
        }
        if (activeCategory === "全部") return searched;
        return searched.filter((f) => f.category === activeCategory);
    }, [searchKeyword, activeCategory]);

    /** 当前分类下的问题总数（用于显示在分类标签上） */
    const getCategoryCount = (cat: string) => {
        if (cat === "热门问题") return HOT_FAQS.length;
        if (cat === "全部") return FAQS.length;
        return FAQS.filter((f) => f.category === cat).length;
    };

    /* ===== 事件处理 ===== */

    /** 切换分类 */
    const handleCategoryChange = (cat: string) => {
        setActiveCategory(cat);
        setOpenIndex(-1);
        setSearchKeyword("");
    };

    /** 搜索输入变更 */
    const handleSearchChange = (value: string) => {
        setSearchKeyword(value);
        setOpenIndex(-1);
        /* 搜索时自动切换到"全部"分类以展示所有匹配结果 */
        if (value.trim() && activeCategory !== "全部") {
            setActiveCategory("全部");
        }
        /* 清空搜索时恢复热门问题 */
        if (!value.trim() && activeCategory === "全部") {
            setActiveCategory("热门问题");
        }
    };

    /** 处理底部操作按钮点击 */
    const handleAction = (action: ActionItem) => {
        switch (action.action) {
            case "modal":
                /* 触发全局客服弹窗事件（与 FAQSection 保持一致） */
                window.dispatchEvent(new CustomEvent("open-customer-modal"));
                break;
            case "tel":
                /* 拨打电话 */
                if (action.href) window.location.href = action.href;
                break;
            case "feedback":
                /* 打开客服弹窗作为反馈入口 */
                window.dispatchEvent(new CustomEvent("open-customer-modal"));
                break;
        }
    };

    return (
        <section className="relative overflow-hidden">
            {/* ===== 背景：多层渐变 + 顶部光晕 ===== */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/30 to-white" />
                <div className="absolute -top-32 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-100/20 blur-3xl" />
            </div>

            <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
                {/* ===== 顶部标题区 ===== */}
                <div className="mb-12 text-center md:mb-14">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-600">
                        <Sparkles className="size-4" />
                        帮助中心
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        常见问题
                    </h2>
                    <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                    <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                        关于号卡套餐、物流配送、支付和账号相关的常见疑问，这里都有答案
                    </p>
                </div>

                {/* ===== 搜索框 ===== */}
                <div className="mx-auto mb-10 max-w-xl">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchKeyword}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="搜索问题关键词..."
                            className="w-full rounded-md border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-800 placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:py-3.5 sm:text-base"
                        />
                        {/* 搜索有结果时的计数提示 */}
                        {searchKeyword.trim() && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                {filteredFaqs.length} 条结果
                            </span>
                        )}
                    </div>
                </div>

                {/* ===== 分类筛选栏（移动端/平板顶部横排滚动） ===== */}
                <div className="mb-8 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:pb-0 lg:hidden">
                    {ALL_CATEGORIES.map((cat) => {
                        const isActive = activeCategory === cat;
                        const count = getCategoryCount(cat);
                        const cfg = FAQ_CATEGORIES[cat];
                        const isSpecial = cat === "热门问题" || cat === "全部";
                        const IconComp: LucideIcon = isSpecial ? Sparkles : (cfg?.icon ?? Sparkles);

                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => handleCategoryChange(cat)}
                                className={`flex shrink-0 items-center gap-2.5 rounded-md border px-3.5 py-1.5 text-left transition-all duration-200 ${isActive
                                        ? "border-blue-200 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm"
                                        : "border-gray-100 bg-white text-gray-700 hover:border-blue-100 hover:bg-blue-50"
                                    }`}
                            >
                                {/* 图标 */}
                                <div
                                    className={`flex size-7 shrink-0 items-center justify-center rounded transition-all ${isActive
                                            ? "bg-white/20"
                                            : isSpecial
                                                ? "bg-yellow-50"
                                                : cfg?.bg ?? "bg-gray-100"
                                        }`}
                                >
                                    {React.createElement(IconComp, {
                                        className: `size-4 ${isActive
                                                ? "text-white"
                                                : isSpecial
                                                    ? "text-yellow-500"
                                                    : cfg?.color ?? "text-gray-400"
                                            }`,
                                    })}
                                </div>

                                {/* 文字 + 描述 — 仅 sm 及以上 */}
                                <div className="hidden min-w-0 flex-1 sm:block">
                                    <p
                                        className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-800"}`}
                                    >
                                        {cat}
                                    </p>
                                    <p
                                        className={`mt-0.5 truncate text-xs ${isActive ? "text-white/80" : "text-gray-400"}`}
                                    >
                                        {isSpecial
                                            ? cat === "热门问题"
                                                ? "用户最关心"
                                                : "查看全部"
                                            : cfg?.desc ?? ""}
                                    </p>
                                </div>

                                {/* 数量徽章 — 仅 sm 及以上 */}
                                <span
                                    className={`ml-auto hidden shrink-0 rounded px-2 py-0.5 text-xs font-bold sm:block ${isActive
                                            ? "bg-white/20 text-white"
                                            : "bg-gray-100 text-gray-500"
                                        }`}
                                >
                                    {count}
                                </span>

                                {/* 移动端仅显示分类名 + 数量 */}
                                <span className="text-sm font-medium sm:hidden">{cat}</span>
                                <span
                                    className={`ml-1 rounded px-1.5 py-0.5 text-xs font-bold sm:hidden ${isActive
                                            ? "bg-white/20 text-white"
                                            : "bg-gray-100 text-gray-500"
                                        }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ===== 左右双栏布局 ===== */}
                <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[300px_1fr] lg:gap-10 xl:grid-cols-[340px_1fr]">
                    {/* ===== 左栏：桌面端分类导航 + 信息卡片（移动端置于下方） ===== */}
                    <div className="order-2 flex flex-col gap-4 lg:order-none">
                        {/* 分类标签 — 仅桌面端左侧竖排 */}
                        <div className="hidden flex-col gap-2 lg:flex">
                            {/* 筛选图标标题 */}
                            <div className="mb-1 flex items-center gap-2 px-1">
                                <Filter className="size-4 text-gray-400" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    问题分类
                                </span>
                            </div>

                            {ALL_CATEGORIES.map((cat) => (
                                <CategoryTab
                                    key={cat}
                                    cat={cat}
                                    isActive={activeCategory === cat}
                                    count={getCategoryCount(cat)}
                                    onClick={() => handleCategoryChange(cat)}
                                />
                            ))}
                        </div>

                        {/* 统计卡片 — 仅桌面端显示 */}
                        <div className="hidden rounded-md border border-gray-100 bg-white p-4 lg:block">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                问题概览
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(FAQ_CATEGORIES).map(([cat, cfg]) => (
                                    <div key={cat} className="rounded bg-gray-50 p-3 text-center">
                                        <div
                                            className={`mx-auto mb-1.5 flex size-8 items-center justify-center rounded ${cfg.bg}`}
                                        >
                                            <cfg.icon className={`size-4 ${cfg.color}`} />
                                        </div>
                                        <p className="text-lg font-bold text-gray-800">
                                            {FAQS.filter((f) => f.category === cat).length}
                                        </p>
                                        <p className="text-xs text-gray-400">{cat}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 联系引导卡片 */}
                        <div className="overflow-hidden rounded-md border border-blue-100 bg-gradient-to-br from-blue-600 to-blue-700 p-4 sm:p-5">
                            <div className="mb-1 flex items-center gap-2">
                                <MessageCircle className="size-4 text-blue-200" />
                                <p className="text-sm font-semibold text-white">没有找到答案？</p>
                            </div>
                            <p className="mb-4 text-xs leading-relaxed text-blue-100">
                                我们的客服团队随时为您提供一对一专属帮助
                            </p>
                            <div className="flex flex-row gap-2 sm:flex-col">
                                <button
                                    type="button"
                                    onClick={() =>
                                        window.dispatchEvent(new CustomEvent("open-customer-modal"))
                                    }
                                    className="flex flex-1 items-center justify-center gap-2 rounded bg-white px-3 py-2 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-50 sm:flex-none sm:px-4 sm:py-2.5"
                                >
                                    <MessageCircle className="size-4" />
                                    <span className="sm:hidden">在线咨询</span>
                                    <span className="hidden sm:inline">在线咨询客服</span>
                                </button>
                                <a
                                    href="tel:400-xxx-xxxx"
                                    className="flex flex-1 items-center justify-center gap-2 rounded border border-blue-400/40 bg-blue-500/30 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-blue-500/50 sm:flex-none sm:px-4 sm:py-2.5"
                                >
                                    <Phone className="size-4" />
                                    <span className="sm:hidden">电话咨询</span>
                                    <span className="hidden sm:inline">拨打客服热线</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* ===== 右栏：FAQ 折叠面板列表 ===== */}
                    <div className="order-1 min-w-0 lg:order-none">
                        {/* 当前分类标题 */}
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">
                                共{" "}
                                <span className="font-bold text-blue-600">
                                    {filteredFaqs.length}
                                </span>{" "}
                                个问题
                                {activeCategory !== "热门问题" && activeCategory !== "全部" && (
                                    <span className="ml-1 text-gray-400">· {activeCategory}</span>
                                )}
                            </p>
                            {activeCategory !== "热门问题" && activeCategory !== "全部" && (
                                <button
                                    type="button"
                                    onClick={() => handleCategoryChange("全部")}
                                    className="text-xs text-blue-500 transition-colors hover:text-blue-600 hover:underline"
                                >
                                    查看全部
                                </button>
                            )}
                        </div>

                        {/* FAQ 列表 */}
                        <div className="space-y-2.5 sm:space-y-3">
                            {filteredFaqs.map((faq, localIdx) => (
                                <FaqAccordionItem
                                    key={`${faq.category}-${localIdx}`}
                                    idx={localIdx}
                                    faq={faq}
                                    isOpen={openIndex === localIdx}
                                    onToggle={() =>
                                        setOpenIndex(openIndex === localIdx ? -1 : localIdx)
                                    }
                                />
                            ))}
                        </div>

                        {/* 空状态 */}
                        {filteredFaqs.length === 0 && (
                            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 py-16">
                                <Search className="mb-3 size-10 text-gray-300" />
                                <p className="text-sm font-medium text-gray-500">
                                    暂无相关问题
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    试试搜索其他关键词吧
                                </p>
                            </div>
                        )}

                        {/* 搜索模式下且无结果时，显示回到热门问题按钮 */}
                        {searchKeyword.trim() && filteredFaqs.length === 0 && (
                            <div className="mt-4 text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchKeyword("");
                                        setActiveCategory("热门问题");
                                    }}
                                    className="text-sm text-blue-500 transition-colors hover:text-blue-600 hover:underline"
                                >
                                    返回热门问题
                                </button>
                            </div>
                        )}

                        {/* ===== 底部操作栏 ===== */}
                        <div className="mt-12 border-t border-gray-100 pt-8">
                            {/* 操作按钮行 */}
                            <div className="flex items-center justify-center gap-3 sm:gap-4">
                                {BOTTOM_ACTIONS.map((item) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => handleAction(item)}
                                        className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 sm:px-5 sm:py-3"
                                    >
                                        <item.icon className="size-4" />
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* 服务时间 */}
                            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                                <Clock className="size-3.5" />
                                <span>客服时间：{SERVICE_HOURS}</span>
                            </div>

                            {/* 回到顶部按钮 */}
                            <div className="mt-6 text-center">
                                <button
                                    type="button"
                                    onClick={() =>
                                        window.scrollTo({ top: 0, behavior: "smooth" })
                                    }
                                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-blue-500"
                                >
                                    <ArrowUp className="size-3.5" />
                                    回到顶部
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
