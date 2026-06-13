/**
 * 为什么选择我们区块组件（WhyChooseSection）
 *
 * 参考 Aboutsection.astro 设计：
 * - 左侧：统计数据 + 品牌资质 + 核心优势
 * - 右侧：适用场景 + 全程支持
 * - 底部：售后无忧 CTA
 * 全局微圆角 (2-6px)，布局紧凑合理，响应式适配。
 */
"use client";

import Link from "next/link";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import {
  Building2,
  Tag,
  ShieldCheck,
  Rocket,
  Smartphone,
  Users,
  Store,
  TrendingUp,
  Headphones,
  HeartHandshake,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

/* ========== 数据 ========== */

/** 平台数据统计 */
const STATS = [
  { value: "5年+", label: "行业深耕" },
  { value: "100万+", label: "服务代理" },
  { value: "500万+", label: "月激活量" },
];

/** 旗下品牌 */
const BRANDS = [
  { name: "号卡之家号卡", desc: "四大运营商流量卡分销平台，19元起299G大流量" },
  { name: "飞利猫", desc: "随身WiFi产品矩阵，满足多场景上网需求" },
];

/** 核心优势 */
const ADVANTAGES = [
  "四大运营商一级代理资质，合同透明可查验",
  "每张卡最高200元佣金，日结提现秒到账",
];

/** 适用场景 */
const SCENARIOS = [
  {
    icon: Smartphone,
    title: "个人自用",
    desc: "月租19元起，299G大流量，比营业厅套餐省70%",
  },
  {
    icon: Users,
    title: "代理推广",
    desc: "0成本加盟，分享链接即可赚取佣金，百万代理共同选择",
  },
  {
    icon: Store,
    title: "线下门店",
    desc: "实体店/地推团队专属政策，高返利+免费物料支持",
  },
  {
    icon: TrendingUp,
    title: "自媒体变现",
    desc: "抖音/快手/小红书博主专属高佣金方案，一键生成推广海报",
  },
];

/** 全程支持 */
const SUPPORTS = [
  "独立SaaS后台，订单、佣金、数据一目了然",
  "1对1运营顾问全程陪跑，从入门到盈利",
];

/* ========== 主组件 ========== */

/** 为什么选择我们 */
export default function WhyChooseSection() {
  return (
    <section
      id="why-choose"
      className="relative bg-[url('/background/background-6.png')] bg-cover bg-center bg-no-repeat"
    >
      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        {/* ===== 标题区 ===== */}
        <div className="mb-12 text-center md:mb-14">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Sparkles className="size-4" />
            平台实力
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            为什么
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}百万代理{" "}
            </span>
            选择号卡之家流量卡平台
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            从注册到盈利的全链路支持，让流量卡推广变得简单高效
          </p>
        </div>

        {/* ===== 双栏布局 ===== */}
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* ===== 左栏：品牌与资质 ===== */}
          <div className="w-full lg:w-1/2">
            <div className="flex h-full flex-col rounded-md border bg-gradient-to-br from-blue-50/20 via-white to-white p-6 sm:p-8">
              {/* 标题 */}
              <div className="mb-5 flex items-center gap-3 border-b pb-4">
                <div className="flex size-10 items-center justify-center rounded bg-blue-50">
                  <Building2 className="size-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">品牌与资质</h3>
              </div>

              {/* 描述 */}
              <p className="mb-5 leading-relaxed text-muted-foreground">
                号卡之家深耕流量卡分销领域5年+，已发展成为行业领先的号卡分发平台。
                旗下拥有「号卡之家」和「飞利猫」两大品牌，覆盖手机流量卡与随身WiFi两大核心品类。
              </p>

              {/* 旗下品牌 */}
              <div className="mb-5">
                <h4 className="mb-3 flex items-center text-sm font-semibold">
                  <Tag className="mr-2 size-4 text-blue-600" />
                  旗下品牌
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {BRANDS.map((b) => (
                    <div
                      key={b.name}
                      className="rounded bg-muted/50 p-4 transition-colors hover:bg-blue-50/50"
                    >
                      <h5 className="font-semibold">{b.name}</h5>
                      <p className="mt-1 text-xs text-muted-foreground">{b.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 核心优势 */}
              <div>
                <h4 className="mb-3 flex items-center text-sm font-semibold">
                  <ShieldCheck className="mr-2 size-4 text-blue-600" />
                  核心优势
                </h4>
                <ul className="space-y-2.5">
                  {ADVANTAGES.map((a) => (
                    <li key={a} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-blue-600" />
                      <span className="text-sm text-muted-foreground">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 数据统计 */}
              <div className="mt-auto grid grid-cols-3 gap-3 pt-5">
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    className="rounded bg-white p-3 text-center"
                  >
                    <div className="text-lg font-extrabold text-blue-600 sm:text-xl">
                      {s.value}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== 右栏：适用场景 + 全程支持 ===== */}
          <div className="w-full lg:w-1/2">
            <div className="flex h-full flex-col rounded-md border bg-gradient-to-br from-amber-50/20 via-white to-white p-6 sm:p-8">
              {/* 标题 */}
              <div className="mb-5 flex items-center gap-3 border-b pb-4">
                <div className="flex size-10 items-center justify-center rounded bg-amber-50">
                  <Rocket className="size-5 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold">适用场景</h3>
              </div>

              {/* 场景网格 */}
              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SCENARIOS.map((s) => (
                  <div
                    key={s.title}
                    className="group rounded bg-muted/50 p-4 transition-all hover:bg-amber-50/50"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-sm bg-white p-1.5 transition-colors group-hover:bg-amber-50">
                        <s.icon className="size-4 text-muted-foreground transition-colors group-hover:text-amber-600" />
                      </div>
                      <h5 className="font-semibold">{s.title}</h5>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>

              {/* 全程支持 */}
              <div>
                <h4 className="mb-3 flex items-center text-sm font-semibold">
                  <Headphones className="mr-2 size-4 text-blue-600" />
                  全程支持
                </h4>
                <ul className="space-y-2.5">
                  {SUPPORTS.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-blue-600" />
                      <span className="text-sm text-muted-foreground">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 底部 CTA：售后无忧 ===== */}
        <div className="mt-8 rounded-md bg-gradient-to-br from-blue-50 via-indigo-50 to-amber-50 p-8 text-center sm:p-10 lg:px-16 lg:py-12">
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-blue-100">
            <HeartHandshake className="size-6 text-blue-600" />
          </div>
          <h3 className="mb-3 text-xl font-bold">售后无忧 · 运营商直接对接</h3>
          <p className="mx-auto mb-6 max-w-2xl leading-relaxed text-muted-foreground">
            用户完成首充后，售后服务由运营商官方客服直接承接。代理商无需处理任何售后问题
            ——没有退换货压力、没有投诉风险、没有客服成本。您只需专注推广，剩下的交给我们。
          </p>
          <Link
            href="/join"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
          >
            立即加入成为代理
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
