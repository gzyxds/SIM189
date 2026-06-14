/**
 * 搜索页共享类型定义
 *
 * 从 page.tsx 和 SearchContent.tsx 中提取的公共类型，
 * 避免循环依赖导致 TypeScript 模块解析失败。
 */

/* ========== 平台标识 ========== */

/** 平台标识 */
export type PlatformKey = "haoka" | "lotml" | "linxi" | "ksj" | "yky" | "gongchuang" | "gantanhao";

/* ========== 统一运营商 ========== */

/** 统一运营商枚举 */
export type UnifiedOperator = "mobile" | "telecom" | "unicom" | "broadcast" | "unknown";

/* ========== 统一商品模型 ========== */

/**
 * 统一商品模型 — 搜索页专用
 *
 * 将各平台异构数据映射为平台无关的统一格式，
 * 客户端直接使用此结构进行搜索、筛选、排序和渲染。
 */
export interface UnifiedProduct {
    /** 平台内唯一ID */
    id: string;
    /** 来源平台标识 */
    platform: PlatformKey;
    /** 商品名称（已清理特殊符号） */
    name: string;
    /** 商品图片 URL */
    image: string;
    /** 详情页路由（如 /haoka/123） */
    detailUrl: string;
    /** 办理链接（外链） */
    orderUrl: string;
    /** 运营商 */
    operator: UnifiedOperator;
    /** 月租价格（元），0 表示面议 */
    price: number;
    /** 通用流量（GB），0 表示无/未知 */
    flow: number;
    /** 通话时长（分钟），0 表示无/未知 */
    voice: number;
    /** 套餐时长：长期 | 2年 | 1年 | 6个月 | 短期 | 未知 */
    duration: string;
    /** 归属地/地区，空字符串表示全国 */
    region: string;
    /** 平台特有标签 */
    tags: string[];
    /** 返佣类型（秒返/次月返/月月返） */
    commissionType?: string;
}
