/**
 * 浩卡联盟商品展示页面/haoka
 *
 * 使用服务端预计算元数据（_provider / _location / _duration / _tags），
 * 避免客户端重复解析 product_name，提升筛选和渲染性能。
 */

"use client";

import { useState, useMemo, useRef, useEffect, useCallback, useReducer } from "react";
import Link from "next/link";
import type { HaokaProductWithMeta, Operator, DurationType } from "@/lib/api/haokavip";
import { OPERATOR_LABEL } from "@/lib/api/haokavip";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import ProductCard from "@/components/home/ProductCard";
import {
  Signal,
  ArrowRight,
  ShoppingCart,
  ShieldCheck,
  TrendingUp,
  MapPin,
  RefreshCw,
} from "lucide-react";
import ClaimTicker from "@/components/ClaimTicker";

/* ========== 类型定义 ========== */

interface HaokaContentProps {
  products: HaokaProductWithMeta[];
  error: string | null;
}

/** 商品携带的筛选维度（从预计算字段读取） */
interface ProductMeta {
  provider: Operator;
  location: string;
  shipping: string;
  duration: string;
}

/* ========== 筛选选项常量 ========== */

const OPERATOR_OPTIONS = [
  { key: "all" as const, label: "全部运营商" },
  ...(["mobile", "telecom", "unicom", "broadcast"] as Operator[]).map((k) => ({
    key: k,
    label: OPERATOR_LABEL[k],
  })),
];

const DURATION_OPTIONS = [
  { key: "all" as const, label: "全部时长" },
  { key: "长期" as DurationType, label: "长期" },
  { key: "2年" as DurationType, label: "2年" },
  { key: "1年" as DurationType, label: "1年" },
];

/* ========== 页面顶栏优势 ========== */

function AdvantagesSection() {
  const items = [
    { icon: ShieldCheck, title: "一级代理卡品", desc: "直连运营商渠道，确保卡品质量和稳定性" },
    { icon: TrendingUp, title: "超高分销佣金", desc: "业内领先的佣金比例，助力合作伙伴收益最大化" },
    { icon: MapPin, title: "卡品全国覆盖", desc: "覆盖全国各省市，满足不同地区用户需求" },
    { icon: RefreshCw, title: "实时回传不扣量", desc: "订单实时同步，确保数据准确无误" },
  ];

  return (
    <section className={containerClass("pt-6")} style={SITE_WIDTH_STYLE}>
      <h3 className="mb-3 text-base font-medium text-gray-800 sm:mb-4 sm:text-lg">亚平科技号卡供应链优势</h3>
      {/* 移动端双排，桌面端四列 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-5">
            <div className="mb-1.5 flex items-center gap-2 text-blue-600 sm:mb-2">
              <item.icon className="size-4 shrink-0 sm:size-5" />
              <span className="text-sm font-semibold text-gray-800 sm:text-base">{item.title}</span>
            </div>
            <p className="text-xs leading-relaxed text-gray-400 sm:text-sm sm:text-gray-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ========== 筛选栏 ========== */

/** 通用筛选行组件 */
function FilterRow({
  label,
  options,
  activeKey,
  onChange,
  counts,
}: {
  label: string;
  options: { key: string; label: string }[];
  activeKey: string;
  onChange: (key: string) => void;
  counts?: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="relative mr-1 flex items-center pl-3 text-sm font-medium text-gray-600 before:absolute before:left-0 before:top-1/2 before:h-3.5 before:w-[3px] before:-translate-y-1/2 before:rounded-sm before:bg-blue-600">
        {label}
      </span>
      {options.map((opt) => {
        const isActive = activeKey === opt.key;
        const count = counts?.[opt.key];
        if (count !== undefined && count === 0 && opt.key !== "all") return null;

        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`rounded-md border px-3.5 py-1.5 text-xs transition-all duration-300 ${isActive
                ? "border-blue-600 bg-blue-600 font-medium text-white shadow-sm shadow-blue-600/20"
                : "border-transparent bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
              }`}
          >
            {opt.label}
            {count !== undefined && (
              <span className={`ml-1 text-[11px] ${isActive ? "text-white/80" : "text-gray-400"}`}>
                ({count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function FilterBar({
  activeOperator,
  onOperatorChange,
  activeLocation,
  onLocationChange,
  activeDuration,
  onDurationChange,
  operatorCounts,
  locationOptions,
  locationCounts,
}: {
  activeOperator: string;
  onOperatorChange: (k: string) => void;
  activeLocation: string;
  onLocationChange: (k: string) => void;
  activeDuration: string;
  onDurationChange: (k: string) => void;
  operatorCounts: Record<string, number>;
  locationOptions: { key: string; label: string }[];
  locationCounts: Record<string, number>;
}) {
  return (
    <div className={containerClass("py-4")} style={SITE_WIDTH_STYLE}>
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <FilterRow
          label="运营商"
          options={OPERATOR_OPTIONS}
          activeKey={activeOperator}
          onChange={onOperatorChange}
          counts={operatorCounts}
        />
        <div className="border-t border-gray-50" />
        <FilterRow
          label="归属地"
          options={locationOptions}
          activeKey={activeLocation}
          onChange={onLocationChange}
          counts={locationCounts}
        />
        <div className="border-t border-gray-50" />
        <FilterRow
          label="套餐时长"
          options={DURATION_OPTIONS}
          activeKey={activeDuration}
          onChange={onDurationChange}
        />
      </div>
    </div>
  );
}

/* ========== 商品网格（分页加载，默认 12 条） ========== */

/** 每页加载数量 */
const PAGE_SIZE = 12;

/** visibleCount reducer：dispatch 稳定引用，无卸载后 setState 问题 */
type VisibleAction = { type: "reset" } | { type: "loadMore"; maxCount: number };
function visibleReducer(state: number, action: VisibleAction): number {
  switch (action.type) {
    case "reset":
      return PAGE_SIZE;
    case "loadMore":
      return Math.min(state + PAGE_SIZE, action.maxCount);
  }
}

/** 浩卡商品卡片网格 */
function ProductGrid({
  products,
  activeOperator,
  activeLocation,
  activeDuration,
}: {
  products: HaokaProductWithMeta[];
  activeOperator: string;
  activeLocation: string;
  activeDuration: string;
}) {
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const meta = getProductMeta(p);
      if (activeOperator !== "all" && meta.provider !== activeOperator) return false;
      if (activeLocation !== "all" && meta.location !== activeLocation && meta.shipping !== activeLocation) return false;
      if (activeDuration !== "all" && meta.duration !== activeDuration) return false;
      return true;
    });
  }, [products, activeOperator, activeLocation, activeDuration]);

  /* ===== 分页状态 ===== */

  // 筛选条件变化时重置为初始页数
  const filterKey = `${activeOperator}-${activeLocation}-${activeDuration}`;
  const [visibleCount, dispatchVisible] = useReducer(visibleReducer, PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 筛选条件变化时重置分页
  useEffect(() => {
    dispatchVisible({ type: "reset" });
  }, [filterKey]);

  // 当前展示的商品
  const displayed = filtered.slice(0, visibleCount);
  const hasMore = displayed.length < filtered.length;

  /* ===== IntersectionObserver 自动加载 ===== */

  const loadMore = useCallback(() => {
    dispatchVisible({ type: "loadMore", maxCount: filtered.length });
  }, [filtered.length]);

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 当哨兵元素进入可视区域时加载更多
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" } // 提前 200px 触发加载
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <Signal className="mb-4 size-12 text-gray-300" />
        <p className="text-base font-medium text-gray-500">暂无符合条件的套餐</p>
        <p className="mt-1 text-sm text-gray-400">请尝试调整筛选条件</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayed.map((product) => (
          <ProductCard
            key={product.product_id}
            product={product}
            provider={product._provider}
          />
        ))}
      </div>

      {/* ===== 分页信息栏 ===== */}
      <div className="mt-8">
        {/* 进度条 */}
        <div className="mx-auto mb-4 h-1.5 max-w-xs overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
              className="h-full rounded-full bg-linear-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out dark:from-blue-400 dark:to-blue-500"
              style={{ width: `${Math.round((displayed.length / filtered.length) * 100)}%` }}
            />
        </div>

        {hasMore && (
          <div className="flex flex-col items-center gap-3">
            {/* 加载状态文字 */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              已展示
              <span className="mx-1 font-semibold text-gray-600 dark:text-gray-300">{displayed.length}</span>
              件，共
              <span className="mx-1 font-semibold text-gray-600 dark:text-gray-300">{filtered.length}</span>
              件
            </p>
            {/* 哨兵 + 加载更多按钮 */}
            <div ref={sentinelRef} className="h-1 w-full" />
            <button
              type="button"
              onClick={loadMore}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:border-blue-500/30 dark:hover:text-blue-400"
            >
              <RefreshCw className="size-4" />
              加载更多（剩余 {filtered.length - displayed.length} 件）
            </button>
          </div>
        )}

        {!hasMore && filtered.length > 0 && (
          <div className="mx-auto mt-3 flex max-w-xs items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 shadow-sm dark:bg-blue-700">
            <span className="inline-block size-2 rounded-full bg-white/70" />
            <span className="text-sm font-medium text-white">
              已展示全部
              <span className="mx-1 font-semibold">{filtered.length}</span>
              件商品
            </span>
          </div>
        )}
      </div>
    </>
  );
}

/* ========== 商品元数据工具（从预计算字段读取） ========== */

function getProductMeta(product: HaokaProductWithMeta): ProductMeta {
  return {
    provider: product._provider,
    location: product._location,
    shipping: product._shipping,
    duration: product._duration,
  };
}

/* ========== 底部 CTA ========== */

function CtaSection() {
  return (
    <section className="bg-linear-to-r from-blue-600 to-blue-700 py-14">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
          立即申请，免费包邮到家！
        </h2>
        <p className="mb-6 text-sm text-blue-100 sm:text-base">
          正规渠道、7天无理由退换，零风险体验
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://www.haokavip.com/page.html#/usercenter"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-blue-600 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <ShoppingCart className="size-4" />
            免费申请号卡
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-all hover:border-white hover:bg-white/10"
          >
            返回首页 <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ========== 错误页面 ========== */

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Signal className="mx-auto mb-4 size-12 text-red-300" />
          <h2 className="mb-1 text-lg font-semibold text-gray-700">数据加载失败</h2>
          <p className="text-sm text-gray-400">{message}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ========== 主入口 ========== */

export default function HaokaContent({ products, error }: HaokaContentProps) {
  const [activeOperator, setActiveOperator] = useState("all");
  const [activeLocation, setActiveLocation] = useState("all");
  const [activeDuration, setActiveDuration] = useState("all");

  /** 计算各维度统计数据 */
  const { operatorCounts, locationOptions, locationCounts } = useMemo(() => {
    const opCounts: Record<string, number> = { all: products.length, mobile: 0, telecom: 0, unicom: 0, broadcast: 0 };
    const locCounts: Record<string, number> = { all: products.length };
    const locSet = new Set<string>();

    products.forEach((p) => {
      const meta = getProductMeta(p);
      // 运营商
      if (opCounts[meta.provider] !== undefined) opCounts[meta.provider]++;
      // 归属地
      locSet.add(meta.location);
      locCounts[meta.location] = (locCounts[meta.location] || 0) + 1;
    });

    const locOpts = [
      { key: "all", label: "全部归属地" },
      ...Array.from(locSet)
        .sort()
        .filter((k) => locCounts[k] > 0)
        .map((k) => ({ key: k, label: k })),
    ];

    return { operatorCounts: opCounts, locationOptions: locOpts, locationCounts: locCounts };
  }, [products]);

  if (error) return <ErrorPage message={error} />;

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header />

      {/* ===== 页面 Banner ===== */}
      <section className="bg-linear-to-br from-blue-600 via-blue-700 to-indigo-700 py-8 sm:py-12">
        <div className={containerClass()} style={SITE_WIDTH_STYLE}>
          <div className="flex items-center gap-3">
            <Signal className="size-6 shrink-0 text-blue-200 sm:size-8" />
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                浩卡联盟大流量卡套餐大全
              </h1>
              <p className="mt-1 text-xs text-blue-100 sm:text-sm">
                一级代理直供 · 秒返佣金 · 全国包邮 · 共 {products.length} 款在售套餐
              </p>
            </div>
          </div>
        </div>
      </section>

      <main>
        <AdvantagesSection />
        <ClaimTicker />
        <FilterBar
          activeOperator={activeOperator}
          onOperatorChange={setActiveOperator}
          activeLocation={activeLocation}
          onLocationChange={setActiveLocation}
          activeDuration={activeDuration}
          onDurationChange={setActiveDuration}
          operatorCounts={operatorCounts}
          locationOptions={locationOptions}
          locationCounts={locationCounts}
        />
        <section className={containerClass("pb-10")} style={SITE_WIDTH_STYLE}>
          <ProductGrid
            products={products}
            activeOperator={activeOperator}
            activeLocation={activeLocation}
            activeDuration={activeDuration}
          />
        </section>
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
