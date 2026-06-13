/**
 * 新闻资讯 — 客户端安全类型与工具模块
 *
 * 此模块仅包含可在客户端/服务端通用使用的类型定义、
 * 分类配置和纯函数。不依赖任何 Node.js API。
 * 服务端解析逻辑在 news.ts 中。
 */

/* ========== 类型定义 ========== */

/** 新闻分类（从 MD 文件中自动收集） */
export type NewsCategoryType = string;

/** 新闻分类 UI 配置 */
export interface NewsCategoryConfig {
    /** 分类中文名 */
    label: string;
    /** 分类描述 */
    desc: string;
    /** 分类标识色 */
    color: string;
    /** 背景色类 */
    bg: string;
}

/** 新闻文章数据类型 */
export interface NewsArticle {
    /** 文章唯一标识（文件名不含扩展名） */
    id: string;
    /** 文章标题 */
    title: string;
    /** 文章简短描述 */
    description: string;
    /** 文章原始 Markdown 内容 */
    content: string;
    /** 文章正文 HTML（从 Markdown 转换） */
    html: string;
    /** 封面图 URL（从内容中提取首张图片） */
    imageUrl: string;
    /** 发布日期（YYYY-MM-DD） */
    date: string;
    /** 发布日期时间（ISO 格式） */
    datetime: string;
    /** 所属分类 */
    category: string;
    /** 标签列表 */
    tags: string[];
    /** 作者信息 */
    author: {
        /** 作者姓名 */
        name: string;
        /** 作者角色 */
        role: string;
        /** 作者头像 URL */
        avatarUrl: string;
    };
    /** 文章字数 */
    wordCount: number;
}

/* ========== 分类配置 ========== */

/** 预设分类 UI 配置表（从 MD 文件中动态扩展） */
const PRESET_CATEGORIES: Record<string, NewsCategoryConfig> = {
    产品推荐: {
        label: "产品推荐",
        desc: "热门流量套餐精选推介",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
    },
    科普知识: {
        label: "科普知识",
        desc: "流量卡知识科普与解读",
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    人群推荐: {
        label: "人群推荐",
        desc: "不同人群流量卡推荐",
        color: "text-amber-600",
        bg: "bg-amber-50",
    },
    攻略指南: {
        label: "攻略指南",
        desc: "办卡用卡攻略与指南",
        color: "text-violet-600",
        bg: "bg-violet-50",
    },
    政策解读: {
        label: "政策解读",
        desc: "运营商政策分析与解读",
        color: "text-rose-600",
        bg: "bg-rose-50",
    },
};

/** 默认分类配置（当分类未在预设表中匹配时使用） */
const DEFAULT_CATEGORY_CONFIG: NewsCategoryConfig = {
    label: "综合资讯",
    desc: "号卡行业综合资讯",
    color: "text-slate-600",
    bg: "bg-slate-50",
};

/** 获取分类 UI 配置（label、颜色、背景色等） */
export function getCategoryConfig(category: string): NewsCategoryConfig {
    return PRESET_CATEGORIES[category] || DEFAULT_CATEGORY_CONFIG;
}

/** 从文章列表中提取全部去重分类（含"全部"选项） */
export function getAllCategories(articles: NewsArticle[]): string[] {
    const cats = new Set(articles.map((a) => a.category));
    return ["全部", ...Array.from(cats)];
}
