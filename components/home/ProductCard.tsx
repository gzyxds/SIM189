/**
 * 共享商品卡片组件
 *
 * 首页套餐区 / 各平台列表页 共用同一套卡片设计。
 * 修改此处即可全局统一商品卡片的展示样式。
 *
 * 设计要点：
 * - 移动端水平布局（图左文右），省空间且易于扫读
 * - 桌面端垂直布局（图上文下），5 列等高卡片
 * - 图片内留白 + 圆角展示，提升精致感
 * - 价格高亮 + 梯度阴影 + 悬浮动效
 * - 圆角药丸标签提升可读性与美观度
 * - 完整暗色模式适配，夜间浏览不刺眼
 */
"use client";

import Link from "next/link";
import type { HaokaProduct, HaokaProductWithMeta, Operator } from "@/lib/api/haokavip";
import { mapOperator, OPERATOR_LABEL } from "@/lib/api/haokavip";
import { Button } from "@/components/ui/button";
import { Eye, ChevronRight, Star, TrendingUp } from "lucide-react";

/* ========== 商品标签 ========== */

interface ProductTagsProps {
  tags: { text: string; className: string }[];
  max?: number;
}

/** 商品标签列表（圆角药丸，支持暗色模式） */
export function ProductTags({ tags, max }: ProductTagsProps) {
  const displayTags = max ? tags.slice(0, max) : tags;
  if (displayTags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-0.5 sm:gap-1">
      {displayTags.map((tag, i) => (
        <span
          key={i}
          className={`inline-block rounded-full border px-1.5 sm:px-2 py-px text-[9px] sm:text-[10px] leading-relaxed font-medium ${tag.className}`}
        >
          {tag.text}
        </span>
      ))}
    </div>
  );
}

/* ========== 运营商配色（亮色/暗色双主题） ========== */

const OPERATOR_STYLE: Record<string, { badge: string; dot: string }> = {
  mobile: {
    badge: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
    dot: "bg-green-500 dark:bg-green-400",
  },
  telecom: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    dot: "bg-blue-500 dark:bg-blue-400",
  },
  unicom: {
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
    dot: "bg-orange-500 dark:bg-orange-400",
  },
  broadcast: {
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400",
    dot: "bg-purple-500 dark:bg-purple-400",
  },
  unknown: {
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    dot: "bg-gray-400 dark:bg-gray-500",
  },
};

/* ========== 商品卡片 ========== */

interface ProductCardProps {
  product: HaokaProduct;
  provider?: Operator;
}

/** 商品卡片（移动端图左文右 / 桌面端图上文下，完整暗色模式适配） */
export default function ProductCard({ product, provider }: ProductCardProps) {
  const prov = provider || mapOperator(product.product_name);
  const price = product.product_name.match(/(\d+\.?\d*)元/)?.[1] || "?";
  const isTop = product.top_flag === 1;
  const opStyle = OPERATOR_STYLE[prov] || OPERATOR_STYLE.unknown;

  return (
    <div
      className="group flex flex-row overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200/80 hover:shadow-lg hover:shadow-blue-100/50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800/50 dark:hover:shadow-lg dark:hover:shadow-blue-900/20 sm:flex-col"
      data-provider={prov}
    >
      {/* ===== 图片区域 ===== */}
      <Link
        href={`/haoka/${product.product_id}`}
        className="block shrink-0 w-[130px] sm:w-full"
      >
        {product.product_image ? (
          <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100/50 p-3 dark:from-gray-800 dark:to-gray-800/60">
            <div className="h-full w-full overflow-hidden rounded-lg">
              <img
                src={product.product_image}
                alt={product.product_name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            {isTop && (
              <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 text-[9px] font-bold text-white shadow-md sm:rounded-full sm:px-3 sm:py-1.5 sm:text-[11px]">
                <Star className="size-2.5 sm:size-3 fill-white" /> 推荐
              </span>
            )}
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3 dark:from-gray-800 dark:to-gray-800/60">
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700/50">
              <span className="text-xs text-gray-400 dark:text-gray-600">暂无图片</span>
            </div>
          </div>
        )}
      </Link>

      {/* ===== 内容区域 ===== */}
      <div className="flex flex-1 flex-col p-3 sm:p-4 min-w-0">
        <Link href={`/haoka/${product.product_id}`} className="flex flex-col gap-1.5 sm:gap-2">
          {/* 运营商标签 + 佣金提示 */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold sm:text-[10px] ${opStyle.badge}`}
            >
              <span className={`inline-block size-1.5 rounded-full ${opStyle.dot}`} />
              {OPERATOR_LABEL[prov]}
            </span>
            {(product as Record<string, unknown>).commition_price && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-[8px] font-medium text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 sm:px-2 sm:text-[9px]">
                <TrendingUp className="size-2.5 sm:size-3" />
                高佣
              </span>
            )}
          </div>

          {/* 标题 */}
          <h3 className="line-clamp-2 text-[13px] sm:text-sm font-bold leading-snug text-gray-900 dark:text-gray-100">
            {product.product_name.replace(/【.*?】/g, "").trim()}
          </h3>

          {/* 价格 */}
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black leading-none tracking-tight text-blue-600 dark:text-blue-400 sm:text-[28px]">
              ¥{price}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 sm:text-xs">/月</span>
          </div>

          {/* 标签 */}
          <ProductTags
            tags={(product as HaokaProductWithMeta)._tags}
            max={3}
          />
        </Link>

        {/* ===== 操作按钮 ===== */}
        <div className="mt-auto flex gap-2 pt-2 sm:pt-3 sm:border-t sm:border-gray-100 dark:sm:border-gray-800">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 sm:h-9 text-[10px] sm:text-xs border-gray-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-700 dark:hover:text-blue-400 dark:hover:bg-blue-950/30 px-1.5 sm:px-3"
            asChild
          >
            <Link href={`/haoka/${product.product_id}`}>
              <Eye className="size-3 sm:size-3.5" />
              详情
            </Link>
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 sm:h-9 bg-gradient-to-r from-blue-600 to-blue-500 text-[10px] sm:text-xs font-medium text-white shadow-sm hover:from-blue-700 hover:to-blue-600 hover:shadow-md dark:from-blue-600 dark:to-blue-500 dark:hover:from-blue-500 dark:hover:to-blue-400"
            asChild
          >
            <a href={product.product_link} target="_blank" rel="noopener noreferrer">
              立即办理<ChevronRight className="size-3 sm:size-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
