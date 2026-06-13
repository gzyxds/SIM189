/**
 * 新闻详情页面 — 服务端入口
 *
 * 路由：/news/[id]
 * 根据文章 ID 从 content/news/{id}.md 读取并解析 Markdown，
 * 展示完整的新闻内容，包含封面图、HTML 正文、相关推荐等。
 */

import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import DetailContent from "./DetailContent";
import { getNewsById, getAllNews } from "@/lib/data/news";
import { ArrowLeft, BookOpen } from "lucide-react";

/* ========== 动态 Metadata ========== */

/** 根据文章 ID 动态生成 SEO 元数据 */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const article = getNewsById(id);

    if (!article) {
        return { title: "文章未找到 - 号卡之家" };
    }

    return {
        title: `${article.title} - 号卡之家`,
        description: article.description,
        keywords: [
            "流量卡",
            "新闻资讯",
            article.category,
            "大流量卡",
            "手机流量卡",
            ...article.tags,
        ],
        alternates: {
            canonical: `/news/${id}`,
        },
        openGraph: {
            title: `${article.title} | 号卡之家`,
            description: article.description,
            type: "article",
            publishedTime: article.datetime,
            authors: [article.author.name],
            images: article.imageUrl ? [article.imageUrl] : [],
        },
    };
}

/* ========== 页面入口 ========== */

/** 新闻详情页面组件 */
export default async function NewsDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const article = getNewsById(id);

    // 文章未找到
    if (!article) {
        return (
            <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
                <Header />
                <main className="flex flex-1 items-center justify-center px-4">
                    <div className="text-center">
                        <BookOpen className="mx-auto mb-4 size-12 text-gray-300" />
                        <h2 className="mb-1 text-lg font-semibold text-gray-700">
                            文章未找到
                        </h2>
                        <p className="mb-4 text-sm text-gray-400">
                            文章不存在或已被删除
                        </p>
                        <Link
                            href="/news"
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                            <ArrowLeft className="size-4" /> 返回新闻列表
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    /* ===== 相关推荐：同分类最多 3 篇 ===== */
    const allArticles = getAllNews();
    const relatedArticles = allArticles
        .filter((a) => a.id !== article.id && a.category === article.category)
        .slice(0, 3);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            <Header />
            {/* ===== JSON-LD 结构化数据 — Article Schema ===== */}
            <script
                type="application/ld+json"
                // eslint-disable-next-line react/no-dangerously-set-innerhtml
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Article",
                        headline: article.title,
                        description: article.description,
                        image: article.imageUrl || undefined,
                        datePublished: article.datetime,
                        dateModified: article.datetime,
                        author: {
                            "@type": "Person",
                            name: article.author.name,
                            image: article.author.avatarUrl || undefined,
                        },
                        publisher: {
                            "@type": "Organization",
                            name: "号卡之家",
                            url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.sim189.cn",
                            logo: {
                                "@type": "ImageObject",
                                url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.sim189.cn"}/logo.svg`,
                            },
                        },
                        mainEntityOfPage: {
                            "@type": "WebPage",
                            "@id": `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.sim189.cn"}/news/${article.id}`,
                        },
                    }),
                }}
            />
            <DetailContent article={article} relatedArticles={relatedArticles} />
            <Footer />
        </div>
    );
}
