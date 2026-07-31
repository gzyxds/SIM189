/**
 * 卡易号卡平台商品展示页面（服务端组件）
 *
 * 路由：/kayi
 * 在服务端获取商品数据后传入客户端组件进行交互展示。
 *
 * 数据来源：卡易号卡平台 API /openapi/goods/list
 * 接口文档：https://s.apifox.cn/1cad9662-1cd9-48af-9649-cd23d7c9be7a/llms.txt
 */

import { fetchKayiProducts, type KayiProductWithMeta } from "@/lib/api/kayi";
import KayiContent from "./KayiContent";

/* ========== SEO Metadata ========== */

export const metadata = {
    title: "卡易号卡平台大流量卡 | 19元/29元低月租手机流量卡推荐办理",
    description:
        "卡易号卡平台精选号卡，电信/移动/联通/广电19元-39元大流量套餐，全国通用不限速，正规渠道免费申请包邮到家",
    keywords: [
        "卡易号卡",
        "卡易号卡平台",
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
        canonical: "/kayi",
    },
};

/* ========== 页面入口 ========== */

export default async function KayiPage() {
    let products: KayiProductWithMeta[] = [];
    let error: string | null = null;

    try {
        const result = await fetchKayiProducts();
        products = result.products;
    } catch (e) {
        error = e instanceof Error ? e.message : "获取卡易号卡商品失败";
        console.error("[KayiPage]", error);
    }

    return <KayiContent products={products} error={error} />;
}
