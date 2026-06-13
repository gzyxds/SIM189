/**
 * 共享商品卡片组件
 *
 * 首页套餐区 / 浩卡列表页 共用同一套卡片设计。
 * 修改此处即可全局统一商品卡片的展示样式。
 *
 * 设计要点：
 * - 卡片微投影 + 悬停上浮，营造层次感
 * - 运营商色系贯穿标签/徽章，快速识别品牌
 * - 圆角药丸标签提升可读性与美观度
 * - 完整暗色模式适配，夜间浏览不刺眼
 */
"use client";

import Link from "next/link";
import type { HaokaProduct, HaokaProductWithMeta, Operator } from "@/lib/api/haokavip";
import { mapOperator, OPERATOR_LABEL } from "@/lib/api/haokavip";
import { Button } from "@/components/ui/button";
import { Eye, ChevronRight, Star } from "lucide-react";

/* ========== 商品标签 ========== */

interface ProductTagsProps {
  /** 预计算标签列表（优先使用，避免客户端解析） */
  tags: { text: string; className: string }[];
  /** 最多显示数量 */
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
          className={`inline-block rounded-full border px-2 py-px text-[10px] leading-relaxed font-medium ${tag.className}`}
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

/** 商品卡片（含图片/标签/价格/按钮，完整暗色模式适配） */
export default function ProductCard({ product, provider }: ProductCardProps) {
  const prov = provider || mapOperator(product.product_name);
  const price = product.product_name.match(/(\d+\.?\d*)元/)?.[1] || "?";
  const isTop = product.top_flag === 1;
  const opStyle = OPERATOR_STYLE[prov] || OPERATOR_STYLE.unknown;

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-gray-300/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_28px_rgba(0,0,0,0.04)] dark:border-gray-800 dark:bg-gray-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.15)] dark:hover:border-gray-700 dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
      data-provider={prov}
    >
      {/* ===== 图片区域 ===== */}
      <Link href={`/haoka/${product.product_id}`} className="block">
        {product.product_image ? (
          <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/60 p-2 sm:p-3">
            <img
              src={product.product_image}
              alt={product.product_name}
              className="h-full w-full rounded-lg object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* 底部渐变遮罩 — 为推荐角标提供对比 */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-lg bg-gradient-to-t from-black/10 to-transparent" />
            {/* 推荐角标 */}
            {isTop && (
              <span className="absolute left-0 top-0 inline-flex items-center gap-1 rounded-br-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 text-[10px] font-bold text-white shadow-md sm:rounded-br-xl sm:px-3 sm:py-1.5 sm:text-[11px]">
                <Star className="size-3 fill-white" /> 推荐
              </span>
            )}
          </div>
        ) : (
          /* 无图片占位 */
          <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/60">
            <span className="text-xs text-gray-400 dark:text-gray-600">暂无图片</span>
          </div>
        )}
      </Link>

      {/* ===== 内容区域 ===== */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link href={`/haoka/${product.product_id}`} className="flex-1">
          {/* 运营商标签 */}
          <div className="mb-2 sm:mb-2.5 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:text-[11px] ${opStyle.badge}`}
            >
              <span className={`inline-block size-1.5 rounded-full ${opStyle.dot}`} />
              {OPERATOR_LABEL[prov]}
            </span>
          </div>

          {/* 标题 */}
          <h3 className="mb-1.5 sm:mb-2 line-clamp-2 text-xs sm:text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
            {product.product_name.replace(/【.*?】/g, "").trim()}
          </h3>

          {/* 价格 */}
          <div className="mb-2 sm:mb-3 flex items-baseline gap-0.5">
            <span className="text-xl sm:text-[28px] font-extrabold leading-none tracking-tight text-blue-600 dark:text-blue-400">
              ¥{price}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">/月</span>
          </div>

          {/* 标签（使用预计算数据，避免客户端解析） */}
          <ProductTags
            tags={(product as HaokaProductWithMeta)._tags}
            max={4}
          />
        </Link>

        {/* 分隔线 */}
        <div className="my-2 sm:my-3 border-t border-gray-100 dark:border-gray-800" />

        {/* ===== 操作按钮 ===== */}
        <div className="flex gap-1.5 sm:gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
            asChild
          >
            <Link href={`/haoka/${product.product_id}`}>
              <Eye className="size-3.5" />
              详情
            </Link>
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-blue-600 text-xs font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow-md dark:bg-blue-600 dark:hover:bg-blue-500"
            asChild
          >
            <a href={product.product_link} target="_blank" rel="noopener noreferrer">
              立即办理 <ChevronRight className="size-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
