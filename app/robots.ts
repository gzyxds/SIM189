/**
 * robots.txt 配置
 *
 * 声明搜索引擎爬虫规则，指向 sitemap 位置。
 * Next.js App Router 自动输出为 /robots.txt。
 */
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.sim189.cn";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
