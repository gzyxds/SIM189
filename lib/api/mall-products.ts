/**
 * 商城首页商品数据 Server Action（客户端重试入口）
 *
 * 首屏数据不经过本文件：服务端组件（app/page.tsx）渲染时直接调用
 * `getMallPlatformsProducts`（定义于 `lib/api/mall-products-data.ts`），
 * 数据随 HTML 一并返回，客户端无需二次请求、无骨架屏。
 *
 * 本文件仅保留 `"use server"` 包装，用于失败重试：
 * 当六平台商品全部拉取失败、首页展示错误态时，用户点击「重新加载」，
 * 由客户端通过本 Server Action 重试取数。
 */
"use server";

import { getMallPlatformsProducts } from "./mall-products-data";

/** 平台筛选 key 与统一商品类型（转发自数据模块，供客户端类型导入） */
export type { MallPlatformKey, MallProductItem } from "./mall-products-data";

/**
 * 获取商城首页展示商品列表（Server Action 包装）。
 *
 * @returns { products, errors } - 统一商品列表、失败平台名称列表
 */
export async function getMallPlatformsProductsAction() {
    return getMallPlatformsProducts();
}
