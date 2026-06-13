/**
 * 卡世界商品展示页面
 *
 * 展示卡世界平台的号卡套餐商品，支持运营商/归属地筛选。
 * 数据来源：卡世界号卡管理系统 /api/admin/store/sale
 */
import { fetchKsjProducts, type KsjProductWithMeta } from "@/lib/api/ksj";
import KsjContent from "./KsjContent";

export const metadata = {
    title: "卡世界大流量卡 | 19元/29元低月租手机流量卡推荐办理",
    description:
        "卡世界精选号卡，电信/移动/联通/广电19元-49元大流量套餐，全国通用不限速，正规渠道免费申请包邮到家",
    keywords: [
        "卡世界",
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
        canonical: "/ksj",
    },
};

export default async function KsjPage() {
    let products: KsjProductWithMeta[] = [];
    let error: string | null = null;

    try {
        const result = await fetchKsjProducts();
        products = result.products;
    } catch (e) {
        error = e instanceof Error ? e.message : "获取卡世界商品失败";
        console.error("[KsjPage]", error);
    }

    return <KsjContent products={products} error={error} />;
}
