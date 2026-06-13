/**
 * 新闻资讯列表页面（客户端组件）
 *
 * 展示号卡之家平台的新闻资讯列表，支持分类筛选和新闻卡片预览。
 * 参考 Tailwind UI Blog Section 设计规范。
 * 数据来源：服务端从 content/news/*.md 解析后传递
 */

"use client";

import { useState, useMemo, useRef, useCallback, useEffect, useReducer } from "react";
import Link from "next/link";
import Image from "next/image";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/lib/data/news-types";
import { getCategoryConfig } from "@/lib/data/news-types";
import {
    Eye,
    Calendar,
    RefreshCw,
} from "lucide-react";

/* ========== Props 类型 ========== */

interface NewsContentProps {
    /** 全部新闻文章（已排序） */
    articles: NewsArticle[];
    /** 全部分类列表（含"全部"） */
    allCategories: string[];
}

/* ========== 分类筛选栏 ========== */

/** 新闻分类筛选标签栏
 *  - 移动端：横向滚动（隐藏滚动条 + snap 对齐），紧凑药丸
 *  - 桌面端：居中 flex-wrap 排列，舒适药丸
 *  - 激活态：蓝色填充 + 彩色扩散阴影
 *  - 非激活态：灰色浅底，hover 加深
 */
function CategoryBar({
    categories,
    activeCategory,
    onSelect,
}: {
    categories: string[];
    activeCategory: string;
    onSelect: (category: string) => void;
}) {
    return (
        <div className="-mx-4 overflow-x-auto scrollbar-hide px-4 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
            <div className="flex snap-x gap-2.5 sm:flex-wrap sm:justify-center sm:gap-3 sm:snap-none">
                {categories.map((cat) => {
                    const config = getCategoryConfig(cat);
                    const isActive = activeCategory === cat;
                    return (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => onSelect(cat)}
                            className={cn(
                                "inline-flex shrink-0 snap-start items-center rounded-full font-medium transition-all duration-200",
                                "px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm",
                                "active:scale-95",
                                isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25 dark:bg-blue-500 dark:shadow-blue-500/25"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            )}
                        >
                            {config?.label || cat}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ========== 新闻卡片 ========== */

/** 单篇新闻卡片组件 */
function NewsCard({ article }: { article: NewsArticle }) {
    const categoryConfig = getCategoryConfig(article.category);
    // 将 wordCount 作为模拟阅读量展示
    const reads = article.wordCount;

    return (
        <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
            {/* ===== 封面图 ===== */}
            <Link href={`/news/${article.id}`} className="relative block overflow-hidden">
                <div className="aspect-video w-full">
                    <Image
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                </div>
                {/* 封面环形边框装饰 */}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10 dark:ring-white/10" />
            </Link>

            {/* ===== 内容区域 ===== */}
            <div className="flex flex-1 flex-col p-4 sm:p-5">
                {/* 日期 + 分类 */}
                <div className="mb-3 flex items-center gap-x-3 text-xs">
                    <time
                        dateTime={article.datetime}
                        className="flex items-center gap-1 text-gray-500 dark:text-gray-400"
                    >
                        <Calendar className="size-3.5" />
                        {article.date}
                    </time>
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryConfig?.bg || "bg-gray-100"} ${categoryConfig?.color || "text-gray-600"}`}
                    >
                        {categoryConfig?.label || article.category}
                    </span>
                </div>

                {/* 标题 */}
                <h3 className="mb-2 text-base font-semibold leading-snug text-gray-900 transition-colors group-hover:text-blue-600 sm:text-lg dark:text-white dark:group-hover:text-blue-400">
                    <Link href={`/news/${article.id}`}>
                        <span className="absolute inset-0" />
                        {article.title}
                    </Link>
                </h3>

                {/* 描述 */}
                <p className="mb-3 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {article.description}
                </p>

                {/* 作者信息 */}
                <div className="mt-auto flex items-center gap-x-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <Image
                            src={article.author.avatarUrl}
                            alt={article.author.name}
                            fill
                            className="object-cover"
                            sizes="36px"
                        />
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                        <p className="truncate font-semibold text-gray-900 dark:text-white">
                            {article.author.name}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {article.author.role}
                        </p>
                    </div>
                    {/* 字数标签 */}
                    <div className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
                        <Eye className="size-3.5" />
                        {reads >= 1000
                            ? `${(reads / 1000).toFixed(1)}k`
                            : reads}
                    </div>
                </div>
            </div>
        </article>
    );
}

/* ========== 分页加载 ========== */

/** 每页加载数量 */
const PAGE_SIZE = 12;

/** visibleCount reducer 操作类型 */
type VisibleAction = { type: "reset" } | { type: "loadMore"; maxCount: number };

/**
 * visibleCount reducer
 * reset → 回到 PAGE_SIZE；loadMore → 追加一页但不超出总量
 */
function visibleReducer(state: number, action: VisibleAction): number {
    switch (action.type) {
        case "reset":
            return PAGE_SIZE;
        case "loadMore":
            return Math.min(state + PAGE_SIZE, action.maxCount);
    }
}

/* ========== 新闻列表网格 ========== */

/** 新闻卡片网格布局 */
function NewsGrid({ articles }: { articles: NewsArticle[] }) {
    if (articles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Eye className="mb-4 size-12 text-gray-300" />
                <p className="text-base font-medium text-gray-500">
                    暂无相关新闻
                </p>
                <p className="mt-1 text-sm text-gray-400">
                    请尝试调整筛选条件
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((article) => (
                <NewsCard key={article.id} article={article} />
            ))}
        </div>
    );
}

/* ========== 主入口 ========== */

/** 新闻资讯页面主体组件 */
export default function NewsContent({ articles, allCategories }: NewsContentProps) {
    /* ===== 分类筛选状态 ===== */
    const [activeCategory, setActiveCategory] = useState<string>("全部");

    /* ===== 筛选后的文章列表 ===== */
    const filteredArticles = useMemo(() => {
        if (activeCategory === "全部") return articles;
        return articles.filter((n) => n.category === activeCategory);
    }, [activeCategory, articles]);

    /* ===== 分页状态 ===== */
    const [visibleCount, dispatchVisible] = useReducer(visibleReducer, PAGE_SIZE);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // 分类切换时重置分页
    useEffect(() => {
        dispatchVisible({ type: "reset" });
    }, [activeCategory]);

    const displayed = filteredArticles.slice(0, visibleCount);
    const hasMore = displayed.length < filteredArticles.length;

    /* ===== IntersectionObserver 自动加载更多 ===== */
    const loadMore = useCallback(() => {
        dispatchVisible({ type: "loadMore", maxCount: filteredArticles.length });
    }, [filteredArticles.length]);

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

    return (
        <>
            {/* ===== 页面标题区域 ===== */}
            <section className="bg-gradient-to-b from-gray-50 to-white py-10 dark:from-gray-900 dark:to-gray-950 sm:py-16">
                <div className={containerClass()} style={SITE_WIDTH_STYLE}>
                    <div className="mx-auto max-w-2xl text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                            新闻资讯
                        </h1>
                        <p className="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-400">
                            号卡行业动态、套餐推荐、使用技巧与政策解读 —— 号卡之家官方资讯频道
                        </p>
                    </div>

                    {/* ===== 分类筛选栏 ===== */}
                    <div className="mt-6 sm:mt-8 sm:flex sm:justify-center">
                        <CategoryBar
                            categories={allCategories}
                            activeCategory={activeCategory}
                            onSelect={setActiveCategory}
                        />
                    </div>
                </div>
            </section>

            {/* ===== 新闻列表 ===== */}
            <div className={containerClass("py-8 sm:py-12")} style={SITE_WIDTH_STYLE}>
                <NewsGrid articles={displayed} />

                {/* ===== 分页信息栏 ===== */}
                {filteredArticles.length > 0 && (
                    <div className="mt-8">
                        {/* 进度条 */}
                        <div className="mx-auto mb-4 h-1.5 max-w-xs overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                                className="h-full rounded-full bg-linear-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out dark:from-blue-400 dark:to-blue-500"
                                style={{ width: `${Math.round((displayed.length / filteredArticles.length) * 100)}%` }}
                            />
                        </div>

                        {hasMore && (
                            <div className="flex flex-col items-center gap-3">
                                {/* 进度文字 */}
                                <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                                    已展示
                                    <span className="mx-1 font-semibold text-gray-600 dark:text-gray-300">{displayed.length}</span>
                                    篇，共
                                    <span className="mx-1 font-semibold text-gray-600 dark:text-gray-300">{filteredArticles.length}</span>
                                    篇
                                </p>
                                {/* 哨兵 + 加载更多按钮 */}
                                <div ref={sentinelRef} className="h-1 w-full" />
                                <button
                                    type="button"
                                    onClick={loadMore}
                                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:border-blue-500/30 dark:hover:text-blue-400"
                                >
                                    <RefreshCw className="size-4" />
                                    加载更多（剩余 {filteredArticles.length - displayed.length} 篇）
                                </button>
                            </div>
                        )}

                        {!hasMore && (
                            <div className="mx-auto mt-3 flex max-w-xs items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 shadow-sm dark:bg-blue-700">
                                <span className="inline-block size-2 rounded-full bg-white/70" />
                                <span className="text-sm font-medium text-white">
                                    已展示全部
                                    <span className="mx-1 font-semibold">{filteredArticles.length}</span>
                                    篇文章
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
