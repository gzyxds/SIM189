"use client";

/**
 * 核心优势区域组件（FeaturesSection）
 *
 * 参考腾讯云「解决方案 + 客户案例」区块样式重构：
 * - 头部：标签 + 主标题 + 右侧链接
 * - 主体：Tab 方案切换（左侧方案要点 + 相关平台 + 操作按钮 / 右侧案例与数据指标）
 * - 底部：合作平台与运营商墙（带装饰线的居中标题）
 *
 * 文案全部取自本项目现有区块（Hero / WhyChoose / Guarantee 等），未新增虚构数据。
 */

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import { cn } from "@/lib/utils";
import {
  Wifi,
  Users,
  MapPin,
  TrendingUp,
  Check,
  ArrowRight,
  Store,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

/* ========== 数据 ========== */

/** 号卡平台（Tab 内「相关平台」与底部平台墙共用） */
const PLATFORMS = [
  { name: "172号卡", href: "/lotml" },
  { name: "号卡精选", href: "/haoka" },
  { name: "翼卡云", href: "/yky" },
  { name: "林夕通信", href: "/linxi" },
  { name: "卡业联盟", href: "/gantanhao" },
  { name: "卡易号卡", href: "/kayi" },
];

/** 四大运营商 */
const OPERATORS = [
  { name: "移动", color: "bg-green-500" },
  { name: "电信", color: "bg-blue-500" },
  { name: "联通", color: "bg-orange-500" },
  { name: "广电", color: "bg-purple-500" },
];

/** 数据指标（取自首页 Hero 既有统计） */
const METRICS = [
  { value: "100万+", label: "用户信赖" },
  { value: "300+", label: "城市覆盖" },
  { value: "4.9分", label: "用户好评" },
];

/** 方案 Tab 配置 */
interface SolutionTab {
  id: string;
  icon: ComponentType<{ className?: string }>;
  name: string;
  title: string;
  caseTitle: string;
  caseDesc: string;
  features: string[];
  platforms: { name: string; href: string }[];
  btnLabel: string;
  btnHref: string;
}

const SOLUTION_TABS: SolutionTab[] = [
  {
    id: "personal",
    icon: Wifi,
    name: "个人上网",
    title: "个人上网，19元起畅享高速5G",
    caseTitle: "个人用户首选 · 月租低至19元",
    caseDesc:
      "四大运营商官方正规流量卡，299G大流量全国通用不限速，免费包邮到家，自主激活，7×12小时专属客服全程指导。",
    features: [
      "5G/4G双模高速网络，峰值速率可达500Mbps，刷视频、打游戏、看直播都不卡顿",
      "流量全国通用，不限地区、不限APP，出差旅行、回家过年都能畅快使用",
      "月租透明低至19元，无隐形消费、无强制捆绑，套餐内容官方APP随时可查",
    ],
    platforms: [PLATFORMS[0], PLATFORMS[1], PLATFORMS[2], PLATFORMS[3]],
    btnLabel: "立即办理",
    btnHref: "/haoka",
  },
  {
    id: "family",
    icon: Users,
    name: "家庭共享",
    title: "家庭共享，一张卡盘活全家设备",
    caseTitle: "多设备共享 · 家庭上网更省心",
    caseDesc:
      "手机开热点即可让平板、笔记本、电视共享高速网络；一证五号合规办理，家庭成员各选各的套餐，官方APP统一管理。",
    features: [
      "手机热点即开即用，平板、笔记本、电视多设备共享高速网络",
      "一证五号政策合规办理，家庭成员按需选卡、互不干扰",
      "套餐详情、流量余额官方APP统一查询，全家用卡一目了然",
    ],
    platforms: [PLATFORMS[2], PLATFORMS[3], PLATFORMS[4]],
    btnLabel: "挑选套餐",
    btnHref: "/haoka",
  },
  {
    id: "travel",
    icon: MapPin,
    name: "出行出差",
    title: "全国畅行，走到哪流量跟到哪",
    caseTitle: "跨省出行 · 全国通用不断网",
    caseDesc:
      "流量全国通用，跨省出差旅行不漫游、不加价；在线下单京东/EMS包邮配送，1-3天送达，自主激活无需排队。",
    features: [
      "流量全国通用，跨省出差旅行不漫游、不加价",
      "免费包邮到家，京东/EMS配送1-3天送达，自主激活",
      "支持全国大部分地区发货，偏远地区以下单页提示为准",
    ],
    platforms: [PLATFORMS[0], PLATFORMS[1], PLATFORMS[4], PLATFORMS[5]],
    btnLabel: "立即办理",
    btnHref: "/haoka",
  },
  {
    id: "agent",
    icon: TrendingUp,
    name: "代理推广",
    title: "0成本加盟，一张卡最高赚200元",
    caseTitle: "百万代理 · 日结提现秒到账",
    caseDesc:
      "四大运营商一级代理资质，合同透明可查验；每张卡最高200元佣金，日结提现秒到账，独立SaaS后台订单佣金一目了然。",
    features: [
      "四大运营商一级代理资质，合同透明可查验",
      "每张卡最高200元佣金，日结提现秒到账",
      "独立SaaS后台订单、佣金、数据一目了然，1对1运营顾问全程陪跑",
    ],
    platforms: PLATFORMS,
    btnLabel: "成为代理",
    btnHref: "/join",
  },
];

/* ========== 主组件 ========== */

/** 核心优势区域 */
export default function FeaturesSection() {
  const [activeId, setActiveId] = useState(SOLUTION_TABS[0].id);
  const activeTab = SOLUTION_TABS.find((t) => t.id === activeId) ?? SOLUTION_TABS[0];

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-white"
    >
      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        {/* ===== 头部：标签 + 标题 + 右侧链接 ===== */}
        <div className="mb-10 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
              <Sparkles className="size-4" />
              核心优势
            </div>
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              让每一张流量卡，
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {" "}都物超所值
              </span>
            </h2>
          </div>
          <Link
            href="/haoka"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            查看全部套餐
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* ===== Tab 栏（移动端横向滚动） ===== */}
        <div
          role="tablist"
          aria-label="解决方案分类"
          className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mb-8"
        >
          {SOLUTION_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`feature-panel-${tab.id}`}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600"
                )}
                onClick={() => setActiveId(tab.id)}
              >
                <Icon className="size-4" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* ===== Tab 面板：左方案 + 右案例指标 ===== */}
        <div
          id={`feature-panel-${activeTab.id}`}
          role="tabpanel"
          className="overflow-hidden rounded-md border border-slate-200/80 bg-white shadow-sm"
        >
          <div className="grid lg:grid-cols-[1.2fr_1fr]">
            {/* 左侧：方案要点 + 相关平台 + 操作按钮 */}
            <div className="p-6 sm:p-8">
              <h3 className="mb-5 text-xl font-bold sm:text-2xl">{activeTab.title}</h3>

              <ul className="mb-6 space-y-3.5">
                {activeTab.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm bg-blue-50">
                      <Check className="size-3.5 text-blue-600" />
                    </span>
                    <span className="text-sm leading-relaxed text-slate-600 sm:text-base">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* 相关平台 */}
              <div className="mb-6">
                <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  相关平台
                </div>
                <div className="flex flex-wrap items-center gap-y-2.5">
                  {activeTab.platforms.map((p, i) => (
                    <span key={p.name} className="flex items-center">
                      {i > 0 && <span className="mx-3 h-4 w-px bg-slate-200" />}
                      <Link
                        href={p.href}
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-700 transition-colors hover:text-blue-600"
                      >
                        <Store className="size-4 text-blue-500" />
                        {p.name}
                      </Link>
                    </span>
                  ))}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={activeTab.btnHref}
                  className="inline-flex items-center gap-2 rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  {activeTab.btnLabel}
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/services"
                  className="group inline-flex items-center gap-1 text-sm font-medium text-blue-600"
                >
                  查看更多服务
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* 右侧：案例 + 数据指标 */}
            <div className="relative flex flex-col justify-between overflow-hidden border-t border-slate-200/80 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 p-6 sm:p-8 lg:border-l lg:border-t-0">
              {/* 装饰光晕 */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-100/50 blur-2xl"
              />

              <div className="relative">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-semibold text-blue-700">
                  <ShieldCheck className="size-3.5" />
                  号卡之家
                </div>
                <h4 className="mb-3 text-lg font-bold">{activeTab.caseTitle}</h4>
                <p className="text-sm leading-relaxed text-slate-600">
                  {activeTab.caseDesc}
                </p>
              </div>

              {/* 数据指标 */}
              <div className="relative mt-8 grid grid-cols-3 gap-4 border-t border-slate-200/70 pt-6">
                {METRICS.map((m) => (
                  <div key={m.label}>
                    <div className="text-xl font-extrabold text-blue-600 sm:text-2xl">
                      {m.value}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== 底部：平台与运营商墙 ===== */}
        <div className="mt-10 rounded-md border border-slate-200/80 bg-white px-5 py-7 sm:px-8">
          {/* 平台墙标题 */}
          <h3 className="mb-6 text-center text-base font-bold sm:text-lg">
            与优质号卡平台深度合作，共创价值
          </h3>

          {/* 平台墙 */}
          <div className="mb-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {PLATFORMS.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
              >
                <Store className="size-4 text-slate-300" />
                {p.name}
              </Link>
            ))}
          </div>

          {/* 运营商 */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-slate-100 pt-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              合作运营商
            </span>
            {OPERATORS.map((op) => (
              <div key={op.name} className="flex items-center gap-1.5">
                <span className={cn("inline-block size-2 rounded-full", op.color)} />
                <span className="text-sm font-medium text-slate-600">{op.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
