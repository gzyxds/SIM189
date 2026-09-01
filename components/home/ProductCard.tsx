/**
 * 共享商品卡片组件（浩卡联盟数据源）
 *
 * 首页套餐区 / 浩卡列表页共用同一套卡片设计。
 * 样式参考 app/yky/YkyContent.tsx 的 YkyProductCard：
 * - 卡片：rounded-xl + ring 细描边 + 轻阴影
 * - 移动端（<sm）：紧凑布局（小图 + 标题 + 4 列参数条 + 操作栏）
 * - PC 端（≥sm）：左图右内容横向布局（大图 + 标题/描述 + 参数条 + 标签 + 底部按钮）
 * - 完整暗色模式适配（使用标准 gray 色板）
 */
"use client";

import Link from "next/link";
import type { HaokaProduct, HaokaProductWithMeta, Operator } from "@/lib/api/haokavip";
import { mapOperator } from "@/lib/api/haokavip";
import {
  Signal,
  Star,
  Zap,
  MapPin,
  ShieldCheck,
  Eye,
  ChevronRight,
  ArrowRight,
  FileText,
  TrendingUp,
  Wifi,
  LayoutGrid,
} from "lucide-react";

/* ========== 运营商角标样式（参考 Yky 白底浅色标签） ========== */

const OPERATOR_BADGE: Record<
  Operator,
  { label: string; text: string; bg: string; icon: React.ElementType }
> = {
  mobile: { label: "移动", text: "text-green-600", bg: "bg-green-50", icon: Signal },
  telecom: { label: "电信", text: "text-blue-600", bg: "bg-blue-50", icon: Wifi },
  unicom: { label: "联通", text: "text-orange-600", bg: "bg-orange-50", icon: Zap },
  broadcast: { label: "广电", text: "text-purple-600", bg: "bg-purple-50", icon: LayoutGrid },
  unknown: { label: "其他", text: "text-gray-600", bg: "bg-gray-50", icon: Signal },
};

/* ========== 数据解析 ========== */

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

/** 清洗商品标题，移除前缀括号信息 */
function cleanName(name: string): string {
  return (name || "").replace(/【.*?】/g, "").trim();
}

/** 商品卡片（参考 YkyProductCard：移动端紧凑布局 + PC 左图右内容） */
export default function ProductCard({ product, provider }: ProductCardProps) {
  const prov =
    provider || (product as HaokaProductWithMeta)._provider || mapOperator(product.product_name);
  const op = OPERATOR_BADGE[prov] || OPERATOR_BADGE.unknown;
  const OpIcon = op.icon;

  const { flow, voice, age } = extractSpecs(product);
  const duration = (product as HaokaProductWithMeta)._duration;
  const shipping = (product as HaokaProductWithMeta)._shipping;
  const location = (product as HaokaProductWithMeta)._location;
  const price = product.product_name.match(/(\d+(?:\.\d+)?)\s*元/)?.[1] || "—";
  const isRecommended = product.top_flag === 1 || product.is_recommend === 1;
  const hasCommission = !!(product as Record<string, unknown>).commition_price;
  const rawTags = (product as HaokaProductWithMeta)._tags || [];
  const featureTags = rawTags
    .filter((t) => !SPEC_TAG_PATTERNS.some((re) => re.test(t.text)))
    .slice(0, 8);

  const title = cleanName(product.product_name);
  const detailHref = `/haoka/${product.product_id}`;
  const shippingLabel = shipping === "全国" ? "全国可发" : shipping || "快递配送";
  const durationLabel = duration && duration !== "未知" ? duration : "长期";

  /* 套餐描述 */
  const planParts = [`月租¥${price}`];
  if (flow) planParts.push(`${flow}通用`);
  if (voice) planParts.push(voice);
  if (duration && duration !== "未知") planParts.push(duration);
  const planDesc = planParts.join(" · ");

  return (
    <article className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
      {/* ===== 移动端布局（<sm）：紧凑上下结构 ===== */}
      <div className="block sm:hidden">
        <div className="p-3">
          {/* 运营商标签：右上角 */}
          <span
            className={`absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${op.text} ${op.bg}`}
          >
            <OpIcon className="h-3.5 w-3.5" />
            {op.label}
          </span>

          {/* 推荐 / 高佣角标：左上角 */}
          {(isRecommended || hasCommission) && (
            <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
              {isRecommended && (
                <span className="inline-flex items-center rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                  <Star className="mr-1 inline-block h-3 w-3 fill-white" />
                  推荐
                </span>
              )}
              {hasCommission && (
                <span className="inline-flex items-center rounded-md bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-0.5 text-xs font-bold text-white">
                  <TrendingUp className="mr-1 inline-block h-3 w-3" />
                  高佣
                </span>
              )}
            </div>
          )}

          {/* 图片 + 标题区 */}
          <div className="flex gap-3">
            <Link
              href={detailHref}
              className="relative h-[90px] w-[90px] shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
            >
              {product.product_image ? (
                <img
                  src={product.product_image}
                  alt={title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                  暂无图片
                </div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-gray-900 dark:text-gray-100">
                <Link href={detailHref} className="hover:text-blue-600">
                  {title}
                </Link>
              </h3>
              <p className="mt-1 line-clamp-1 text-[13px] text-gray-600 dark:text-gray-400">
                {planDesc}
              </p>
              {/* 特色标签 */}
              {featureTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {featureTags.slice(0, 5).map((tag) => (
                    <span
                      key={tag.text}
                      className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-medium ${tag.className}`}
                    >
                      {tag.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4 列参数条 */}
          <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-xl bg-gray-50 p-2.5 dark:bg-gray-800">
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-red-500">¥{price}</span>
              <span className="mt-0.5 text-[10px] text-gray-400">月租</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{flow || "—"}</span>
              <span className="mt-0.5 text-[10px] text-gray-400">通用流量</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{voice || "—"}</span>
              <span className="mt-0.5 text-[10px] text-gray-400">通话分钟</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {duration && duration !== "未知" ? duration : "—"}
              </span>
              <span className="mt-0.5 text-[10px] text-gray-400">套餐时长</span>
            </div>
          </div>

          {/* 操作栏：左侧可发地区 + 右侧按钮 */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="h-3.5 w-3.5 text-orange-500" />
              {shippingLabel}
            </span>
            <div className="flex items-center gap-1.5">
              <Link
                href={detailHref}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-normal whitespace-nowrap text-gray-500 hover:border-blue-300 hover:text-blue-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-blue-400 dark:hover:text-blue-400"
              >
                <Eye className="h-3.5 w-3.5" />
                查看详情
              </Link>
              <a
                href={product.product_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-normal whitespace-nowrap text-white hover:bg-blue-700 active:scale-95"
              >
                立即办理
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* 底部分割线 */}
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-[10px] text-gray-400 dark:border-gray-800 dark:text-gray-500">
            <span>{durationLabel}</span>
            <span>{location || shippingLabel}</span>
          </div>
        </div>
      </div>

      {/* ===== PC 端布局（≥sm）：左图右内容 ===== */}
      <div className="hidden sm:block">
        <div className="flex flex-row">
          {/* 左侧图片区 */}
          <div className="relative w-5/12 shrink-0 lg:w-2/5">
            <Link href={detailHref} className="relative block h-full bg-white p-3 dark:bg-gray-900">
              <div className="absolute inset-3 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                {product.product_image ? (
                  <img
                    src={product.product_image}
                    alt={title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                    暂无图片
                  </div>
                )}
              </div>
            </Link>
            {/* 推荐 / 高佣角标 */}
            {(isRecommended || hasCommission) && (
              <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
                {isRecommended && (
                  <span className="inline-flex items-center rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    <Star className="mr-1 inline-block h-3 w-3 fill-white" />
                    推荐
                  </span>
                )}
                {hasCommission && (
                  <span className="inline-flex items-center rounded-md bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    <TrendingUp className="mr-1 inline-block h-3 w-3" />
                    高佣
                  </span>
                )}
              </div>
            )}
            {/* 运营商标签 */}
            <span
              className={`absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${op.text} ${op.bg}`}
            >
              <OpIcon className="h-3 w-3" />
              {op.label}
            </span>
          </div>

          {/* 右侧内容区 */}
          <div className="flex flex-1 flex-col p-4 xl:p-5">
            {/* 标题 */}
            <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 dark:text-gray-100 lg:text-base">
              <Link href={detailHref} className="hover:text-blue-600">
                {title}
              </Link>
            </h3>

            {/* 套餐描述 */}
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{planDesc}</p>

            {/* 4 列参数条 */}
            <div className="mb-3 grid grid-cols-4 gap-2 rounded-xl bg-gray-50 p-2.5 dark:bg-gray-800">
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-red-500 lg:text-base">¥{price}</span>
                <span className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">月租</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 lg:text-base">
                  {flow || "—"}
                </span>
                <span className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">通用流量</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 lg:text-base">
                  {voice || "—"}
                </span>
                <span className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">通话分钟</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 lg:text-base">
                  {duration && duration !== "未知" ? duration : "—"}
                </span>
                <span className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">套餐时长</span>
              </div>
            </div>

            {/* 条件标签 */}
            <div className="mb-2 flex flex-wrap gap-1.5">
              {age && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:bg-green-500/20 dark:text-green-300">
                  <ShieldCheck className="h-3 w-3" />
                  {age}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-600 dark:bg-orange-500/20 dark:text-orange-300">
                <MapPin className="h-3 w-3" />
                {shippingLabel}
              </span>
            </div>

            {/* 特色标签 */}
            {featureTags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {featureTags.slice(0, 8).map((tag) => (
                  <span
                    key={tag.text}
                    className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-medium ${tag.className}`}
                  >
                    {tag.text}
                  </span>
                ))}
              </div>
            )}

            {/* 底部按钮 */}
            <div className="mt-auto flex items-center gap-2.5 border-t border-gray-100 pt-2.5 dark:border-gray-800">
              <a
                href={product.product_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-normal text-white transition-colors hover:bg-blue-700 lg:px-5 lg:py-2 lg:text-sm"
              >
                立即办理
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href={detailHref}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-700 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-blue-400 dark:hover:text-blue-600 lg:px-4 lg:py-2 lg:text-sm"
              >
                <FileText className="h-4 w-4" />
                查看详情
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
