/**
 * 浩卡联盟商品详情页面
 *
 * 根据商品ID展示商品详细信息（月租/流量/通话/归属地等）
 * 数据来源：浩卡联盟分销系统
 */
import { fetchHaokaProducts, type HaokaProduct } from "@/lib/api/haokavip";
import DetailContent from "@/app/haoka/[id]/DetailContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { products } = await fetchHaokaProducts();
  const product = products.find((p) => p.product_id === Number(id));

  if (!product) {
    return { title: "商品未找到 - 浩卡联盟大流量卡" };
  }

  const price = product.product_name.match(/(\d+\.?\d*)元/)?.[1] || "?";
  /** JSON-LD Product Schema 结构化数据 */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.product_name,
    description: `${product.product_name}，月租¥${price}/月，正规大流量卡全国包邮`,
    offers: {
      "@type": "Offer",
      price: price,
      priceCurrency: "CNY",
      availability: "https://schema.org/InStock",
    },
  };
  return {
    title: `${product.product_name} - 浩卡联盟 | 流量卡推荐`,
    description: `${product.product_name}，月租¥${price}/月，正规大流量卡全国包邮`,
    keywords: [
      product.product_name.replace(/【.*?】/g, "").trim(),
      "流量卡",
      "大流量卡",
      "手机流量卡",
      "流量卡推荐",
      "流量卡办理",
      `${price}元流量卡`,
      "浩卡联盟",
    ],
    alternates: {
      canonical: `/haoka/${id}`,
    },
    other: {
      "application/ld+json": JSON.stringify(jsonLd),
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let products: HaokaProduct[] = [];
  let error: string | null = null;

  try {
    const result = await fetchHaokaProducts();
    products = result.products;
  } catch (e) {
    error = e instanceof Error ? e.message : "获取商品数据失败";
  }

  const product = products.find((p) => p.product_id === Number(id));

  return <DetailContent product={product ?? null} error={error} />;
}
