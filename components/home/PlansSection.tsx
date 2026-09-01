/**
 * 套餐展示区域组件
 *
 * 展示浩卡联盟 API 套餐，默认显示 8 个，点击「加载更多」展开全部。
 * 数据来源：浩卡联盟分销系统 /open/api/product
 * 样式说明：卡片参考 app/yky/YkyContent.tsx（左图右内容），
 * 标题区采用首页统一风格（简洁居中），浅灰底衬托白色卡片
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
    <section id="plans" className="bg-[#f5f7fa] dark:bg-gray-950">
      <div className={containerClass("py-10 md:py-20")} style={SITE_WIDTH_STYLE}>
        {/* ===== 标题区（简洁居中，与首页其他区块一致） ===== */}
        <div className="mb-8 text-center md:mb-12">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
            <CreditCard className="size-4" />
            套餐选择
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            大流量卡套餐，灵活选择
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            从日常轻度使用到重度流量消耗，总有一款适合您
          </p>
        </div>

        <PlansGrid products={plans} />

        <p className="mt-6 text-center text-[10px] text-muted-foreground sm:text-xs">
          * 定向流量覆盖主流视频、社交、音乐类APP，具体以运营商说明为准；套餐优惠期通常为24个月，到期后可按政策续约。
        </p>
      </div>
    </section>
  );
}
