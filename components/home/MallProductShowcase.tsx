/**
 * 商城首页促销楼层组件
 *
 * 架构说明（Next.js App Router）：
 * 1. 本文件是 Client Component（文件顶部 `"use client"`）
 * 2. 首屏商品数据由服务端组件（app/page.tsx）渲染时直接调用
 *    `getMallPlatformsProducts`（定义于 `lib/api/mall-products-data.ts`）取数，
 *    随 HTML 一并返回，客户端无需二次请求、也没有骨架屏
 * 3. 仅当六平台全部失败时，客户端通过 Server Action `getMallPlatformsProductsAction` 手动重试
 * 4. 所有 UI 子组件在客户端渲染，可自由使用 Hooks
 *
 * 设计目标：
 * - 整块楼层采用“右侧商品转化位”样式：全宽白卡 + 平台 Tab + 商品卡片网格
 * - 平台 Tab 分别展示 浩卡联盟 / 172号卡 / 林夕通信 / 卡业联盟 / 翼卡云 / 卡易号卡 的商品
 * - 整体留白克制、色彩柔和、信息层级清晰
 *
 * 多端适配策略：
 * - 移动端（<640px）：2列商品网格
 * - 平板（640-1024px）：3列商品网格
 * - 桌面（≥1024px）：5列商品网格（默认 5 个 × 2 排展示）
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, FileText, Flame, Gift, RefreshCw } from "lucide-react";
import {
    getMallPlatformsProductsAction,
    type MallPlatformKey,
    type MallProductItem,
} from "@/lib/api/mall-products";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import { cn } from "@/lib/utils";

/* ==================================================================
 * 常量配置
 * ================================================================== */

/** 数据请求最大重试次数 */
const MAX_RETRY_COUNT = 3;

/** 数据请求超时时间（毫秒） */
const REQUEST_TIMEOUT_MS = 15_000;

/** 每个 Tab 默认展示的商品数量（桌面端 5 列 × 2 排） */
const PAGE_SIZE = 10;

/** Tab 悬停自动切换的防抖延迟（毫秒，兼顾响应速度与误触） */
const HOVER_SWITCH_DELAY_MS = 120;

/* ==================================================================
 * 类型定义
 * ================================================================== */

/** 平台筛选 Tab 配置 */
interface PlatformTab {
    key: MallPlatformKey | "all";
    label: string;
    icon?: LucideIcon;
}

/** 通用商品图片组件参数 */
interface ProductImageFrameProps {
    src?: string;
    alt: string;
    sizes: string;
    wrapperClassName: string;
    fallbackClassName: string;
    imageClassName?: string;
}

/** 商城首页促销楼层组件参数 */
interface MallProductShowcaseProps {
    /** 服务端预取的初始商品数据 */
    initialProducts: MallProductItem[];
    /** 服务端预取失败信息（无错误为 null） */
    initialError: string | null;
}

/* ==================================================================
 * 静态配置数据
 * ================================================================== */

/** 平台筛选 Tab 选项 */
const PLATFORM_TABS: PlatformTab[] = [
    { key: "all", label: "全部", icon: Flame },
    { key: "haoka", label: "浩卡联盟" },
    { key: "lotml", label: "172号卡" },
    { key: "linxi", label: "林夕通信" },
    { key: "gantanhao", label: "卡业联盟" },
    { key: "yky", label: "翼卡云" },
    { key: "kayi", label: "卡易号卡" },
];

/** 平台角标配置（商品卡片左上角展示来源平台） */
const PLATFORM_BADGE: Record<MallPlatformKey, { label: string; className: string }> = {
    haoka: {
        label: "浩卡联盟",
        className:
            "border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400",
    },
    lotml: {
        label: "172号卡",
        className:
            "border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400",
    },
    linxi: {
        label: "林夕通信",
        className:
            "border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    gantanhao: {
        label: "卡业联盟",
        className:
            "border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400",
    },
    yky: {
        label: "翼卡云",
        className:
            "border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400",
    },
    kayi: {
        label: "卡易号卡",
        className:
            "border border-cyan-200 bg-cyan-50 text-cyan-600 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400",
    },
};

/* ==================================================================
 * 工具函数
 * ================================================================== */

/**
 * 判断图片地址是否为远程 HTTPS 资源。
 *
 * Next/Image 对外部图片常需保留优化能力，而本地或非 HTTPS 图片则禁用优化，
 * 避免出现加载策略不兼容的问题。
 *
 * @param src - 商品图片地址
 * @returns 是否为 HTTPS 远程图片
 */
function isRemoteHttpsImage(src?: string): boolean {
    return typeof src === "string" && src.startsWith("https");
}

/**
 * 带重试和超时的 Server Action 调用封装。
 *
 * 使用指数退避策略：首次立即请求，失败后等待 1s、2s、4s… 依次重试。
 * 单次请求超过 timeoutMs 毫秒自动视为失败。
 *
 * @param retries - 最大重试次数，默认 MAX_RETRY_COUNT
 * @param timeoutMs - 单次请求超时时间（毫秒），默认 REQUEST_TIMEOUT_MS
 * @returns 服务端返回的数据结果
 * @throws 超过重试次数后抛出最后一次错误
 */
async function fetchMallProductsWithRetry(
    retries = MAX_RETRY_COUNT,
    timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Awaited<ReturnType<typeof getMallPlatformsProductsAction>>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        /* 非首次请求前，执行指数退避等待 */
        if (attempt > 0) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
            await new Promise((r) => setTimeout(r, delay));
        }

        try {
            /* 使用 Promise.race 实现超时控制 */
            const result = await Promise.race([
                getMallPlatformsProductsAction(),
                new Promise<never>((_, reject) =>
                    setTimeout(
                        () => reject(new Error(`请求超时（${timeoutMs / 1000}s）`)),
                        timeoutMs
                    )
                ),
            ]);

            /* 所有平台均失败时才重试，部分成功则直接返回 */
            if (result.products.length === 0 && result.errors.length > 0) {
                if (attempt < retries) {
                    lastError = new Error(result.errors.join("；"));
                    continue;
                }
                /* 最后一次重试仍然失败，统一抛出异常 */
                throw new Error(result.errors.join("；"));
            }

            return result;
        } catch (e) {
            lastError = e instanceof Error ? e : new Error(String(e));

            /* 最后一次重试仍失败则跳出循环 */
            if (attempt >= retries) break;
        }
    }

    throw lastError ?? new Error("获取商品数据失败，请稍后重试");
}

/**
 * 通用商品图片展示组件。
 *
 * 统一处理以下逻辑：
 * 1. `next/image` 填充式展示
 * 2. 无图片时的占位文案
 * 3. 远程 HTTPS 图片的优化策略
 *
 * @param props - 图片组件参数
 * @returns 商品图片展示节点
 */
function ProductImageFrame({
    src,
    alt,
    sizes,
    wrapperClassName,
    fallbackClassName,
    imageClassName = "object-cover",
}: ProductImageFrameProps) {
    return (
        <div className={wrapperClassName}>
            {src ? (
                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes={sizes}
                    className={imageClassName}
                    loading="lazy"
                    unoptimized={!isRemoteHttpsImage(src)}
                />
            ) : (
                <div className={fallbackClassName}>暂无图片</div>
            )}
        </div>
    );
}

/* ==================================================================
 * 商品卡片组件
 * ================================================================== */

/**
 * 商城促销商品卡片。
 *
 * 使用 next/image 优化图片加载性能，支持自动 WebP 转换和响应式尺寸。
 * 卡片左上角展示来源平台角标，整卡点击跳转立即办理外链。
 * 移动端增加 active 态反馈提升触控体验。
 *
 * @param props - 组件参数
 * @param props.product - 统一后的商品数据
 * @returns 商品卡片节点
 */
function PromoProductCard({ product }: { product: MallProductItem }) {
    const badge = PLATFORM_BADGE[product.platform];

    return (
        <article
            className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-100/60 active:scale-[0.98] dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-none"
        >
            {/* 图片区：点击进入详情页 */}
            <Link
                href={product.detailUrl}
                className="relative block"
                aria-label={`查看${product.name}详情`}
            >
                {/* 图片相框：灰底 + 内间距，图片不贴边 */}
                <div className="relative aspect-square overflow-hidden bg-gray-50 p-2.5 sm:p-3 dark:bg-gray-800">
                    <ProductImageFrame
                        src={product.image}
                        alt={product.name}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        wrapperClassName="relative h-full w-full overflow-hidden rounded-md"
                        fallbackClassName="flex h-full w-full items-center justify-center text-xs text-gray-400 dark:text-gray-500"
                        imageClassName="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>

                {/* 来源平台角标 */}
                <div
                    className={cn(
                        "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm backdrop-blur-sm sm:px-2.5 sm:py-1 sm:text-[11px]",
                        badge.className
                    )}
                >
                    <Gift className="hidden size-3 sm:block" />
                    {badge.label}
                </div>

                {/* 热度角标：右上角 */}
                <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm sm:px-2.5 sm:py-1 sm:text-[11px]">
                    <Flame className="hidden size-3 sm:block" />
                    热销
                </div>
            </Link>

            {/* 卡片信息区 */}
            <div className="flex flex-1 flex-col p-2.5 sm:p-3">
                <div className="mb-2 flex flex-wrap gap-1.5">
                    {product.tags.length > 0 ? (
                        product.tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
                            >
                                {tag}
                            </span>
                        ))
                    ) : (
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                            正规办理
                        </span>
                    )}
                </div>

                <Link href={product.detailUrl} className="block">
                    <h4 className="line-clamp-2 min-h-[2.6rem] text-[13px] font-semibold leading-5 text-gray-900 transition-colors group-hover:text-blue-600 dark:text-gray-100 sm:min-h-[2.8rem] sm:text-sm sm:leading-6">
                        {product.name}
                    </h4>
                </Link>

                {/* 分隔线 + 价格 + 操作按钮 */}
                <div className="mt-auto border-t border-gray-100 pt-2.5 dark:border-gray-800">
                    <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-end gap-1">
                                <span className="pb-1 text-xs font-semibold text-red-500">¥</span>
                                <span className="text-2xl font-black leading-none tracking-tight text-red-500">
                                    {product.price}
                                </span>
                                <span className="pb-0.5 text-[11px] text-gray-400">/月</span>
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">
                                低月租大流量 · 包邮到家
                            </p>
                        </div>
                    </div>

                    {/* 操作按钮：查看详情 + 立即办理（移动端堆叠、≥640px 并排，避免挤压变形） */}
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <Link
                            href={product.detailUrl}
                            className="inline-flex w-full flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-gray-200 px-2 py-1.5 text-[11px] font-semibold text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 sm:w-auto"
                        >
                            <FileText className="size-3" />
                            查看详情
                        </Link>
                        <a
                            href={product.orderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-full flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-blue-600 px-2 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all duration-300 hover:bg-blue-700 hover:shadow-md dark:bg-blue-500 dark:hover:bg-blue-400 sm:w-auto"
                        >
                            立即办理
                            <ArrowRight className="size-3" />
                        </a>
                    </div>
                </div>
            </div>
        </article>
    );
}

/* ==================================================================
 * 平台 Tab 栏组件
 * ================================================================== */

/**
 * 平台筛选 Tab 栏。
 *
 * 移动端可横向滚动，两端显示渐变遮罩作为可滚动视觉提示；
 * 悬停到 Tab 上延迟 120ms 自动切换，防抖避免鼠标快速划过频繁切换。
 */
function PlatformTabBar({
    activeTab,
    onTabChange,
}: {
    /** 当前激活的 Tab key */
    activeTab: string;
    /** Tab 切换回调 */
    onTabChange: (key: string) => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const hoverTimerRef = useRef<number | null>(null);

    /** 检测并更新左右滚动状态 */
    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 2);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }, []);

    /** 清除尚未触发的悬停切换定时器 */
    const clearHoverTimer = useCallback(() => {
        if (hoverTimerRef.current !== null) {
            window.clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
    }, []);

    /** 鼠标悬停到 Tab 上，延迟后自动切换 */
    const handleTabHover = useCallback(
        (key: string) => {
            clearHoverTimer();
            if (key === activeTab) return;

            hoverTimerRef.current = window.setTimeout(() => {
                hoverTimerRef.current = null;
                onTabChange(key);
            }, HOVER_SWITCH_DELAY_MS);
        },
        [activeTab, clearHoverTimer, onTabChange]
    );

    /* 组件卸载时清理残留的悬停定时器 */
    useEffect(() => clearHoverTimer, [clearHoverTimer]);

    /* 初始和窗口变化时检测滚动状态 */
    useEffect(() => {
        updateScrollState();
        window.addEventListener("resize", updateScrollState);
        return () => window.removeEventListener("resize", updateScrollState);
    }, [updateScrollState]);

    return (
        <div className="relative">
            {/* 左侧渐变遮罩 */}
            {canScrollLeft && (
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-linear-to-r from-white to-transparent dark:from-gray-900" />
            )}

            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto border-b border-gray-100 pb-2 scrollbar-hide dark:border-gray-800 sm:gap-5"
                onScroll={updateScrollState}
                onMouseLeave={clearHoverTimer}
                role="tablist"
                aria-label="平台筛选"
            >
                {PLATFORM_TABS.map((tab) => {
                    const isActive = activeTab === tab.key;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onMouseEnter={() => handleTabHover(tab.key)}
                            onClick={() => {
                                clearHoverTimer();
                                onTabChange(tab.key);
                            }}
                            className={cn(
                                "flex shrink-0 items-center gap-1.5 border-b-2 pb-2 text-[13px] font-semibold transition-colors sm:text-sm",
                                isActive
                                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                                    : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                            )}
                        >
                            {tab.icon ? <tab.icon className="size-3.5" /> : null}
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* 右侧渐变遮罩 */}
            {canScrollRight && (
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-linear-to-l from-white to-transparent dark:from-gray-900" />
            )}
        </div>
    );
}

/* ==================================================================
 * 标题 / 状态区域组件
 * ================================================================== */

/**
 * 商城楼层顶部标题区域。
 *
 * 仅负责标题文案展示，抽离后让主组件聚焦于数据与布局编排。
 *
 * @returns 标题区域节点
 */
function MallSectionHeader() {
    return (
        <div className="mb-5 flex flex-col gap-2 sm:mb-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Flame className="size-3.5" />
                商城爆款推荐
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                        低月租大流量卡专区
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        聚合浩卡联盟/172号卡/林夕通信/卡业联盟/翼卡云/卡易号卡六平台精选商品，在线办理，包邮到家
                    </p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    精选展示，快速浏览，轻松办理
                </span>
            </div>
        </div>
    );
}

/**
 * 商城楼层失败态。
 *
 * @param props - 失败态参数
 * @param props.error - 当前错误信息
 * @param props.onRetry - 用户点击重试时的回调
 * @param props.isRetrying - 是否正在重试
 * @returns 失败态节点
 */
function MallShowcaseError({
    error,
    onRetry,
    isRetrying = false,
}: {
    error: string;
    onRetry: () => void;
    isRetrying?: boolean;
}) {
    return (
        <section id="mall" className="bg-[#f8f9fa] py-10 dark:bg-gray-950 sm:py-12">
            <div className="mx-auto flex min-h-[240px] max-w-5xl flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-white px-5 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:min-h-[280px] sm:px-6">
                <Flame className="mb-3 size-10 text-gray-300 dark:text-gray-600" />
                <p className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
                    数据加载失败
                </p>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{error}</p>
                <button
                    type="button"
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-500 dark:hover:bg-blue-400"
                >
                    <RefreshCw className={cn("size-4", isRetrying && "animate-spin")} />
                    {isRetrying ? "加载中…" : "重新加载"}
                </button>
            </div>
        </section>
    );
}

/**
 * 平台商品网格空状态。
 *
 * @returns 空态提示节点
 */
function EmptyFilteredProducts() {
    return (
        <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50/50 text-center dark:border-gray-800 dark:bg-gray-950/40 sm:min-h-[320px]">
            <Flame className="mb-3 size-10 text-gray-300 dark:text-gray-700" />
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                暂无该平台商品
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                请切换其他平台查看热门套餐
            </p>
        </div>
    );
}

/* ==================================================================
 * 主组件
 * ================================================================== */

/**
 * 商城首页促销楼层主组件。
 *
 * 首屏商品数据由服务端组件（app/page.tsx）取数后以 props 传入，
 * 组件内不再有 loading 状态与骨架屏；仅在六平台全部失败时展示错误态，
 * 用户点击「重新加载」通过 Server Action 重试。
 * 平台 Tab 筛选 + 精选商品卡片网格，每个 Tab 默认展示 10 个商品（5 个 × 2 排）。
 *
 * 多端适配：
 * - 移动端：2列商品网格
 * - 平板（sm-md）：3列商品网格
 * - 桌面（lg）：5列商品网格（默认 5 个 × 2 排展示）
 *
 * 数据请求：
 * - 首屏：服务端组件渲染时直接调用 getMallPlatformsProducts 取数（各平台带 12h 内存缓存）
 * - 重试：失败态点击「重新加载」时调用 Server Action，带指数退避与超时控制
 */
export default function MallProductShowcase({
    initialProducts,
    initialError,
}: MallProductShowcaseProps) {
    const [activeTab, setActiveTab] = useState<MallPlatformKey | "all">("all");
    const [products, setProducts] = useState<MallProductItem[]>(initialProducts);
    const [error, setError] = useState<string | null>(initialError);
    const [isRetrying, setIsRetrying] = useState(false);

    /**
     * 失败重试函数，仅在错误态下由用户点击触发。
     * 使用 useCallback 缓存以保持引用稳定。
     */
    const loadData = useCallback(async () => {
        setIsRetrying(true);

        try {
            const result = await fetchMallProductsWithRetry();
            setProducts(result.products);

            /* 全部平台都失败时才保持失败态；部分成功则恢复展示 */
            if (result.products.length === 0 && result.errors.length > 0) {
                setError(result.errors.join("；"));
            } else {
                setError(null);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "获取商品数据失败，请稍后重试");
        } finally {
            setIsRetrying(false);
        }
    }, []);

    /* 按平台筛选数据源，每个 Tab 固定展示 PAGE_SIZE 个商品 */
    const filteredProducts = useMemo(() => {
        const source =
            activeTab === "all"
                ? products
                : products.filter((product) => product.platform === activeTab);

        return source.slice(0, PAGE_SIZE);
    }, [products, activeTab]);

    /* ===== 加载失败状态（含重试按钮） ===== */
    if (error) {
        return <MallShowcaseError error={error} onRetry={loadData} isRetrying={isRetrying} />;
    }

    /* ===== 正常渲染：整宽“右侧商品转化位”卡片样式 ===== */
    return (
        <section id="mall" className="bg-[#f8f9fa] dark:bg-gray-950">
            <div className={containerClass("py-8 md:py-12")} style={SITE_WIDTH_STYLE}>
                {/* ===== 区段标题 ===== */}
                <MallSectionHeader />

                {/* ===== 全宽白卡：头部 + 平台 Tab + 商品网格 ===== */}
                <div className="rounded-md border border-gray-100 bg-white p-3.5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-4 md:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                精选套餐
                            </h3>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                聚合六大平台热门在售商品
                            </p>
                        </div>
                        <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            共 {filteredProducts.length} 款
                        </span>
                    </div>

                    {/* 平台 Tab 栏（带滚动指示器） */}
                    <PlatformTabBar
                        activeTab={activeTab}
                        onTabChange={(key) => setActiveTab(key as MallPlatformKey | "all")}
                    />

                    {/* 商品网格区域 */}
                    <div className="mt-4">
                        {filteredProducts.length === 0 ? (
                            <EmptyFilteredProducts />
                        ) : (
                            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
                                {filteredProducts.map((product) => (
                                    <PromoProductCard
                                        key={`${product.platform}-${product.id}`}
                                        product={product}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
