/**
 * 卡业联盟商品展示页面（服务端组件）
 *
 * 路由：/gantanhao
 * 在服务端获取商品数据后传入客户端组件进行交互展示。
 *
 * 数据来源：卡业联盟 API /api/api/selectProduct
 * 接口文档：https://gantanhao.apifox.cn/9004453m0.md
 */

import { fetchGantanhaoProducts, type GantanhaoProductWithMeta } from "@/lib/api/gantanhao";
import GantanhaoContent from "./GantanhaoContent";

/* ========== SEO Metadata ========== */

export const metadata = {
    title: "卡业联盟大流量卡 | 19元/29元低月租手机流量卡推荐办理",
    description:
        "卡业联盟精选号卡，电信/移动/联通/广电19元-39元大流量套餐，全国通用不限速，正规渠道免费申请包邮到家",
    keywords: [
        "卡业联盟",
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
        canonical: "/gantanhao",
    },
};

/* ========== 页面入口 ========== */

export default async function GantanhaoPage() {
    let products: GantanhaoProductWithMeta[] = [];
    let error: string | null = null;

    try {
        const result = await fetchGantanhaoProducts();
        products = result.products;
    } catch (e) {
        error = e instanceof Error ? e.message : "获取卡业联盟商品失败";
        console.error("[GantanhaoPage]", error);
    }

    return <GantanhaoContent products={products} error={error} />;
}
