/**
 * 共创通信商品展示页面
 *
 * 展示共创号卡平台的多运营商号卡套餐，支持运营商分类筛选。
 * 数据来源：共创号卡系统 /haoka/api/order/getProductList
 */
import { fetchGongchuangProducts, type GongchuangProductWithMeta } from "@/lib/api/gongchuang";
import KakatxContent from "./KakatxContent";

export const metadata = {
    title: "共创通信大流量卡 | 19元/29元低月租手机流量卡推荐办理",
    description:
        "共创通信精选号卡，电信/移动/联通/广电大流量套餐，正规渠道免费申请，全国包邮到家",
    keywords: [
        "共创通信",
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
        canonical: "/kakatx",
    },
};

/** 共创通信商品列表服务端页面 */
export default async function GongchuangPage() {
    let products: GongchuangProductWithMeta[] = [];
    let error: string | null = null;

    try {
        const result = await fetchGongchuangProducts();
        products = result.products;
    } catch (e) {
        error = e instanceof Error ? e.message : "获取共创通信商品失败";
        console.error("[GongchuangPage]", error);
    }

    return <KakatxContent products={products} error={error} />;
}
