import Link from "next/link";
import { containerClass, SITE_WIDTH_STYLE } from "@/lib/layout";
import {
  ArrowRight,
  Banknote,
  Package,
  Rocket,
  ShieldCheck,
  Signal,
} from "lucide-react";

/**
 * 首页底部 CTA（行动号召）区 —— 左右布局紧凑浅色版
 *
 * - 左侧：标签 + 标题 + 描述 + 双按钮（立即加入 / 免费领取）；
 * - 右侧：权益卡点（口径与 Hero 核心优势保持一致，md+ 显示）；
 * - 背景与面板统一为「白 → 浅蓝白」白色渐变，整体高度保持紧凑。
 *
 * 注意：Tailwind v4 已移除 bg-gradient-to-*，这里统一使用 bg-linear-to-*。
 */

/** 右侧权益卡点数据 */
const BENEFITS = [
  { icon: Banknote, title: "19元起", desc: "超低月租", color: "text-orange-500", bg: "bg-orange-50" },
  { icon: Signal, title: "299G", desc: "通用流量", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: Package, title: "免费包邮", desc: "送到家", color: "text-green-500", bg: "bg-green-50" },
  { icon: ShieldCheck, title: "官方授权", desc: "正规号卡", color: "text-purple-500", bg: "bg-purple-50" },
];

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-white via-blue-50/40 to-white">
      <div className={containerClass("py-8 md:py-12")} style={SITE_WIDTH_STYLE}>
        {/* ===== 白色渐变 CTA 卡片 ===== */}
        <div className="relative isolate overflow-hidden rounded-[22px] border border-blue-100/70 bg-linear-to-br from-white via-blue-50/50 to-indigo-50/60 px-5 py-8 shadow-sm sm:px-8 md:px-10 md:py-10 lg:px-14">
          {/* ===== 浅色背景装饰层（低对比，避免喧宾夺主） ===== */}
          <div
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit] opacity-50"
            aria-hidden="true"
          >
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 2560 1700"
              preserveAspectRatio="xMidYMid slice"
              focusable="false"
            >
              {/* 软线：左侧回环与底部横线 */}
              <g
                fill="none"
                stroke="rgba(59, 130, 246, 0.12)"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="2.5 9"
                vectorEffect="non-scaling-stroke"
              >
                <path d="M -36 408 H 101 C 125 408 143 427 143 451" />
                <path d="M -36 451 H 58 C 79 451 95 468 95 489 V 698 C 95 719 112 736 133 736 H 702 V 943" />
                <path d="M -36 430 H 81 C 102 430 119 447 119 468 V 676 C 119 697 136 714 158 714 H 281" />
                <path d="M 143 443 V 661 C 143 678 157 691 174 691 H 351" />
                <path d="M 1340 1249 H 2418" />
                <path d="M 2418 1249 V 1718" />
                <path d="M 1248 1608 H 2584" />
              </g>
              {/* 主线：顶部横轨与右侧弧形 */}
              <g
                fill="none"
                stroke="rgba(99, 102, 241, 0.16)"
                strokeWidth="0.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="2.5 9"
                vectorEffect="non-scaling-stroke"
              >
                <path d="M 143 443 H 2462 V 994" />
                <path d="M 1340 780 C 1455 552 1652 443 1880 443 C 2184 443 2410 628 2462 994 C 2469 1088 2460 1196 2418 1249" />
              </g>
              {/* 节点 */}
              <g>
                <circle
                  cx="143"
                  cy="443"
                  r="4.5"
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="rgba(59, 130, 246, 0.22)"
                  strokeWidth="0.75"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx="128"
                  cy="736"
                  r="4.5"
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="rgba(59, 130, 246, 0.22)"
                  strokeWidth="0.75"
                  vectorEffect="non-scaling-stroke"
                />
                <rect
                  x="696"
                  y="730"
                  width="12"
                  height="12"
                  rx="1.5"
                  fill="rgba(99, 102, 241, 0.14)"
                  stroke="rgba(59, 130, 246, 0.25)"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                />
                <rect
                  x="1874"
                  y="437"
                  width="12"
                  height="12"
                  rx="1.5"
                  fill="rgba(99, 102, 241, 0.14)"
                  stroke="rgba(59, 130, 246, 0.25)"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                />
                <rect
                  x="2456"
                  y="437"
                  width="12"
                  height="12"
                  rx="1.5"
                  fill="rgba(99, 102, 241, 0.14)"
                  stroke="rgba(59, 130, 246, 0.25)"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx="2462"
                  cy="994"
                  r="4.5"
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="rgba(59, 130, 246, 0.22)"
                  strokeWidth="0.75"
                  vectorEffect="non-scaling-stroke"
                />
                <rect
                  x="2412"
                  y="1243"
                  width="12"
                  height="12"
                  rx="1.5"
                  fill="rgba(99, 102, 241, 0.14)"
                  stroke="rgba(59, 130, 246, 0.25)"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                />
                <rect
                  x="2412"
                  y="1602"
                  width="12"
                  height="12"
                  rx="1.5"
                  fill="rgba(99, 102, 241, 0.14)"
                  stroke="rgba(59, 130, 246, 0.25)"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            </svg>

            {/* 左右浅色光晕 */}
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl"></div>
            <div className="absolute -bottom-28 right-[10%] h-80 w-80 rounded-full bg-indigo-100/40 blur-3xl"></div>
          </div>

          {/* ===== 左右两栏内容 ===== */}
          <div className="relative z-10 flex flex-col gap-8 md:grid md:grid-cols-[1fr_auto] md:items-center md:gap-10 lg:gap-14">
            {/* 左侧：文案与双按钮 */}
            <div className="max-w-2xl">
              {/* 身份标签 */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/90 px-3.5 py-1 text-xs font-semibold text-blue-600 ring-1 ring-blue-100 sm:text-sm">
                <Rocket className="size-3.5" aria-hidden="true" />
                代理合作
              </span>

              {/* 标题（沿用原文案） */}
              <h2 className="mt-3 text-xl font-bold leading-snug tracking-tight text-slate-900 sm:text-2xl md:text-3xl lg:text-[32px]">
                还等什么？开启您的流量卡代理之旅
              </h2>

              {/* 描述（沿用原文案） */}
              <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                立即注册成为代理，开启您的赚钱之旅
              </p>

              {/* 双按钮：立即加入 / 免费领取 */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 md:mt-6">
                <Link
                  href="/join"
                  className="group inline-flex items-center gap-2 rounded-full bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                >
                  <span>立即加入</span>
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  href="/haoka"
                  className="group inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-8 py-3 text-sm font-semibold text-blue-600 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                >
                  <span>免费领取</span>
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>

            {/* 右侧：权益卡点（md+ 显示，口径与 Hero 核心优势一致） */}
            <div className="hidden w-full max-w-sm shrink-0 grid-cols-2 gap-3 md:grid lg:max-w-[380px]">
              {BENEFITS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-center gap-2.5 rounded-lg border border-blue-100/60 bg-white/80 px-3 py-2.5 shadow-sm backdrop-blur-sm"
                  >
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${item.bg}`}>
                      <Icon className={`size-4 ${item.color}`} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-tight">{item.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
