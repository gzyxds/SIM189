/**
 * 林夕通信商品详情页面
 *
 * 根据商品ID展示商品详细信息（运营商/月租/流量/套餐时长/归属地/结算规则等）。
 * 数据来源：号卡极团系统开放接口 /order/api/haoteam/getlist（带服务端内存缓存）。
 */
import { fetchLinxiProducts, type LinxiProductWithMeta } from "@/lib/api/linxi";
import LinxiDetailContent from "@/app/linxi/[id]/LinxiDetailContent";

/**
 * 生成页面 metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { products } = await fetchLinxiProducts();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return { title: "商品未找到 - 林夕通信大流量卡" };
  }

  return {
    title: `${product.shop_name} - 林夕通信 | 流量卡推荐`,
    description: `${product.shop_name}，${product.shop_des}，正规大流量卡全国包邮到家`,
    keywords: [
      product.shop_name,
      "流量卡",
      "大流量卡",
      "手机流量卡",
      "流量卡推荐",
      "流量卡办理",
      "林夕通信",
    ],
    alternates: {
      canonical: `/linxi/${id}`,
    },
    other: {
      "application/ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.shop_name,
        description: `${product.shop_name}，${product.shop_des}，正规大流量卡全国包邮到家`,
        offers: {
          "@type": "Offer",
          priceCurrency: "CNY",
          availability: "https://schema.org/InStock",
        },
      }),
    },
  };
}

/** 林夕通信商品详情服务端页面 */
export default async function LinxiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product: LinxiProductWithMeta | null = null;
  let error: string | null = null;

  try {
    const result = await fetchLinxiProducts();
    product = result.products.find((p) => p.id === id) ?? null;
  } catch (e) {
    error = e instanceof Error ? e.message : "获取商品数据失败";
  }

  return <LinxiDetailContent product={product} error={error} />;
}
