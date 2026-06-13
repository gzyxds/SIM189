/**
 * 代理加盟页面完整内容组件（JoinContent）
 *
 * 包含：Hero 区、加盟优势、加盟流程、加盟条件、为什么选择号卡之家。
 * 响应式设计，兼容移动端与桌面端。
 */
"use client";

import { cn } from "@/lib/utils";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import {
  TrendingUp,
  ShieldCheck,
  GraduationCap,
  Headphones,
  Zap,
  Users,
  ChevronRight,
  CheckCircle2,
  Phone,
  MapPin,
  Banknote,
  FileText,
  ArrowRight,
  Star,
  MessageCircle,
  Crown,
  Trophy,
  Award,
  HeartHandshake,
  UserPlus,
  DollarSign,
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
            <Star className="size-3.5 text-amber-400" />
            零门槛 · 高佣金 · 全国招募
          </div>

          {/* 主标题 */}
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            流量卡代理
            <span className="relative mx-2 inline-block text-blue-600">
              加盟号卡之家
              <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-blue-200" />
            </span>
          </h1>

          {/* 副标题 */}
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg">
            加入流量卡代理计划，无需囤货、无需门店，一部手机即可开启高佣金副业。
            三大运营商官方授权，佣金秒结，全程扶持。
          </p>

          {/* 按钮组 */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#form"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200"
            >
              立即申请加盟
              <ArrowRight className="size-4" />
            </a>
            <a
              href="#advantages"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-7 py-3 text-sm font-medium text-gray-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 hover:shadow-md"
            >
              了解加盟优势
            </a>
          </div>

          {/* 核心数据 */}
          <div className="mt-12 flex items-center justify-center gap-8 sm:gap-14">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gray-900">50%+</div>
              <div className="mt-1 text-xs text-gray-400">最高佣金比例</div>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gray-900">0 元</div>
              <div className="mt-1 text-xs text-gray-400">零加盟费用</div>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gray-900">24h</div>
              <div className="mt-1 text-xs text-gray-400">佣金结算</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========== 加盟优势区 ========== */

/** 加盟优势数据 */
const ADVANTAGES = [
  {
    icon: TrendingUp,
    title: "高额佣金",
    desc: "单卡佣金高达 50-200 元，月销百单轻松过万。佣金秒结，提现无门槛。",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    icon: ShieldCheck,
    title: "品牌背书",
    desc: "三大运营商官方授权，正规号卡，用户信任度高，成交转化率远超行业平均。",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    icon: GraduationCap,
    title: "培训体系",
    desc: "从零起步到专业代理，提供系统化培训课程、话术模板、营销素材一键转发。",
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
  },
  {
    icon: Headphones,
    title: "专属扶持",
    desc: "一对一运营导师全程跟进，7×12 小时在线答疑，遇到问题即时解决。",
    iconColor: "text-rose-500",
    iconBg: "bg-rose-50",
  },
  {
    icon: Zap,
    title: "秒返系统",
    desc: "用户激活即返佣，无需等待次月。后台实时查看订单与佣金，透明清晰。",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
  },
  {
    icon: Users,
    title: "团队裂变",
    desc: "支持发展下级代理，享受团队管理津贴。裂变模式让收益呈指数增长。",
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50",
  },
];

/** 加盟优势区 */
function AdvantagesSection() {
  return (
    <section id="advantages" className="bg-slate-50">
      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        {/* 标题 */}
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
            <Zap className="size-4" />
            核心优势
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            为什么选择号卡之家代理
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            六大核心优势，助你轻松开启副业增收之路
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADVANTAGES.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md md:p-7"
            >
              <div className={cn("mb-4 flex size-10 items-center justify-center rounded-xl", item.iconBg)}>
                <item.icon className={cn("size-5", item.iconColor)} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-gray-900">{item.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========== 加盟流程区 ========== */

/** 加盟流程步骤 */
const STEPS = [
  {
    step: "01",
    title: "在线申请",
    desc: "提交加盟信息，专属顾问将在 24 小时内与您取得联系。",
    icon: FileText,
  },
  {
    step: "02",
    title: "资格审核",
    desc: "专属顾问电话回访，确认合作意向与基本条件，快速通过审核。",
    icon: ShieldCheck,
  },
  {
    step: "03",
    title: "签约入驻",
    desc: "线上签署代理合作协议，开通专属代理后台账号与推广链接。",
    icon: CheckCircle2,
  },
  {
    step: "04",
    title: "系统培训",
    desc: "参加线上培训课程，学习产品知识、推广技巧与后台操作流程。",
    icon: GraduationCap,
  },
  {
    step: "05",
    title: "正式推广",
    desc: "获取专属推广素材与链接，开始推广获客，实时查看订单与佣金。",
    icon: Zap,
  },
];

/** 加盟流程区 */
function ProcessSection() {
  return (
    <section className="bg-white">
      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        {/* 标题 */}
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
            <ChevronRight className="size-4" />
            简单五步
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            加盟流程
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            从申请到盈利，全程只需 5 步
          </p>
        </div>

        {/* ===== 桌面端：横向卡片 + 箭头 ===== */}
        <div className="hidden lg:flex lg:items-start lg:gap-0">
          {STEPS.map((s, i) => (
            <div key={s.step} className="flex items-start">
              <div className="flex w-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md">
                {/* 步骤编号 */}
                <span className="text-xs font-bold tracking-widest text-blue-500 uppercase">
                  STEP {s.step}
                </span>
                {/* 图标 + 标题 */}
                <div className="mt-3 mb-3 flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <s.icon className="size-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{s.title}</h3>
                </div>
                <p className="text-xs leading-relaxed text-gray-500">{s.desc}</p>
              </div>
              {/* 步骤间箭头 */}
              {i < STEPS.length - 1 && (
                <div className="flex shrink-0 items-center px-2 pt-9 text-gray-300">
                  <ArrowRight className="size-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ===== 移动端/平板：纵向时间轴卡片 ===== */}
        <div className="relative lg:hidden">
          <div className="absolute top-4 bottom-4 left-6 w-0.5 bg-gray-100" aria-hidden="true" />
          <div className="flex flex-col gap-5">
            {STEPS.map((s) => (
              <div key={s.step} className="relative flex gap-4">
                <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm">
                  <s.icon className="size-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <span className="text-xs font-bold tracking-widest text-blue-500 uppercase">
                    STEP {s.step}
                  </span>
                  <h3 className="mt-1 text-sm font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========== 加盟条件区 ========== */

/** 加盟条件数据 */
const CONDITIONS = [
  {
    icon: Users,
    title: "年满 18 周岁",
    desc: "具备完全民事行为能力，对副业增收有热情即可加入。",
  },
  {
    icon: Phone,
    title: "智能手机操作",
    desc: "能熟练使用微信等社交工具，会基本图文转发即可上手。",
  },
  {
    icon: MapPin,
    title: "全国不限地区",
    desc: "无需固定办公场地，无论城市或乡镇均可申请加入。",
  },
  {
    icon: Banknote,
    title: "零加盟费",
    desc: "无需囤货、无需押金，仅需投入个人时间与精力推广。",
  },
  {
    icon: MessageCircle,
    title: "良好沟通能力",
    desc: "具备基本服务意识，能耐心解答客户对号卡的常见疑问。",
  },
  {
    icon: Zap,
    title: "认同品牌理念",
    desc: "认可号卡之家价值观，愿意长期合作，与平台共同成长。",
  },
];

/** 加盟条件区 */
function ConditionsSection() {
  return (
    <section className="bg-slate-50">
      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        {/* 标题 */}
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
            <CheckCircle2 className="size-4" />
            基本要求
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            加盟条件
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            门槛极低，几乎人人可做的副业项目
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONDITIONS.map((c, i) => (
            <div
              key={c.title}
              className="group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* 序号水印 */}
              <span className="absolute top-4 right-4 text-4xl font-extrabold text-gray-100 select-none">
                {String(i + 1).padStart(2, "0")}
              </span>
              {/* 图标 + 标题 */}
              <div className="relative flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <c.icon className="size-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{c.title}</h3>
              </div>
              <p className="relative mt-3 text-sm leading-relaxed text-gray-500">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========== 为什么选择号卡之家 ========== */

/** 平台核心卖点数据 */
const WHY_CHOOSE = [
  {
    icon: DollarSign,
    title: "全网高佣",
    desc: "所有号卡系列均为运营商直签一手资源，佣金全网最高，拒绝中间商赚差价。",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    icon: UserPlus,
    title: "下级分销",
    desc: "可邀请合伙人一同分销，下级推广开卡您也能赚取佣金，团队裂变收益倍增。",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    icon: ShieldCheck,
    title: "佣金保障",
    desc: "平台所有代理佣金由平台统一结算、统一打款，彻底避免上游代理跑路问题。",
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
  },
  {
    icon: MessageCircle,
    title: "专属客服",
    desc: "内置专属客服体系，从开卡指导到售后问题，均有专人及时响应与解决。",
    iconColor: "text-rose-500",
    iconBg: "bg-rose-50",
  },
  {
    icon: Crown,
    title: "分销特权",
    desc: "不同分销商等级享有不同特权，可查看对应等级商品，享受差异化返利比例。",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
  },
  {
    icon: Trophy,
    title: "业绩奖励",
    desc: "招商奖励、团队奖励、销售奖励等多维度激励体系，打造更强分销代理团队。",
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
  },
  {
    icon: Award,
    title: "管理奖",
    desc: "对优质代理分销团队进行专项激励，激发管理员主人公意识，主动建言献策。",
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50",
  },
  {
    icon: HeartHandshake,
    title: "推荐奖励",
    desc: "鼓励代理商向企业推荐优质资源，盘活代理渠道，有效降低整体推广成本。",
    iconColor: "text-teal-600",
    iconBg: "bg-teal-50",
  },
];

/** 为什么选择号卡之家 */
function WhyChooseSection() {
  return (
    <section id="why-choose" className="bg-white">
      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        {/* 标题 */}
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
            <Star className="size-4" />
            平台优势
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            为什么选择号卡之家联盟分销系统
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">
            号卡之家分销系统提供全国四大运营商的优质流量卡，以更优惠的资费满足市场需求
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_CHOOSE.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
            >
              <div className={cn("mb-4 flex size-10 items-center justify-center rounded-xl", item.iconBg)}>
                <item.icon className={cn("size-5", item.iconColor)} />
              </div>
              <h3 className="mb-1.5 text-sm font-semibold text-gray-900">{item.title}</h3>
              <p className="text-xs leading-relaxed text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========== 页面主组件 ========== */

/** 代理加盟页面完整内容 */
export default function JoinContent() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <AdvantagesSection />
        <ProcessSection />
        <ConditionsSection />
        <WhyChooseSection />
      </main>
      <Footer />
    </div>
  );
}
