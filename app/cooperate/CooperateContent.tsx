/**
 * 合作伙伴页面完整内容组件（CooperateContent）
 *
 * 包含：Hero 区、核心合作伙伴 Logo 展示区、合作价值区。
 * Logo 来源：/public/cooperate/ 目录下的品牌图片。
 * 响应式设计，兼容移动端与桌面端。
 */
"use client";

import { cn } from "@/lib/utils";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import CooperateSection from "@/components/home/CooperateSection";
import {
  Handshake,
  ShieldCheck,
  Zap,
  ArrowRight,
  Star,
} from "lucide-react";


/* ========== 合作价值数据 ========== */

/** 合作价值优势 */
const VALUES = [
  {
    icon: Handshake,
    title: "官方直签",
    desc: "与四大运营商总部直接签约，货源稳定、政策一流，杜绝中间环节加价。",
    color: "text-blue-600",
  },
  {
    icon: ShieldCheck,
    title: "品质保障",
    desc: "合作品牌均通过严格资质审核，为用户提供正规号卡与可靠服务保障。",
    color: "text-emerald-600",
  },
  {
    icon: Zap,
    title: "高效协同",
    desc: "跨品牌资源整合，从选卡到配送无缝衔接，提升代理推广与用户激活效率。",
    color: "text-amber-600",
  },
];

/* ========== Hero 区 ========== */

/** Hero 宣传区 */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* ===== 背景装饰 ===== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* 右上角大圆 */}
        <div className="absolute -top-40 -right-32 h-[600px] w-[600px] rounded-full bg-blue-50/60" />
        {/* 左下角小圆 */}
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-indigo-50/40" />
        {/* 中部光晕 */}
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/30 blur-3xl" />
        {/* 隐藏的网格纹理 */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #3b82f6 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* 右侧装饰线条 */}
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-blue-200/50 to-transparent hidden lg:block" />
      </div>

      <div className={containerClass("relative py-20 md:py-28")} style={SITE_WIDTH_STYLE}>
        <div className="mx-auto max-w-3xl text-center">
          {/* 标签 */}
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            <Star className="size-3.5 text-amber-500" />
            生态伙伴 · 强强联合
          </div>

          {/* 标题 */}
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            合作伙伴
          </h1>

          {/* 描述 */}
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
            号卡之家与全国顶级通信运营商、物流企业深度合作，
            打造从号卡供应到极速配送的全链路服务体系。
          </p>

          {/* CTA 按钮 */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#partners"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30"
            >
              查看合作伙伴
              <ArrowRight className="size-4" />
            </a>
            <a
              href="/join"
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 px-7 py-3 text-sm font-medium text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              加入我们
            </a>
          </div>

          {/* 核心数据 */}
          <div className="mt-14 flex items-center justify-center divide-x divide-slate-200">
            <div className="px-6 text-center sm:px-10">
              <span className="text-2xl font-extrabold text-blue-600 sm:text-3xl">4 大</span>
              <span className="ml-2 text-sm text-slate-400">运营商直签</span>
            </div>
            <div className="px-6 text-center sm:px-10">
              <span className="text-2xl font-extrabold text-slate-800 sm:text-3xl">6+</span>
              <span className="ml-2 text-sm text-slate-400">核心伙伴</span>
            </div>
            <div className="px-6 text-center sm:px-10">
              <span className="text-2xl font-extrabold text-slate-800 sm:text-3xl">全国</span>
              <span className="ml-2 text-sm text-slate-400">覆盖范围</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========== 合作价值区 ========== */

/** 合作价值区 */
function ValueSection() {
  return (
    <section className="bg-[#f5f7fa]">
      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        <div className="mb-12 text-center md:mb-14">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Handshake className="size-4" />
            合作价值
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            为什么选择这些伙伴
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            强强联合，为代理与用户提供从选卡到激活的全链路保障
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="group relative rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                <v.icon className={cn("size-5", v.color)} />
              </div>
              <h3 className="mb-2 text-base font-semibold">{v.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========== 页面主组件 ========== */

/** 合作伙伴页面完整内容 */
export default function CooperateContent() {
  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header />
      <main>
        <HeroSection />
        <CooperateSection />
        <ValueSection />
      </main>
      <Footer />
    </div>
  );
}
