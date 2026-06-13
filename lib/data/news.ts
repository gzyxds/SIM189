/**
 * 新闻资讯数据模块（服务端）
 *
 * 从 content/news/ 目录读取 Markdown 文章文件，
 * 解析 YAML Frontmatter 和正文内容，提供给页面组件使用。
 * 此模块只能在服务端组件中调用（使用 fs / path）。
 */

import fs from "fs";
import path from "path";

// 客户端安全类型/工具从独立模块导入
import type { NewsArticle } from "./news-types";
import { getCategoryConfig, getAllCategories } from "./news-types";

// 重新导出供服务端页面使用（统一导入路径）
export type { NewsArticle, NewsCategoryType, NewsCategoryConfig } from "./news-types";
export { getCategoryConfig, getAllCategories } from "./news-types";

/* ========== 简版 Markdown → HTML 转换 ========== */

/**
 * 将 Markdown 正文转换为 HTML
 * 支持：标题、粗体、表格、列表、代码块、引用、链接、分隔线、行内代码
 */
function markdownToHtml(md: string): string {
    let html = md;

    // 代码块（```...```，兼容 CRLF）
    html = html.replace(/```(\w*)\r?\n([\s\S]*?)```/g, (_m, lang, code) => {
        const escaped = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        return `<pre><code class="language-${lang || "text"}">${escaped}</code></pre>`;
    });

    // 行内代码
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // 标题（从高到低）
    html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(
        /^## (.+)$/gm,
        '<h2 class="text-xl font-bold mt-8 mb-4">$1</h2>'
    );
    html = html.replace(
        /^# (.+)$/gm,
        '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>'
    );

    // 粗体
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // 图片
    html = html.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" class="rounded-xl my-4 max-w-full" />'
    );

    // 链接
    html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
    );

    // 分隔线（兼容 CRLF）
    html = html.replace(/^---$/gm, '<hr class="my-6 border-gray-200" />');

    // 表格（简化处理，按行分割）
    html = html.replace(
        /\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/gm,
        (_m, headerRow, bodyRows) => {
            const headers = headerRow
                .split("|")
                .map((h: string) => h.trim())
                .filter(Boolean);
            const rows = bodyRows
                .trim()
                .split("\n")
                .map((row: string) =>
                    row
                        .split("|")
                        .map((c: string) => c.trim())
                        .filter(Boolean)
                );
            let tableHtml =
                '<table class="w-full my-4 text-sm border-collapse"><thead><tr>';
            headers.forEach((h: string) => {
                tableHtml += `<th class="border px-3 py-2 text-left font-semibold bg-gray-50">${h}</th>`;
            });
            tableHtml += "</tr></thead><tbody>";
            rows.forEach((row: string[]) => {
                tableHtml += "<tr>";
                row.forEach((cell: string) => {
                    tableHtml += `<td class="border px-3 py-2">${cell}</td>`;
                });
                tableHtml += "</tr>";
            });
            tableHtml += "</tbody></table>";
            return tableHtml;
        }
    );

    // 无序列表
    html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
    // 用 ul 包裹连续的 <li>
    html = html.replace(
        /((?:<li>.*<\/li>\n?)+)/g,
        '<ul class="list-disc pl-5 my-3 space-y-1">$1</ul>'
    );

    // 引用块
    html = html.replace(
        /^> (.+)$/gm,
        '<blockquote class="border-l-4 border-blue-400 pl-4 my-4 italic text-gray-600">$1</blockquote>'
    );
    // 合并连续 blockquote
    html = html.replace(
        /<\/blockquote>\n<blockquote[^>]*>/g,
        "<br />"
    );

    // 普通段落：将连续非空行用 <p> 包裹
    // 先移除已有的 HTML 标签行和空行
    const lines = html.split("\n");
    const result: string[] = [];
    let paragraphLines: string[] = [];

    const isHtmlTag = (line: string) =>
        /^<(h[1-4]|p|pre|ul|ol|li|table|thead|tbody|tr|th|td|img|hr|blockquote|div|br|code)/.test(
            line.trim()
        );

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "") {
            if (paragraphLines.length > 0) {
                result.push(`<p>${paragraphLines.join("<br />")}</p>`);
                paragraphLines = [];
            }
            continue;
        }
        if (isHtmlTag(trimmed)) {
            if (paragraphLines.length > 0) {
                result.push(`<p>${paragraphLines.join("<br />")}</p>`);
                paragraphLines = [];
            }
            result.push(trimmed);
            continue;
        }
        paragraphLines.push(trimmed);
    }
    if (paragraphLines.length > 0) {
        result.push(`<p>${paragraphLines.join("<br />")}</p>`);
    }

    return result.join("\n");
}

/* ========== Frontmatter 解析 ========== */

/**
 * 解析 YAML 风格的 Frontmatter
 * 支持字符串、数组值
 */
function parseFrontmatter(
    raw: string
): Record<string, string | string[]> | null {
    // 兼容 Windows (CRLF) 和 Unix (LF) 换行符
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return null;

    const fm: Record<string, string | string[]> = {};
    // 统一换行符后再分割
    const lines = match[1].replace(/\r\n/g, "\n").split("\n");

    let currentKey: string | null = null;
    let currentArray: string[] = [];

    for (const line of lines) {
        // 数组项
        const arrMatch = line.match(/^\s+-\s+(.+)$/);
        if (arrMatch && currentKey) {
            currentArray.push(arrMatch[1].trim());
            continue;
        }

        // 已有数组 → 提交
        if (currentKey && currentArray.length > 0) {
            fm[currentKey] = currentArray;
            currentArray = [];
            currentKey = null;
        }

        // 键值对
        const kvMatch = line.match(/^(\w+):\s*(.+)$/);
        if (kvMatch) {
            const key = kvMatch[1];
            let value = kvMatch[2].trim();

            // 去除引号
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }

            // 检查是否下一行是数组
            if (key === "tags") {
                currentKey = key;
                currentArray = [];
            } else {
                fm[key] = value;
            }
        }
    }

    // 提交最后的数组
    if (currentKey && currentArray.length > 0) {
        fm[currentKey] = currentArray;
    }

    return fm;
}

/** 新闻封面图片目录（相对于 public/） */
const COVER_DIR = "/news";

/** 封面图片文件名列表 */
const COVER_IMAGES = [
    "news-1.png",
    "news-2.png",
    "news-3.jpg",
    "news-4.jpg",
    "news-5.jpg",
    "news-6.png",
];

/**
 * 根据文章文件名确定性映射到封面图片
 * 使用文件编号取模，确保同一篇文章始终使用同一张封面
 * @param filename - 文件名（含扩展名，如 "24.md"）
 */
function getCoverImage(filename: string): string {
    const num = parseInt(filename, 10);
    const index = isNaN(num) ? 0 : num % COVER_IMAGES.length;
    return `${COVER_DIR}/${COVER_IMAGES[index]}`;
}

/** 计算文章字数（去除 Markdown 语法） */
function countWords(content: string): number {
    return content
        .replace(/[#*`\-\[\]()>|!~]/g, "")
        .replace(/\s+/g, "")
        .length;
}

/** 根据文件名生成模拟阅读量 */
function generateReads(filename: string): number {
    const num = parseInt(filename, 10);
    if (isNaN(num)) return 500;
    // 按文件名编号产生不同的阅读量
    return 500 + (num * 137 + (num % 7) * 213) % 9500;
}

/** 默认作者头像（使用站点 Logo） */
const DEFAULT_AVATAR = "/logo.svg";

/* ========== 主解析函数 ========== */

/** 新闻文件存放目录 */
const NEWS_DIR = path.join(process.cwd(), "content", "news");

/**
 * 解析单个 Markdown 文件为 NewsArticle
 * @param filePath - 文件绝对路径
 * @param filename - 文件名（含扩展名）
 */
function parseNewsFile(filePath: string, filename: string): NewsArticle | null {
    const raw = fs.readFileSync(filePath, "utf-8");
    const fm = parseFrontmatter(raw);

    if (!fm || !fm.title) return null;

    // 提取正文（去除 Frontmatter，兼容 CRLF 和 LF）
    const contentMatch = raw.slice(4).match(/\r?\n---\r?\n/);
    const markdownContent = contentMatch
        ? raw.slice(4 + (contentMatch.index ?? 0) + contentMatch[0].length).trim()
        : raw.trim();

    // 根据文件名确定性映射封面图
    const imageUrl = getCoverImage(filename);

    // 解析日期
    let date = "";
    let datetime = "";
    const publishDate = (fm.publishDate as string) || "";
    if (publishDate) {
        // 格式: "2026-06-14 09:00"
        const d = publishDate.split(" ")[0];
        date = d;
        datetime = publishDate.replace(" ", "T") + ":00.000Z";
    }

    // 标签
    const tags = Array.isArray(fm.tags)
        ? fm.tags
        : typeof fm.tags === "string"
            ? (fm.tags as string)
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : [];

    const category = (fm.category as string) || "综合资讯";
    const authorName = (fm.author as string) || "172号卡团队";

    return {
        id: filename.replace(/\.md$/, ""),
        title: fm.title as string,
        description: (fm.snippet as string) || (fm.title as string),
        content: markdownContent,
        html: markdownToHtml(markdownContent),
        imageUrl,
        date,
        datetime,
        category,
        tags,
        author: {
            name: authorName,
            role: authorName.includes("清风") ? "运营团队" : "内容团队",
            avatarUrl: DEFAULT_AVATAR,
        },
        wordCount: countWords(markdownContent),
    };
}

/**
 * 从 content/news/ 读取并解析全部新闻文章
 * 按发布日期降序排列
 */
export function getAllNews(): NewsArticle[] {
    if (!fs.existsSync(NEWS_DIR)) return [];

    const files = fs.readdirSync(NEWS_DIR).filter((f) => f.endsWith(".md"));

    const articles: NewsArticle[] = [];

    for (const filename of files) {
        const filePath = path.join(NEWS_DIR, filename);
        try {
            const article = parseNewsFile(filePath, filename);
            if (article) articles.push(article);
        } catch {
            // 跳过解析失败的文件
            console.warn(`[News] 跳过无法解析的文件: ${filename}`);
        }
    }

    // 按日期降序
    articles.sort(
        (a, b) =>
            new Date(b.datetime || 0).getTime() -
            new Date(a.datetime || 0).getTime()
    );

    return articles;
}

/**
 * 按 ID 获取单篇新闻文章
 * @param id - 文章 ID（文件名不含扩展名）
 */
export function getNewsById(id: string): NewsArticle | null {
    const filePath = path.join(NEWS_DIR, `${id}.md`);
    if (!fs.existsSync(filePath)) return null;

    try {
        return parseNewsFile(filePath, `${id}.md`);
    } catch {
        return null;
    }
}

/**
 * 按分类筛选新闻
 * @param category - 分类名，"全部"表示不筛选
 */
export function getNewsByCategory(
    category: string,
    articles?: NewsArticle[]
): NewsArticle[] {
    const all = articles || getAllNews();
    if (category === "全部") return all;
    return all.filter((a) => a.category === category);
}

/** 搜索新闻（按标题和描述） */
export function searchNews(
    keyword: string,
    articles?: NewsArticle[]
): NewsArticle[] {
    const all = articles || getAllNews();
    const kw = keyword.trim().toLowerCase();
    if (!kw) return all;
    return all.filter(
        (a) =>
            a.title.toLowerCase().includes(kw) ||
            a.description.toLowerCase().includes(kw) ||
            a.tags.some((t) => t.toLowerCase().includes(kw))
    );
}
