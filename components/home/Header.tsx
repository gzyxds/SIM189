"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  ChevronDown,
  CreditCard,
  Award,
  Radio,
  ArrowRight,
  BadgeCheck,
  UserPlus,
  LogIn,
  Bot,
  Cloud,
  Building2,
  Cpu,
  Server,
  ExternalLink,
  Tag,
  Download,
  Users,
  Handshake,
  Wrench,
  Info,
  HelpCircle,
  Wifi,
  Search,
  Megaphone,
  Newspaper,
} from "lucide-react";

/* ========== 导航数据结构 ========== */

/** 导航子菜单项 */
interface SubNavItem {
  label: string;
  href: string;
  /** 简短描述 */
  desc?: string;
  /** lucide 图标组件 */
  icon: React.ElementType;
  /** 图标颜色与背景类 */
  iconColor?: string;
  /** 是否为外部链接 */
  isExternal?: boolean;
}

/** 导航项（可有子菜单） */
interface NavItem {
  label: string;
  href?: string;
  /** 下拉面板标题（可选） */
  dropdownTitle?: string;
  children?: SubNavItem[];
  /** 移动端图标（普通链接使用） */
  icon?: React.ElementType;
  /** 移动端图标颜色与背景类 */
  iconColor?: string;
  /** 移动端下拉菜单标题图标 */
  dropdownIcon?: React.ElementType;
  /** 移动端下拉菜单标题图标颜色类 */
  dropdownIconColor?: string;
}

/** PC 端右侧 CTA 按钮配置 */
interface CtaButton {
  label: string;
  href: string;
  icon: React.ElementType;
  /** 按钮变体：ghost（描边）| solid（实心） */
  variant: "ghost" | "solid";
}

/** 主导航配置 */
const NAV_ITEMS: NavItem[] = [
  { label: "首页", href: "/" },
  {
    label: "号卡办理",
    dropdownTitle: "选择号卡平台",
    dropdownIcon: CreditCard,
    dropdownIconColor: "text-blue-500",
    children: [
      {
        label: "172号卡",
        href: "/lotml",
        desc: "全网最热，全国可办",
        icon: CreditCard,
        iconColor: "text-blue-600 bg-blue-50",
      },
      {
        label: "号卡精选",
        href: "/haoka",
        desc: "浩卡联盟精选，品质保障",
        icon: Award,
        iconColor: "text-amber-600 bg-amber-50",
      },
      {
        label: "翼卡云",
        href: "/yky",
        desc: "翼卡云流量卡，全国发货",
        icon: Cloud,
        iconColor: "text-cyan-600 bg-cyan-50",
      },
      {
        label: "林夕通信",
        href: "/linxi",
        desc: "万千号卡，尽在林夕",
        icon: Radio,
        iconColor: "text-green-600 bg-green-50",
      },
      {
        label: "共创通信",
        href: "/kakatx",
        desc: "共创号卡平台，佣金日结",
        icon: BadgeCheck,
        iconColor: "text-violet-600 bg-violet-50",
      },
      {
        label: "卡世界号卡",
        href: "/ksj",
        desc: "精选套餐·号卡大全",
        icon: Wifi,
        iconColor: "text-orange-500 bg-orange-50",
      },
      {
        label: "卡业联盟",
        href: "/gantanhao",
        desc: "感叹号联盟，正规大流量卡",
        icon: Megaphone,
        iconColor: "text-rose-600 bg-rose-50",
      },
    ],
  },
  { label: "全站搜索", href: "/search", icon: Search, iconColor: "text-blue-600 bg-blue-50" },
  { label: "下载APP", href: "/download", icon: Download, iconColor: "text-blue-600 bg-blue-50" },
  { label: "代理加盟", href: "/join", icon: Users, iconColor: "text-violet-600 bg-violet-50" },
  { label: "合作伙伴", href: "/cooperate", icon: Handshake, iconColor: "text-sky-600 bg-sky-50" },
  { label: "自助服务", href: "/services", icon: Wrench, iconColor: "text-slate-600 bg-slate-100" },
  { label: "关于我们", href: "/about", icon: Info, iconColor: "text-rose-600 bg-rose-50" },
  { label: "常见问题", href: "/faq", icon: HelpCircle, iconColor: "text-teal-600 bg-teal-50" },
  { label: "新闻资讯", href: "/news", icon: Newspaper, iconColor: "text-indigo-600 bg-indigo-50" },
  { label: "生活优惠", href: "/cps", icon: Tag, iconColor: "text-orange-600 bg-orange-50" },
  {
    label: "合作产品",
    dropdownTitle: "生态合作产品",
    dropdownIcon: Building2,
    dropdownIconColor: "text-blue-500",
    children: [
      {
        label: "艺创官网",
        href: "https://urlnet.cn",
        desc: "专业的网络服务提供商",
        icon: Building2,
        iconColor: "text-blue-600 bg-blue-50",
        isExternal: true,
      },
      {
        label: "数字分身",
        href: "https://v.cnai.art",
        desc: "AI数字人技术领先平台",
        icon: Bot,
        iconColor: "text-purple-600 bg-purple-50",
        isExternal: true,
      },
      {
        label: "艺创AI",
        href: "https://www.cnai.art",
        desc: "人工智能创新应用平台",
        icon: Cpu,
        iconColor: "text-amber-600 bg-amber-50",
        isExternal: true,
      },
      {
        label: "优刻云",
        href: "https://www.cloudcvm.com/",
        desc: "高性能云计算服务商",
        icon: Server,
        iconColor: "text-cyan-600 bg-cyan-50",
        isExternal: true,
      },
    ],
  },
];

/** PC/移动端共用的 CTA 按钮数据 */
const CTA_BUTTONS: CtaButton[] = [
  {
    label: "登入",
    href: "https://haoka.lot-ml.com/login.html",
    icon: LogIn,
    variant: "ghost",
  },
  {
    label: "注册",
    href: "https://haoka.lot-ml.com/plugreg.html?agentid=90925",
    icon: UserPlus,
    variant: "solid",
  },
];

/* ========== 桌面端下拉菜单 ========== */

/**
 * 桌面端下拉菜单 — 企业级网格宫格设计
 * 根据子项数量自动决定列数，悬浮触发展开
 */
function DropdownMenu({
  label,
  dropdownTitle,
  children,
}: {
  label: string;
  dropdownTitle?: string;
  children: SubNavItem[];
}) {
  /** 根据子项数量决定列数：≤2 项用 2 列，否则用 3 列 */
  const cols = children.length <= 2 ? 2 : 3;

  return (
    <div className="group relative">
      {/* 触发按钮 */}
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-base font-medium tracking-wide text-slate-600 transition-all duration-200 group-hover:bg-slate-100 group-hover:text-blue-700"
      >
        {label}
        <ChevronDown className="size-3.5 text-slate-400 transition-transform duration-300 group-hover:rotate-180 group-hover:text-blue-500" />
      </button>

      {/* 下拉面板：悬浮时显示，带淡入/淡出动效 */}
      <div className="invisible absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
        {/* 角标箭头指示器 */}
        <div className="absolute left-1/2 top-0.5 -translate-x-1/2">
          <div className="size-3 rotate-45 border-l border-t border-slate-200/60 bg-white" />
        </div>

        <div className="overflow-hidden rounded-md border border-slate-200/60 bg-white shadow-lg shadow-slate-200/50">
          {/* 标题行 */}
          {dropdownTitle && (
            <div className="border-b border-slate-100 px-5 py-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {dropdownTitle}
              </span>
            </div>
          )}

          {/* 宫格子项 */}
          <div
            className="grid gap-1.5 p-3"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(220px, 1fr))` }}
          >
            {children.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                target={item.isExternal ? "_blank" : undefined}
                rel={item.isExternal ? "noopener noreferrer" : undefined}
                className="group/item flex items-start gap-4 rounded-md px-4 py-3 transition-all duration-200 hover:bg-slate-50"
              >
                {/* 图标容器 */}
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${item.iconColor || "text-slate-600 bg-slate-100"}`}
                >
                  <item.icon className="size-5" />
                </div>

                {/* 文字区 */}
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-700 transition-colors group-hover/item:text-blue-700">
                      {item.label}
                    </span>
                    <ArrowRight className="size-3 shrink-0 -translate-x-1 text-blue-400 opacity-0 transition-all duration-200 group-hover/item:translate-x-0 group-hover/item:opacity-100" />
                  </div>
                  {item.desc && (
                    <span className="text-xs leading-relaxed text-slate-400">
                      {item.desc}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========== 移动端下拉菜单 ========== */

/**
 * 移动端子菜单展开项 — 点击触发，双排网格排列子项
 * 子项以 2 列网格展示，图标 + 文字紧凑布局
 */
function MobileDropdownMenu({
  label,
  icon: Icon = BadgeCheck,
  iconClassName = "text-blue-500",
  children,
  onClose,
}: {
  label: string;
  /** 标题图标组件 */
  icon?: React.ElementType;
  /** 标题图标颜色类 */
  iconClassName?: string;
  children: SubNavItem[];
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      {/* 展开/折叠触发按钮 */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Icon className={`size-4 ${iconClassName}`} />
          {label}
        </span>
        <ChevronDown
          className={cn("size-4 text-slate-400 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {/* 双排网格子菜单内容 */}
      <div
        className={cn(
          "grid grid-cols-2 gap-1.5 overflow-hidden px-1 transition-all duration-300 ease-out",
          open ? "mb-2 mt-1 max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
          {children.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target={item.isExternal ? "_blank" : undefined}
              rel={item.isExternal ? "noopener noreferrer" : undefined}
              onClick={onClose}
              className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-600 transition-colors hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700"
            >
              {/* 图标 */}
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-md ${item.iconColor || "text-slate-500 bg-slate-100"}`}
              >
                <item.icon className="size-4" />
              </div>
              {/* 文字 */}
              <div className="min-w-0">
                <div className="flex items-center gap-1 font-medium leading-tight">
                  <span className="truncate">{item.label}</span>
                  {item.isExternal && (
                    <ExternalLink className="size-2.5 shrink-0 text-slate-400" />
                  )}
                </div>
                {item.desc && (
                  <div className="mt-0.5 truncate text-[11px] leading-tight text-slate-400">
                    {item.desc}
                  </div>
                )}
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}

/* ========== 移动端导航链接项（双排网格） ========== */

/**
 * 移动端普通导航链接 — 用于在双排网格中展示单页面链接
 * 字体与子菜单触发按钮保持一致，带图标
 */
function MobileNavLink({
  label,
  href,
  icon: Icon,
  iconColor,
  onClose,
}: {
  label: string;
  href: string;
  icon?: React.ElementType;
  iconColor?: string;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-600 transition-colors hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700"
    >
      {Icon && (
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-md ${iconColor || "text-slate-500 bg-slate-100"}`}
        >
          <Icon className="size-4" />
        </div>
      )}
      <span className="font-medium">{label}</span>
    </Link>
  );
}

/* ========== 顶部导航栏 ========== */

/**
 * 页面顶部导航栏组件
 * - 桌面端：水平导航 + 悬浮下拉宫格菜单 + CTA 按钮
 * - 移动端：汉堡菜单展开后双排布局 + 完整 CTA 按钮同步
 */
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  /** 点击导航栏外部区域时关闭移动端菜单 */
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  /** 关闭移动端菜单的快捷函数 */
  const closeMobile = () => setMobileOpen(false);

  /** 按语义获取登入/注册按钮配置，避免数组索引硬编码 */
  const loginBtn = CTA_BUTTONS.find((b) => b.label === "登入")!;
  const registerBtn = CTA_BUTTONS.find((b) => b.label === "注册")!;

  /** 移动端菜单打开时锁定背景页面滚动 */
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  /** Escape 键关闭移动端菜单 */
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mobileOpen]);

  /**
   * 渲染移动端导航项列表（普通链接 + 下拉菜单混合布局）。
   *
   * 将连续的普通导航链接批量放入双排网格，子菜单组全宽展开。
   *
   * @param closeMobile - 关闭移动端菜单的回调
   * @returns 导航项 React 节点数组
   */
  const renderMobileNavItems = (closeMobile: () => void): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    let plainBatch: NavItem[] = [];

    const flushBatch = () => {
      if (plainBatch.length === 0) return;
      const batch = plainBatch;
      if (batch.length === 1) {
        result.push(
          <MobileNavLink
            key={batch[0].label}
            label={batch[0].label}
            href={batch[0].href!}
            icon={batch[0].icon}
            iconColor={batch[0].iconColor}
            onClose={closeMobile}
          />
        );
      } else {
        result.push(
          <div key={`plain-${batch[0].label}`} className="grid grid-cols-2 gap-1.5">
            {batch.map((item) => (
              <MobileNavLink
                key={item.label}
                label={item.label}
                href={item.href!}
                icon={item.icon}
                iconColor={item.iconColor}
                onClose={closeMobile}
              />
            ))}
          </div>
        );
      }
      plainBatch = [];
    };

    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        flushBatch();
        result.push(
          <MobileDropdownMenu
            key={item.label}
            label={item.label}
            icon={item.dropdownIcon}
            iconClassName={item.dropdownIconColor}
            // eslint-disable-next-line react/no-children-prop
            children={item.children}
            onClose={closeMobile}
          />
        );
      } else {
        plainBatch.push(item);
      }
    });
    flushBatch();

    return result;
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl"
    >
      {/* ── 顶部栏 ── */}
      <div
        className={containerClass("flex h-16 items-center justify-between")}
        style={SITE_WIDTH_STYLE}
      >
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt="号卡之家 Logo"
            width={36}
            height={36}
            className="size-9"
          />
          <div className="flex flex-col">
            <span className="text-lg font-extrabold leading-none tracking-tight text-slate-800">
              号卡之家
            </span>
            <span className="mt-0.5 text-[10px] font-medium leading-none uppercase tracking-widest text-slate-400">
              全国正规号卡
            </span>
          </div>
        </Link>

        {/* 桌面端水平导航 */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            if (item.children) {
              return (
                <DropdownMenu
                  key={item.label}
                  label={item.label}
                  dropdownTitle={item.dropdownTitle}
                >
                  {item.children}
                </DropdownMenu>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href!}
                className="rounded-lg px-3 py-2 text-base font-medium tracking-wide text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-blue-700"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 桌面端 CTA 按钮组 + 移动端汉堡按钮 */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 桌面端：登入按钮（描边样式） */}
          <a
            href={loginBtn.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 md:inline-flex lg:px-3.5 lg:py-2 lg:text-base"
          >
            <LogIn className="size-4" />
            登入
          </a>
          {/* 桌面端：注册按钮（实心样式） */}
          <a
            href={registerBtn.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-medium text-white transition-all hover:bg-blue-700 hover:-translate-y-0.5 md:inline-flex lg:px-3.5 lg:py-2 lg:text-base"
          >
            <UserPlus className="size-4" />
            注册
          </a>

          {/* 移动端汉堡菜单切换按钮 */}
          <button
            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="切换菜单"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu-panel"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* ── 移动端展开菜单 ── */}
      {mobileOpen && (
        <div id="mobile-menu-panel" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-slate-200/60 bg-white md:hidden">
          {/* ── 导航链接区：按 PC 端顺序混排，双排网格 ── */}
          <div className="px-4 pt-3">
            {/* 分节标题 */}
            <div className="mb-2 px-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                导航
              </span>
            </div>

            <div className="space-y-1">
              {/* 按 NAV_ITEMS 原始顺序渲染：普通链接双排，子菜单组全宽展开 */}
              {renderMobileNavItems(closeMobile)}
            </div>
          </div>

          {/* ── 分隔线 ── */}
          <div className="mx-4 my-3 border-t border-slate-100" />

          {/* ── 账户操作区：登入 / 注册（功能与 PC 端同步） ── */}
          <div className="px-4 pb-4">
            <div className="mb-2 px-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                账户
              </span>
            </div>

            {/* 登入 & 注册：双排并列 */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={loginBtn.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <LogIn className="size-4" />
                登入
              </a>
              <a
                href={registerBtn.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-2 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <UserPlus className="size-4" />
                注册
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
