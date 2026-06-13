/**
 * LotML 商品列表页
 *
 * 展示 LotML 平台全部在售套餐，支持运营商、时长筛选。
 * 数据来源：LotML 开放 API（GetProductsV2），服务端渲染。
 */
import { fetchLotMLProducts, type LotMLProductWithMeta } from "@/lib/api/lotml";
import LotMLContent from "./LotMLContent";

export const metadata = {
  title: "172号卡联盟大流量卡 | 19元/29元低月租流量卡推荐办理",
  description:
    "172号卡联盟精选套餐，电信/移动/联通/广电大流量低月租，正规一级代理渠道，秒返佣金，全国包邮到家",
  keywords: [
    "号卡联盟",
    "172号卡",
    "流量卡",
    "大流量卡",
    "手机流量卡",
    "流量卡推荐",
    "流量卡办理",
    "电信流量卡",
    "移动流量卡",
    "联通流量卡",
    "广电流量卡",
    "号卡办理",
    "低月租大流量",
  ],
  alternates: {
    canonical: "/lotml",
  },
};

/** LotML 商品列表服务端页面 */
export default async function LotMLPage() {
  let products: LotMLProductWithMeta[] = [];
  let error: string | null = null;

  try {
    const result = await fetchLotMLProducts();
    products = result.products;
  } catch (e) {
    error = e instanceof Error ? e.message : "获取号卡联盟商品失败";
    console.error("[LotMLPage]", error);
  }

  return <LotMLContent products={products} error={error} />;
}
