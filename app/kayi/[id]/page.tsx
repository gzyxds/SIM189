/**
 * 卡易号卡平台商品详情页面（服务端组件）
 *
 * 路由：/kayi/[id]
 * 根据商品 ID 展示商品详细信息（调用商品详情接口获取佣金/注意事项/限制规则等）。
 *
 * 数据来源：卡易号卡平台 API /openapi/goods/details
 * 接口文档：https://s.apifox.cn/1cad9662-1cd9-48af-9649-cd23d7c9be7a/llms.txt
 */

import { fetchKayiProductDetail, type KayiProductWithMeta } from "@/lib/api/kayi";
import DetailContent from "./DetailContent";

/* ========== 动态 Metadata（含 JSON-LD 结构化数据） ========== */

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const product = await fetchKayiProductDetail(id);

    if (!product) {
        return { title: "商品未找到 - 卡易号卡平台大流量卡" };
    }

    const price = product._price || "?";
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: `${product.name}，${product.des}，正规大流量卡全国包邮`,
        offers: {
            "@type": "Offer",
            price: price.replace("元", ""),
            priceCurrency: "CNY",
            availability: product.status === 1 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
    };

    return {
        title: `${product.name} - 卡易号卡平台 | 流量卡推荐`,
        description: `${product.name}，${product.des}，正规大流量卡全国包邮`,
        keywords: [
            product.name.replace(/^\d+-/, ""),
            "卡易号卡",
            "流量卡",
            "大流量卡",
            "手机流量卡",
            "流量卡推荐",
            "流量卡办理",
            price ? `${price}流量卡` : "",
        ].filter(Boolean),
        alternates: {
            canonical: `/kayi/${id}`,
        },
        other: {
            "application/ld+json": JSON.stringify(jsonLd),
        },
    };
}

/* ========== 页面入口 ========== */

export default async function KayiDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    let product: KayiProductWithMeta | null = null;
    let error: string | null = null;

    try {
        product = await fetchKayiProductDetail(id);
    } catch (e) {
        error = e instanceof Error ? e.message : "获取商品数据失败";
    }

    return <DetailContent product={product} error={product ? null : (error ?? "商品未找到")} />;
}
