/**
 * 自助服务导航页面完整内容组件（ServicesContent）
 *
 * 聚合 172号卡、浩卡联盟、林夕通信等平台的常用自助服务入口。
 * 数据来源：项目根目录 .md 参考文件中的服务链接。
 * 响应式设计，兼容移动端与桌面端。
 *
 * UI 重设计要点：
 * - 平台卡片化：每个平台是一张独立大卡，顶部品牌渐变 header 强化识别度
 * - 服务分级展示：主推服务（商城/代理）用大尺寸 primary 卡，辅助服务（查询/反馈）用小尺寸 secondary 卡
 * - Hero 区加入平台快捷锚点导航，用户一眼找到目标平台
 * - 所有平台集中于同一页面区域，无交替背景，靠卡片阴影和间距形成层次
 */
"use client";

import { cn } from "@/lib/utils";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import {
  Compass,
  Store,
  UserPlus,
  LogIn,
  Search,
  MessageSquare,
  Radio,
  Smartphone,
  Wifi,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Zap,
  ChevronRight,
  CreditCard,
  Award,
  Cloud,
  Antenna,
  RefreshCw,
} from "lucide-react";

/* ========== 类型定义 ========== */

/** 服务入口显示级别 */
type ServiceLevel = "primary" | "secondary";

/** 单个服务入口 */
interface ServiceItem {
  /** 服务名称 */
  label: string;
  /** 外部链接地址 */
  href: string;
  /** 简短描述 */
  desc: string;
  /** lucide 图标组件 */
  icon: React.ElementType;
  /** 图标容器颜色类（文字色 + 背景色） */
  iconColor?: string;
  /**
   * 展示级别
   * primary  = 主推服务（大卡，占更多视觉权重）
   * secondary = 辅助服务（紧凑小卡）
   */
  level?: ServiceLevel;
}

/** 服务平台分组 */
interface ServicePlatform {
  /** 平台 ID（用于锚点跳转） */
  id: string;
  /** 平台名称 */
  name: string;
  /** 平台简介 */
  description: string;
  /** 平台图标（用于 Hero 快捷导航及 Header 标识） */
  icon: React.ElementType;
  /** 顶部 header 背景色（简洁浅色） */
  headerBg: string;
  /** 品牌文字强调色 */
  accentText: string;
  /** 装饰圆颜色 */
  decorColor: string;
  /** 该平台下的服务入口列表 */
  services: ServiceItem[];
}

/* ========== 服务平台数据 ========== */

/** 所有自助服务平台数据 */
const PLATFORMS: ServicePlatform[] = [
  {
    id: "lotml",
    name: "172号卡",
    description: "172号卡联盟，涵盖号卡选购、代理注册、订单追踪等核心功能",
    icon: CreditCard,
    headerBg: "bg-blue-50",
    accentText: "text-blue-600",
    decorColor: "bg-blue-100",
    services: [
      {
        label: "在线办理",
        href: "/lotml",
        desc: "浏览 172 号卡精选套餐，站内一键办理",
        icon: Smartphone,
        iconColor: "text-blue-600 bg-blue-50",
        level: "primary",
      },
      {
        label: "号卡商城",
        href: "https://h5.lot-ml.com/ProductEn/Index/1a654e0b341cadd2",
        desc: "浏览全量号卡套餐，在线选号下单",
        icon: Store,
        iconColor: "text-blue-600 bg-blue-50",
        level: "primary",
      },
      {
        label: "代理申请",
        href: "https://haoka.lot-ml.com/plugreg.html?agentid=90925",
        desc: "免费注册成为代理商，开启推广分佣",
        icon: UserPlus,
        iconColor: "text-emerald-600 bg-emerald-50",
        level: "secondary",
      },
      {
        label: "登录后台",
        href: "https://haoka.lot-ml.com/login.html",
        desc: "代理商后台，查看订单与佣金",
        icon: LogIn,
        iconColor: "text-violet-600 bg-violet-50",
        level: "secondary",
      },
      {
        label: "订单查询",
        href: "https://h5.lot-ml.com/Search/Index",
        desc: "输入手机号查询号卡办理进度",
        icon: Search,
        iconColor: "text-amber-600 bg-amber-50",
        level: "secondary",
      },
    ],
  },
  {
    id: "haoka",
    name: "浩卡联盟",
    description: "浩卡联盟精选品质号卡，商城、代理、反馈等一站式服务",
    icon: Award,
    headerBg: "bg-rose-50",
    accentText: "text-rose-600",
    decorColor: "bg-rose-100",
    services: [
      {
        label: "在线办理",
        href: "/haoka",
        desc: "浩卡精选套餐，站内快速办理下单",
        icon: Smartphone,
        iconColor: "text-rose-600 bg-rose-50",
        level: "primary",
      },
      {
        label: "号卡商城",
        href: "https://mp.yapingkeji.com/#/pages/sales_index/my_store?mall_id=AUEQSwr8rvmcWnFhf%2Fnf0g%3D%3D",
        desc: "浩卡精选套餐，品质保障在线办理",
        icon: Store,
        iconColor: "text-rose-600 bg-rose-50",
        level: "primary",
      },
      {
        label: "代理申请",
        href: "https://s.haokavip.com/u/3792476",
        desc: "加入浩卡联盟代理，享高额佣金",
        icon: UserPlus,
        iconColor: "text-emerald-600 bg-emerald-50",
        level: "secondary",
      },
      {
        label: "订单查询",
        href: "https://mp.yapingkeji.com/#/pages/sales_index/orderSearchentrance?mode=bottom",
        desc: "查询浩卡订单状态与物流信息",
        icon: Search,
        iconColor: "text-amber-600 bg-amber-50",
        level: "secondary",
      },
      {
        label: "意见反馈",
        href: "https://mp.yapingkeji.com/#/pages/feedback/index",
        desc: "提交使用反馈，帮助我们优化服务",
        icon: MessageSquare,
        iconColor: "text-sky-600 bg-sky-50",
        level: "secondary",
      },
      {
        label: "登录后台",
        href: "https://www.haokavip.com/page.html#/login",
        desc: "浩卡代理商后台，查看订单与佣金",
        icon: LogIn,
        iconColor: "text-violet-600 bg-violet-50",
        level: "secondary",
      },
    ],
  },
  {
    id: "linxi",
    name: "林夕通信",
    description: "林夕通信号卡服务，涵盖号卡选购、代理申请、订单查询及三大运营商自助入口",
    icon: Antenna,
    headerBg: "bg-green-50",
    accentText: "text-green-600",
    decorColor: "bg-green-100",
    services: [
      {
        label: "在线办理",
        href: "/linxi",
        desc: "林夕号卡精选套餐，站内快速办理下单",
        icon: Smartphone,
        iconColor: "text-green-600 bg-green-50",
        level: "primary",
      },
      {
        label: "号卡店铺",
        href: "https://h5.vip12300.cn/index?k=SGpiazRLQVZSREk9",
        desc: "林夕号卡商城，在线选号下单",
        icon: Store,
        iconColor: "text-green-600 bg-green-50",
        level: "primary",
      },
      {
        label: "代理申请",
        href: "https://h5.vip12300.cn/agent/reg.php?code=6GE6QUOM",
        desc: "申请成为林夕代理商，开启推广分佣",
        icon: UserPlus,
        iconColor: "text-emerald-600 bg-emerald-50",
        level: "secondary",
      },
      {
        label: "订单查询",
        href: "https://h5.vip12300.cn/cha?k=SGpiazRLQVZSREk9",
        desc: "林夕号卡专属订单查询通道",
        icon: Search,
        iconColor: "text-green-600 bg-green-50",
        level: "secondary",
      },
      {
        label: "登录后台",
        href: "https://h5.vip12300.cn/agent/login",
        desc: "林夕代理商后台，查看订单与佣金",
        icon: LogIn,
        iconColor: "text-violet-600 bg-violet-50",
        level: "secondary",
      },
      {
        label: "中国电信",
        href: "https://pms.189.cn/cljy-ui/xshkzzfw/xshkzzfw_index?shopid=szs-ah&cmpid=szs-ah",
        desc: "中国电信官方号卡订单自助查询",
        icon: Radio,
        iconColor: "text-blue-600 bg-blue-50",
        level: "secondary",
      },
      {
        label: "中国移动",
        href: "https://dev.coc.10086.cn/coc/web/coc2020/cardqueryorder/",
        desc: "中国移动官方号卡订单自助查询",
        icon: Smartphone,
        iconColor: "text-green-600 bg-green-50",
        level: "secondary",
      },
      {
        label: "中国联通",
        href: "https://m.10010.com/myorder/",
        desc: "中国联通官方订单查询入口",
        icon: Wifi,
        iconColor: "text-orange-600 bg-orange-50",
        level: "secondary",
      },
    ],
  },
  {
    id: "yky",
    name: "翼卡云",
    description: "翼卡云流量卡平台，在线商城、靓号选购、代理加盟及订单查询",
    icon: Cloud,
    headerBg: "bg-cyan-50",
    accentText: "text-cyan-600",
    decorColor: "bg-cyan-100",
    services: [
      {
        label: "在线办理",
        href: "/yky",
        desc: "翼卡云流量卡精选套餐，站内快速办理",
        icon: Smartphone,
        iconColor: "text-cyan-600 bg-cyan-50",
        level: "primary",
      },
      {
        label: "在线商城",
        href: "https://iot.87haoka.cn/s/TpImx3gi",
        desc: "浏览全量流量卡套餐，在线选号下单",
        icon: Store,
        iconColor: "text-cyan-600 bg-cyan-50",
        level: "primary",
      },
      {
        label: "代理申请",
        href: "https://iot.87haoka.cn/r/02237888",
        desc: "申请成为翼卡云代理商，开启推广分佣",
        icon: UserPlus,
        iconColor: "text-emerald-600 bg-emerald-50",
        level: "secondary",
      },
      {
        label: "靓号商城",
        href: "https://iot.87haoka.cn/shop/#/?indexFirstGroup=1&promoCode=TpImx3gi",
        desc: "全国手机靓号资源，平台直供",
        icon: Sparkles,
        iconColor: "text-amber-600 bg-amber-50",
        level: "secondary",
      },
      {
        label: "订单查询",
        href: "https://iot.87haoka.cn/shop#/pages-sub/login/index?promoCode=TpImx3gi",
        desc: "查询翼卡云订单状态与物流信息",
        icon: Search,
        iconColor: "text-sky-600 bg-sky-50",
        level: "secondary",
      },
      {
        label: "登录后台",
        href: "https://iot.87haoka.cn/admin",
        desc: "翼卡云代理商后台管理入口",
        icon: LogIn,
        iconColor: "text-violet-600 bg-violet-50",
        level: "secondary",
      },
    ],
  },
  {
    id: "kakatx",
    name: "共创通信",
    description: "共创号卡分销平台，涵盖号卡选购、代理加盟、订单查询等核心功能",
    icon: CreditCard,
    headerBg: "bg-amber-50",
    accentText: "text-amber-600",
    decorColor: "bg-amber-100",
    services: [
      {
        label: "在线办理",
        href: "/kakatx",
        desc: "共创号卡精选套餐，站内快速办理下单",
        icon: Smartphone,
        iconColor: "text-amber-600 bg-amber-50",
        level: "primary",
      },
      {
        label: "号卡商城",
        href: "https://haoka.kakatx.com/web/#/?token=MjQ3NDk3fDE3ODA4MjAwNTQ3MDVoYW9rYTY2Ng",
        desc: "共创号卡商城，在线选号下单办理",
        icon: Store,
        iconColor: "text-amber-600 bg-amber-50",
        level: "primary",
      },
      {
        label: "代理申请",
        href: "https://haoka.kakatx.com/register?inviteCode=ZKG58800",
        desc: "申请成为共创代理商，享高额佣金",
        icon: UserPlus,
        iconColor: "text-emerald-600 bg-emerald-50",
        level: "secondary",
      },
      {
        label: "登录后台",
        href: "https://haoka.kakatx.com/index",
        desc: "共创代理商后台，查看订单与佣金",
        icon: LogIn,
        iconColor: "text-violet-600 bg-violet-50",
        level: "secondary",
      },
      {
        label: "订单查询",
        href: "https://haoka.kakatx.com/web/#/pages/order/index1",
        desc: "查询共创订单状态与物流信息",
        icon: Search,
        iconColor: "text-sky-600 bg-sky-50",
        level: "secondary",
      },
    ],
  },
];

/** 公共服务（官方权威）平台数据，统一使用 PlatformCard 布局 */
const PUBLIC_PLATFORM: ServicePlatform = {
  id: "public",
  name: "公共服务",
  description: "工信部及运营商官方提供的通用自助服务，权威可信",
  icon: ShieldCheck,
  headerBg: "bg-slate-50",
  accentText: "text-slate-600",
  decorColor: "bg-slate-100",
  services: [
    {
      label: "一证通查",
      href: "https://getsimnum.caict.ac.cn/",
      desc: "工信部官方服务，查询名下所有手机号卡数量",
      icon: ShieldCheck,
      iconColor: "text-slate-700 bg-slate-100",
      level: "primary",
    },
    {
      label: "携号转网查询",
      href: "https://getsimnum.caict.ac.cn/m/",
      desc: "工信部官方服务，查询手机号是否支持携号转网",
      icon: RefreshCw,
      iconColor: "text-indigo-600 bg-indigo-50",
      level: "primary",
    },
    {
      label: "中国移动订单查询",
      href: "https://dev.coc.10086.cn/coc/web/coc2020/cardqueryorder/",
      desc: "中国移动官方号卡订单自助查询",
      icon: Smartphone,
      iconColor: "text-green-600 bg-green-50",
      level: "secondary",
    },
    {
      label: "中国联通订单查询",
      href: "https://m.10010.com/myorder/",
      desc: "中国联通官方号卡订单自助查询",
      icon: Wifi,
      iconColor: "text-orange-600 bg-orange-50",
      level: "secondary",
    },
    {
      label: "中国电信订单查询",
      href: "https://pms.189.cn/cljy-ui/xshkzzfw/xshkzzfw_index?shopid=szs-ah&cmpid=szs-ah",
      desc: "中国电信官方号卡订单自助查询",
      icon: Radio,
      iconColor: "text-blue-600 bg-blue-50",
      level: "secondary",
    },
  ],
};

/* ========== Hero 区 ========== */

/**
 * Hero 宣传区
 *
 * 新增平台快捷锚点导航栏（pill 胶囊式），
 * 用户可直接点击跳转到对应平台区块，减少滚动寻找的成本。
 */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* ===== 背景装饰 ===== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-blue-50 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-[360px] w-[360px] rounded-full bg-slate-100 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#1d4ed8 1px, transparent 1px), linear-gradient(to right, #1d4ed8 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute right-12 bottom-12 size-56 rounded-full border border-blue-100 opacity-60" />
        <div className="absolute right-24 bottom-24 size-32 rounded-full border border-blue-100 opacity-60" />
      </div>

      <div className={containerClass("relative py-20 md:py-28")} style={SITE_WIDTH_STYLE}>
        <div className="mx-auto max-w-3xl text-center">
          {/* 顶部标签 */}
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600">
            <Compass className="size-3.5 text-blue-500" />
            一站直达 · 快捷服务
          </div>

          {/* 主标题 */}
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            自助服务
            <span className="relative mx-2 inline-block text-blue-600">
              导航
              <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-blue-200" />
            </span>
          </h1>

          {/* 副标题 */}
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg">
            聚合多平台号卡自助服务入口，号卡办理、订单查询、代理注册一站直达。
          </p>

          {/* ===== 平台快捷锚点导航（核心新增） ===== */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
            {PLATFORMS.map((platform) => (
              <a
                key={platform.id}
                href={`#${platform.id}`}
                className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 hover:shadow-md"
              >
                <platform.icon className="size-4" />
                <span>{platform.name}</span>
                <ChevronRight className="size-3.5 text-gray-300 transition-colors group-hover:text-blue-400" />
              </a>
            ))}
            <a
              href="#public"
              className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-700 hover:shadow-md"
            >
              <ShieldCheck className="size-3.5 text-slate-400 transition-colors group-hover:text-slate-600" />
              <span>公共服务</span>
              <ChevronRight className="size-3.5 text-gray-300 transition-colors group-hover:text-slate-400" />
            </a>
          </div>

          {/* 核心统计数据 */}
          <div className="mt-10 flex items-center justify-center gap-8 sm:gap-14">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gray-900">{PLATFORMS.length} 大</div>
              <div className="mt-1 text-xs text-gray-400">合作平台</div>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gray-900">
                {PLATFORMS.reduce((acc, p) => acc + p.services.length, 0) + PUBLIC_PLATFORM.services.length}+
              </div>
              <div className="mt-1 text-xs text-gray-400">自助服务入口</div>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gray-900">全程</div>
              <div className="mt-1 text-xs text-gray-400">在线自助</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========== 服务入口卡片组件 ========== */

/**
 * Primary 级别服务卡片（主推服务）
 *
 * 竖向布局，图标居上，文字居中，视觉权重更大。
 * 用于商城、代理申请等核心转化入口。
 */
function PrimaryServiceCard({ item }: { item: ServiceItem }) {
  /* 判断是否为站内链接（以 "/" 开头），站内链接不新开标签页 */
  const isInternal = item.href.startsWith("/");

  return (
    <a
      href={item.href}
      {...(!isInternal && { target: "_blank", rel: "noopener noreferrer" })}
      className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      {/* 悬停时右上角光晕装饰 */}
      <div className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-blue-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* 图标容器 */}
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
          item.iconColor || "text-slate-600 bg-slate-100"
        )}
      >
        <item.icon className="size-7" />
      </div>

      {/* 文字区域 */}
      <div className="relative text-center">
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm font-bold text-gray-800 transition-colors group-hover:text-blue-700">
            {item.label}
          </span>
          {/* 站内链接显示右箭头，外部链接显示外链图标 */}
          {isInternal ? (
            <ChevronRight className="size-3 shrink-0 text-gray-300 opacity-0 transition-all duration-200 group-hover:text-blue-400 group-hover:opacity-100" />
          ) : (
            <ExternalLink className="size-3 shrink-0 text-gray-300 opacity-0 transition-all duration-200 group-hover:text-blue-400 group-hover:opacity-100" />
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">{item.desc}</p>
      </div>

      {/* 底部提示（悬停显示）：站内链接显示"立即办理"，外部链接显示"立即前往" */}
      <div className="flex items-center gap-1 text-xs font-medium text-blue-600 opacity-0 transition-all duration-200 group-hover:opacity-100">
        {isInternal ? "立即办理" : "立即前往"}
        <ArrowRight className="size-3" />
      </div>
    </a>
  );
}

/**
 * Secondary 级别服务卡片（辅助服务）
 *
 * 横向紧凑布局，图标偏小，节省空间。
 * 用于订单查询、登录后台、意见反馈等辅助功能。
 */
function SecondaryServiceCard({ item }: { item: ServiceItem }) {
  /* 判断是否为站内链接（以 "/" 开头），站内链接不新开标签页 */
  const isInternal = item.href.startsWith("/");

  return (
    <a
      href={item.href}
      {...(!isInternal && { target: "_blank", rel: "noopener noreferrer" })}
      className="group flex items-center gap-3 rounded-md border border-gray-100 bg-white/70 px-4 py-3.5 transition-all duration-200 hover:border-gray-200 hover:bg-white hover:shadow-sm"
    >
      {/* 图标 */}
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          item.iconColor || "text-slate-600 bg-slate-100"
        )}
      >
        <item.icon className="size-4" />
      </div>

      {/* 文字 */}
      <div className="min-w-0 flex-1">
        <span className="text-sm font-semibold text-gray-700 transition-colors group-hover:text-blue-700">
          {item.label}
        </span>
        <p className="truncate text-xs text-gray-400">{item.desc}</p>
      </div>

      {/* 站内链接显示右箭头，外部链接显示外链图标 */}
      {isInternal ? (
        <ChevronRight className="size-3.5 shrink-0 text-gray-300 transition-colors group-hover:text-blue-400" />
      ) : (
        <ExternalLink className="size-3.5 shrink-0 text-gray-300 transition-colors group-hover:text-blue-400" />
      )}
    </a>
  );
}

/* ========== 平台大卡片组件 ========== */

/**
 * 单个平台大卡片
 *
 * 结构：
 * ┌─────────────────────────────────┐
 * │  品牌渐变色 Header（平台名+描述）  │
 * ├─────────────────────────────────┤
 * │  Primary 服务（大卡 2列网格）     │
 * ├─────────────────────────────────┤
 * │  Secondary 服务（小卡列表）       │
 * └─────────────────────────────────┘
 *
 * 通过顶部渐变色差异建立平台识别度，
 * 通过 primary/secondary 分级建立入口层次感。
 */
function PlatformCard({ platform }: { platform: ServicePlatform }) {
  const primaryServices = platform.services.filter((s) => s.level === "primary");
  const secondaryServices = platform.services.filter((s) => s.level === "secondary");

  return (
    <div
      id={platform.id}
      className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      {/* ===== 品牌简洁 Header ===== */}
      <div className={`relative overflow-hidden ${platform.headerBg} px-5 py-5 border-b border-gray-100`}>
        {/* 装饰圆 */}
        <div className={`pointer-events-none absolute -right-6 -top-6 size-24 rounded-full ${platform.decorColor}`} />
        <div className={`pointer-events-none absolute -left-4 bottom-0 size-16 rounded-full ${platform.decorColor}`} />

        {/* 平台名 + 描述 */}
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className={`flex size-8 items-center justify-center rounded-lg bg-white`}>
              <platform.icon className={`size-4.5 ${platform.accentText}`} />
            </div>
            <h2 className={`text-lg font-bold ${platform.accentText}`}>{platform.name}</h2>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            {platform.description}
          </p>
        </div>

        {/* Header 右侧服务数量徽章 */}
        <div className={`absolute right-4 top-4 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium ${platform.accentText}`}>
          {platform.services.length} 项服务
        </div>
      </div>

      {/* ===== 卡片内容区 ===== */}
      <div className="p-5">
        {/* Primary 服务区：主推卡片，2列网格 */}
        {primaryServices.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-1.5">
              <Zap className="size-3.5 text-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">主要服务</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {primaryServices.map((item) => (
                <PrimaryServiceCard key={item.href} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Secondary 服务区：辅助列表 */}
        {secondaryServices.length > 0 && (
          <div className={primaryServices.length > 0 ? "mt-4" : ""}>
            {primaryServices.length > 0 && (
              <div className="mb-3 flex items-center gap-1.5">
                <Search className="size-3.5 text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">更多工具</span>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {secondaryServices.map((item) => (
                <SecondaryServiceCard key={item.href} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========== 平台服务总区域 ========== */

/**
 * 全部平台展示区
 *
 * 采用响应式网格布局（桌面 2 列，移动单列），
 * 各平台大卡靠自身渐变 header 区分，无需交替背景。
 */
function PlatformsSection() {
  return (
    <section
      id="platforms"
      className="bg-[url('/background/background-1.png')] bg-cover bg-center bg-no-repeat"
    >
      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        {/* 区块标题 */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            合作平台服务
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
          <p className="mx-auto mt-4 max-w-lg text-sm text-gray-500">
            点击卡片直接跳转，所有服务均为官方入口
          </p>
        </div>

        {/* 平台大卡网格：桌面 2 列，移动 1 列（含公共服务） */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {PLATFORMS.map((platform) => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}
          {/* 公共服务使用统一平台卡片布局 */}
          <PlatformCard platform={PUBLIC_PLATFORM} />
        </div>
      </div>
    </section>
  );
}

/* ========== 底部 CTA 区 ========== */

/** 底部快捷入口横幅 */
function BottomCTASection() {
  return (
    <section className="bg-white">
      <div className={containerClass("py-14 md:py-20")} style={SITE_WIDTH_STYLE}>
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            没找到需要的服务？
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-blue-100">
            成为号卡之家代理商，获取专属后台与更多推广工具
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/join"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-blue-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              立即加入
              <ArrowRight className="size-4" />
            </a>
            <a
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-2.5 text-sm font-medium text-white transition-all hover:border-white/60 hover:bg-white/10"
            >
              了解更多
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========== 页面主组件 ========== */

/** 自助服务导航页面完整内容 */
export default function ServicesContent() {
  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header />
      <main>
        <HeroSection />
        <PlatformsSection />
        <BottomCTASection />
      </main>
      <Footer />
    </div>
  );
}
