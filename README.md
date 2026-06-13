# 号卡之家 — sim189.cn 手机大流量卡在线办理平台

基于 Next.js 16 构建的多平台号卡分销聚合站点，一站式对接电信、移动、联通、广电四大运营商大流量卡资源，支持 19 元/29 元低月租套餐在线免费申请。

## 功能特性

- **多平台号卡聚合** — 同时对接 172号卡、浩卡联盟、林夕通信、共创号卡、翼卡云、卡世界、聚推客等主流分销平台
- **四大运营商覆盖** — 中国移动、中国电信、中国联通、中国广电正规套餐
- **智能商品筛选** — 支持按运营商、价格、流量、时长等多维度筛选与排序
- **服务端数据缓存** — 12 小时 TTL 内存缓存，大幅提升页面加载速度
- **SEO 全面优化** — 每页独立 Metadata、动态 Sitemap、robots.txt、JSON-LD 结构化数据
- **响应式布局** — 完美适配桌面、平板、手机各尺寸屏幕
- **暗色模式支持** — 基于 Tailwind CSS 变量自动切换
- **商品元数据预计算** — 服务端一次性解析运营商、标签、价格等，客户端零负担渲染

## 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | [Next.js 16](https://nextjs.org/) (App Router) |
| 语言 | [TypeScript 5](https://www.typescriptlang.org/) (strict 模式) |
| UI 库 | [shadcn/ui](https://ui.shadcn.com/) (New York 风格) + [Tailwind CSS v4](https://tailwindcss.com/) |
| 图标 | [lucide-react](https://lucide.dev/) |
| 字体 | DM Sans + JetBrains Mono (next/font) |
| 工具 | clsx + tailwind-merge → `cn()` / class-variance-authority (cva) |

## 项目结构

```
app/                          # Next.js App Router 页面路由
  page.tsx                    # 首页（Header/Hero/Features/Plans/Process/Guarantee/FAQ/WhyChoose/CTA/Footer）
  layout.tsx                  # 根布局（字体、Metadata、SEO、JSON-LD）
  globals.css                 # Tailwind v4 主题变量 + 全局动画
  robots.ts                   # robots.txt 动态生成
  sitemap.ts                  # sitemap.xml 动态生成
  haoka/                      # 浩卡联盟商品页
  lotml/                      # 172号卡商品页
  linxi/                      # 林夕通信商品页
  ksj/                        # 卡世界商品页
  yky/                        # 翼卡云商品页
  gongchuang/                 # 共创号卡商品页
  cps/                        # 聚推客 CPS 推广页
  about/                      # 关于我们
  faq/                        # 常见问题
  services/                   # 服务页
  cooperate/                  # 合作页
  join/                       # 代理加盟页
  download/                   # 下载页
components/
  ui/                         # shadcn/ui 基础组件
  home/                       # 首页各区域组件
  ClaimTicker.tsx             # 顶部跑马灯公告
lib/
  api/                        # API 服务模块（每个平台独立文件）
    cache.ts                  # 通用服务端内存缓存 MemoryCache<T>
    haokavip.ts             # 浩卡联盟（AES-256-ECB 加密）
    lotml.ts                # 172号卡（MD5 签名）
    lotml-utils.ts          # 172号卡客户端安全工具
    linxi.ts                # 林夕通信（MD5 密码加密）
    ksj.ts                  # 卡世界（RSA 签名 + JWT）
    yky.ts                  # 翼卡云（Header MD5 签名）
    gongchuang.ts           # 共创号卡（MD5 签名）
    jutuike.ts              # 聚推客 CPS
  data/                       # 静态数据
    faq.ts                    # FAQ 数据
    claim-records.ts          # 跑马灯数据
    pudid-map.json            # 172号卡 pudID 映射表
  layout.ts                   # 站点布局常量（SITE_WIDTH=1550）
  utils.ts                    # cn() 工具函数
public/                       # 静态资源
scripts/                      # 辅助脚本
  scrape-pudid.mjs
  scrape-pudid-playwright.mjs
```

## 对接平台一览

| 平台 | 路由 | API 认证方式 | 特点 |
|------|------|-------------|------|
| 172号卡 | `/lotml` | MD5 签名 | 号卡行业老牌平台，商品丰富 |
| 浩卡联盟 | `/haoka` | AES-256-ECB 加密 | 高佣金，API 稳定 |
| 林夕通信 | `/linxi` | MD5 密码加密 | 号卡极团系统，支持选号 |
| 卡世界 | `/ksj` | RSA 签名 + JWT | 后台管理 API，数据字段丰富 |
| 翼卡云 | `/yky` | Header MD5 签名 | 87号卡体系，支持靓号/宽带 |
| 共创号卡 | `/kakatx` | MD5 签名 | 新兴平台，套餐竞争力强 |
| 聚推客 | `/cps` | 平台自定义签名 | CPS 推广联盟 |

## 快速开始

### 前置要求

- Node.js 18+
- npm

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制示例文件并填入你的平台对接配置：

```bash
cp .env.example .env
```

```env
# 林夕通信 API 配置（号卡极团系统）
LINXI_API_USER=your_api_user
LINXI_API_PWD=your_api_pwd

# 172号卡平台 API 配置
HAOKA_USER_ID=your_user_id
HAOKA_SECRET=your_secret
HAOKA_AGENT_ID=your_agent_id

# 浩卡联盟 API 配置
HAOKAVIP_APP_ID=your_app_id
HAOKAVIP_APP_SECRET=your_app_secret

# 共创号卡 API 配置
GONGCHUANG_USERNAME=your_username
GONGCHUANG_SECRET=your_secret

# 翼卡云 API 配置
YKY_APP_ID=your_app_id
YKY_API_SECRET=your_api_secret
YKY_CHANNEL_CODE=your_channel_code

# 聚推客联盟 API 配置
JUTUIKE_API_KEY=your_api_key
JUTUIKE_PUB_ID=your_pub_id

# 卡世界 API 配置
KASJ_API_TOKEN=your_jwt_token
KSJ_STORE_ID=your_store_id

# 站点基础 URL（影响 sitemap / robots）
NEXT_PUBLIC_SITE_URL=https://www.yourdomain.com
```

> **提示**：以上配置均为可选。如未配置某个平台，对应页面会优雅降级显示错误提示，不影响其他页面正常运行。

### 3. 启动开发服务器

```bash
npm run dev
```

打开 `http://localhost:3000` 查看效果。

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 可用脚本

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run scrape:pudid` | 抓取 172号卡 pudID 映射表 |
| `npm run scrape:pudid:playwright` | 使用 Playwright 抓取 pudID |

## 页面路由一览

| 路径 | 说明 | 优先级 |
|------|------|--------|
| `/` | 首页 — 流量卡推荐、办理流程、FAQ | 1.0 |
| `/haoka` | 浩卡联盟大流量卡列表 | 0.9 |
| `/lotml` | 172号卡大流量卡列表 | 0.9 |
| `/linxi` | 林夕通信大流量卡列表 | 0.9 |
| `/kakatx` | 共创号卡大流量卡列表 | 0.9 |
| `/yky` | 翼卡云大流量卡列表 | 0.9 |
| `/ksj` | 卡世界大流量卡列表 | 0.9 |
| `/cps` | 聚推客 CPS 推广 | 0.7 |
| `/join` | 代理加盟 | 0.8 |
| `/services` | 服务支持 | 0.7 |
| `/about` | 关于我们 | 0.6 |
| `/faq` | 常见问题 | 0.6 |
| `/cooperate` | 商务合作 | 0.6 |
| `/download` | APP 下载 | 0.6 |

## 缓存策略

项目采用**服务端内存缓存**策略，每个 API 模块独立管理：

- **TTL**: 12 小时（43200 秒）
- **首次请求**: 从第三方 API 拉取全量商品数据，预计算元数据后写入缓存
- **缓存命中**: 直接返回内存数据，零网络开销
- **缓存失效**: 过期后自动静默刷新
- **隔离性**: 以 appId / apiUser / token 作为 identityKey，防止不同配置冲突

如需手动清除缓存，可调用对应模块的 `MemoryCache.invalidate()` 方法。

## SEO 优化

- **每页独立 Metadata**: title、description、keywords、canonical URL
- **结构化数据**: 根布局注入 Organization JSON-LD
- **Sitemap**: 自动生成为搜索引擎提供全站索引
- **Robots**: 允许全站索引，禁止 `/api/` 目录
- **Open Graph**: 支持社交分享卡片
- **PWA**: apple-web-app 配置

## 开发规范

详见项目根目录 `.codebuddy/rules/nextcard.mdc`，核心要点：

- **注释强制**: 文件头部、组件上方、复杂函数必须添加中文注释
- **函数声明**: 全部使用 `function ComponentName()` 形式
- **类型导入**: 使用 `import type` 语法
- **className**: 使用 `cn()` 合并，root 元素支持外部覆盖
- **图标**: 仅使用 `lucide-react`，禁止 emoji
- **布局**: 使用 `lib/layout.ts` 的 `SITE_WIDTH_STYLE` + `containerClass()`

## 许可证

MIT
