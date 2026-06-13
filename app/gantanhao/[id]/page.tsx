/**
 * 卡业联盟商品详情页面（服务端组件）
 *
 * 路由：/gantanhao/[id]
 * 根据产品编码（codeNumber）展示商品详细信息。
 *
 * 数据来源：卡业联盟 API /api/api/selectProduct
 * 接口文档：https://gantanhao.apifox.cn/9004453m0.md
 */

import { fetchGantanhaoProducts, type GantanhaoProductWithMeta } from "@/lib/api/gantanhao";
import DetailContent from "./DetailContent";

/* ========== 动态 Metadata（含 JSON-LD 结构化数据） ========== */

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { products } = await fetchGantanhaoProducts();
    const product = products.find((p) => p.codeNumber === id);

    if (!product) {
        return { title: "商品未找到 - 卡业联盟大流量卡" };
    }

    const price = product._price || "?";
    /** JSON-LD Product Schema 结构化数据 */
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: `${product.name}，${product.subName}，正规大流量卡全国包邮`,
        offers: {
            "@type": "Offer",
            price: price.replace("元", ""),
            priceCurrency: "CNY",
            availability: product.isOnSale === 1 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
    };

    return {
        title: `${product.name} - 卡业联盟 | 流量卡推荐`,
        description: `${product.name}，${product.subName}，正规大流量卡全国包邮`,
        keywords: [
            product.name.replace(/^\d+-/, ""),
            "流量卡",
            "大流量卡",
            "手机流量卡",
            "流量卡推荐",
            "流量卡办理",
            price ? `${price}流量卡` : "",
            "卡业联盟",
        ].filter(Boolean),
        alternates: {
            canonical: `/gantanhao/${id}`,
        },
        other: {
            "application/ld+json": JSON.stringify(jsonLd),
        },
    };
}

/* ========== 页面入口 ========== */

export default async function GantanhaoDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    let products: GantanhaoProductWithMeta[] = [];
    let error: string | null = null;

    try {
        const result = await fetchGantanhaoProducts();
        products = result.products;
    } catch (e) {
        error = e instanceof Error ? e.message : "获取商品数据失败";
    }

    // 通过产品编码查找商品
    const product = products.find((p) => p.codeNumber === id);

    return <DetailContent product={product ?? null} error={error} />;
}
