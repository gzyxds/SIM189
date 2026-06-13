/**
 * 新闻详情页面（客户端组件）
 *
 * 双栏布局展示完整新闻内容：
 * - 左侧（2/3）：封面图、标题、元信息、摘要引用、正文、分享按钮
 * - 右侧（1/3）：文章目录、作者信息、相关推荐、热门标签
 *
 * 交互功能：阅读进度条、目录高亮跟随滚动、分享（微信/微博/复制链接）
 * 参考设计：Astro 博客详情页 [slug].astro
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import type { NewsArticle } from "@/lib/data/news-types";
import { getCategoryConfig } from "@/lib/data/news-types";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import {
    Calendar,
    User,
    Clock,
    ArrowLeft,
    Share2,
    Copy,
    MessageCircle,
} from "lucide-react";

/* ========== 常量 ========== */

/** 中文阅读速度：每分钟约 400 字 */
const CHARS_PER_MINUTE = 400;

/* ========== Props 类型 ========== */

interface DetailContentProps {
    /** 当前新闻文章数据 */
    article: NewsArticle;
    /** 相关推荐文章（服务端筛选后传入） */
    relatedArticles: NewsArticle[];
}

/** TOC 目录项 */
interface TocHeading {
    id: string;
    text: string;
    level: number;
}

/* ========== 工具函数 ========== */

/** 根据字数估算阅读时间（分钟） */
function estimateReadingTime(wordCount: number): number {
    return Math.max(1, Math.ceil(wordCount / CHARS_PER_MINUTE));
}

/* ========== 阅读进度条 ========== */

/** 顶部固定阅读进度条 */
function ReadingProgress({ progress }: { progress: number }) {
    return (
        <div
            id="reading-progress"
            className="fixed top-0 left-0 z-50 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
        />
    );
}

/* ========== 返回按钮 ========== */

/** 返回新闻列表链接 */
function BackButton() {
    return (
        <div className="mb-6">
            <Link
                href="/news"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
                <ArrowLeft className="size-4" />
                返回新闻列表
            </Link>
        </div>
    );
}

/* ========== 文章头部 ========== */

/** 文章头部：封面图（含渐变遮罩+分类徽章）、标题、元信息、标签、摘要 */
function ArticleHeader({ article }: { article: NewsArticle }) {
    const catConfig = getCategoryConfig(article.category);
    const readingTime = estimateReadingTime(article.wordCount);

    return (
        <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {/* ===== 封面图（含渐变遮罩 + 分类徽章） ===== */}
            <div className="relative h-48 overflow-hidden sm:h-64 md:h-[400px]">
                <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                />
                {/* 底部渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {/* 分类徽章 */}
                <div className="absolute bottom-6 left-8">
                    <span className="inline-block rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                        号卡之家资讯
                    </span>
                </div>
            </div>

            {/* ===== 文章信息区域 ===== */}
            <div className="p-5 md:p-10 lg:p-12">
                {/* 标题 */}
                <h1 className="mb-6 text-2xl font-bold leading-[1.2] text-gray-900 sm:mb-8 sm:text-3xl md:text-5xl dark:text-white">
                    {article.title}
                </h1>

                {/* 元信息：发布日期、作者、阅读时长 */}
                <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-gray-100 pb-6 text-sm text-gray-500 sm:mb-10 sm:gap-6 sm:pb-8 dark:border-gray-800 dark:text-gray-400">
                    {/* 发布日期 */}
                    <div className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Calendar className="size-5" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider opacity-60">
                                发布日期
                            </p>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {article.date}
                            </span>
                        </div>
                    </div>

                    {/* 作者 */}
                    <div className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <User className="size-5" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider opacity-60">
                                文章作者
                            </p>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {article.author.name}
                            </span>
                        </div>
                    </div>

                    {/* 阅读时长 */}
                    <div className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Clock className="size-5" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider opacity-60">
                                阅读建议
                            </p>
                            <span className="font-bold text-gray-900 dark:text-white">
                                约 {readingTime} 分钟
                            </span>
                        </div>
                    </div>
                </div>

                {/* 摘要引用块 */}
                {article.description && (
                    <div className="relative mb-10">
                        <div className="absolute -left-4 top-0 bottom-0 w-1.5 rounded-full bg-blue-600" />
                        <div className="rounded-r-2xl border border-blue-100 bg-blue-50/50 p-6 dark:border-blue-900/30 dark:bg-blue-900/10">
                            <p className="text-lg font-medium leading-relaxed text-gray-700 italic opacity-90 dark:text-gray-300">
                                " {article.description} "
                            </p>
                        </div>
                    </div>
                )}

                {/* 标签 */}
                {article.tags.length > 0 && (
                    <div className="mb-6 flex flex-wrap gap-2">
                        {article.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* 分类 */}
                <div className="mb-4">
                    <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${catConfig?.bg || "bg-gray-100"} ${catConfig?.color || "text-gray-600"}`}
                    >
                        {catConfig?.label || article.category}
                    </span>
                </div>
            </div>
        </article>
    );
}

/* ========== 文章正文 ========== */

/** 文章正文 HTML 渲染区域 */
function ArticleBody({ html }: { html: string }) {
    return (
        <div
            id="article-content"
            className="markdown-body mt-8 border-t border-gray-100 pt-8 sm:mt-10 sm:pt-10 dark:border-gray-800"
            // eslint-disable-next-line react/no-dangerously-set-innerhtml
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

/* ========== 分享按钮 ========== */

/** 分享按钮组：微信、微博、复制链接 */
function ShareButtons() {
    /** 复制当前页面链接到剪贴板 */
    const handleCopyLink = useCallback(() => {
        if (typeof window !== "undefined") {
            navigator.clipboard
                .writeText(window.location.href)
                .then(() => alert("链接已复制到剪贴板"))
                .catch(() => alert("复制失败，请手动复制"));
        }
    }, []);

    /** 分享到微博 */
    const handleShareWeibo = useCallback(() => {
        if (typeof window !== "undefined") {
            window.open(
                `https://service.weibo.com/share/share.php?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(document.title)}`,
                "_blank"
            );
        }
    }, []);

    return (
        <div className="mt-8 border-t border-gray-200 pt-6 sm:mt-10 sm:pt-8 dark:border-gray-800">
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                分享这篇文章
            </h3>
            <div className="flex flex-wrap gap-2">
                {/* 微信 */}
                <button
                    type="button"
                    onClick={() => alert("微信分享功能需要在微信环境中使用")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
                >
                    <MessageCircle className="size-4" />
                    微信
                </button>

                {/* 微博 */}
                <button
                    type="button"
                    onClick={handleShareWeibo}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                >
                    <Share2 className="size-4" />
                    微博
                </button>

                {/* 复制链接 */}
                <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
                >
                    <Copy className="size-4" />
                    复制链接
                </button>
            </div>
        </div>
    );
}

/* ========== 文章目录 ========== */

/** 侧边栏文章目录导航（从正文 heading 动态生成） */
function TableOfContents({
    headings,
    activeId,
}: {
    headings: TocHeading[];
    activeId: string;
}) {
    if (headings.length === 0) {
        return (
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <svg
                        className="size-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                    </svg>
                    文章目录
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">暂无目录</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <svg
                    className="size-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                </svg>
                文章目录
            </h3>
            <nav className="space-y-1">
                {headings.map((heading) => {
                    const isActive = heading.id === activeId;
                    return (
                        <a
                            key={heading.id}
                            href={`#${heading.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(heading.id)?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                });
                            }}
                            className={`toc-link block rounded-md py-1.5 text-sm transition-colors ${isActive
                                ? "font-medium text-blue-600 dark:text-blue-400"
                                : "text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                                }`}
                            style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
                        >
                            {heading.text}
                        </a>
                    );
                })}
            </nav>
        </div>
    );
}

/* ========== 作者卡片 ========== */

/** 侧边栏作者信息卡片 */
function AuthorCard({ article }: { article: NewsArticle }) {
    const authorInitial = article.author.name.charAt(0);

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <User className="size-5 text-blue-600" />
                作者信息
            </h3>
            <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    {authorInitial}
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                        {article.author.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {article.author.role}
                    </p>
                </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                专注于流量卡相关资讯和技术分享，为用户提供最新最全的号卡信息。
            </p>
        </div>
    );
}

/* ========== 相关推荐 ========== */

/** 侧边栏相关推荐列表 */
function RelatedArticles({ articles }: { articles: NewsArticle[] }) {
    if (articles.length === 0) return null;

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <svg
                    className="size-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
                推荐阅读
            </h3>
            <div className="space-y-3">
                {articles.map((a) => (
                    <Link
                        key={a.id}
                        href={`/news/${a.id}`}
                        className="group block rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                        <h4 className="line-clamp-2 text-sm font-medium text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                            {a.title}
                        </h4>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                            {a.description}
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                            <Calendar className="size-3" />
                            {a.date}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

/* ========== 标签云 ========== */

/** 侧边栏热门标签 */
function TagCloud() {
    const tags = [
        "流量卡推荐",
        "使用指南",
        "技术支持",
        "常见问题",
        "最新资讯",
        "套餐对比",
        "运营商",
    ];

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <svg
                    className="size-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                </svg>
                热门标签
            </h3>
            <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                    <Link
                        key={tag}
                        href={`/news?tag=${encodeURIComponent(tag)}`}
                        className="inline-block rounded-md bg-blue-50 px-3 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                    >
                        {tag}
                    </Link>
                ))}
            </div>
        </div>
    );
}

/* ========== 主入口 ========== */

/** 新闻详情客户端组件入口 */
export default function DetailContent({
    article,
    relatedArticles,
}: DetailContentProps) {
    /* ===== 状态 ===== */
    const [progress, setProgress] = useState(0);
    const [headings, setHeadings] = useState<TocHeading[]>([]);
    const [activeId, setActiveId] = useState("");

    /* ===== 目录生成 ===== */
    useEffect(() => {
        const articleEl = document.getElementById("article-content");
        if (!articleEl) return;

        // 等待 DOM 渲染完成后提取标题
        const timer = setTimeout(() => {
            const headingElements = Array.from(
                articleEl.querySelectorAll("h2, h3")
            ) as HTMLHeadingElement[];

            const tocItems: TocHeading[] = headingElements.map((el, i) => {
                const id = `heading-${i}`;
                el.id = id;
                return {
                    id,
                    text: el.textContent || "",
                    level: parseInt(el.tagName.charAt(1), 10),
                };
            });

            setHeadings(tocItems);
        }, 100);

        return () => clearTimeout(timer);
    }, [article.id]);

    /* ===== 滚动处理：阅读进度 + 目录高亮 ===== */
    useEffect(() => {
        const handleScroll = () => {
            /* ---- 阅读进度 ---- */
            const articleEl = document.getElementById("article-content");
            if (articleEl) {
                const articleTop = articleEl.offsetTop;
                const articleHeight = articleEl.offsetHeight;
                const scrollTop = window.pageYOffset;
                const viewportHeight = window.innerHeight;

                const pct = Math.min(
                    100,
                    Math.max(
                        0,
                        ((scrollTop - articleTop + viewportHeight) / articleHeight) * 100
                    )
                );
                setProgress(pct);
            }

            /* ---- 目录高亮 ---- */
            const headingElements = Array.from(
                document.querySelectorAll("#article-content h2, h3")
            ) as HTMLHeadingElement[];

            if (headingElements.length === 0) return;

            let activeIdx = 0;
            for (let i = headingElements.length - 1; i >= 0; i--) {
                const rect = headingElements[i].getBoundingClientRect();
                if (rect.top <= 120) {
                    activeIdx = i;
                    break;
                }
            }
            setActiveId(`heading-${activeIdx}`);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        // 初始调用
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <main>
            {/* ===== 阅读进度条 ===== */}
            <ReadingProgress progress={progress} />

            {/* ===== 文章详情区域 ===== */}
            <section className="pb-10 pt-16 lg:pb-20 lg:pt-[120px] dark:bg-gray-950">
                <div className={containerClass()} style={SITE_WIDTH_STYLE}>
                    {/* 返回按钮 */}
                    <BackButton />

                    {/* 双栏布局 */}
                    <div className="flex flex-wrap gap-8 lg:flex-nowrap">
                        {/* ===== 左侧：主要内容 ===== */}
                        <div className="w-full lg:w-2/3">
                            <ArticleHeader article={article} />
                            <ArticleBody html={article.html} />
                            <ShareButtons />
                        </div>

                        {/* ===== 右侧：侧边栏 ===== */}
                        <div className="w-full lg:w-1/3">
                            <div className="space-y-5 lg:sticky lg:top-24 lg:space-y-6">
                                <TableOfContents headings={headings} activeId={activeId} />
                                <AuthorCard article={article} />
                                <RelatedArticles articles={relatedArticles} />
                                <TagCloud />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
