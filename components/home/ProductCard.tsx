/**
 * 共享商品卡片组件（浩卡联盟数据源）
 *
 * 首页套餐区 / 浩卡列表页共用同一套卡片设计。
 * 样式参考 app/linxi/LinxiContent.tsx 的 LinxiProductCard：
 * - 垂直卡片：图上文下，圆角 2xl + 悬浮上移动效
 * - 图片内留白 + 内圆角，悬浮缓慢放大
 * - 左上角运营商毛玻璃角标、右上角推荐/高佣角标
 * - 规格参数彩色标签（流量/通话/时长/年龄，带图标）
 * - 特性标签 + 分隔线 + 蓝色价格 + 药丸按钮
 * - 完整暗色模式适配
 */
"use client";

import Link from "next/link";
import type { HaokaProduct, HaokaProductWithMeta, Operator } from "@/lib/api/haokavip";
import { mapOperator, OPERATOR_LABEL } from "@/lib/api/haokavip";
import {
  Signal,
  Star,
  Zap,
  Phone,
  Clock,
  User,
  Eye,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

/* ========== 运营商图片角标样式（参考 Linxi 毛玻璃设计） ========== */

const OPERATOR_OVERLAY: Record<string, string> = {
  mobile: "bg-green-500/80 text-white",
  telecom: "bg-blue-500/80 text-white",
  unicom: "bg-orange-500/80 text-white",
  broadcast: "bg-purple-500/80 text-white",
  unknown: "bg-gray-500/80 text-white",
};

/* ========== 规格参数标签（参考 Linxi SpecTag） ========== */

/**
 * 规格参数标签
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

interface ProductCardProps {
  product: HaokaProduct;
  provider?: Operator;
}

/** 从商品名称提取结构化规格参数（与 haokavip.parseTags 来源一致） */
function extractSpecs(product: HaokaProduct) {
  const name = product.product_name || "";
  const flow = name.match(/\d+(?:\.\d+)?\s*(?:GB|G)/i)?.[0]?.toUpperCase() || "";
  const voiceMatch = name.match(/(\d+)\s*分钟/);
  const voice = voiceMatch ? `${voiceMatch[1]}分钟` : "";
  const ageMatch = name.match(/年龄(\d+)-(\d+)/);
  const age = ageMatch ? `${ageMatch[1]}-${ageMatch[2]}岁` : "";
  return { flow, voice, age };
}

/** 规格区已展示的参数，特性标签需排除这些 */
const SPEC_TAG_PATTERNS = [
  /GB/i,
  /G\s*$/i,
  /分钟/,
  /^(短期|1年|2年|长期|未知)$/,
  /^\d+-\d+岁$/,
];

/** 商品卡片（参考 LinxiProductCard 设计，完整暗色模式适配） */
export default function ProductCard({ product, provider }: ProductCardProps) {
  const prov =
    provider || (product as HaokaProductWithMeta)._provider || mapOperator(product.product_name);
  const overlayClass = OPERATOR_OVERLAY[prov] || OPERATOR_OVERLAY.unknown;
  const { flow, voice, age } = extractSpecs(product);
  const duration = (product as HaokaProductWithMeta)._duration;
  const price = product.product_name.match(/(\d+(?:\.\d+)?)\s*元/)?.[1] || "?";
  const isTop = product.top_flag === 1;
  const hasCommission = !!(product as Record<string, unknown>).commition_price;
  const rawTags = (product as HaokaProductWithMeta)._tags || [];
  const featureTags = rawTags
    .filter((t) => !SPEC_TAG_PATTERNS.some((re) => re.test(t.text)))
    .slice(0, 3);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-600/20 hover:shadow-lg hover:shadow-blue-600/5 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-600/40 dark:hover:shadow-blue-900/20">
      {/* 商品图片区域 */}
      <Link href={`/haoka/${product.product_id}`} className="block">
        <div className="relative overflow-hidden bg-gray-100 p-2 dark:bg-gray-800">
          {product.product_image ? (
            <div className="relative aspect-square overflow-hidden rounded-lg">
              <img
                src={product.product_image}
                alt={product.product_name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="aspect-square rounded-lg bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/60" />
          )}

          {/* 运营商标签（左上角毛玻璃） */}
          <div
            className={`absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs backdrop-blur-sm ${overlayClass}`}
          >
            <Signal className="size-3" />
            <span className="font-medium">{OPERATOR_LABEL[prov]}</span>
          </div>

          {/* 推荐 + 高佣角标（右上角） */}
          {(isTop || hasCommission) && (
            <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
              {isTop && (
                <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                  <Star className="size-3 fill-white" />
                  推荐
                </span>
              )}
              {hasCommission && (
                <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-rose-500 to-pink-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                  <TrendingUp className="size-3" />
                  高佣
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* 内容区域 */}
      <div className="flex flex-col p-4">
        <Link href={`/haoka/${product.product_id}`} className="flex-1">
          {/* 套餐名称 */}
          <h3 className="mb-3 line-clamp-2 text-sm font-bold leading-snug text-gray-800 dark:text-gray-100">
            {product.product_name.replace(/【.*?】/g, "").trim()}
          </h3>

          {/* 规格参数标签 */}
          <div className="mb-3 h-[52px] overflow-hidden">
            <div className="flex flex-wrap gap-1.5">
              {flow && (
                <SpecTag
                  icon={Zap}
                  value={`${flow}通用`}
                  colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                />
              )}
              {voice && (
                <SpecTag
                  icon={Phone}
                  value={voice}
                  colorClass="bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
                />
              )}
              {duration && duration !== "未知" && (
                <SpecTag
                  icon={Clock}
                  value={duration}
                  colorClass="bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
                />
              )}
              {age && (
                <SpecTag
                  icon={User}
                  value={age}
                  colorClass="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                />
              )}
              {/* 特性标签 */}
              {featureTags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-blue-600/4 px-2.5 py-0.5 text-[11px] font-medium text-blue-600/80 dark:bg-blue-600/10 dark:text-blue-400"
                >
                  {tag.text}
                </span>
              ))}
            </div>
          </div>
        </Link>

        {/* 分隔线 */}
        <div className="mb-3 border-t border-gray-100 dark:border-gray-800" />

        {/* 价格 + 操作按钮 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex shrink-0 items-baseline gap-1">
            <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
              ¥{price}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">/月</span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href={`/haoka/${product.product_id}`}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700 transition-colors hover:border-blue-600/30 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-600/40 dark:hover:text-blue-400"
            >
              <Eye className="size-4" />
              查看详情
            </Link>
            <a
              href={product.product_link}
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
