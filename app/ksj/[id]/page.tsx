/**
 * 卡世界商品详情页面
 *
 * 根据商品ID展示商品详细信息（月租/流量/通话/归属地/佣金等）
 * 数据来源：卡世界号卡管理系统 /api/admin/store/sale
 */
import { fetchKsjProducts, type KsjProductWithMeta } from "@/lib/api/ksj";
import DetailContent from "./DetailContent";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { products } = await fetchKsjProducts();
    const product = products.find((p) => p.goods_id === Number(id));

    if (!product) {
        return { title: "商品未找到 - 卡世界大流量卡" };
    }

    const price = product.name.match(/(\d+\.?\d*)元/)?.[1] || "?";
    /** JSON-LD Product Schema 结构化数据 */
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: `${product.name}，月租¥${price}/月，${product.category_text}正规号卡`,
        offers: {
            "@type": "Offer",
            price: price,
            priceCurrency: "CNY",
            availability: "https://schema.org/InStock",
        },
    };
    return {
        title: `${product.short_name || product.name} - 卡世界 | 流量卡推荐`,
        description: `${product.name}，月租¥${price}/月，${product.category_text}正规号卡全国包邮`,
        keywords: [
            product.short_name || product.name,
            "流量卡",
            "大流量卡",
            "手机流量卡",
            "流量卡推荐",
            `${price}元流量卡`,
            "卡世界",
            product.category_text,
        ],
        alternates: {
            canonical: `/ksj/${id}`,
        },
        other: {
            "application/ld+json": JSON.stringify(jsonLd),
        },
    };
}

export default async function KsjDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    let products: KsjProductWithMeta[] = [];
    let error: string | null = null;

    try {
        const result = await fetchKsjProducts();
        products = result.products;
    } catch (e) {
        error = e instanceof Error ? e.message : "获取商品数据失败";
    }

    const product = products.find((p) => p.goods_id === Number(id));

    return <DetailContent product={product ?? null} error={error} />;
}
