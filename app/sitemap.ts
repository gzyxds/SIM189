/**
 * 网站地图（Sitemap）
 *
 * 动态读取各流量卡品类 API 数据源和新闻 Markdown 文件，
 * 自动生成为搜索引擎提供完整站点 URL 索引（含所有详情页）。
 * 符合 sitemap.org XML 协议标准，Next.js App Router 自动输出为 /sitemap.xml。
 *
 * ===== 数据来源 =====
 * - 流量卡品类：haoka / lotml / linxi / kakatx / yky / ksj / gantanhao（API 拉取，含服务端缓存）
 * - 新闻资讯：content/news/*.md（本地文件读取）
 *
 * ===== 容错策略 =====
 * 各数据源独立 try/catch，单个 API 失败不影响其他 URL 的生成。
 */
import type { MetadataRoute } from "next";
import { fetchHaokaProducts } from "@/lib/api/haokavip";
import { fetchLotMLProducts } from "@/lib/api/lotml";
import { fetchLinxiProducts } from "@/lib/api/linxi";
import { fetchGongchuangProducts } from "@/lib/api/gongchuang";
import { fetchYkyProducts } from "@/lib/api/yky";
import { fetchKsjProducts } from "@/lib/api/ksj";
import { fetchGantanhaoProducts } from "@/lib/api/gantanhao";
import { getAllNews } from "@/lib/data/news";

/* ===== 优先级常量 ===== */
/** 首页 — 最高优先级 */
const HOME = 1;
/** 大流量卡列表页 — 高优先级 */
const FLOW_CARD_LIST = 0.9;
/** 新闻列表页 */
const NEWS_LIST = 0.85;
/** 代理加盟 — 高优先级 */
const AGENT = 0.8;
/** 流量卡详情页 — 中高优先级（内容页，对长尾 SEO 极为重要） */
const PRODUCT_DETAIL = 0.7;
/** 其他功能页 — 中优先级 */
const FUNCTIONAL = 0.7;
/** 新闻详情页 — 较低优先级（发布后内容不再变化） */
const NEWS_DETAIL = 0.6;
/** 辅助页面 — 较低优先级 */
const AUXILIARY = 0.6;

/**
 * 安全获取某品类的全部商品 ID 列表
 * 单个 API 失败时打印警告并返回空数组，不中断整体 sitemap 生成
 * @param name 品类标识（用于日志）
 * @param fetchFn 拉取函数
 * @param getId 从商品对象提取 URL ID 字符串
 */
async function safeGetProductIds<T>(
  name: string,
  fetchFn: () => Promise<{ products: T[]; total: number }>,
  getId: (p: T) => string,
): Promise<string[]> {
  try {
    const { products } = await fetchFn();
    return products.map(getId);
  } catch (err) {
    console.warn(`[Sitemap] ${name} 数据获取失败，跳过该品类详情页:`, err);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /** 站点基础 URL（生产环境请替换为实际域名） */
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.sim189.cn";

  /* ===== 并发拉取全部数据源的 ID ===== */
  const [haokaIds, lotmlIds, linxiIds, kakatxIds, ykyIds, ksjIds, gantanhaoIds] =
    await Promise.all([
      safeGetProductIds("浩卡联盟", fetchHaokaProducts, (p) => String(p.product_id)),
      safeGetProductIds("172号卡", fetchLotMLProducts, (p) => String(p.productID)),
      safeGetProductIds("林夕通信", fetchLinxiProducts, (p) => String(p.id)),
      safeGetProductIds("共创号卡", fetchGongchuangProducts, (p) => String(p.goods_id)),
      safeGetProductIds("翼卡云", fetchYkyProducts, (p) => String(p.id)),
      safeGetProductIds("卡世界", fetchKsjProducts, (p) => String(p.goods_id)),
      safeGetProductIds("卡业联盟", fetchGantanhaoProducts, (p) => String(p.codeNumber)),
    ]);

  /** 安全获取新闻 ID 列表 */
  let newsIds: string[] = [];
  try {
    newsIds = getAllNews().map((a) => a.id);
  } catch (err) {
    console.warn("[Sitemap] 新闻数据获取失败，跳过新闻详情页:", err);
  }

  /* ===== 辅助：批量生成详情页 URL 条目 ===== */
  const buildDetailEntries = (
    ids: string[],
    prefix: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  ): MetadataRoute.Sitemap =>
    ids.map((id) => ({
      url: `${baseUrl}/${prefix}/${id}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    }));

  /* ===== 静态页面条目 ===== */
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: HOME,
    },
    {
      url: `${baseUrl}/haoka`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: FLOW_CARD_LIST,
    },
    {
      url: `${baseUrl}/lotml`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: FLOW_CARD_LIST,
    },
    {
      url: `${baseUrl}/linxi`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: FLOW_CARD_LIST,
    },
    {
      url: `${baseUrl}/kakatx`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: FLOW_CARD_LIST,
    },
    {
      url: `${baseUrl}/yky`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: FLOW_CARD_LIST,
    },
    {
      url: `${baseUrl}/ksj`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: FLOW_CARD_LIST,
    },
    {
      url: `${baseUrl}/gantanhao`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: FLOW_CARD_LIST,
    },
    {
      url: `${baseUrl}/join`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: AGENT,
    },
    {
      url: `${baseUrl}/cps`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: FUNCTIONAL,
    },
    {
      url: `${baseUrl}/download`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: AUXILIARY,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: FUNCTIONAL,
    },
    {
      url: `${baseUrl}/cooperate`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: FUNCTIONAL,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: FLOW_CARD_LIST,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: FUNCTIONAL,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: NEWS_LIST,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: FUNCTIONAL,
    },
  ];

  /* ===== 各品类详情页条目（商品数据变化频繁，每日更新） ===== */
  const productDetailEntries: MetadataRoute.Sitemap = [
    ...buildDetailEntries(haokaIds, "haoka", PRODUCT_DETAIL, "daily"),
    ...buildDetailEntries(lotmlIds, "lotml", PRODUCT_DETAIL, "daily"),
    ...buildDetailEntries(linxiIds, "linxi", PRODUCT_DETAIL, "daily"),
    ...buildDetailEntries(kakatxIds, "kakatx", PRODUCT_DETAIL, "daily"),
    ...buildDetailEntries(ykyIds, "yky", PRODUCT_DETAIL, "daily"),
    ...buildDetailEntries(ksjIds, "ksj", PRODUCT_DETAIL, "daily"),
    ...buildDetailEntries(gantanhaoIds, "gantanhao", PRODUCT_DETAIL, "daily"),
  ];

  /* ===== 新闻详情页条目（发布后内容稳定，每周检查即可） ===== */
  const newsDetailEntries: MetadataRoute.Sitemap = buildDetailEntries(
    newsIds,
    "news",
    NEWS_DETAIL,
    "weekly",
  );

  /* ===== 日志输出（构建时便于排查） ===== */
  console.log(
    `[Sitemap] 生成完成 — ` +
    `静态页: ${staticEntries.length}, ` +
    `商品详情: ${productDetailEntries.length} ` +
    `(浩卡${haokaIds.length}/172${lotmlIds.length}/林夕${linxiIds.length}` +
    `/共创${kakatxIds.length}/翼卡云${ykyIds.length}/卡世界${ksjIds.length}` +
    `/卡业联盟${gantanhaoIds.length}), ` +
    `新闻详情: ${newsDetailEntries.length}`,
  );

  return [...staticEntries, ...productDetailEntries, ...newsDetailEntries];
}
