/**
 * LotML 商品详情页
 *
 * 根据 productID 展示商品完整信息（运营商/月租/流量/套餐时长/归属地/结算规则等）。
 * 数据来源：LotML 开放 API GetProductsV2（带服务端内存缓存）。
 */
import { fetchLotMLProducts, type LotMLProductWithMeta } from "@/lib/api/lotml";
import LotMLDetailContent from "./LotMLDetailContent";

/**
 * 生成页面 metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { products } = await fetchLotMLProducts();
  const product = products.find((p) => p.productID === Number(id));

  if (!product) {
    return { title: "商品未找到 - 号卡联盟大流量卡" };
  }

  return {
    title: `${product.productName} - 号卡联盟 | 流量卡推荐`,
    description: `${product.productName}，正规大流量卡一级代理渠道，${product.BackMoneyType}佣金，全国包邮到家`,
    keywords: [
      product.productName,
      "流量卡",
      "大流量卡",
      "手机流量卡",
      "流量卡推荐",
      "流量卡办理",
      "172号卡",
      "号卡联盟",
    ],
    alternates: {
      canonical: `/lotml/${id}`,
    },
    other: {
      "application/ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.productName,
        description: `${product.productName}，正规大流量卡一级代理渠道，${product.BackMoneyType}佣金，全国包邮到家`,
        offers: {
          "@type": "Offer",
          priceCurrency: "CNY",
          availability: "https://schema.org/InStock",
        },
      }),
    },
  };
}

/** LotML 商品详情服务端页面 */
export default async function LotMLDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product: LotMLProductWithMeta | null = null;
  let error: string | null = null;

  try {
    const result = await fetchLotMLProducts();
    product = result.products.find((p) => p.productID === Number(id)) ?? null;
  } catch (e) {
    error = e instanceof Error ? e.message : "获取商品数据失败";
  }

  return <LotMLDetailContent product={product} error={error} />;
}
