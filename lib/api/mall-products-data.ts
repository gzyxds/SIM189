/**
 * 商城首页商品数据服务端模块（仅服务端使用）
 *
 * 本文件不包含 "use server" 指令，是纯服务端数据函数：
 * 由首页服务端组件（app/page.tsx）在渲染时直接调用，数据随 HTML 一并返回，
 * 客户端无需二次请求，也没有骨架屏。
 *
 * 数据来源：浩卡联盟（haoka）、172号卡（lotml）、林夕通信（linxi）、
 * 卡业联盟（gantanhao）、翼卡云（yky）、卡易号卡（kayi）
 * 六个平台并行拉取、各自容错：单个平台失败不影响其他平台的商品展示。
 *
 * 客户端「失败重试」场景由 `mall-products.ts`（"use server"）包装本模块的
 * `getMallPlatformsProducts` 为 Server Action 后调用。
 */

import { fetchHaokaProducts } from "./haokavip";
import type { HaokaProductWithMeta } from "./haokavip";
import { fetchLotMLProducts } from "./lotml";
import type { LotMLProductWithMeta } from "./lotml-utils";
import { fetchLinxiProducts } from "./linxi";
import type { LinxiProductWithMeta } from "./linxi";
import { fetchGantanhaoProducts } from "./gantanhao";
import type { GantanhaoProductWithMeta } from "./gantanhao";
import { fetchYkyProducts } from "./yky";
import type { YkyProductWithMeta } from "./yky";
import { fetchKayiProducts } from "./kayi";
import type { KayiProductWithMeta } from "./kayi";

/* ==================================================================
 * 类型定义
 * ================================================================== */

/** 商城首页展示的平台标识 */
export type MallPlatformKey = "haoka" | "lotml" | "linxi" | "gantanhao" | "yky" | "kayi";

/** 统一后的商城商品展示项 */
export interface MallProductItem {
    /** 来源平台标识 */
    platform: MallPlatformKey;
    /** 平台内唯一商品 ID */
    id: string;
    /** 商品名称 */
    name: string;
    /** 商品主图 URL */
    image: string;
    /** 月租价格展示文本（如 "29"），未知为 "?" */
    price: string;
    /** 促销标签（最多 2 个） */
    tags: string[];
    /** 平台详情页路由（如 /lotml/123） */
    detailUrl: string;
    /** 立即办理外链 */
    orderUrl: string;
}

/* ==================================================================
 * 工具函数
 * ================================================================== */

/**
 * 过滤通用无意义标签（包邮、归属地说明等），去重后取前 2 个。
 *
 * @param tags - 平台预计算标签列表
 * @returns 展示用的标签文本列表
 */
function pickPromoTags(tags: { text: string }[]): string[] {
    return Array.from(
        new Set(
            tags
                .map((tag) => tag.text)
                .filter((text) => !/免费包邮|随机归属地|收货地即归属地/.test(text))
        )
    ).slice(0, 2);
}

/**
 * 将浩卡联盟商品映射为统一商品项。
 *
 * @param product - 浩卡联盟扩展商品
 * @returns 统一商品项
 */
function mapHaoka(product: HaokaProductWithMeta): MallProductItem {
    const price = product.product_name.match(/(\d+\.?\d*)元/)?.[1];

    return {
        platform: "haoka",
        id: String(product.product_id),
        name: product.product_name.replace(/【.*?】/g, "").trim() || product.product_name,
        image: product.product_image || "",
        price: price || "?",
        tags: pickPromoTags(product._tags),
        detailUrl: `/haoka/${product.product_id}`,
        orderUrl: product.product_link,
    };
}

/* ==================================================================
 * 各平台 → 统一商品映射
 * ================================================================== */

/**
 * 将172号卡商品映射为统一商品项。
 *
 * @param product - 172号卡扩展商品
 * @returns 统一商品项
 */
function mapLotML(product: LotMLProductWithMeta): MallProductItem {
    return {
        platform: "lotml",
        id: String(product.productID),
        name: product.productName.replace(/【.*?】/g, "").trim() || product.productName,
        image: product.mainPic || "",
        price: product._price ? String(product._price) : "?",
        tags: pickPromoTags(product._tags),
        detailUrl: `/lotml/${product.productID}`,
        orderUrl: product._orderUrl,
    };
}

/**
 * 将林夕通信商品映射为统一商品项。
 *
 * @param product - 林夕通信扩展商品
 * @returns 统一商品项
 */
function mapLinxi(product: LinxiProductWithMeta): MallProductItem {
    return {
        platform: "linxi",
        id: product.id,
        name: product.shop_name,
        image: product.shop_img || "",
        price: product._price ? String(product._price) : "?",
        tags: pickPromoTags(product._tags),
        detailUrl: `/linxi/${product.id}`,
        orderUrl: product._orderUrl,
    };
}

/**
 * 将卡业联盟商品映射为统一商品项。
 *
 * 卡业联盟预计算 `_price` 为 "19元" 格式，这里去掉单位只保留数字。
 *
 * @param product - 卡业联盟扩展商品
 * @returns 统一商品项
 */
function mapGantanhao(product: GantanhaoProductWithMeta): MallProductItem {
    return {
        platform: "gantanhao",
        id: product.codeNumber,
        name: product.name,
        image: product.img || "",
        price: product._price.replace(/元/g, "") || "?",
        tags: pickPromoTags(product._tags),
        detailUrl: `/gantanhao/${product.codeNumber}`,
        orderUrl: product._orderUrl,
    };
}

/**
 * 将翼卡云商品映射为统一商品项。
 *
 * 优先展示优惠月租，无优惠时回退常规月租。
 *
 * @param product - 翼卡云扩展商品
 * @returns 统一商品项
 */
function mapYky(product: YkyProductWithMeta): MallProductItem {
    const price = product.favourMonthFee || product.monthFee || 0;

    return {
        platform: "yky",
        id: String(product.id),
        name: product.name,
        image: product.tips || "",
        price: price ? String(price) : "?",
        tags: pickPromoTags(product._tags),
        detailUrl: `/yky/${product.id}`,
        orderUrl: product._orderUrl,
    };
}

/**
 * 将卡易号卡商品映射为统一商品项。
 *
 * 卡易号卡预计算 `_price` 已优先使用优惠月租（数字字符串），直接复用。
 *
 * @param product - 卡易号卡扩展商品
 * @returns 统一商品项
 */
function mapKayi(product: KayiProductWithMeta): MallProductItem {
    return {
        platform: "kayi",
        id: String(product.id),
        name: product.name,
        image: product.tips || "",
        price: product._price || "?",
        tags: pickPromoTags(product._tags),
        detailUrl: `/kayi/${product.id}`,
        orderUrl: product._orderUrl,
    };
}

/* ==================================================================
 * 主入口
 * ================================================================== */

/**
 * 获取商城首页展示用的六平台商品列表。
 *
 * 在服务端并行拉取 浩卡联盟 / 172号卡 / 林夕通信 / 卡业联盟 / 翼卡云 / 卡易号卡 的商品，
 * 统一映射为 `MallProductItem` 结构，返回商品列表与失败平台列表。
 *
 * 各平台拉取函数内部均有 12 小时内存缓存，缓存命中时零网络开销，
 * 因此服务端组件在每次渲染时调用本函数代价很小。
 *
 * @returns { products, errors } - 统一商品列表、失败平台名称列表
 */
export async function getMallPlatformsProducts(): Promise<{
    products: MallProductItem[];
    errors: string[];
}> {
    const [haokaRes, lotmlRes, linxiRes, gantanhaoRes, ykyRes, kayiRes] = await Promise.allSettled([
        fetchHaokaProducts(),
        fetchLotMLProducts(),
        fetchLinxiProducts(),
        fetchGantanhaoProducts(),
        fetchYkyProducts(),
        fetchKayiProducts(),
    ]);

    const products: MallProductItem[] = [];
    const errors: string[] = [];

    /* ===== 浩卡联盟 ===== */
    if (haokaRes.status === "fulfilled") {
        products.push(...haokaRes.value.products.map(mapHaoka));
    } else {
        errors.push("浩卡联盟");
        console.error("[商城] 浩卡联盟数据加载失败:", haokaRes.reason);
    }

    /* ===== 172号卡 ===== */
    if (lotmlRes.status === "fulfilled") {
        products.push(...lotmlRes.value.products.map(mapLotML));
    } else {
        errors.push("172号卡");
        console.error("[商城] 172号卡数据加载失败:", lotmlRes.reason);
    }

    /* ===== 林夕通信 ===== */
    if (linxiRes.status === "fulfilled") {
        products.push(...linxiRes.value.products.map(mapLinxi));
    } else {
        errors.push("林夕通信");
        console.error("[商城] 林夕通信数据加载失败:", linxiRes.reason);
    }

    /* ===== 卡业联盟 ===== */
    if (gantanhaoRes.status === "fulfilled") {
        products.push(...gantanhaoRes.value.products.map(mapGantanhao));
    } else {
        errors.push("卡业联盟");
        console.error("[商城] 卡业联盟数据加载失败:", gantanhaoRes.reason);
    }

    /* ===== 翼卡云 ===== */
    if (ykyRes.status === "fulfilled") {
        products.push(...ykyRes.value.products.map(mapYky));
    } else {
        errors.push("翼卡云");
        console.error("[商城] 翼卡云数据加载失败:", ykyRes.reason);
    }

    /* ===== 卡易号卡 ===== */
    if (kayiRes.status === "fulfilled") {
        products.push(...kayiRes.value.products.map(mapKayi));
    } else {
        errors.push("卡易号卡");
        console.error("[商城] 卡易号卡数据加载失败:", kayiRes.reason);
    }

    return { products, errors };
}
