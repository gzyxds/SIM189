/**
 * 共创通信商品详情页面
 *
 * 根据商品ID展示商品详细信息（月租/流量/通话/归属地/优惠详情等）。
 * 数据来源：共创号卡系统 /haoka/api/order/getProductList（带服务端内存缓存）。
 */
import { fetchGongchuangProducts, type GongchuangProductWithMeta } from "@/lib/api/gongchuang";
import DetailContent from "./DetailContent";

/**
 * 生成页面 metadata
 */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    try {
        const { products } = await fetchGongchuangProducts();
        const product = products.find((p) => p.goods_id === Number(id));

        if (!product) {
            return { title: "商品未找到 - 共创通信大流量卡" };
        }

        return {
            title: `${product.goods_name} - 共创通信 | 流量卡推荐`,
            description: `${product.goods_name}，月租¥${product.price}/月，正规大流量卡全国包邮`,
            keywords: [
                product.goods_name,
                "流量卡",
                "大流量卡",
                "手机流量卡",
                "流量卡推荐",
                "流量卡办理",
                `${product.price}元流量卡`,
                "共创通信",
            ],
            alternates: {
                canonical: `/kakatx/${id}`,
            },
            other: {
                "application/ld+json": JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Product",
                    name: product.goods_name,
                    description: `${product.goods_name}，月租¥${product.price}/月，正规大流量卡全国包邮`,
                    offers: {
                        "@type": "Offer",
                        price: String(product.price),
                        priceCurrency: "CNY",
                        availability: "https://schema.org/InStock",
                    },
                }),
            },
        };
    } catch {
        return { title: "商品详情 - 共创通信大流量卡" };
    }
}

/** 共创通信商品详情服务端页面 */
export default async function GongchuangDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    let product: GongchuangProductWithMeta | null = null;
    let error: string | null = null;

    try {
        const result = await fetchGongchuangProducts();
        product = result.products.find((p) => p.goods_id === Number(id)) ?? null;
    } catch (e) {
        error = e instanceof Error ? e.message : "获取商品数据失败";
    }

    return <DetailContent product={product} error={error} />;
}
