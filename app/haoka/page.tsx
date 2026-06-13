/**
 * 浩卡联盟商品展示页面
 *
 * 展示浩卡联盟平台的多运营商号卡套餐，支持运营商分类筛选。
 * 数据来源：浩卡联盟分销系统 /open/api/product
 */
import { fetchHaokaProducts, type HaokaProductWithMeta } from "@/lib/api/haokavip";
import HaokaContent from "./HaokaContent";

export const metadata = {
  title: "浩卡联盟大流量卡 | 19元/29元低月租手机流量卡推荐办理",
  description:
    "浩卡联盟精选号卡，电信/移动/联通/广电19元-39元大流量套餐，全国通用不限速，正规渠道免费申请包邮到家",
  keywords: [
    "浩卡联盟",
    "流量卡",
    "大流量卡",
    "手机流量卡",
    "流量卡推荐",
    "流量卡办理",
    "19元流量卡",
    "29元流量卡",
    "电信流量卡",
    "移动流量卡",
    "联通流量卡",
    "广电流量卡",
    "低月租大流量",
  ],
  alternates: {
    canonical: "/haoka",
  },
};

export default async function HaokaPage() {
  let products: HaokaProductWithMeta[] = [];
  let error: string | null = null;

  try {
    const result = await fetchHaokaProducts();
    products = result.products;
  } catch (e) {
    error = e instanceof Error ? e.message : "获取浩卡联盟商品失败";
    console.error("[HaokaPage]", error);
  }

  return <HaokaContent products={products} error={error} />;
}
