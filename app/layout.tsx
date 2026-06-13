import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import ScrollToTopButton from "@/components/home/ScrollToTopButton";
import { ExternalBrowserGuide } from "@/lib/layout";
import "./globals.css";

/* ========== 字体配置 ========== */

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

/** 站点名称 */
const SITE_NAME = "号卡之家";
/** 站点描述 — 融入核心高搜索指数关键词 */
const SITE_DESC =
  "号卡之家是专业的手机流量卡在线办理平台，提供电信、联通、移动、广电四大运营商正规大流量卡，19元/29元低月租套餐全国通用不限速，官方授权免费申请包邮到家。";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | 手机大流量卡在线办理 — 19元/29元低月租流量卡推荐`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: [
    "号卡之家",
    "流量卡",
    "大流量卡",
    "手机流量卡",
    "流量卡推荐",
    "流量卡办理",
    "19元流量卡",
    "29元流量卡",
    "9元流量卡",
    "低月租大流量",
    "电信流量卡",
    "联通流量卡",
    "移动流量卡",
    "广电流量卡",
    "纯流量卡",
    "学生流量卡",
    "长期套餐流量卡",
    "号卡办理",
    "流量卡代理",
    "浩卡联盟",
  ],

  /* ===== 图标 ===== */
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },

  /* ===== Open Graph ===== */
  openGraph: {
    title: `${SITE_NAME} | 手机大流量卡在线办理`,
    description: SITE_DESC,
    type: "website",
    locale: "zh_CN",
    siteName: SITE_NAME,
    images: [
      {
        url: "/HeroSection/hero.jpg",
        width: 1200,
        height: 630,
        alt: "号卡之家 - 手机大流量卡在线办理平台",
      },
    ],
  },

  /* ===== 其他 SEO ===== */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
  metadataBase: new URL("https://www.sim189.cn"),
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: true,
    address: false,
    email: false,
  },

  /* ===== 其他 ===== */
  applicationName: SITE_NAME,
  referrer: "origin-when-cross-origin",
  creator: "号卡之家",
  publisher: "号卡之家",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 主题色 */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light dark" />
        {/* 禁止百度转码 */}
        <meta httpEquiv="Cache-Control" content="no-transform" />
        <meta httpEquiv="Cache-Control" content="no-siteapp" />
        {/* ===== JSON-LD 结构化数据 — Organization Schema ===== */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "号卡之家",
              url: "https://www.sim189.cn",
              logo: "https://www.sim189.cn/logo.svg",
              description: SITE_DESC,
              sameAs: [
                "https://www.sim189.cn",
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} font-[family-name:var(--font-sans)] antialiased`}
      >
        {children}
        <ScrollToTopButton />
        <ExternalBrowserGuide />
      </body>
    </html>
  );
}
