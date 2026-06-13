/**
 * 关于我们页面完整内容组件（AboutContent）
 *
 * 包含：Hero 区、公司简介、发展历程（时间轴）、团队介绍、联系方式。
 * 响应式设计，兼容移动端与桌面端。
 * 设计风格与 JoinContent 保持一致：白色主基调、slate-50 交替背景。
 */
"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import {
  Building2,
  Eye,
  Target,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Star,
  ArrowRight,
  Zap,
} from "lucide-react";

/* ========== Hero 区 ========== */

/** Hero 宣传区 */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-blue-50 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-[360px] w-[360px] rounded-full bg-slate-100 blur-3xl" />
        {/* 极淡网格纹理 */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#1d4ed8 1px, transparent 1px), linear-gradient(to right, #1d4ed8 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* 右下角同心圆环 */}
        <div className="absolute right-12 bottom-12 size-56 rounded-full border border-blue-100 opacity-60" />
        <div className="absolute right-24 bottom-24 size-32 rounded-full border border-blue-100 opacity-60" />
      </div>

      <div className={containerClass("relative py-20 md:py-28")} style={SITE_WIDTH_STYLE}>
        <div className="mx-auto max-w-2xl text-center">
          {/* 标签 */}
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600">
            <Building2 className="size-3.5 text-blue-500" />
            携手共赢 · 信赖之选
          </div>

          {/* 主标题 */}
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            关于
            <span className="relative mx-2 inline-block text-blue-600">
              号卡之家
              <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-blue-200" />
            </span>
          </h1>

          {/* 副标题 */}
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg">
            以技术驱动号卡行业变革，让每一位用户都能享受便捷、透明、高性价比的号卡服务。
          </p>

          {/* 快速导航按钮 */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#intro"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200"
            >
              了解我们
              <ArrowRight className="size-4" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-7 py-3 text-sm font-medium text-gray-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 hover:shadow-md"
            >
              联系我们
            </a>
          </div>

          {/* 核心数据 */}
          <div className="mt-12 flex items-center justify-center gap-8 sm:gap-14">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gray-900">100万+</div>
              <div className="mt-1 text-xs text-gray-400">累计服务用户</div>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gray-900">4大</div>
              <div className="mt-1 text-xs text-gray-400">运营商直签</div>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gray-900">万人+</div>
              <div className="mt-1 text-xs text-gray-400">月活代理</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========== 公司简介 ========== */

/** 品牌价值主张 */
const BRAND_VALUES = [
  {
    icon: Eye,
    title: "我们的愿景",
    desc: "成为全国领先的通信服务分销平台，让优质号卡触手可及。",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    icon: Target,
    title: "我们的使命",
    desc: "整合四大运营商资源，以技术赋能代理，为用户提供高性价比号卡。",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    icon: Zap,
    title: "核心价值",
    desc: "公开透明、佣金保障、全程扶持 —— 让每一次合作都值得信赖。",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
  },
];

/** 公司简介区 */
function IntroSection() {
  return (
    <section id="intro" className="bg-slate-50">
      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        {/* 标题 */}
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
            <Building2 className="size-4" />
            关于我们
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            公司简介
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">
            号卡之家是一家专注于通信行业号卡分销的互联网平台，
            致力于整合四大运营商优质资源，为全国用户和代理伙伴提供最优质的服务。
          </p>
        </div>

        {/* 品牌价值三卡片 */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BRAND_VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={cn("mx-auto mb-4 flex size-10 items-center justify-center rounded-xl", v.iconBg)}>
                <v.icon className={cn("size-5", v.iconColor)} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-gray-900">{v.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* 平台简介长文 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
            自成立以来，号卡之家始终秉持「公开透明、合作共赢」的理念，
            已与四大运营商建立官方直签合作，累计服务用户超过百万。
            我们通过自研分销系统，为代理商提供实时佣金结算、专属推广素材、
            一对一运营指导等全方位支持，让每一位合伙人轻松实现副业增收。
            未来，我们将继续深耕通信服务领域，拓展更多优质号卡产品，
            打造覆盖全国的智能选卡与分销生态。
          </p>
        </div>
      </div>
    </section>
  );
}

/* ========== 发展历程 ========== */

/** 里程碑数据 */
const MILESTONES = [
  {
    year: "2021",
    title: "平台创立",
    desc: "号卡之家品牌正式成立，首批与移动、联通达成直签合作。",
  },
  {
    year: "2022",
    title: "业务拓展",
    desc: "新增电信运营商合作，号卡产品线扩展至 50+ 款套餐。",
  },
  {
    year: "2023",
    title: "系统升级",
    desc: "自研分销系统上线，实现佣金秒返、订单实时追踪。",
  },
  {
    year: "2024",
    title: "广电接入",
    desc: "与第四大运营商中国广电达成合作，成为全运营商平台。",
  },
  {
    year: "2025",
    title: "生态完善",
    desc: "上线代理培训体系与团队裂变模式，月活代理突破万人。",
  },
  {
    year: "2026",
    title: "全国布局",
    desc: "启动全国千城计划，服务覆盖 300+ 城市，迈向行业第一阵营。",
  },
];

/** 发展历程区（时间轴） */
function TimelineSection() {
  return (
    <section id="history" className="bg-white">
      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        {/* 标题 */}
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
            <Calendar className="size-4" />
            成长之路
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            发展历程
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            从创立到布局全国，每一步都坚实有力
          </p>
        </div>

        {/* ===== 桌面端：左右交替时间轴 ===== */}
        <div className="relative hidden lg:block">
          {/* 中间竖线 */}
          <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-gray-100" aria-hidden="true" />

          <div className="flex flex-col gap-8">
            {MILESTONES.map((m, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div
                  key={m.year}
                  className={`relative flex items-center ${isLeft ? "justify-start" : "justify-end"}`}
                >
                  {/* 内容卡片 */}
                  <div className="w-[calc(50%-2rem)] rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md">
                    <span className="inline-block rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-600">
                      {m.year}
                    </span>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">{m.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{m.desc}</p>
                  </div>

                  {/* 中间节点 */}
                  <div className="absolute left-1/2 z-10 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border-4 border-blue-50 bg-blue-600 shadow-sm">
                    <div className="size-2 rounded-full bg-white" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== 移动端/平板：纵向时间轴 ===== */}
        <div className="relative lg:hidden">
          <div className="absolute top-4 bottom-4 left-6 w-0.5 bg-gray-100" aria-hidden="true" />
          <div className="flex flex-col gap-5">
            {MILESTONES.map((m) => (
              <div key={m.year} className="relative flex gap-4">
                {/* 时间轴节点 */}
                <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white shadow-sm">
                  <span className="text-[10px] font-bold text-blue-600">{m.year.slice(2)}</span>
                </div>
                {/* 内容卡片 */}
                <div className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                    {m.year}
                  </span>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">{m.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========== 团队介绍 ========== */

/** 核心团队数据 */
const TEAM_MEMBERS = [
  {
    name: "张明远",
    role: "创始人 & CEO",
    desc: "前运营商省级渠道总监，15 年通信行业经验，深谙号卡产业链上下游。",
    avatarBg: "bg-blue-600",
  },
  {
    name: "李思涵",
    role: "联合创始人 & CTO",
    desc: "全栈工程师出身，曾主导千万级用户平台架构，负责分销系统技术研发。",
    avatarBg: "bg-emerald-600",
  },
  {
    name: "王瑞峰",
    role: "运营总监",
    desc: "8 年互联网运营经验，擅长代理体系搭建与用户增长策略制定。",
    avatarBg: "bg-violet-600",
  },
  {
    name: "陈晓琳",
    role: "渠道总监",
    desc: "深耕号卡渠道 10 年，拥有广泛的运营商与代理商资源网络。",
    avatarBg: "bg-amber-500",
  },
];

/** 团队介绍区 */
function TeamSection() {
  return (
    <section id="team" className="bg-slate-50">
      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        {/* 标题 */}
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
            <Star className="size-4" />
            核心力量
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            团队介绍
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            由通信与互联网资深人士组成的专业团队
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.name}
              className="group rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
            >
              {/* 头像 */}
              <div
                className={cn(
                  "mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm",
                  member.avatarBg
                )}
              >
                {member.name.charAt(0)}
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{member.name}</h3>
              <p className="mt-1 text-xs font-medium text-blue-600">{member.role}</p>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">{member.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========== 联系方式 ========== */

/** 联系方式数据 */
const CONTACTS = [
  {
    icon: Phone,
    label: "微信客服",
    value: "userhlc",
    desc: "工作日 9:00 - 18:00",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    icon: Mail,
    label: "电子邮箱",
    value: "236749035@qq.com",
    desc: "商务合作请邮件联系",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    icon: MapPin,
    label: "公司地址",
    value: "广东省深圳市",
    desc: "南山区科技园",
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
  },
];

/** 联系我们区 */
function ContactSection() {
  return (
    <section id="contact" className="bg-white">
      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        {/* 标题 */}
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
            <Mail className="size-4" />
            取得联系
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            联系方式
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            期待与您沟通，共创通信服务新未来
          </p>
        </div>

        {/* 联系卡片 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONTACTS.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
            >
              <div className={cn("mx-auto mb-3 flex size-10 items-center justify-center rounded-xl", c.iconBg)}>
                <c.icon className={cn("size-5", c.iconColor)} />
              </div>
              <h3 className="text-xs font-medium text-gray-400">{c.label}</h3>
              <p className="mt-1 text-base font-bold text-gray-900">{c.value}</p>
              <p className="mt-1 text-xs text-gray-400">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* 关注我们 */}
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:items-start sm:gap-8">
            {/* 微信公众号二维码 */}
            <div className="shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <Image
                src="/wx.png"
                alt="号卡之家官方公众号二维码"
                width={128}
                height={128}
                className="size-32 object-contain"
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-base font-semibold text-gray-900">关注号卡之家官方公众号</h3>
              <p className="mt-2 text-sm text-gray-500">
                每日推送热销套餐、代理政策更新与行业资讯
              </p>
              <a
                href="/join"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700"
              >
                加入代理
                <ArrowRight className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========== 页面主组件 ========== */

/** 关于我们页面完整内容 */
export default function AboutContent() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <IntroSection />
        <TimelineSection />
        <TeamSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
