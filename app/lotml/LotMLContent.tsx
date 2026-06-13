/**
 * LotML 商品列表客户端组件
 *
 * 参考样式：`参考样式/分类.md`
 * 提供运营商、可用流量、通话时长、地区四维筛选，以及无限滚动分页加载、空态处理等交互功能。
 * 接收服务端预计算好的商品数据，避免客户端重复解析。
 */
"use client";

import { useState, useMemo, useRef, useEffect, useCallback, useReducer } from "react";
import Link from "next/link";
import Image from "next/image";
import type { LotMLProductWithMeta, LotMLOperator } from "@/lib/api/lotml-utils";
import { LOTML_OPERATOR_LABEL, mapLotMLOperator } from "@/lib/api/lotml-utils";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import {
  Signal,
  ShoppingCart,
  ShieldCheck,
  TrendingUp,
  MapPin,
  RefreshCw,
  Eye,
  ChevronRight,
  ChevronDown,
  Star,
  BadgeCheck,
  Zap,
  Phone,
  User,
  Clock,
  Search,
} from "lucide-react";
import ClaimTicker from "@/components/ClaimTicker";

/* ========== 类型 ========== */

interface LotMLContentProps {
  products: LotMLProductWithMeta[];
  error: string | null;
}

/** 筛选字段枚举 */
type LotMLFilterField = "operator" | "flow" | "voice" | "area";

/** 筛选状态 */
interface LotMLFilterState {
  operator: string;
  flow: string;
  voice: string;
  area: string;
}

/** 筛选项结构 */
interface FilterOption {
  key: string;
  label: string;
  value: string;
}

/** 筛选栏分组结构 */
interface FilterSection {
  field: LotMLFilterField;
  label: string;
  options: FilterOption[];
  counts: Record<string, number>;
}

/** 全部筛选值 */
const ALL_FILTER_VALUE = "all";

/** 默认筛选状态 */
const LOTML_DEFAULT_FILTERS: LotMLFilterState = {
  operator: ALL_FILTER_VALUE,
  flow: ALL_FILTER_VALUE,
  voice: ALL_FILTER_VALUE,
  area: ALL_FILTER_VALUE,
};

/** 四大运营商筛选项 */
const OPERATOR_OPTIONS: FilterOption[] = [
  { key: "operator:all", label: "全部", value: ALL_FILTER_VALUE },
  { key: "operator:mobile", label: LOTML_OPERATOR_LABEL.mobile, value: "mobile" },
  { key: "operator:telecom", label: LOTML_OPERATOR_LABEL.telecom, value: "telecom" },
  { key: "operator:unicom", label: LOTML_OPERATOR_LABEL.unicom, value: "unicom" },
  { key: "operator:broadcast", label: LOTML_OPERATOR_LABEL.broadcast, value: "broadcast" },
];

/** 可用流量筛选项，按参考样式固定 */
const FLOW_OPTIONS: FilterOption[] = [
  { key: "flow:all", label: "全部", value: ALL_FILTER_VALUE },
  { key: "flow:lte100", label: "100G以内", value: "lte100" },
  { key: "flow:100to200", label: "100G-200G", value: "100to200" },
  { key: "flow:gt200", label: "200G以上", value: "gt200" },
];

/** 通话时长筛选项，按参考样式固定 */
const VOICE_OPTIONS: FilterOption[] = [
  { key: "voice:all", label: "全部", value: ALL_FILTER_VALUE },
  { key: "voice:lte100", label: "100分钟以内", value: "lte100" },
  { key: "voice:100to200", label: "100-200分钟", value: "100to200" },
  { key: "voice:gt200", label: "200分钟以上", value: "gt200" },
];

/**
 * 获取商品运营商枚举值。
 * @param product - 当前商品。
 * @returns 运营商枚举值。
 */
function getLotMLOperatorValue(product: LotMLProductWithMeta): LotMLOperator {
  return mapLotMLOperator(product.operator);
}

/**
 * 获取商品地区展示值。
 * @param product - 当前商品。
 * @returns 地区名称；为空时返回“随机归属地”。
 */
function getLotMLAreaLabel(product: LotMLProductWithMeta): string {
  return product.area || "随机归属地";
}

/**
 * 从商品中提取通用流量数值。
 * @param product - 当前商品。
 * @returns 提取到的流量数值；提取失败返回 0。
 */
function getLotMLFlowNumber(product: LotMLProductWithMeta): number {
  const flowText = product._flow || "";
  const match = flowText.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

/**
 * 从商品中提取通话分钟数值。
 * @param product - 当前商品。
 * @returns 提取到的分钟数；提取失败返回 0。
 */
function getLotMLVoiceNumber(product: LotMLProductWithMeta): number {
  const voiceText = product._voice || "";
  const match = voiceText.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

/**
 * 判断商品是否命中运营商筛选。
 * @param product - 当前商品。
 * @param operatorValue - 当前运营商筛选值。
 * @returns 命中返回 true，否则返回 false。
 */
function matchesLotMLOperator(
  product: LotMLProductWithMeta,
  operatorValue: string,
): boolean {
  if (operatorValue === ALL_FILTER_VALUE) {
    return true;
  }

  return getLotMLOperatorValue(product) === operatorValue;
}

/**
 * 判断商品是否命中流量区间筛选。
 * @param product - 当前商品。
 * @param flowValue - 当前流量筛选值。
 * @returns 命中返回 true，否则返回 false。
 */
function matchesLotMLFlow(product: LotMLProductWithMeta, flowValue: string): boolean {
  if (flowValue === ALL_FILTER_VALUE) {
    return true;
  }

  const flowNumber = getLotMLFlowNumber(product);

  switch (flowValue) {
    case "lte100":
      return flowNumber <= 100;
    case "100to200":
      return flowNumber > 100 && flowNumber <= 200;
    case "gt200":
      return flowNumber > 200;
    default:
      return true;
  }
}

/**
 * 判断商品是否命中通话时长区间筛选。
 * @param product - 当前商品。
 * @param voiceValue - 当前通话时长筛选值。
 * @returns 命中返回 true，否则返回 false。
 */
function matchesLotMLVoice(product: LotMLProductWithMeta, voiceValue: string): boolean {
  if (voiceValue === ALL_FILTER_VALUE) {
    return true;
  }

  const voiceNumber = getLotMLVoiceNumber(product);

  switch (voiceValue) {
    case "lte100":
      return voiceNumber <= 100;
    case "100to200":
      return voiceNumber > 100 && voiceNumber <= 200;
    case "gt200":
      return voiceNumber > 200;
    default:
      return true;
  }
}

/**
 * 判断商品是否命中地区筛选。
 * @param product - 当前商品。
 * @param areaValue - 当前地区筛选值。
 * @returns 命中返回 true，否则返回 false。
 */
function matchesLotMLArea(product: LotMLProductWithMeta, areaValue: string): boolean {
  if (areaValue === ALL_FILTER_VALUE) {
    return true;
  }

  return getLotMLAreaLabel(product) === areaValue;
}

/**
 * 判断商品是否命中指定筛选字段。
 * @param product - 当前商品。
 * @param field - 筛选字段。
 * @param value - 当前筛选值。
 * @returns 命中返回 true，否则返回 false。
 */
function matchesLotMLField(
  product: LotMLProductWithMeta,
  field: LotMLFilterField,
  value: string,
): boolean {
  switch (field) {
    case "operator":
      return matchesLotMLOperator(product, value);
    case "flow":
      return matchesLotMLFlow(product, value);
    case "voice":
      return matchesLotMLVoice(product, value);
    case "area":
      return matchesLotMLArea(product, value);
  }
}

/**
 * 按四维筛选状态过滤商品列表。
 * @param products - 原始商品列表。
 * @param filters - 当前筛选状态。
 * @param excludedField - 可选排除字段，用于计算同组筛选数量。
 * @returns 过滤后的商品列表。
 */
function filterLotMLProducts(
  products: LotMLProductWithMeta[],
  filters: LotMLFilterState,
  excludedField?: LotMLFilterField,
): LotMLProductWithMeta[] {
  return products.filter((product) =>
    (Object.entries(filters) as [LotMLFilterField, string][]).every(([field, value]) => {
      if (field === excludedField || value === ALL_FILTER_VALUE) {
        return true;
      }
      return matchesLotMLField(product, field, value);
    }),
  );
}

/**
 * 构建地区筛选项。
 * @param products - 原始商品列表。
 * @returns 动态地区筛选项，按商品数量降序排列。
 */
function buildAreaOptions(products: LotMLProductWithMeta[]): FilterOption[] {
  const areaCounter = new Map<string, number>();

  for (const product of products) {
    const areaLabel = getLotMLAreaLabel(product);
    areaCounter.set(areaLabel, (areaCounter.get(areaLabel) || 0) + 1);
  }

  return [
    { key: "area:all", label: "全部", value: ALL_FILTER_VALUE },
    ...[...areaCounter.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "zh-CN"))
      .map(([area]) => ({
        key: `area:${area}`,
        label: area,
        value: area,
      })),
  ];
}

/**
 * 构建筛选栏分组与动态数量。
 * @param products - 原始商品列表。
 * @param filters - 当前筛选状态。
 * @param searchQuery - 当前搜索词。
 * @returns 可直接用于渲染的筛选栏配置。
 */
function buildLotMLFilterSections(
  products: LotMLProductWithMeta[],
  filters: LotMLFilterState,
  searchQuery: string = "",
): FilterSection[] {
  // 先应用搜索条件
  const searchedProducts = searchQuery.trim()
    ? products.filter(p => p.productName.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : products;

  const sections: FilterSection[] = [
    {
      field: "operator",
      label: "运营商",
      options: OPERATOR_OPTIONS,
      counts: {},
    },
    {
      field: "flow",
      label: "可用流量",
      options: FLOW_OPTIONS,
      counts: {},
    },
    {
      field: "voice",
      label: "通话时长",
      options: VOICE_OPTIONS,
      counts: {},
    },
    {
      field: "area",
      label: "地区",
      options: buildAreaOptions(searchedProducts),
      counts: {},
    },
  ];

  return sections.map((section) => {
    const baseProducts = filterLotMLProducts(searchedProducts, filters, section.field);
    const counts: Record<string, number> = {};

    for (const option of section.options) {
      counts[option.key] =
        option.value === ALL_FILTER_VALUE
          ? baseProducts.length
          : baseProducts.filter((product) =>
              matchesLotMLField(product, section.field, option.value),
            ).length;
    }

    return {
      ...section,
      counts,
    };
  });
}

/* ========== 返佣角标 ========== */

/** 页面顶部平台优势介绍 */
function AdvantagesSection() {
  const items = [
    {
      icon: ShieldCheck,
      title: "一级代理正规渠道",
      desc: "直连运营商，卡品质量稳定有保障",
    },
    {
      icon: TrendingUp,
      title: "秒返/次月返佣金",
      desc: "业内领先佣金，支持秒到账模式",
    },
    {
      icon: MapPin,
      title: "多省归属地可选",
      desc: "部分套餐支持选号、收货地归属",
    },
    {
      icon: BadgeCheck,
      title: "实名合规不扣量",
      desc: "订单数据实时同步，数据准确透明",
    },
  ];

  return (
    <section className={containerClass("pt-6")} style={SITE_WIDTH_STYLE}>
      <h3 className="mb-3 text-base font-medium text-gray-800 sm:mb-4 sm:text-lg">
        号卡联盟平台优势
      </h3>
      {/* 移动端双排，桌面端四列 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-5"
          >
            <div className="mb-1.5 flex items-center gap-2 text-blue-600 sm:mb-2">
              <item.icon className="size-4 shrink-0 sm:size-5" />
              <span className="text-sm font-semibold text-gray-800 sm:text-base">
                {item.title}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-400 sm:text-sm sm:text-gray-500">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ========== 筛选栏 ========== */

/** 通用筛选下拉框 */
function FilterSelect({
  label,
  options,
  activeValue,
  onChange,
  counts,
}: {
  label: string;
  options: FilterOption[];
  activeValue: string;
  onChange: (value: string) => void;
  counts?: Record<string, number>;
}) {
  return (
    <div className="flex min-w-[140px] flex-1 flex-col gap-1.5 sm:min-w-[160px]">
      <label className="pl-1 text-xs font-medium text-gray-500">{label}</label>
      <div className="relative">
        <select
          value={activeValue}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full cursor-pointer appearance-none rounded-md border border-gray-200 bg-gray-50/50 px-3.5 pr-8 text-sm text-gray-700 outline-none transition-all hover:border-gray-300 hover:bg-gray-50 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
          aria-label={`${label}筛选`}
        >
          {options.map((opt) => {
            const count = counts?.[opt.key];
            const optionLabel =
              count !== undefined ? `${opt.label} (${count})` : opt.label;

            return (
              <option key={opt.key} value={opt.value}>
                {optionLabel}
              </option>
            );
          })}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
          <ChevronDown className="size-4" />
        </div>
      </div>
    </div>
  );
}

/** 筛选面板 */
function FilterBar({
  sections,
  filters,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: {
  sections: FilterSection[];
  filters: LotMLFilterState;
  onFilterChange: (field: LotMLFilterField, value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className={containerClass("py-4")} style={SITE_WIDTH_STYLE}>
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {sections.map((section) => (
            <FilterSelect
              key={section.field}
              label={section.label}
              options={section.options}
              activeValue={filters[section.field]}
              onChange={(value) => onFilterChange(section.field, value)}
              counts={section.counts}
            />
          ))}
          
          {/* 搜索框 */}
          <div className="flex min-w-[140px] flex-1 flex-col gap-1.5 sm:min-w-[160px]">
            <label className="pl-1 text-xs font-medium text-gray-500">搜索</label>
            <div className="relative">
              <input
                type="text"
                placeholder="搜索套餐名称..."
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className="h-10 w-full rounded-md border border-gray-200 bg-gray-50/50 px-3.5 pl-9 pr-3 text-sm text-gray-700 outline-none transition-all hover:border-gray-300 hover:bg-gray-50 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                aria-label="搜索套餐名称"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="size-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========== 商品卡片 ========== */

/**
 * 返佣角标配置
 */
const COMMISSION_BADGE: Record<string, { label: string; className: string }> = {
  秒返: {
    label: "秒返",
    className: "bg-gradient-to-r from-green-500 to-emerald-500",
  },
  次月返: {
    label: "次月返",
    className: "bg-gradient-to-r from-blue-500 to-indigo-500",
  },
};

/** 运营商图片角标样式（毛玻璃 + 品牌色背景） */
const OPERATOR_OVERLAY: Record<string, string> = {
  mobile: "bg-green-500/80 text-white",
  telecom: "bg-blue-500/80 text-white",
  unicom: "bg-orange-500/80 text-white",
  broadcast: "bg-purple-500/80 text-white",
  unknown: "bg-gray-500/80 text-white",
};

/* ========== 规格参数标签 ========== */

/**
 * 规格参数标签（参考 Product.astro 样式）
 * @param icon - 图标组件
 * @param value - 参数值
 * @param colorClass - 背景与文字颜色类
 */
function SpecTag({
  icon: Icon,
  value,
  colorClass,
}: {
  icon: React.ElementType;
  value: string;
  colorClass: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${colorClass}`}
    >
      <Icon className="size-3.5 shrink-0" />
      <span>{value}</span>
    </span>
  );
}

/* ========== 商品卡片 ========== */

/** LotML 商品卡片（参考 Product.astro 统一设计） */
function LotMLProductCard({ product }: { product: LotMLProductWithMeta }) {
  const overlayClass =
    OPERATOR_OVERLAY[product._operator] || OPERATOR_OVERLAY.unknown;
  const price = product._price;
  const operatorLabel = LOTML_OPERATOR_LABEL[product._operator];
  const commissionBadge = COMMISSION_BADGE[product.BackMoneyType];

  // 精简标签：返佣类型 / 选号 / 归属地
  const visibleTags = product._tags.filter(
    (t) =>
      t.text.includes(product.BackMoneyType) ||
      t.text === product.area ||
      t.text === "可选号" ||
      t.text === "收货地归属",
  );

  return (
    <div className="group relative mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-600/20 hover:shadow-lg hover:shadow-blue-600/5">
      {/* 商品图片区域 */}
      <Link href={`/lotml/${product.productID}`} className="block">
        <div className="relative overflow-hidden bg-gray-100 p-2">
          {product.mainPic ? (
            <div className="relative aspect-4/3 overflow-hidden rounded-lg">
              <Image
                src={product.mainPic}
                alt={product.productName}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          ) : (
            <div className="aspect-4/3 rounded-lg bg-linear-to-br from-gray-50 to-gray-100" />
          )}

          {/* 运营商标签（左上角毛玻璃） */}
          <div
            className={`absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs backdrop-blur-sm ${overlayClass}`}
          >
            <Signal className="size-3" />
            <span className="font-medium">{operatorLabel}</span>
          </div>

          {/* 返佣角标（右上角） */}
          {commissionBadge && (
            <span
              className={`absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-sm ${commissionBadge.className}`}
            >
              <Star className="size-3 fill-white" />
              {commissionBadge.label}
            </span>
          )}
        </div>
      </Link>

      {/* 内容区域 */}
      <div className="flex flex-col p-4">
        <Link href={`/lotml/${product.productID}`} className="flex-1">
          {/* 套餐名称 */}
          <h3 className="mb-3 line-clamp-2 text-sm font-bold leading-snug text-gray-800">
            {product.productName}
          </h3>

          {/* 规格参数标签（统一两行显示，含特性标签） */}
          <div className="mb-3 h-[52px] overflow-hidden">
            <div className="flex flex-wrap gap-1.5">
              {product._flow && (
                <SpecTag
                  icon={Zap}
                  value={`${product._flow}通用`}
                  colorClass="bg-blue-50 text-blue-600"
                />
              )}
              {product._voice && (
                <SpecTag
                  icon={Phone}
                  value={product._voice}
                  colorClass="bg-green-50 text-green-600"
                />
              )}
              <SpecTag
                icon={User}
                value={`${product.Age1 || 18}-${product.Age2 || 60}岁`}
                colorClass="bg-gray-100 text-gray-500"
              />
              <SpecTag
                icon={Clock}
                value={product._duration}
                colorClass="bg-orange-50 text-orange-600"
              />
              {/* 特性标签（rounded-full，与规格标签在同一容器） */}
              {visibleTags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-blue-600/4 px-2.5 py-0.5 text-[11px] font-medium text-blue-600/80"
                >
                  {tag.text}
                </span>
              ))}
            </div>
          </div>

          {/* 套餐说明（Taocan 优先，Rule 兜底，参考 Product.astro） */}
          {(product.Taocan || product.Rule) && (
            <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-400">
              {product.Taocan || product.Rule?.slice(0, 60)}
            </p>
          )}
        </Link>

        {/* 分隔线 */}
        <div className="mb-3 border-t border-gray-100" />

        {/* 价格 + 操作按钮（价格 shrink-0 避免被挤压） */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex shrink-0 items-baseline gap-1">
            <span className="text-lg font-extrabold text-blue-600">
              {price > 0 ? `¥${price}` : "面议"}
            </span>
            {price > 0 && (
              <span className="text-xs text-gray-400">/月</span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href={`/lotml/${product.productID}`}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700 transition-colors hover:border-blue-600/30 hover:text-blue-600"
            >
              <Eye className="size-4" />
              查看详情
            </Link>
            <a
              href={product._orderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-normal text-white shadow-sm transition-all duration-200 hover:bg-blue-600/90 hover:shadow-md"
            >
              立即办理
              <ChevronRight className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========== 商品网格 ========== */

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

/** 商品网格组件（带无限滚动分页） */
function ProductGrid({
  products,
}: {
  products: LotMLProductWithMeta[];
}) {
  /* ===== 分页状态 ===== */
  const [visibleCount, dispatchVisible] = useReducer(visibleReducer, PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 筛选条件变化时重置分页
  useEffect(() => {
    dispatchVisible({ type: "reset" });
  }, [products]);

  const displayed = products.slice(0, visibleCount);
  const hasMore = displayed.length < products.length;

  /* ===== 无限滚动 ===== */
  const loadMore = useCallback(() => {
    dispatchVisible({ type: "loadMore", maxCount: products.length });
  }, [products.length]);

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (products.length === 0) {
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
          <LotMLProductCard key={product.productID} product={product} />
        ))}
      </div>

      {/* ===== 分页信息栏 ===== */}
      <div className="mt-8">
        {/* 进度条 */}
        <div className="mx-auto mb-4 h-1.5 max-w-xs overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-linear-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out dark:from-blue-400 dark:to-blue-500"
            style={{ width: `${Math.round((displayed.length / products.length) * 100)}%` }}
          />
        </div>

        {hasMore && (
          <div className="flex flex-col items-center gap-3">
            {/* 加载状态文字 */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              已展示
              <span className="mx-1 font-semibold text-gray-600 dark:text-gray-300">{displayed.length}</span>
              件，共
              <span className="mx-1 font-semibold text-gray-600 dark:text-gray-300">{products.length}</span>
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
              加载更多（剩余 {products.length - displayed.length} 件）
            </button>
          </div>
        )}

        {!hasMore && products.length > 0 && (
          <div className="mx-auto mt-3 flex max-w-xs items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 shadow-sm dark:bg-blue-700">
            <span className="inline-block size-2 rounded-full bg-white/70" />
            <span className="text-sm font-medium text-white">
              已展示全部
              <span className="mx-1 font-semibold">{products.length}</span>
              件商品
            </span>
          </div>
        )}
      </div>
    </>
  );
}

/* ========== 底部 CTA ========== */

/** 底部引导区 */
function CtaSection() {
  return (
    <section className="bg-linear-to-r from-blue-600 to-blue-700 py-14">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
          立即申请，免费包邮到家！
        </h2>
        <p className="mb-6 text-sm text-blue-100 sm:text-base">
          正规一级代理渠道，7天无理由退换，零风险体验
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://haokawx.lot-ml.com/ProductEn/Index/1a654e0b341cadd2"
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
            返回首页
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ========== 错误状态 ========== */

/** API 错误展示区块 */
function ErrorBanner({ error }: { error: string }) {
  return (
    <div className={containerClass("py-4")} style={SITE_WIDTH_STYLE}>
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        <span className="font-semibold">数据加载失败：</span>
        {error}
      </div>
    </div>
  );
}

/* ========== 页面主体 ========== */

/** LotML 商品列表页主组件 */
export default function LotMLContent({ products, error }: LotMLContentProps) {
  const [filters, setFilters] = useState<LotMLFilterState>(LOTML_DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * 更新指定筛选字段的当前值。
   * @param field - 当前要更新的筛选字段。
   * @param value - 新的筛选值。
   * @returns 无返回值。
   */
  function handleFilterChange(field: LotMLFilterField, value: string): void {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  const filterSections = useMemo(
    () => buildLotMLFilterSections(products, filters, searchQuery),
    [products, filters, searchQuery],
  );
  const filteredProducts = useMemo(
    () => {
      let res = filterLotMLProducts(products, filters);
      if (searchQuery.trim()) {
        const lowerQuery = searchQuery.trim().toLowerCase();
        res = res.filter((p) => p.productName.toLowerCase().includes(lowerQuery));
      }
      return res;
    },
    [products, filters, searchQuery],
  );

  return (
    <div className="flex min-h-svh flex-col bg-[#f5f7fa]">
      <Header />

      {/* ===== 页面 Banner ===== */}
      <section className="bg-linear-to-br from-blue-600 via-blue-700 to-indigo-700 py-8 sm:py-12">
        <div className={containerClass()} style={SITE_WIDTH_STYLE}>
          <div className="flex items-center gap-3">
            <Signal className="size-6 shrink-0 text-blue-200 sm:size-8" />
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                172号卡联盟大流量卡套餐大全
              </h1>
              <p className="mt-1 text-xs text-blue-100 sm:text-sm">
                一级代理直供 · 秒返佣金 · 全国包邮 · 共 {products.length} 款在售套餐
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* 平台优势 */}
        <AdvantagesSection />
        <ClaimTicker />

        {/* 错误提示 */}
        {error && <ErrorBanner error={error} />}

        {/* 筛选栏 */}
        <FilterBar
          sections={filterSections}
          filters={filters}
          onFilterChange={handleFilterChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* 商品网格 */}
        <div className={containerClass("pb-10")} style={SITE_WIDTH_STYLE}>
          <ProductGrid products={filteredProducts} />
        </div>
      </main>

      {/* 底部 CTA */}
      <CtaSection />
      <Footer />
    </div>
  );
}
