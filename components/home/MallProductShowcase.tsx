/**
 * 商城首页促销楼层组件
 *
 * 架构说明（Next.js App Router）：
 * 1. 本文件是 Client Component（文件顶部 `"use client"`）
 * 2. 数据通过 Server Action `getMallProductsAction`（定义于 `lib/api/mall-products.ts`）
 *    在服务端执行，可安全使用 Node.js crypto 等服务端 API
 * 3. 所有 UI 子组件在客户端渲染，可自由使用 Hooks
 *
 * 设计目标：
 * - 左侧承担活动引流位：轮播 + 快捷入口 + 热销榜单（自动滚动）
 * - 右侧承担商品转化位：运营商 Tab + 商品卡片网格
 * - 整体留白克制、色彩柔和、信息层级清晰
 *
 * 多端适配策略：
 * - 移动端（<640px）：单列堆叠，2列商品网格，触摸滑动轮播
 * - 平板（640-1024px）：快捷入口4列，3列商品网格
 * - 桌面（≥1024px）：左右分栏，3列商品网格
 */
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Flame,
  Gift,
  MapPin,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type { HaokaProductWithMeta } from "@/lib/api/haokavip";
import { getMallProductsAction } from "@/lib/api/mall-products";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import { cn } from "@/lib/utils";

/* ==================================================================
 * 常量配置
 * ================================================================== */

/** 数据请求最大重试次数 */
const MAX_RETRY_COUNT = 3;

/** 数据请求超时时间（毫秒） */
const REQUEST_TIMEOUT_MS = 15_000;

/** 轮播自动播放间隔（毫秒） */
const CAROUSEL_INTERVAL_MS = 4000;

/** 触摸滑动触发最小距离（像素） */
const SWIPE_THRESHOLD = 50;

/* ==================================================================
 * 类型定义
 * ================================================================== */

/** 运营商筛选 Tab 配置 */
interface OperatorTab {
  key: string;
  label: string;
  icon?: LucideIcon;
}

/** 快捷入口配置 */
interface QuickEntryItem {
  icon: LucideIcon;
  label: string;
  desc: string;
  iconClassName: string;
  bgClassName: string;
}

/** 商品展示信息 */
interface ProductDisplayInfo {
  title: string;
  price: string;
  tags: string[];
}

/** 通用商品图片组件参数 */
interface ProductImageFrameProps {
  src?: string;
  alt: string;
  sizes: string;
  wrapperClassName: string;
  fallbackClassName: string;
  imageClassName?: string;
  priority?: boolean;
}

/* ==================================================================
 * 静态配置数据
 * ================================================================== */

/** 运营商 Tab 筛选选项 */
const OPERATOR_TABS: OperatorTab[] = [
  { key: "all", label: "热门推荐", icon: Flame },
  { key: "telecom", label: "电信专区" },
  { key: "unicom", label: "联通专区" },
  { key: "mobile", label: "移动专区" },
  { key: "broadcast", label: "广电专区" },
];

/** 轮播 Banner 图片路径列表 */
const BANNER_IMAGES = [
  "/HeroSection/hero.jpg",
  "/HeroSection/hero-3.png",
  "/HeroSection/hero-4.png",
] as const;

/** 快捷入口卡片配置 */
const QUICK_ENTRIES: QuickEntryItem[] = [
  {
    icon: Flame,
    label: "热门爆款",
    desc: "高转化套餐",
    iconClassName: "text-orange-500",
    bgClassName: "bg-orange-50 dark:bg-orange-500/10",
  },
  {
    icon: PhoneCall,
    label: "带语音卡",
    desc: "通话流量兼顾",
    iconClassName: "text-blue-500",
    bgClassName: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    icon: MapPin,
    label: "本地归属",
    desc: "筛选更方便",
    iconClassName: "text-emerald-500",
    bgClassName: "bg-emerald-50 dark:bg-emerald-500/10",
  },
  {
    icon: ShieldCheck,
    label: "官方正品",
    desc: "办理更安心",
    iconClassName: "text-rose-500",
    bgClassName: "bg-rose-50 dark:bg-rose-500/10",
  },
];

/* ==================================================================
 * 工具函数
 * ================================================================== */

/**
 * 从商品名称中提取月租价格。
 * 匹配形如 "29元" "19.9元" 的模式，未匹配返回 "?"。
 *
 * @param name - 商品名称原始字符串
 * @returns 价格数字字符串
 */
function extractPrice(name: string): string {
  return name.match(/(\d+\.?\d*)元/)?.[1] || "?";
}

/**
 * 清洗商品标题，移除前缀括号信息。
 * 例如 "【限时优惠】电信星卡29元" → "电信星卡29元"
 *
 * @param name - 商品名称原始字符串
 * @returns 清洗后的标题
 */
function cleanProductName(name: string): string {
  return name.replace(/【.*?】/g, "").trim();
}

/**
 * 提取用于展示的促销标签，优先使用服务端预计算标签。
 * 过滤掉通用无意义标签（包邮、随机归属地等），去重后取前 2 个。
 *
 * @param product - 带预计算元数据的商品对象
 * @returns 展示用的标签文本数组
 */
function getPromoTags(product: HaokaProductWithMeta): string[] {
  const preferred = product._tags
    .map((tag) => tag.text)
    .filter((text) => !/免费包邮|随机归属地|收货地即归属地/.test(text));

  const uniqueTags = Array.from(new Set(preferred));
  return uniqueTags.slice(0, 2);
}

/**
 * 统一提取商品展示所需信息，避免不同卡片内重复计算。
 *
 * @param product - 当前商品对象
 * @returns 包含标题、价格与展示标签的结构化信息
 */
function getProductDisplayInfo(
  product: HaokaProductWithMeta
): ProductDisplayInfo {
  return {
    title: cleanProductName(product.product_name),
    price: extractPrice(product.product_name),
    tags: getPromoTags(product),
  };
}

/**
 * 判断图片地址是否为远程 HTTPS 资源。
 *
 * Next/Image 对外部图片常需保留优化能力，而本地或非 HTTPS 图片则禁用优化，
 * 避免出现加载策略不兼容的问题。
 *
 * @param src - 商品图片地址
 * @returns 是否为 HTTPS 远程图片
 */
function isRemoteHttpsImage(src?: string): boolean {
  return typeof src === "string" && src.startsWith("https");
}

/**
 * 根据随机种子生成热销榜单展示数据。
 *
 * 使用确定性伪随机算法保证同一批次服务端与客户端选择结果一致，
 * 从而避免水合不一致问题。
 *
 * @param products - 完整商品列表
 * @param randomSeed - 服务端提供的随机种子
 * @returns 用于榜单滚动展示的商品数组
 */
function getRankingProducts(
  products: HaokaProductWithMeta[],
  randomSeed: number
): HaokaProductWithMeta[] {
  if (products.length === 0) return [];

  /** 基于 seed + index 的确定性伪随机数，范围 [0, 1) */
  function seededRandom(index: number): number {
    const x = Math.sin(randomSeed + index) * 10000;
    return x - Math.floor(x);
  }

  /* 从 seed 本身确定抽取数量（15~20） */
  const count = 15 + Math.floor(seededRandom(0) * 6);

  /* Fisher-Yates 风格的索引洗牌，使用种子化伪随机 */
  const indices = Array.from(products.keys());
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(i + 1) * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices.slice(0, Math.min(count, indices.length)).map((k) => products[k]);
}

/**
 * 带重试和超时的 Server Action 调用封装。
 *
 * 使用指数退避策略：首次立即请求，失败后等待 1s、2s、4s… 依次重试。
 * 单次请求超过 timeoutMs 毫秒自动视为失败。
 *
 * @param retries - 最大重试次数，默认 MAX_RETRY_COUNT
 * @param timeoutMs - 单次请求超时时间（毫秒），默认 REQUEST_TIMEOUT_MS
 * @returns 服务端返回的数据结果
 * @throws 超过重试次数后抛出最后一次错误
 */
async function fetchMallProductsWithRetry(
  retries = MAX_RETRY_COUNT,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Awaited<ReturnType<typeof getMallProductsAction>>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    /* 非首次请求前，执行指数退避等待 */
    if (attempt > 0) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      await new Promise((r) => setTimeout(r, delay));
    }

    try {
      /* 使用 Promise.race 实现超时控制 */
      const result = await Promise.race([
        getMallProductsAction(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`请求超时（${timeoutMs / 1000}s）`)),
            timeoutMs
          )
        ),
      ]);

      /* 服务端返回业务错误时，也进行重试 */
      if (result.error) {
        if (attempt < retries) {
          lastError = new Error(result.error);
          continue;
        }
        /* 最后一次重试仍然失败，统一抛出异常 */
        throw new Error(result.error);
      }

      return result;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));

      /* 最后一次重试仍失败则跳出循环 */
      if (attempt >= retries) break;
    }
  }

  throw lastError ?? new Error("获取商品数据失败，请稍后重试");
}

/**
 * 订阅系统的“减少动态效果”偏好。
 *
 * 使用 `useSyncExternalStore` 直接桥接浏览器媒体查询，避免在 `useEffect`
 * 中先读取再调用 `setState`，从而规避 React 关于 effect 内同步设值的告警。
 *
 * @returns 当前用户是否启用了减少动态效果偏好
 */
function usePrefersReducedMotion(): boolean {
  /**
   * 订阅媒体查询变化事件。
   *
   * @param onStoreChange - 当媒体查询结果变化时，通知 React 重新读取快照
   * @returns 取消订阅函数
   */
  function subscribe(onStoreChange: () => void): () => void {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const mediaQueryList = window.matchMedia("(prefers-reduced-motion: reduce)");
    mediaQueryList.addEventListener("change", onStoreChange);

    return () => mediaQueryList.removeEventListener("change", onStoreChange);
  }

  /**
   * 在客户端读取当前媒体查询结果。
   *
   * @returns 当前是否匹配减少动态效果
   */
  function getSnapshot(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /**
   * 在服务端提供稳定兜底快照，避免预渲染阶段访问 `window`。
   *
   * @returns 服务端默认值
   */
  function getServerSnapshot(): boolean {
    return false;
  }

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ==================================================================
 * 骨架屏组件
 * ================================================================== */

/**
 * 商品卡片骨架屏。
 *
 * 模拟真实商品卡片的视觉结构（图片区 + 标签 + 标题 + 价格 + 按钮），
 * 保持与正式布局一致的骨架结构，减少加载前后视觉跳动。
 *
 * @returns 骨架屏节点
 */
function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="aspect-square animate-pulse bg-gray-100 dark:bg-gray-800" />
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <div className="mb-2 flex gap-1.5">
          <div className="h-4 w-12 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="h-4 w-10 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        <div className="mt-1.5 h-4 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        <div className="mt-3 flex items-end justify-between">
          <div className="h-8 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-8 w-16 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  );
}

/**
 * 通用商品图片展示组件。
 *
 * 统一处理以下逻辑：
 * 1. `next/image` 填充式展示
 * 2. 无图片时的占位文案
 * 3. 远程 HTTPS 图片的优化策略
 *
 * @param props - 图片组件参数
 * @returns 商品图片展示节点
 */
function ProductImageFrame({
  src,
  alt,
  sizes,
  wrapperClassName,
  fallbackClassName,
  imageClassName = "object-cover",
  priority = false,
}: ProductImageFrameProps) {
  return (
    <div className={wrapperClassName}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={imageClassName}
          loading={priority ? undefined : "lazy"}
          priority={priority}
          unoptimized={!isRemoteHttpsImage(src)}
        />
      ) : (
        <div className={fallbackClassName}>暂无图片</div>
      )}
    </div>
  );
}

/**
 * 热销榜单单项骨架屏。
 *
 * 模拟侧边栏榜单行结构（编号 + 缩略图 + 标题 + 价格），
 * 在热销榜数据加载期间提供平滑的加载过渡。
 *
 * @returns 骨架屏节点
 */
function RankingItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-white px-3 py-2.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="size-6 shrink-0 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
      <div className="size-12 shrink-0 animate-pulse rounded-sm bg-gray-100 dark:bg-gray-800" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  );
}

/* ==================================================================
 * 轮播组件
 * ================================================================== */

/**
 * 左侧活动轮播 Banner。
 *
 * 功能特性：
 * - 自动轮播（尊重 prefers-reduced-motion 偏好自动暂停）
 * - 移动端支持触摸左右滑动切换
 * - 指示器可点击跳转到对应 Banner
 */
function PromoCarousel() {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  /* 自动轮播定时器（减少动画偏好时暂停） */
  useEffect(() => {
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % BANNER_IMAGES.length);
    }, CAROUSEL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [prefersReducedMotion]);

  /** 触摸开始：记录起始 X 坐标 */
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.changedTouches[0].clientX;
  }

  /** 触摸结束：计算滑动方向并切换 Banner */
  function handleTouchEnd(e: React.TouchEvent) {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        /* 左滑 → 下一张 */
        setCurrent((prev) => (prev + 1) % BANNER_IMAGES.length);
      } else {
        /* 右滑 → 上一张 */
        setCurrent((prev) => (prev - 1 + BANNER_IMAGES.length) % BANNER_IMAGES.length);
      }
    }
  }

  return (
    <div
      className="relative h-full min-h-[200px] overflow-hidden rounded-md bg-white shadow-sm sm:min-h-[240px]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="商城促销轮播图"
      aria-roledescription="carousel"
    >
      {BANNER_IMAGES.map((imageSrc, index) => (
        <div
          key={imageSrc}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            current === index ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          role="group"
          aria-roledescription="slide"
          aria-label={`第 ${index + 1} 张，共 ${BANNER_IMAGES.length} 张`}
          aria-hidden={current !== index}
        >
          <Image
            src={imageSrc}
            alt={`商城促销轮播图 ${index + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            loading="eager"
          />
        </div>
      ))}

      {/* 轮播指示器：移动端加大触控面积 */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-4 sm:gap-1.5">
        {BANNER_IMAGES.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`切换到第 ${index + 1} 张轮播`}
            onClick={() => setCurrent(index)}
            className={cn(
              "h-2.5 rounded-full transition-all sm:h-1.5",
              current === index
                ? "w-6 bg-white sm:w-5"
                : "w-2.5 bg-white/50 sm:w-2"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* ==================================================================
 * 快捷入口组件
 * ================================================================== */

/**
 * 左侧快捷入口卡片。
 *
 * 使用图标 + 标题 + 描述的组合呈现入口信息，
 * 悬停时微上浮 + 阴影增强，点击时缩放反馈。
 *
 * @param props - 组件参数
 * @param props.item - 快捷入口配置项
 * @returns 快捷入口卡片节点
 */
function QuickEntryCard({ item }: { item: QuickEntryItem }) {
  return (
    <div role="button" tabIndex={0} className="group flex items-center gap-2.5 rounded-md border border-gray-100 bg-white px-3 py-2.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] dark:border-gray-800 dark:bg-gray-900 sm:gap-3 sm:py-3 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-hidden">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md transition-transform duration-300 group-hover:scale-105 sm:size-10",
          item.bgClassName
        )}
      >
        <item.icon className={cn("size-4", item.iconClassName)} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{item.label}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
      </div>
    </div>
  );
}

/* ==================================================================
 * 商品卡片组件
 * ================================================================== */

/**
 * 右侧促销商品卡片。
 *
 * 使用 next/image 优化图片加载性能，支持自动 WebP 转换和响应式尺寸。
 * 移动端增加 active 态反馈提升触控体验。
 */
function PromoProductCard({ product }: { product: HaokaProductWithMeta }) {
  const { price, title, tags } = getProductDisplayInfo(product);

  return (
    <a
      href={product.product_link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-md active:scale-[0.98] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
    >
      <div className="relative">
        <ProductImageFrame
          src={product.product_image}
          alt={title}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          wrapperClassName="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-800"
          fallbackClassName="flex h-full w-full items-center justify-center text-xs text-gray-400 dark:text-gray-500"
        />

        {/* 促销角标 */}
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-semibold text-orange-600 shadow-sm backdrop-blur-sm dark:bg-gray-900/92 dark:text-orange-400">
          <Gift className="size-3" />
          热门促销
        </div>
      </div>

      {/* 卡片信息区 */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              正规办理
            </span>
          )}
        </div>

        <h4 className="line-clamp-2 min-h-[2.6rem] text-[13px] font-semibold leading-5 text-gray-900 dark:text-gray-100 sm:min-h-[2.8rem] sm:text-sm sm:leading-6">
          {title}
        </h4>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-end gap-1">
              <span className="text-sm font-semibold text-red-500">¥</span>
              <span className="text-2xl font-black tracking-tight text-red-500">{price}</span>
              <span className="pb-1 text-xs text-gray-400">/月</span>
            </div>
            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">热门套餐 · 在线办理</p>
          </div>

          <span className="inline-flex shrink-0 items-center rounded-full bg-blue-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors group-hover:bg-blue-700 dark:bg-blue-500 dark:group-hover:bg-blue-400 sm:px-3 sm:text-xs">
            立即办理
          </span>
        </div>
      </div>
    </a>
  );
}

/* ==================================================================
 * 热销榜单单项组件
 * ================================================================== */

/**
 * 左侧热销榜单商品项。
 *
 * 设计目标：榜单编号 + 小图 + 单行标题 + 价格，压缩垂直高度提升信息密度。
 * 使用 next/image 优化缩略图加载。
 *
 * @param product - 当前需要渲染的商品对象
 * @param index - 商品在榜单中的排序索引，从 0 开始
 */
function SidebarProductListItem({
  product,
  index,
  ariaHidden,
}: {
  product: HaokaProductWithMeta;
  index: number;
  /** 副本元素需标记 aria-hidden 以避免屏幕阅读器重复朗读 */
  ariaHidden?: boolean;
}) {
  const { price, title } = getProductDisplayInfo(product);

  return (
    <a
      href={product.product_link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-md bg-white px-3 py-2.5 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] dark:bg-gray-900"
      aria-hidden={ariaHidden || undefined}
    >
      {/* 榜单排名编号 */}
      <div
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          index < 3
            ? "bg-orange-500 text-white dark:bg-orange-400"
            : "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
        )}
      >
        {index + 1}
      </div>

      {/* 商品缩略图 */}
      <ProductImageFrame
        src={product.product_image}
        alt={title}
        sizes="48px"
        wrapperClassName="relative size-12 shrink-0 overflow-hidden rounded-sm bg-gray-50 dark:bg-gray-800"
        fallbackClassName="flex h-full w-full items-center justify-center text-[10px] text-gray-400 dark:text-gray-500"
        imageClassName="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* 标题 + 价格 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xs text-gray-400 dark:text-gray-500">月租</span>
          <span className="text-base font-black tracking-tight text-red-500">¥{price}</span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">起</span>
        </div>
      </div>

      <ArrowRight className="size-4 shrink-0 text-gray-300 transition-colors group-hover:text-orange-500 dark:text-gray-600 dark:group-hover:text-orange-400" />
    </a>
  );
}

/* ==================================================================
 * 热销榜单滚动组件
 * ================================================================== */

/**
 * 热销榜单自动滚动组件。
 *
 * 设计目标：
 * 1. 随机抽取 15~20 个商品，组成滚动列表
 * 2. CSS `translateY(-50%)` 配合内容副本实现无缝循环
 * 3. 滚动区域固定高度展示约 5 行商品
 * 4. 悬停时暂停动画，方便用户点击
 * 5. 尊重 prefers-reduced-motion 偏好，暂停滚动动画
 *
 * 使用种子化伪随机数（sin 哈希）确保 SSR 与客户端渲染结果完全一致。
 *
 * @param products - 浩卡联盟商品列表
 * @param randomSeed - 服务端生成的随机种子
 */
function HotRankingScroll({
  products,
  randomSeed,
}: {
  products: HaokaProductWithMeta[];
  randomSeed: number;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const scrollProducts = useMemo(
    () => getRankingProducts(products, randomSeed),
    [products, randomSeed]
  );

  /* 商品不足时回退 */
  if (scrollProducts.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-400 dark:text-gray-500">
        暂无商品数据
      </div>
    );
  }

  return (
    <div
      className="group overflow-hidden"
      style={{ height: "480px" }}
      role="marquee"
      aria-label="热销商品榜单滚动列表"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="animate-ranking-scroll space-y-2.5 sm:space-y-3"
        style={{ animationPlayState: isPaused ? "paused" : "running" }}
      >
        {scrollProducts.map((product, index) => (
          <SidebarProductListItem key={product.product_id} product={product} index={index} />
        ))}
        {/* 内容副本：与上方完全一致，用于 translateY(-50%) 后无缝衔接 */}
        {scrollProducts.map((product, index) => (
          <SidebarProductListItem
            key={`dup-${product.product_id}`}
            product={product}
            index={index}
            ariaHidden
          />
        ))}
      </div>
    </div>
  );
}

/* ==================================================================
 * 运营商 Tab 栏组件
 * ================================================================== */

/**
 * 运营商筛选 Tab 栏。
 *
 * 移动端可横向滚动，两端显示渐变遮罩作为可滚动视觉提示。
 */
function OperatorTabBar({
  activeTab,
  onTabChange,
}: {
  /** 当前激活的 Tab key */
  activeTab: string;
  /** Tab 切换回调 */
  onTabChange: (key: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /** 检测并更新左右滚动状态 */
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  /* 初始和窗口变化时检测滚动状态 */
  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState]);

  return (
    <div className="relative">
      {/* 左侧渐变遮罩 */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-linear-to-r from-white to-transparent dark:from-gray-900" />
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto border-b border-gray-100 pb-2 scrollbar-hide dark:border-gray-800 sm:gap-5"
        onScroll={updateScrollState}
        role="tablist"
        aria-label="运营商筛选"
      >
        {OPERATOR_TABS.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 pb-2 text-[13px] font-semibold transition-colors sm:text-sm",
                isActive
                  ? "border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              )}
            >
              {tab.icon ? <tab.icon className="size-3.5" /> : null}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 右侧渐变遮罩 */}
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-linear-to-l from-white to-transparent dark:from-gray-900" />
      )}
    </div>
  );
}

/**
 * 商城楼层顶部标题区域。
 *
 * 仅负责标题文案展示，抽离后让主组件聚焦于数据与布局编排。
 *
 * @returns 标题区域节点
 */
function MallSectionHeader() {
  return (
    <div className="mb-5 flex flex-col gap-2 sm:mb-7">
      <div className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
        <Flame className="size-3.5" />
        商城爆款推荐
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
            低月租大流量卡专区
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            精选高性价比流量卡，在线办理，包邮到家
          </p>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          精选展示，快速浏览，轻松办理
        </span>
      </div>
    </div>
  );
}

/**
 * 商城楼层加载态。
 *
 * 保持与正式布局一致的骨架结构，减少加载前后视觉跳动。
 *
 * @returns 加载态节点
 */
function MallShowcaseLoading() {
  return (
    <section id="mall" className="bg-[#f8f9fa] dark:bg-gray-950">
      <div className={containerClass("py-8 md:py-12")} style={SITE_WIDTH_STYLE}>
        <div className="mb-5 flex flex-col gap-2 sm:mb-7">
          <div className="h-6 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </div>

        <div className="flex flex-col gap-4 md:gap-5 lg:flex-row lg:gap-5">
          <div className="w-full lg:w-1/2">
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <div className="h-52 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-800 sm:h-60 md:h-64 lg:h-[292px]" />
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800"
                  />
                ))}
              </div>
              <div className="space-y-2.5 rounded-md border border-gray-100 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 sm:p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <RankingItemSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="rounded-md border border-gray-100 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 sm:p-4 md:p-5">
              <div className="mb-4 space-y-2">
                <div className="h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-4 w-40 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="mb-4 h-8 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 商城楼层失败态。
 *
 * @param props - 失败态参数
 * @param props.error - 当前错误信息
 * @param props.onRetry - 用户点击重试时的回调
 * @returns 失败态节点
 */
function MallShowcaseError({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <section id="mall" className="bg-[#f8f9fa] py-10 dark:bg-gray-950 sm:py-12">
      <div className="mx-auto flex min-h-[240px] max-w-5xl flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-white px-5 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:min-h-[280px] sm:px-6">
        <Flame className="mb-3 size-10 text-gray-300 dark:text-gray-600" />
        <p className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
          数据加载失败
        </p>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-[0.98] dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          <RefreshCw className="size-4" />
          重新加载
        </button>
      </div>
    </section>
  );
}

/**
 * 右侧商品网格空状态。
 *
 * @returns 空态提示节点
 */
function EmptyFilteredProducts() {
  return (
    <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50/50 text-center dark:border-gray-800 dark:bg-gray-950/40 sm:min-h-[320px]">
      <Flame className="mb-3 size-10 text-gray-300 dark:text-gray-700" />
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        暂无该运营商商品
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        请切换其他运营商查看热门套餐
      </p>
    </div>
  );
}

/* ==================================================================
 * 主组件
 * ================================================================== */

/**
 * 商城首页促销楼层主组件。
 *
 * 通过 Server Action 在服务端拉取商品数据，客户端渲染完整楼层 UI。
 * 包含左侧活动引流位（轮播/快捷入口/热销榜单滚动）和右侧商品转化位
 * （运营商 Tab 筛选 + 精选商品卡片网格）。
 *
 * 多端适配：
 * - 移动端：上下堆叠布局，2列商品网格
 * - 平板（md）：3列商品网格，快捷入口4列
 * - 桌面（lg）：左右 50/50 分栏
 *
 * 数据请求：
 * - 带指数退避重试（最多 3 次）
 * - 单次请求 15s 超时控制
 * - 失败后提供手动重试按钮
 */
export default function MallProductShowcase() {
  const [activeTab, setActiveTab] = useState("all");
  const [products, setProducts] = useState<HaokaProductWithMeta[]>([]);
  const [randomSeed, setRandomSeed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * 数据加载函数，支持重试。
   * 使用 useCallback 缓存以保持引用稳定。
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchMallProductsWithRetry();
      if (result.error) {
        setError(result.error);
      } else {
        setProducts(result.products);
        setRandomSeed(result.randomSeed);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "获取商品数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  /* 挂载时自动加载数据（loadData 引用稳定，无需取消逻辑） */
  useEffect(() => {
    loadData();
  }, [loadData]);

  /* 按运营商筛选数据源 */
  const filteredProducts = useMemo(() => {
    const source =
      activeTab === "all"
        ? products
        : products.filter((product) => product._provider === activeTab);

    /* 右侧固定展示 6 个商品，保持整齐网格布局 */
    return source.slice(0, 6);
  }, [products, activeTab]);

  /* ===== 加载中骨架屏状态 ===== */
  if (loading) {
    return <MallShowcaseLoading />;
  }

  /* ===== 加载失败状态（含重试按钮） ===== */
  if (error) {
    return <MallShowcaseError error={error} onRetry={loadData} />;
  }

  /* ===== 正常渲染 ===== */
  return (
    <section id="mall" className="bg-[#f8f9fa] dark:bg-gray-950">
      <div className={containerClass("py-8 md:py-12")} style={SITE_WIDTH_STYLE}>
        {/* ===== 区段标题 ===== */}
        <MallSectionHeader />

        {/* ===== 主体内容区：移动端堆叠，桌面端左右分栏（lg:items-stretch 保证等高） ===== */}
        <div className="flex flex-col gap-4 md:gap-5 lg:flex-row lg:items-stretch lg:gap-5">
          {/* ===== 左侧：活动引流位 ===== */}
          <div className="w-full lg:w-1/2">
            <div className="flex h-full flex-col gap-2.5 sm:gap-3">
              {/* 轮播 Banner */}
              <div className="h-52 sm:h-60 md:h-64 lg:h-[292px]">
                <PromoCarousel />
              </div>

              {/* 快捷入口：移动端2列，平板4列 */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                {QUICK_ENTRIES.map((item) => (
                  <QuickEntryCard key={item.label} item={item} />
                ))}
              </div>

              {/* 热销榜单 */}
              <div className="rounded-md border border-gray-100 bg-white p-3.5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">热销榜单</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">实时热销商品排行</p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                    TOP 5
                  </span>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  <HotRankingScroll products={products} randomSeed={randomSeed} />
                </div>
              </div>
            </div>
          </div>

          {/* ===== 右侧：商品转化位 ===== */}
          <div className="w-full lg:w-1/2">
            <div className="flex h-full flex-col rounded-md border border-gray-100 bg-white p-3.5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">精选套餐</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">按运营商查看热门在售商品</p>
                </div>
                <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  共 {filteredProducts.length} 款
                </span>
              </div>

              {/* 运营商 Tab 栏（带滚动指示器） */}
              <OperatorTabBar activeTab={activeTab} onTabChange={setActiveTab} />

              {/* 商品网格区域 */}
              <div className="mt-4">
                {filteredProducts.length === 0 ? (
                  <EmptyFilteredProducts />
                ) : (
                  <div className="grid flex-1 grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3">
                    {filteredProducts.map((product) => (
                      <PromoProductCard key={product.product_id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
