/**
 * 全局搜索页 — 服务端入口
 *
 * 并行拉取 6 大平台（浩卡联盟/172号卡/林夕通信/卡世界/翼卡云/共创号卡）商品数据，
 * 将各平台异构数据统一映射为 UnifiedProduct 格式，传递给客户端组件进行交互。
 *
 * 路由：/search
 * 数据来源：复用各平台 lib/api 模块的 fetchXxxProducts() 函数（自带 12h MemoryCache）
 */

import type { Metadata } from "next";
import { fetchHaokaProducts } from "@/lib/api/haokavip";
import type { HaokaProductWithMeta } from "@/lib/api/haokavip";
import { fetchLotMLProducts } from "@/lib/api/lotml";
import type { LotMLProductWithMeta } from "@/lib/api/lotml-utils";
import { fetchLinxiProducts } from "@/lib/api/linxi";
import type { LinxiProductWithMeta } from "@/lib/api/linxi";
import { fetchKsjProducts, getKsjApplyUrl } from "@/lib/api/ksj";
import type { KsjProductWithMeta } from "@/lib/api/ksj";
import { fetchYkyProducts, getYkyOrderUrl } from "@/lib/api/yky";
import type { YkyProductWithMeta } from "@/lib/api/yky";
import { fetchGongchuangProducts } from "@/lib/api/gongchuang";
import type { GongchuangProductWithMeta } from "@/lib/api/gongchuang";
import SearchContent from "./SearchContent";
import type { UnifiedProduct, PlatformKey, UnifiedOperator } from "./types";

// 重新导出类型供外部使用
export type { PlatformKey, UnifiedOperator, UnifiedProduct } from "./types";

/* ========== SEO 元数据 ========== */

/**
 * 搜索页 SEO 元数据
 *
 * 关键词策略：
 * - 核心词：流量卡/手机流量卡/大流量卡
 * - 价格词：9元/19元/29元/39元流量卡
 * - 运营商词：电信/移动/联通/广电流量卡
 * - 场景词：学生卡/长期套餐/5G流量卡
 * - 痛点词：流量卡哪个好/不限速/正规渠道
 */
export const metadata: Metadata = {
    title: "2026流量卡搜索对比 | 19元29元大流量卡推荐 5G手机卡在线办理 - 号卡之家",
    description:
        "2026年最新流量卡对比搜索，聚合6大平台1000+款套餐。19元200G、29元大流量卡、39元长期套餐一键筛选。电信/移动/联通/广电5G流量卡哪个好？正规渠道免费申请，不限速全国通用。",
    keywords: [
        /* === 核心品类词 === */
        "流量卡",
        "手机流量卡",
        "大流量卡",
        "5G流量卡",
        "纯流量卡",
        "电话卡",
        "手机卡",
        "上网卡",
        /* === 价格规格词（高转化长尾） === */
        "9元流量卡",
        "19元流量卡",
        "29元流量卡",
        "39元流量卡",
        "19元200G流量卡",
        "29元150G流量卡",
        "低月租手机卡",
        "便宜手机卡",
        /* === 运营商品牌词 === */
        "电信流量卡",
        "移动流量卡",
        "联通流量卡",
        "广电流量卡",
        "电信星卡",
        "移动花卡",
        "广电福兔卡",
        /* === 人群/场景细分词 === */
        "学生流量卡",
        "大学生手机卡",
        "上班族流量卡",
        "长期套餐流量卡",
        "不限速流量卡",
        "双卡双待流量卡",
        /* === 问题/痛点型词 === */
        "流量卡哪个好",
        "流量卡怎么选",
        "流量卡搜索",
        "流量卡对比",
        "流量卡推荐",
        "流量卡避坑指南",
        /* === 办理渠道词 === */
        "正规流量卡",
        "流量卡免费申请",
        "流量卡在线办理",
        "网上办手机卡",
    ],
    alternates: { canonical: "/search" },
    openGraph: {
        title: "2026流量卡搜索对比 | 19元29元大流量卡推荐",
        description:
            "聚合6大平台1000+款套餐，支持按运营商/价格/流量/时长多维筛选，一键对比找到最适合你的流量卡。",
        type: "website",
    },
};

/* ========== 平台映射函数 ========== */

/**
 * 从商品名称中提取月租价格数字
 * @param name - 商品名称
 */
function parsePrice(name: string): number {
    const m = name.match(/(\d+\.?\d*)元/);
    return m ? parseFloat(m[1]) : 0;
}

/**
 * 从文本中提取流量 GB 数值
 * @param text - 包含流量信息的文本
 */
function parseFlowGB(text: string): number {
    if (!text) return 0;
    const m = text.match(/(\d+\.?\d*)\s*(?:GB|G)/i);
    return m ? parseFloat(m[1]) : 0;
}

/**
 * 从文本中提取通话分钟数值
 * @param text - 包含通话信息的文本
 */
function parseVoiceMinutes(text: string): number {
    if (!text) return 0;
    const m = text.match(/(\d+)\s*分钟/);
    return m ? parseInt(m[1]) : 0;
}

/**
 * 将浩卡联盟商品映射为 UnifiedProduct
 * @param p - 浩卡联盟扩展商品
 */
function mapHaoka(p: HaokaProductWithMeta): UnifiedProduct {
    const price = parsePrice(p.product_name);
    const flowText = p._tags.find((t) => /\d+G/i.test(t.text))?.text || "";
    return {
        id: String(p.product_id),
        platform: "haoka",
        name: p.product_name.replace(/【.*?】/g, "").trim(),
        image: p.product_image || "",
        detailUrl: `/haoka/${p.product_id}`,
        orderUrl: p.product_link || "",
        operator: p._provider,
        price,
        flow: parseFlowGB(flowText),
        voice: 0,
        duration: p._duration || "未知",
        region: p._location || "",
        tags: p._tags.map((t) => t.text),
    };
}

/**
 * 将172号卡商品映射为 UnifiedProduct
 * @param p - 172号卡扩展商品
 */
function mapLotML(p: LotMLProductWithMeta): UnifiedProduct {
    return {
        id: String(p.productID),
        platform: "lotml",
        name: p.productName,
        image: p.mainPic || "",
        detailUrl: `/lotml/${p.productID}`,
        orderUrl: p._orderUrl || "",
        operator: p._operator,
        price: p._price,
        flow: parseFlowGB(p._flow),
        voice: parseVoiceMinutes(p._voice),
        duration: p._duration || "未知",
        region: p.area || "",
        tags: p._tags.map((t) => t.text),
        commissionType: p.BackMoneyType || undefined,
    };
}

/**
 * 将林夕通信商品映射为 UnifiedProduct
 * @param p - 林夕通信扩展商品
 */
function mapLinxi(p: LinxiProductWithMeta): UnifiedProduct {
    return {
        id: String(p.id),
        platform: "linxi",
        name: p.shop_name,
        image: p.shop_img || "",
        detailUrl: `/linxi/${p.id}`,
        orderUrl: p._orderUrl || "",
        operator: p._operator,
        price: p._price,
        flow: parseFlowGB(p._flow),
        voice: parseVoiceMinutes(p._voice),
        duration: p._duration || "未知",
        region: p.gsd_province || "",
        tags: p._tags.map((t) => t.text),
        commissionType:
            p.shop_money === "1" ? "秒返" : p.shop_money === "2" ? "月月返" : "次月返",
    };
}

/**
 * 将卡世界商品映射为 UnifiedProduct
 * @param p - 卡世界扩展商品
 */
function mapKsj(p: KsjProductWithMeta): UnifiedProduct {
    const price = parsePrice(p.name);
    const flowMatch = p.package_composition?.match(/(\d+)G/)?.[1];
    const voiceMatch = p.package_composition?.match(/(\d+)分钟/)?.[1];
    return {
        // 使用数据库主键 id 而非 goods_id（goods_id 不唯一，会导致 React key 冲突）
        id: String(p.id),
        platform: "ksj",
        name: p.name,
        image: p._imageUrl || "",
        detailUrl: `/ksj/${p.goods_id}`,
        orderUrl: getKsjApplyUrl(p.goods_id),
        operator: p._operator,
        price,
        flow: flowMatch ? parseInt(flowMatch) : 0,
        voice: voiceMatch ? parseInt(voiceMatch) : 0,
        duration: p.package_contract_text?.includes("长期")
            ? "长期"
            : p.package_contract_text?.includes("24")
                ? "2年"
                : p.package_contract_text?.includes("12")
                    ? "1年"
                    : "未知",
        region: p.package_attribution || "",
        tags: p._tags.map((t) => t.text),
    };
}

/**
 * 将翼卡云商品映射为 UnifiedProduct
 * @param p - 翼卡云扩展商品
 */
function mapYky(p: YkyProductWithMeta): UnifiedProduct {
    return {
        id: String(p.id),
        platform: "yky",
        name: p.name,
        image: p.tips || "",
        detailUrl: `/yky/${p.id}`,
        orderUrl: p._orderUrl || getYkyOrderUrl(p.id),
        operator: p._operator,
        price: p.favourMonthFee || p.monthFee || 0,
        flow: p.commonFlow || 0,
        voice: p.callDuration || 0,
        duration: p._duration || "未知",
        region: p._region || "",
        tags: p._tags.map((t) => t.text),
        commissionType: p._settleText || undefined,
    };
}

/**
 * 将共创号卡商品映射为 UnifiedProduct
 * @param p - 共创号卡扩展商品
 */
function mapGongchuang(p: GongchuangProductWithMeta): UnifiedProduct {
    return {
        id: String(p.goods_id),
        platform: "gongchuang",
        name: p.goods_name,
        image: p.imageUrl || "",
        detailUrl: `/kakatx/${p.goods_id}`,
        orderUrl: "",
        operator: p._operator,
        price: parseFloat(p.price) || 0,
        flow: parseFlowGB(p._flow),
        voice: parseVoiceMinutes(p._voice),
        duration: p._duration || "未知",
        region: p.belonging || "",
        tags: p._tags.map((t) => t.text),
        commissionType: p._comTypeLabel || undefined,
    };
}

/* ========== 主入口 ========== */

/** 搜索页服务端组件 — 并行拉取6平台数据并统一映射 */
export default async function SearchPage() {
    /** 并行拉取所有平台数据，各自独立容错 */
    const [haokaRes, lotmlRes, linxiRes, ksjRes, ykyRes, gongchuangRes] =
        await Promise.allSettled([
            fetchHaokaProducts(),
            fetchLotMLProducts(),
            fetchLinxiProducts(),
            fetchKsjProducts(),
            fetchYkyProducts(),
            fetchGongchuangProducts(),
        ]);

    /** 逐平台映射为 UnifiedProduct，失败平台跳过并收集错误信息 */
    const products: UnifiedProduct[] = [];
    const errors: string[] = [];

    /* ===== 浩卡联盟 ===== */
    if (haokaRes.status === "fulfilled") {
        products.push(...haokaRes.value.products.map(mapHaoka));
    } else {
        errors.push("浩卡联盟");
        console.error("[Search] 浩卡联盟数据加载失败:", haokaRes.reason);
    }

    /* ===== 172号卡 ===== */
    if (lotmlRes.status === "fulfilled") {
        products.push(...lotmlRes.value.products.map(mapLotML));
    } else {
        errors.push("172号卡");
        console.error("[Search] 172号卡数据加载失败:", lotmlRes.reason);
    }

    /* ===== 林夕通信 ===== */
    if (linxiRes.status === "fulfilled") {
        products.push(...linxiRes.value.products.map(mapLinxi));
    } else {
        errors.push("林夕通信");
        console.error("[Search] 林夕通信数据加载失败:", linxiRes.reason);
    }

    /* ===== 卡世界 ===== */
    if (ksjRes.status === "fulfilled") {
        products.push(...ksjRes.value.products.map(mapKsj));
    } else {
        errors.push("卡世界");
        console.error("[Search] 卡世界数据加载失败:", ksjRes.reason);
    }

    /* ===== 翼卡云 ===== */
    if (ykyRes.status === "fulfilled") {
        products.push(...ykyRes.value.products.map(mapYky));
    } else {
        errors.push("翼卡云");
        console.error("[Search] 翼卡云数据加载失败:", ykyRes.reason);
    }

    /* ===== 共创号卡 ===== */
    if (gongchuangRes.status === "fulfilled") {
        products.push(...gongchuangRes.value.products.map(mapGongchuang));
    } else {
        errors.push("共创号卡");
        console.error("[Search] 共创号卡数据加载失败:", gongchuangRes.reason);
    }

    /* ========== 生成随机种子（SSR 一致性关键） ========== */

    /** 随机种子 — 服务端生成，客户端水合时使用同一序列 */
    const randomSeed = Math.random();

    /* ========== JSON-LD 结构化数据（SEO） ========== */

    /** 站点基础 URL */
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.sim189.cn";

    /** SearchAction + CollectionPage Schema */
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "2026流量卡搜索对比",
        "description": "聚合6大平台1000+款流量卡套餐，支持按运营商、价格、流量、时长多维筛选对比",
        "url": `${siteUrl}/search`,
        "isPartOf": { "@type": "WebSite", "name": "号卡之家", "url": siteUrl },
        "potentialAction": {
            "@type": "SearchAction",
            "target": `${siteUrl}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
        },
        "about": [
            { "@type": "Thing", "name": "流量卡" },
            { "@type": "Thing", "name": "手机流量卡" },
            { "@type": "Thing", "name": "大流量卡" },
            { "@type": "Thing", "name": "5G流量卡" },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <SearchContent
                products={products}
                totalCount={products.length}
                platformErrors={errors}
                randomSeed={randomSeed}
            />
        </>
    );
}
