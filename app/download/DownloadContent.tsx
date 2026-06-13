/**
 * 号卡联盟APP 下载推广页面完整内容组件（DownloadContent）
 *
 * 展示号卡联盟APP的下载入口页面，包含：
 * - 左侧：APP 名称、描述、核心特性列表
 * - 右侧：手机模型与截图展示
 * - 下载按钮组（iOS App Store + Android 应用宝）
 * - 四大核心模块介绍区域
 * - 代理专属优势区域
 * - 新版特性更新日志
 * - 底部 APP 界面截图无限滚动展示区
 *
 * 设计风格与项目整体保持一致：白底为主、blue-600 品牌色、
 * 蓝紫渐变 CTA、响应式网格布局。
 */
"use client";

import { useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import {
    Check,
    Star,
    ArrowRight,
    Award,
    Smartphone,
    Layers,
    Zap,
    Users,
    Megaphone,
    BarChart3,
    TrendingUp,
    Headset,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

/* ========== 类型定义 ========== */

/** APP 核心特性项 */
interface AppFeature {
    /** 特性标题 */
    title: string;
    /** 特性描述 */
    description: string;
}

/** 下载渠道按钮配置 */
interface DownloadChannel {
    /** 按钮标签 */
    label: string;
    /** 副标签 */
    subLabel: string;
    /** 下载链接 */
    href: string;
    /** 是否为 iOS 渠道 */
    isIOS: boolean;
}

/** 核心模块配置 */
interface CoreModule {
    /** 模块标题 */
    title: string;
    /** 模块描述 */
    description: string;
    /** 模块亮点列表 */
    highlights: { label: string; detail: string }[];
    /** 图标组件 */
    icon: React.ElementType;
}

/** 代理优势配置 */
interface AgentAdvantage {
    title: string;
    description: string;
    icon: React.ElementType;
}

/** 新版特性配置 */
interface VersionFeature {
    title: string;
    description: string;
}

/* ========== 数据配置 ========== */

/** 号卡联盟APP 核心特性列表 */
const APP_FEATURES: AppFeature[] = [
    {
        title: "零门槛免费加盟",
        description: "零成本成为官方一级代理，开放号卡代理渠道与流量卡推广渠道",
    },
    {
        title: "全运营商资源覆盖",
        description: "聚合移动、联通、电信、广电全运营商号卡资源，品类齐全",
    },
    {
        title: "高返佣透明结算",
        description: "行业领先佣金比例，结算快、分润透明，支持团队裂变收益",
    },
    {
        title: "全链路运营支持",
        description: "从注册到销售平台运营，提供培训、客服、技术一站式服务",
    },
];

/** 下载渠道配置 */
const DOWNLOAD_CHANNELS: DownloadChannel[] = [
    {
        label: "App Store",
        subLabel: "Download on the",
        href: "https://apps.apple.com/cn/app/172%E5%8F%B7%E5%8D%A1/id6471650035",
        isIOS: true,
    },
    {
        label: "Android",
        subLabel: "Download",
        href: "https://sj.qq.com/appdetail/com.canghai.haoka",
        isIOS: false,
    },
];

/** 四大核心模块 */
const CORE_MODULES: CoreModule[] = [
    {
        title: "号卡分销系统",
        description: "智能化号卡代理平台后台，实时管理订单、佣金、代理数据，支持号卡分销/流量卡分销/手机卡销售全流程。",
        highlights: [
            { label: "智能后台管理", detail: "实时追踪订单状态、佣金结算、代理数据" },
            { label: "多级分润机制", detail: "打造透明高效的号卡推广返佣平台" },
            { label: "全流程覆盖", detail: "号卡分销 → 流量卡分销 → 手机卡销售" },
        ],
        icon: BarChart3,
    },
    {
        title: "全运营商资源库",
        description: "汇聚移动流量卡代理、联通号卡分销、电信号卡加盟、广电手机卡推广等正规资源，是流量卡分销与号卡代理推广源头平台。",
        highlights: [
            { label: "四大运营商", detail: "移动、联通、电信、广电全接入" },
            { label: "三大品类", detail: "流量卡、手机卡、电话卡全覆盖" },
            { label: "源头直供", detail: "正规授权，品质保障" },
        ],
        icon: Layers,
    },
    {
        title: "代理加盟支持",
        description: "免费加盟成为官方一级代理，多重收益模式助力推广者快速起步，佣金透明结算，支持团队裂变。",
        highlights: [
            { label: "零成本加盟", detail: "免费成为官方一级代理" },
            { label: "多重收益模式", detail: "号卡推广 + 流量卡销售 + 手机卡分销" },
            { label: "团队裂变收益", detail: "发展下级代理，享受团队佣金分成" },
        ],
        icon: Users,
    },
    {
        title: "推广赋能工具",
        description: "专属推广素材库与数据看板，生成海报、链接，实时分析推广效果，优化代理策略。",
        highlights: [
            { label: "推广素材库", detail: "生成海报、链接，适配各类推广渠道" },
            { label: "数据看板", detail: "实时分析推广效果，精准决策" },
            { label: "高转化模板", detail: "多款高转化推广海报与文案模板" },
        ],
        icon: Megaphone,
    },
];

/** 代理专属优势 */
const AGENT_ADVANTAGES: AgentAdvantage[] = [
    {
        title: "全运营商覆盖",
        description: "深度合作移动、联通、电信、广电，提供电信流量卡分销、联通手机卡代理、移动电话卡加盟等资源。",
        icon: Smartphone,
    },
    {
        title: "高返佣保障",
        description: "行业领先佣金比例的手机卡推广返佣平台，结算快、分润透明。",
        icon: TrendingUp,
    },
    {
        title: "全链路服务",
        description: "从号卡代理注册到流量卡销售平台运营，提供培训、客服、技术一站式支持。",
        icon: Headset,
    },
];

/** 新版特性 */
const VERSION_FEATURES: VersionFeature[] = [
    {
        title: "佣金系统升级",
        description: "优化佣金结算流程，分润数据展示更清晰直观。",
    },
    {
        title: "新增运营商产品",
        description: "上线广电最新号卡套餐，丰富您的代理选择。",
    },
    {
        title: "推广素材库更新",
        description: "新增多款高转化推广海报与文案模板，助力营销。",
    },
    {
        title: "数据看板优化",
        description: "增强流量卡推广效果分析维度，提供更精准的决策支持。",
    },
    {
        title: "系统稳定性提升",
        description: "修复已知问题，优化后台运行效率，使用更流畅。",
    },
];

/**
 * APP 界面截图列表
 *
 * 用于底部无限滚动展示区，图片放置在 public/HeroSection/ 目录下。
 */
const APP_SCREENSHOTS: { src: string; alt: string }[] = [
    { src: "/HeroSection/460x996bb.webp", alt: "首页界面" },
    { src: "/HeroSection/460x996bb (1).webp", alt: "订单管理" },
    { src: "/HeroSection/460x996bb (2).webp", alt: "收益统计" },
    { src: "/HeroSection/460x996bb (3).webp", alt: "个人中心" },
    { src: "/HeroSection/460x996bb (4).webp", alt: "我的页面" },
];

/* ========== 下载按钮 SVG 图标 ========== */

/** Apple App Store 图标（内联 SVG） */
function AppleIcon() {
    return (
        <svg className="size-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09998 22C7.78998 22.05 6.79998 20.68 5.95998 19.47C4.24998 17 2.93998 12.45 4.69998 9.39C5.56998 7.87 7.12998 6.91 8.81998 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.35 4.26 13 3.5Z" />
        </svg>
    );
}

/** Android / Google Play 图标（内联 SVG） */
function AndroidIcon() {
    return (
        <svg className="size-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 20.5V3.50002C3 2.91002 3.34 2.39002 3.84 2.15002L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.50002L20.16 10.81ZM6.05 2.66002L16.81 8.88002L14.54 11.15L6.05 2.66002Z" />
        </svg>
    );
}

/* ========== 特性列表项 ========== */

/**
 * 单个特性条目组件
 *
 * 左侧蓝色圆形对勾图标 + 右侧标题与描述文字。
 */
function FeatureItem({ feature }: { feature: AppFeature }) {
    return (
        <div className="flex items-start space-x-4">
            {/* 蓝色圆形对勾图标 */}
            <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600">
                <Check className="size-3 text-white" strokeWidth={3} />
            </div>
            {/* 文字区 */}
            <div>
                <h3 className="font-semibold text-slate-800">{feature.title}</h3>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                    {feature.description}
                </p>
            </div>
        </div>
    );
}

/* ========== 下载渠道按钮 ========== */

/**
 * 单个下载渠道按钮
 *
 * iOS 使用黑色背景（模拟 App Store 风格），
 * Android 使用 blue-600（品牌色），hover 时加深并上浮。
 */
function DownloadButton({ channel }: { channel: DownloadChannel }) {
    return (
        <a
            href={channel.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "group flex items-center justify-center gap-3 rounded-xl px-8 py-4 font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
                channel.isIOS
                    ? "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-slate-900/20"
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-600/25"
            )}
        >
            {channel.isIOS ? <AppleIcon /> : <AndroidIcon />}
            <div className="text-left">
                <div className="text-xs opacity-80">{channel.subLabel}</div>
                <div className="-mt-0.5 text-base font-semibold">{channel.label}</div>
            </div>
        </a>
    );
}

/* ========== 评分与统计区域 ========== */

/** 评分与下载量统计展示 */
function StatsBar() {
    return (
        <div className="flex items-center gap-8 border-t border-slate-100 pt-6">
            {/* 星级评分 */}
            <div className="flex items-center gap-2">
                {/* 五颗星 */}
                <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="size-4 fill-current" />
                    ))}
                </div>
                <div className="text-slate-800">
                    <span className="font-bold">4.9</span>
                    <span className="ml-1 text-sm text-slate-400">(10,000+ 评价)</span>
                </div>
            </div>

            {/* 下载量 */}
            <div className="text-slate-800">
                <span className="font-bold">1M+</span>
                <span className="ml-1 text-sm text-slate-400">下载量</span>
            </div>
        </div>
    );
}

/* ========== 手机展示区域 ========== */

/**
 * 右侧手机模型展示区
 *
 * 使用装饰性圆环背景 + 应用图片展示。
 * 图片来源于 public/HeroSection/ 目录。
 */
function PhoneShowcase() {
    return (
        <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[640px]">
                {/* 背景装饰圆环 */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    <div className="size-80 rounded-full border border-blue-100 opacity-30" />
                </div>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    <div className="size-96 rounded-full border border-slate-100 opacity-20" />
                </div>

                {/* 手机展示图片 */}
                <div className="relative z-10">
                    <Image
                        src="/HeroSection/172app.png"
                        alt="号卡联盟APP 界面展示"
                        width={690}
                        height={1496}
                        className="h-auto w-full object-contain"
                        priority
                    />
                </div>
            </div>
        </div>
    );
}

/* ========== 核心模块区域 ========== */

/**
 * 四大核心模块介绍区域
 *
 * 双栏卡片布局展示每个核心模块的标题、描述与亮点列表。
 */
function CoreModulesSection() {
    return (
        <section className="bg-slate-50 py-16 lg:py-24">
            <div className={containerClass()} style={SITE_WIDTH_STYLE}>
                {/* 区域标题 */}
                <div className="mb-12 text-center">
                    <SectionTag label="四大核心模块" />
                    <h2 className="mt-4 text-3xl font-bold text-slate-800 lg:text-4xl">
                        号卡推广与代理一站式平台
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-slate-500">
                        为代理商提供零门槛、高收益的号卡分销代理解决方案，
                        聚合全运营商资源，赋能个人与团队高效开展推广业务
                    </p>
                </div>

                {/* 模块卡片网格 */}
                <div className="grid gap-6 md:grid-cols-2">
                    {CORE_MODULES.map((mod) => (
                        <div
                            key={mod.title}
                            className="group rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md sm:p-8"
                        >
                            {/* 图标 + 标题 */}
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                                    <mod.icon className="size-5" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">{mod.title}</h3>
                            </div>

                            {/* 描述 */}
                            <p className="mb-5 text-sm leading-relaxed text-slate-500">
                                {mod.description}
                            </p>

                            {/* 亮点列表 */}
                            <ul className="space-y-3">
                                {mod.highlights.map((hl) => (
                                    <li key={hl.label} className="flex items-start gap-2.5">
                                        <Zap className="mt-0.5 size-4 shrink-0 text-blue-500" />
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">
                                                {hl.label}
                                            </span>
                                            <span className="ml-1.5 text-xs text-slate-400">
                                                {hl.detail}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ========== 代理专属优势区域 ========== */

/**
 * 代理专属优势展示区域
 *
 * 三列卡片展示代理核心优势：全运营商覆盖、高返佣保障、全链路服务。
 */
function AgentAdvantagesSection() {
    return (
        <section className="bg-white py-16 lg:py-24">
            <div className={containerClass()} style={SITE_WIDTH_STYLE}>
                {/* 区域标题 */}
                <div className="mb-12 text-center">
                    <SectionTag label="代理专属优势" />
                    <h2 className="mt-4 text-3xl font-bold text-slate-800 lg:text-4xl">
                        为什么选择号卡联盟？
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-slate-500">
                        行业领先的号卡推广返佣平台，为代理商提供全方位的运营支持
                    </p>
                </div>

                {/* 优势卡片 */}
                <div className="grid gap-8 md:grid-cols-3">
                    {AGENT_ADVANTAGES.map((adv, idx) => (
                        <div
                            key={adv.title}
                            className="group relative rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                        >
                            {/* 序号装饰 */}
                            <span className="absolute -right-2 -top-2 flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white shadow-md">
                                {idx + 1}
                            </span>
                            {/* 图标 */}
                            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                <adv.icon className="size-6" />
                            </div>
                            {/* 内容 */}
                            <h3 className="mb-3 text-lg font-bold text-slate-800">{adv.title}</h3>
                            <p className="text-sm leading-relaxed text-slate-500">{adv.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ========== 新版特性区域 ========== */

/**
 * 新版特性更新日志区域
 *
 * 时间线风格展示版本更新内容。
 */
function VersionFeaturesSection() {
    return (
        <section className="bg-slate-50 py-16 lg:py-24">
            <div className={containerClass()} style={SITE_WIDTH_STYLE}>
                {/* 区域标题 */}
                <div className="mb-12 text-center">
                    <SectionTag label="新版特性" />
                    <h2 className="mt-4 text-3xl font-bold text-slate-800 lg:text-4xl">
                        持续迭代，越变越好
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-slate-500">
                        号卡联盟APP 持续优化升级，为代理商提供更强大的推广工具
                    </p>
                </div>

                {/* 特性列表：双栏网格布局 */}
                <div className="grid gap-4 md:grid-cols-2">
                    {VERSION_FEATURES.map((vf, idx) => (
                        <div
                            key={vf.title}
                            className="flex items-start gap-4 rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                        >
                            {/* 版本标记 */}
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                                {idx + 1}
                            </div>
                            {/* 内容 */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-800">{vf.title}</h4>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500">{vf.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ========== 底部截图滚动展示 ========== */

/**
 * APP 界面截图无限滚动展示区
 *
 * 水平滚动容器，支持鼠标拖拽/触屏滑动和左右箭头按钮导航。
 * 截图卡片模拟真实手机外观：顶部刘海 + 圆角机身 + 内屏截图。
 * 两侧使用渐变遮罩实现淡入淡出效果。
 */
function ScreenshotGallery() {
    /** 滚动容器 ref，用于箭头按钮控制滚动位置 */
    const scrollRef = useRef<HTMLDivElement>(null);

    /** 向左滚动一屏 */
    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
        }
    };

    /** 向右滚动一屏 */
    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
        }
    };

    return (
        <div className="mt-20 lg:mt-24">
            {/* 标题区域 */}
            <div className="mb-12 text-center">
                {/* 小标签 */}
                <div className="mb-4 inline-flex items-center">
                    <div className="mr-3 h-6 w-1 rounded-full bg-blue-600" />
                    <span className="text-sm font-medium uppercase tracking-wider text-slate-500">
                        应用界面展示
                    </span>
                </div>
                <h2 className="mb-4 text-3xl font-bold text-slate-800 lg:text-4xl">
                    精美界面设计
                </h2>
                <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-500">
                    沉浸式体验号卡联盟APP的现代化界面设计，每一个细节都经过精心打磨
                </p>
            </div>

            {/* 滚动展示区域 */}
            <div className="relative">
                {/* 左侧渐变遮罩：背景色 → 透明 */}
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-white to-transparent" />
                {/* 右侧渐变遮罩：透明 → 背景色 */}
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-white to-transparent" />

                {/* 左箭头按钮 */}
                <button
                    type="button"
                    onClick={scrollLeft}
                    className="absolute -left-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-xl md:flex size-10"
                >
                    <ChevronLeft className="size-5 text-slate-600" />
                </button>

                {/* 右箭头按钮 */}
                <button
                    type="button"
                    onClick={scrollRight}
                    className="absolute -right-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-xl md:flex size-10"
                >
                    <ChevronRight className="size-5 text-slate-600" />
                </button>

                {/* 滚动容器：支持触屏/鼠标拖拽滑动 + 滚动捕捉 */}
                <div
                    ref={scrollRef}
                    className="scrollbar-hide overflow-x-auto py-4 snap-x snap-mandatory"
                >
                    <div className="flex gap-6 px-4">
                        {APP_SCREENSHOTS.map((shot, index) => (
                            <div key={`${shot.src}-${index}`} className="shrink-0 snap-start">
                                {/* 手机外框：白色机身 + 浅灰边框 */}
                                <div className="relative w-[300px] overflow-hidden rounded-[2.5rem] border-[3px] border-slate-200 bg-white transition-transform duration-300 hover:scale-[1.02]">
                                    {/* 顶部刘海 */}
                                    <div className="flex h-5 items-center justify-center bg-white">
                                        <div className="h-3 w-14 rounded-full bg-slate-200" />
                                    </div>
                                    {/* 屏幕截图：限制高度 */}
                                    <div className="overflow-hidden bg-white" style={{ maxHeight: "560px" }}>
                                        <Image
                                            src={shot.src}
                                            alt={shot.alt}
                                            width={460}
                                            height={996}
                                            className="h-auto w-full object-cover"
                                        />
                                    </div>
                                    {/* 底部 Home 指示条 */}
                                    <div className="flex h-5 items-center justify-center bg-white">
                                        <div className="h-1 w-20 rounded-full bg-slate-200" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ========== Hero 标签行 ========== */

/** 小型标签装饰行（蓝色竖线 + 大写文字） */
function SectionTag({ label }: { label: string }) {
    return (
        <div className="inline-flex items-center">
            <div className="mr-3 h-6 w-1 rounded-full bg-blue-600" />
            <span className="text-sm font-medium uppercase tracking-wider text-slate-500">
                {label}
            </span>
        </div>
    );
}

/* ========== 页面主组件 ========== */

/**
 * 号卡联盟APP 下载推广页面完整内容
 *
 * 布局：顶部导航 → Hero 双栏区 → 四大核心模块 → 代理优势 → 新版特性 → 截图滚动画廊 → CTA → 底部
 */
export default function DownloadContent() {
    return (
        <div className="flex min-h-svh flex-col bg-white">
            <Header />

            <main className="flex-1">
                {/* ===== Hero 主区域：双栏布局 ===== */}
                <section className="relative overflow-hidden bg-white py-16 lg:py-24">
                    {/* 背景几何装饰 */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                        {/* 右上角简约圆 */}
                        <div className="absolute right-10 top-20 size-32 rounded-full border border-blue-100 opacity-30" />
                        {/* 左下角旋转方块 */}
                        <div className="absolute bottom-20 left-10 size-24 rotate-45 rounded-lg bg-blue-50 opacity-40" />
                        {/* 竖直细线 */}
                        <div className="absolute left-1/4 top-1/2 h-16 w-0.5 bg-blue-200 opacity-20" />
                        {/* 水平细线 */}
                        <div className="absolute right-1/3 top-1/3 h-0.5 w-16 bg-blue-200 opacity-20" />
                    </div>

                    <div className={containerClass("relative z-10")} style={SITE_WIDTH_STYLE}>
                        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
                            {/* ===== 左侧内容区域 ===== */}
                            <div className="space-y-8">
                                {/* 标签 */}
                                <SectionTag label="号卡推广与代理一站式平台" />

                                {/* 主标题 */}
                                <div className="space-y-4">
                                    <h1 className="text-3xl font-bold leading-tight text-slate-800 sm:text-4xl lg:text-5xl xl:text-6xl">
                                        号卡联盟<span className="text-blue-600">APP</span>
                                    </h1>
                                    <p className="max-w-lg text-base leading-relaxed text-slate-500 sm:text-lg">
                                        官方打造的号卡推广平台与流量卡代理平台，
                                        聚合移动流量卡、联通号卡、电信号卡、广电手机卡等全运营商资源，
                                        覆盖流量卡销售、手机卡代理、电话卡分销全品类。
                                    </p>
                                </div>

                                {/* 核心特性列表 */}
                                <div className="space-y-6">
                                    {APP_FEATURES.map((feature) => (
                                        <FeatureItem key={feature.title} feature={feature} />
                                    ))}
                                </div>

                                {/* 下载按钮组 */}
                                <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                                    {DOWNLOAD_CHANNELS.map((channel) => (
                                        <DownloadButton key={channel.label} channel={channel} />
                                    ))}
                                </div>

                                {/* 评分与统计 */}
                                <StatsBar />
                            </div>

                            {/* ===== 右侧手机展示区域 ===== */}
                            <PhoneShowcase />
                        </div>

                        {/* ===== 底部截图滚动展示 ===== */}
                        <ScreenshotGallery />
                    </div>
                </section>

                {/* ===== 四大核心模块 ===== */}
                <CoreModulesSection />

                {/* ===== 代理专属优势 ===== */}
                <AgentAdvantagesSection />

                {/* ===== 新版特性 ===== */}
                <VersionFeaturesSection />

                {/* ===== 底部 CTA 横幅 ===== */}
                <section className="bg-white">
                    <div className={containerClass("py-14 md:py-20")} style={SITE_WIDTH_STYLE}>
                        <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center sm:p-10">
                            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90">
                                <Award className="mr-1.5 size-4" />
                                号卡代理加盟
                            </div>
                            <h2 className="text-2xl font-bold text-white sm:text-3xl">
                                号卡代理加盟，首选号卡联盟APP
                            </h2>
                            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-blue-100">
                                注册即享高额分佣，专业运营指导，助您快速开启号卡推广之旅
                            </p>
                            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                <a
                                    href="https://haoka.lot-ml.com/plugreg.html?agentid=90925"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-blue-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                                >
                                    立即注册
                                    <ArrowRight className="size-4" />
                                </a>
                                <a
                                    href="/join"
                                    className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-2.5 text-sm font-medium text-white transition-all hover:border-white/60 hover:bg-white/10"
                                >
                                    了解更多
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
