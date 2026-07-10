# AGENTS.md — 号卡之家 (sim189.cn)

## 项目概述

号卡之家是基于 Next.js 16 (App Router) 构建的手机流量卡在线办理聚合平台，对接多家号卡分销平台 API，面向用户展示电信、移动、联通、广电四大运营商的优惠流量卡套餐。

## 技术栈

- 框架：Next.js 16 (App Router, RSC)
- 语言：TypeScript 5 (strict 模式)
- UI：shadcn/ui (New York 风格, neutral 基色) + Tailwind CSS v4
- 图标：lucide-react (28x28 尺寸偏好)
- 字体：DM Sans (sans) + JetBrains Mono (mono), 通过 next/font 加载
- 工具：clsx + tailwind-merge -> cn() / class-variance-authority (cva)

## 代码规范

### 通用规范

- 所有函数、组件必须添加中文 JSDoc 注释，描述功能和用途
- 使用 TypeScript strict 模式，禁止使用 any（必要时用 unknown）
- 路径别名统一使用 `@/`（对应项目根目录）
- 禁止使用 `var`，优先使用 `const`，需要重新赋值时使用 `let`
- 字符串使用单引号，JSX 属性使用双引号
- 文件末尾保留一个空行

### 组件规范

- 组件文件名使用 PascalCase（如 `HeroSection.tsx`）
- 默认导出：`export default function ComponentName() { ... }`
- 优先使用 Server Component，仅在需要交互/状态/浏览器 API 时加 `"use client"`
- 页面路由模式：`app/{route}/page.tsx`（服务端获取数据） + `app/{route}/{Route}Content.tsx`（客户端交互）
- Props 类型定义在组件文件内，使用 interface（不 export，除非被复用）
- 使用 `cn()` 合并 className，来自 `@/lib/utils`
- 站点布局使用 `containerClass` 和 `SITE_WIDTH_STYLE`（来自 `@/lib/layout`，宽度 1550px）

### API 规范

- 每个对接平台独立一个文件：`lib/api/{platform}.ts`
- API 文件仅供服务端使用（Server Component / Route Handler），含 Node.js 内置模块
- 客户端安全的类型和工具函数放在 `lib/api/{platform}-utils.ts`
- 所有 API 模块统一使用 `MemoryCache<T>` 类进行缓存（12小时 TTL）
- 缓存键使用各自的身份标识（appId / userId）
- API Route Handler 使用 Next.js 标准模式：`export async function GET(request: Request)`

### 样式规范

- Tailwind CSS v4 优先，避免行内 style
- 使用 CSS 变量定义主题色（定义在 `app/globals.css`）
- 响应式断点：sm(640) / md(768) / lg(1024) / xl(1280) / 2xl(1536)
- 暗色模式通过 CSS 变量 + Tailwind dark: 修饰符自动切换
- 动画使用 CSS @keyframes 或 tw-animate-css 预设

### SEO 规范

- 每个页面必须导出 `metadata` 对象（title / description / keywords）
- 每页设置 `alternates.canonical` 规范链接
- 首页和关键落地页需包含 JSON-LD 结构化数据
- 动态路由页面在 `generateMetadata` 中生成 SEO 信息

### 命名规范

- 文件/目录：`kebab-case`（路由目录）、`PascalCase`（组件文件）、`camelCase`（工具/API文件）
- 变量/函数：`camelCase`
- 类型/接口：`PascalCase`、接口不加 `I` 前缀
- 常量：`UPPER_SNAKE_CASE`
- CSS 类名：由 Tailwind 生成，自定义类名用 `kebab-case`

## 项目结构

```
app/                          # Next.js App Router 页面
  page.tsx                    # 首页（Server Component，组合 home/ 子组件）
  layout.tsx                  # 根布局（字体、Metadata、SEO、JSON-LD）
  globals.css                 # Tailwind v4 主题变量 + 全局样式
  robots.ts / sitemap.ts      # 动态 SEO 文件
  {platform}/                 # 平台页面（lotml/haoka/linxi/ksj/yky/gantanhao/kakatx）
    page.tsx                  # 服务端组件（获取数据 + Metadata）
    {Platform}Content.tsx     # 客户端组件（筛选/排序/展示）
    [id]/                     # 商品详情页
  cps/                        # 聚推客 CPS 推广页
  news/                       # 新闻资讯（Markdown 驱动）
  about/ faq/ services/ cooperate/ join/ download/   # 静态内容页
components/
  ui/                         # shadcn/ui 基础组件
  home/                       # 首页各区域组件
  ClaimTicker.tsx             # 顶部跑马灯公告
lib/
  api/                        # 各平台 API 模块
    cache.ts                  # MemoryCache<T> 通用缓存
    {platform}.ts             # 平台 API（服务端专用）
    {platform}-utils.ts       # 平台工具（客户端安全）
  data/                       # 静态数据（FAQ、新闻、跑马灯、pudid-map）
  layout.ts                   # 站点布局常量
  utils.ts                    # cn() 工具函数
public/                       # 静态资源（图片、字体）
scripts/                      # 辅助脚本（爬虫等）
```

## 运行命令

```powershell
# 开发模式
npm run dev

# 生产构建
npm run build

# 生产启动
npm run start

# ESLint 检查
npm run lint

# 爬取 172号卡 pudID 映射表
npm run scrape:pudid
npm run scrape:pudid:playwright
```

## 环境配置

- 复制 `.env.example` 为 `.env` 并填入真实 API 密钥
- 所有第三方平台密钥通过环境变量管理，禁止硬编码
- Windows 环境下使用 PowerShell 执行命令，注意 `&&` 替换为 `;`

## 注意事项

- 不要修改 `.env` 中的密钥配置，除非明确要求
- 修改 `lib/api/` 中的签名逻辑时需同步检查对应的 `*-utils.ts`
- 新增对接平台时需同步更新 `sitemap.ts`
- `pudid-map.json` 由爬虫脚本生成，不要手动编辑
- 图片域名白名单在 `next.config.ts` 的 `images.remotePatterns` 中配置
- 不要提交 `.env`、`node_modules/`、`.next/`
