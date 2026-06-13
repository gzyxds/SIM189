/**
 * 翼卡云商品详情页面
 *
 * 根据商品ID展示商品详细信息（月租/流量/通话/归属地/佣金等）。
 * 数据来源：翼卡云开放API /openapi/goods/details
 * 接口文档：https://s.apifox.cn/1518a853-66c1-47d5-bd54-0050c28e62f1/doc-8877391
 */
import { fetchYkyProducts, fetchYkyProductDetail, type YkyProductDetail } from "@/lib/api/yky";
import YkyDetailContent from "./YkyDetailContent";

/**
 * 生成页面 metadata
 */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const productId = Number(id);

    if (isNaN(productId)) {
        return { title: "商品未找到 - 翼卡云大流量卡" };
    }

    try {
        const detail = await fetchYkyProductDetail(productId);
        return {
            title: `${detail.name} - 翼卡云 | 流量卡推荐`,
            description: `${detail.name}，${detail.des || "大流量套餐"}，正规大流量卡全国包邮到家`,
            keywords: [
                detail.name,
                "流量卡",
                "大流量卡",
                "手机流量卡",
                "流量卡推荐",
                "流量卡办理",
                "翼卡云",
            ],
            alternates: {
                canonical: `/yky/${id}`,
            },
            other: {
                "application/ld+json": JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Product",
                    name: detail.name,
                    description: `${detail.name}，${detail.des || "大流量套餐"}，正规大流量卡全国包邮到家`,
                    offers: {
                        "@type": "Offer",
                        priceCurrency: "CNY",
                        availability: "https://schema.org/InStock",
                    },
                }),
            },
        };
    } catch {
        return { title: "商品未找到 - 翼卡云大流量卡" };
    }
}

/** 翼卡云商品详情服务端页面 */
export default async function YkyDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const productId = Number(id);

    let product: YkyProductDetail | null = null;
    let error: string | null = null;

    if (isNaN(productId)) {
        error = "无效的商品ID";
    } else {
        try {
            // 优先使用详情接口获取完整数据（含佣金信息）
            product = await fetchYkyProductDetail(productId);
        } catch {
            // 详情接口失败时，回退到列表缓存中查找
            try {
                const result = await fetchYkyProducts();
                const found = result.products.find((p) => p.id === productId);
                if (found) {
                    // 列表数据转换为详情类型（缺失佣金等字段用默认值）
                    product = found as unknown as YkyProductDetail;
                } else {
                    error = "商品未找到或已下架";
                }
            } catch (e2) {
                error = e2 instanceof Error ? e2.message : "获取商品数据失败";
            }
        }
    }

    return <YkyDetailContent product={product} error={error} />;
}
