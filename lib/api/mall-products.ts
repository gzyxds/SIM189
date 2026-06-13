/**
 * 商城首页商品数据 Server Action
 *
 * 独立文件模式：整个文件顶部标记 "use server"，导出的函数即为 Server Action。
 * 这种方式是 Next.js 推荐的做法：Client Component 可直接导入并调用。
 *
 * 数据来源：浩卡联盟分销系统 /open/api/product
 */
"use server";

import { fetchHaokaProducts, type HaokaProductWithMeta } from "./haokavip";

/**
 * 获取商城首页展示用的商品列表和随机种子。
 *
 * 在服务端执行：调用浩卡联盟 API 拉取商品数据，按推荐优先排序，
 * 同时生成一个随机种子用于客户端榜单随机排序（确保 SSR 与水合结果一致）。
 *
 * @returns { products, randomSeed, error } - 商品列表、随机种子、错误信息
 */
export async function getMallProductsAction(): Promise<{
  products: HaokaProductWithMeta[];
  randomSeed: number;
  error: string | null;
}> {
  try {
    const result = await fetchHaokaProducts();

    /* 推荐商品优先排序 */
    const recommended = result.products.filter(
      (p) => p.top_flag === 1 || p.is_recommend === 1
    );
    const others = result.products.filter(
      (p) => p.top_flag !== 1 && p.is_recommend !== 1
    );
    const products = [...recommended, ...others];

    /* 服务端生成随机种子，范围 0 ~ 999999 */
    const randomSeed = Math.floor(Math.random() * 1_000_000);

    return { products, randomSeed, error: null };
  } catch (e) {
    return {
      products: [],
      randomSeed: 0,
      error: e instanceof Error ? e.message : "获取商品数据失败",
    };
  }
}
