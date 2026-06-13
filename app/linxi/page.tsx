/**
 * 林夕通信商品展示页面
 *
 * 展示林夕通信平台的多运营商号卡套餐，支持运营商和时长筛选。
 * 数据来源：号卡极团系统开放接口 /order/api/haoteam/getlist
 */
import { fetchLinxiProducts, type LinxiProductWithMeta } from "@/lib/api/linxi";
import LinxiContent from "./LinxiContent";

export const metadata = {
  title: "林夕通信大流量卡 | 19元/29元低月租手机流量卡推荐办理",
  description:
    "林夕通信精选号卡，电信/移动/联通/广电大流量套餐，正规渠道免费申请，全国包邮到家",
  keywords: [
    "林夕通信",
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
    "号卡办理",
  ],
  alternates: {
    canonical: "/linxi",
  },
};

/** 林夕通信商品列表服务端页面 */
export default async function LinxiPage() {
  let products: LinxiProductWithMeta[] = [];
  let error: string | null = null;

  try {
    const result = await fetchLinxiProducts();
    products = result.products;
  } catch (e) {
    error = e instanceof Error ? e.message : "获取林夕通信商品失败";
    console.error("[LinxiPage]", error);
  }

  return <LinxiContent products={products} error={error} />;
}
