/**
 * 首页「最新资讯」区块组件
 *
 * 从 content/news/*.md 获取最新文章，展示最新 4 篇新闻卡片，
 * 底部附"查看全部"按钮跳转至 /news 完整列表页。
 *
 * 数据来源：lib/data/news.ts（服务端 Markdown 解析）
 * 复用场景：首页、关于页等任何需要展示最新资讯摘要的页面
 */

import Link from "next/link";
import Image from "next/image";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import { getAllNews } from "@/lib/data/news";
import type { NewsArticle } from "@/lib/data/news-types";
import { getCategoryConfig } from "@/lib/data/news-types";
import { ArrowRight, Calendar, Eye, Newspaper } from "lucide-react";

/* ========== 常量配置 ========== */

/** 首页展示的最新文章数量 */
const LATEST_COUNT = 4;

/* ========== 新闻卡片 ========== */

/** 首页新闻卡片组件 — 简化版，适配首页紧凑布局 */
function LatestNewsCard({ article }: { article: NewsArticle }) {
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
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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

                {/* 底部信息栏 */}
                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                    {/* 作者 */}
                    <div className="flex items-center gap-x-2">
                        <div className="relative size-7 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <Image
                                src={article.author.avatarUrl}
                                alt={article.author.name}
                                fill
                                className="object-cover"
                                sizes="28px"
                            />
                        </div>
                        <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                            {article.author.name}
                        </span>
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

/* ========== 主入口 ========== */

/**
 * 最新资讯区块组件（服务端组件）
 *
 * 自动获取最新 N 篇文章并以 4 列网格展示，
 * 底部提供"查看全部资讯"按钮跳转 /news。
 *
 * @param count - 展示文章数量，默认 4 篇
 */
export default function LatestNewsSection({ count = LATEST_COUNT }: { count?: number }) {
    /* ===== 服务端获取最新文章 ===== */
    const allArticles = getAllNews();
    const articles = allArticles.slice(0, count);

    // 无文章时不渲染此区块
    if (articles.length === 0) return null;

    return (
        <section className="bg-gradient-to-b from-gray-50/50 to-white py-16 md:py-24 dark:from-gray-950 dark:to-gray-900">
            <div className={containerClass()} style={SITE_WIDTH_STYLE}>
                {/* ===== 区块标题 ===== */}
                <div className="mb-12 flex flex-col items-center gap-4 text-center md:mb-14">
                    {/* 图标 + 标签 */}
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <Newspaper className="size-4" />
                        最新资讯
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
                        号卡行业动态与实用攻略
                    </h2>
                    <p className="max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-400">
                        了解最新流量卡套餐推荐、运营商政策解读与办卡用卡技巧，助您做出明智选择
                    </p>
                </div>

                {/* ===== 新闻卡片网格 ===== */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
                    {articles.map((article) => (
                        <LatestNewsCard key={article.id} article={article} />
                    ))}
                </div>

                {/* ===== 底部查看全部按钮 ===== */}
                <div className="mt-10 flex justify-center md:mt-12">
                    <Link
                        href="/news"
                        className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-7 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:border-blue-300 hover:text-blue-600 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:border-blue-500/30 dark:hover:text-blue-400"
                    >
                        查看全部资讯
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
