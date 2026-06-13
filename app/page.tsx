/**
 * 首页入口组件
 *
 * 组合 Header / HeroSection / FeaturesSection / PlansSection / MallProductShowcase /
 * ProcessSection / GuaranteeSection / FAQSection / CTASection / WhyChooseSection / Footer 等子组件
 */

import type { Metadata } from "next";
import Header from "@/components/home/Header";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import PlansSection from "@/components/home/PlansSection";
import MallProductShowcase from "@/components/home/MallProductShowcase";
import ProcessSection from "@/components/home/ProcessSection";
import GuaranteeSection from "@/components/home/GuaranteeSection";
import FAQSection from "@/components/home/FAQSection";
import CTASection from "@/components/home/CTASection";
import WhyChooseSection from "@/components/home/WhyChooseSection";
import LatestNewsSection from "@/components/home/LatestNewsSection";
import Footer from "@/components/home/Footer";

/** 首页 SEO 元数据 — 融入核心高搜索指数关键词 */
export const metadata: Metadata = {
  title: "手机流量卡在线办理平台 | 19元/29元低月租流量卡推荐 - 号卡之家",
  description:
    "号卡之家提供电信、联通、移动、广电四大运营商正规手机大流量卡，19元/29元低月租套餐全国通用不限速，官方授权在线免费申请包邮到家。",
  keywords: [
    "流量卡",
    "大流量卡",
    "手机流量卡",
    "流量卡推荐",
    "流量卡办理",
    "流量卡哪个好",
    "19元流量卡",
    "29元流量卡",
    "9元流量卡",
    "低月租大流量",
    "学生流量卡",
    "纯流量卡",
    "长期套餐流量卡",
    "流量卡代理",
  ],
  alternates: {
    canonical: "/",
  },
};

/** 首页入口组件 */
export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <PlansSection />
        <MallProductShowcase />
        <ProcessSection />
        <GuaranteeSection />
        <FAQSection />
        <WhyChooseSection />
        <LatestNewsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
