/**
 * 新闻资讯页面 — 服务端入口
 *
 * 从 content/news/*.md 解析全部 Markdown 文章，
 * 按发布日期降序排列，并传递给客户端 NewsContent 组件。
 */

import type { Metadata } from "next";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import NewsContent from "./NewsContent";
import { getAllNews, getAllCategories } from "@/lib/data/news";

/** 新闻页 SEO 元数据 */
export const metadata: Metadata = {
    title: "新闻资讯",
    description:
        "号卡之家官方资讯频道 — 号卡行业动态、大流量卡套餐推荐、使用技巧与运营商政策解读，帮助您及时了解行业趋势。",
    keywords: [
        "流量卡资讯",
        "号卡新闻",
        "流量卡推荐",
        "大流量卡套餐",
        "号卡行业动态",
        "流量卡办理攻略",
        "运营商政策",
        "手机流量卡",
    ],
    alternates: {
        canonical: "/news",
    },
    openGraph: {
        title: "新闻资讯 | 号卡之家",
        description:
            "号卡之家官方资讯频道 — 号卡行业动态、套餐推荐、使用技巧与政策解读。",
        type: "website",
    },
};

/** 新闻资讯页面入口组件 */
export default function NewsPage() {
    /* ===== 服务端解析全部文章 ===== */
    const articles = getAllNews();
    const allCategories = getAllCategories(articles);

    return (
        <div className="flex min-h-svh flex-col">
            <Header />
            {/* ===== JSON-LD 结构化数据 — Blog Schema ===== */}
            <script
                type="application/ld+json"
                // eslint-disable-next-line react/no-dangerously-set-innerhtml
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Blog",
                        name: "号卡之家新闻资讯",
                        description:
                            "号卡行业动态、套餐推荐、使用技巧与政策解读 — 号卡之家官方资讯频道",
                        url: `${process.env.NEXT_PUBLIC_SITE_URL}/news`,
                        publisher: {
                            "@type": "Organization",
                            name: "号卡之家",
                            url: process.env.NEXT_PUBLIC_SITE_URL,
                        },
                    }),
                }}
            />
            <main className="flex-1">
                <NewsContent articles={articles} allCategories={allCategories} />
            </main>
            <Footer />
        </div>
    );
}
