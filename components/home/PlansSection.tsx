/**
 * 套餐展示区域组件
 *
 * 展示浩卡联盟 API 套餐，默认显示 8 个，点击「加载更多」展开全部。
 * 数据来源：浩卡联盟分销系统 /open/api/product
 */
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import { fetchHaokaProducts } from "@/lib/api/haokavip";
import type { HaokaProduct } from "@/lib/api/haokavip";
import PlansGrid from "@/components/home/PlansGrid";
import { CreditCard } from "lucide-react";

/** 套餐展示区域组件（服务端渲染，数据来自浩卡联盟 API） */
export default async function PlansSection() {
  let plans: HaokaProduct[] = [];

  try {
    const result = await fetchHaokaProducts();
    // 优先推荐商品在前，其余在后
    const recommended = result.products.filter((p) => p.top_flag === 1 || p.is_recommend === 1);
    const others = result.products.filter((p) => p.top_flag !== 1 && p.is_recommend !== 1);
    plans = [...recommended, ...others];
  } catch {
    return null;
  }

  return (
    <section id="plans" className="relative overflow-hidden">
      {/* 背景图片 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/background/background-7.png')" }}
        />
        <div className="absolute inset-0 bg-white/40" />
         背景多层渐变 + 光晕
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/30 to-white" />
        <div className="absolute -top-32 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-100/20 blur-3xl" />
        
      </div>

      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        <div className="mb-12 text-center md:mb-14">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
            <CreditCard className="size-4" />
            套餐选择
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            大流量卡套餐，灵活选择
          </h2>
          <p className="mt-3 text-muted-foreground">
            从日常轻度使用到重度流量消耗，总有一款适合您
          </p>
        </div>

        <PlansGrid products={plans} />

        <p className="mt-8 text-center text-xs text-muted-foreground">
          * 定向流量覆盖主流视频、社交、音乐类APP，具体以运营商说明为准；套餐优惠期通常为24个月，到期后可按政策续约。
        </p>
      </div>
    </section>
  );
}
