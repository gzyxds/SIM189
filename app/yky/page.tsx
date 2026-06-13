/**
 * 翼卡云商品展示页面
 *
 * 展示翼卡云平台的多运营商号卡套餐，支持运营商分类筛选。
 * 数据来源：翼卡云开放API /openapi/goods/list
 * 接口文档：https://s.apifox.cn/1518a853-66c1-47d5-bd54-0050c28e62f1/doc-8877391
 */
import { fetchYkyProducts, type YkyProductWithMeta } from "@/lib/api/yky";
import YkyContent from "./YkyContent";

/** 页面 SEO 元数据 */
export const metadata = {
    title: "翼卡云大流量卡 | 19元/29元低月租手机流量卡推荐办理",
    description:
        "翼卡云精选号卡，电信/移动/联通/广电大流量套餐，正规渠道免费申请，全国包邮到家",
    keywords: [
        "翼卡云",
        "流量卡",
        "大流量卡",
        "手机流量卡",
        "流量卡推荐",
        "流量卡办理",
        "号卡办理",
        "电信流量卡",
        "移动流量卡",
        "联通流量卡",
        "广电流量卡",
        "低月租大流量",
    ],
    alternates: {
        canonical: "/yky",
    },
};

/** 翼卡云商品列表服务端页面 */
export default async function YkyPage() {
    let products: YkyProductWithMeta[] = [];
    let error: string | null = null;

    try {
        const result = await fetchYkyProducts();
        products = result.products;
    } catch (e) {
        error = e instanceof Error ? e.message : "获取翼卡云商品失败";
        console.error("[YkyPage]", error);
    }

    return <YkyContent products={products} error={error} />;
}
