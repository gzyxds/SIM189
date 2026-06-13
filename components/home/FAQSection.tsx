"use client";

/**
 * 常见问题区域组件（FAQSection）
 *
 * 左右双栏布局，移动端 FAQ 列表优先显示：
 * - 移动端：FAQ 折叠面板在上 → 分类筛选 + 联系引导在下
 * - 桌面端：左栏分类筛选 + 联系引导（300/340px）| 右栏 FAQ 列表（弹性填充）
 * - 联系卡片移动端横向双按钮，节省纵向空间
 * - 全局圆角统一 rounded-md，视觉柔和
 */
import { useState, useMemo } from "react";
import {
  HelpCircle,
  ChevronDown,
  Smartphone,
  CreditCard,
  ShieldCheck,
  MessageCircle,
  Phone,
  Search,
  Sparkles,
} from "lucide-react";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";

/* ========== FAQ 数据 ========== */

interface FaqItem {
  q: string;
  a: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: "号卡产品",
    q: "流量卡是正规手机卡吗？",
    a: "是的，我们提供的均为四大运营商（移动/联通/电信/广电）官方发行的正规 11 位手机号码卡。支持打电话、发短信、开热点，可在运营商官方 APP 查询套餐余量和在线充值，与营业厅办理的卡没有任何区别。",
  },
  {
    category: "号卡产品",
    q: "流量是全国通用的吗？限不限制 APP？",
    a: "套餐内的通用流量可在全国范围内（不含港澳台）使用，不限地区、不限 APP、不限速。定向流量则在指定主流 APP（如抖音、腾讯视频等）范围内使用。具体请以套餐详情页说明为准。",
  },
  {
    category: "号卡产品",
    q: "为什么你们的套餐比营业厅便宜这么多？",
    a: "这些套餐是运营商为互联网渠道推出的专属优惠号卡，通过线上办理可节省线下门店租金和人力成本，因此资费更具竞争力。但号卡本身与营业厅办理的完全一致，享受同样的网络质量和服务保障。",
  },
  {
    category: "号卡产品",
    q: "如何选择适合自己的套餐？",
    a: "建议根据您的日常流量使用量来选择：轻度用户（刷微信、看新闻）可选 30-60G 套餐；中度用户（刷视频、看直播）可选 80-150G 套餐；重度用户（追剧、下载大文件）建议选择 200G 以上套餐。您也可以联系在线客服，我们会根据您的使用习惯推荐最合适的套餐。",
  },
  {
    category: "订购激活",
    q: "下单后多久能收到卡？如何激活？",
    a: "通常下单后 1-3 个工作日内发货，由京东快递或 EMS 配送上门。收到卡后按照随卡附带的激活指南操作即可，支持线上自助激活（上传身份证 + 人脸识别），全程约 3-5 分钟即可完成。",
  },
  {
    category: "订购激活",
    q: "一个人可以办理几张？有年龄限制吗？",
    a: "根据工信部规定，同一身份证在同一运营商下最多可办理 5 张手机卡。年龄要求通常在 16-60 周岁之间（具体以套餐要求为准）。下单前请确认您名下该运营商的办卡额度是否充足。",
  },
  {
    category: "订购激活",
    q: "下单需要哪些资料？信息安全吗？",
    a: "办理号卡需要提供收件人姓名、身份证号、收货地址和联系电话。这些信息仅用于运营商实名制开户，全程加密传输，我们不会将您的个人信息用于任何其他用途。",
  },
  {
    category: "订购激活",
    q: "下单后可以修改收货信息吗？",
    a: "订单提交后，在未发货前可以联系客服修改收货地址和联系电话。一旦订单进入配送环节，将无法修改地址。建议下单时仔细核对收货信息，确保快递能准确送达。",
  },
  {
    category: "售后保障",
    q: "不想用了可以注销吗？有没有违约金？",
    a: "可以。本平台推荐的套餐大多无合约期限制或不低于 6 个月，支持通过运营商官方 APP 或客服热线（10086/10000/10010）随时办理线上注销，无需前往营业厅，不收取任何违约金。",
  },
  {
    category: "售后保障",
    q: "套餐到期后会自动续约吗？资费会变吗？",
    a: "优惠套餐到期后，通常会自动恢复为运营商标准资费。建议在优惠期结束前关注短信提醒，如有需要可联系我们或登录运营商 APP 选择新的优惠套餐继续使用。",
  },
  {
    category: "售后保障",
    q: "收到卡后不满意可以退吗？",
    a: "号卡属于特殊商品，激活后将无法退货。但下单后至签收激活前，您随时可以取消订单或不激活使用。如果您有任何疑问，建议先联系客服确认套餐详情后再激活。",
  },
  {
    category: "售后保障",
    q: "号卡信号不好或网速慢怎么办？",
    a: "首先建议检查手机是否支持该运营商的网络频段，或尝试重启手机、开关飞行模式。如问题持续，可拨打运营商客服热线反馈，运营商将安排技术人员排查基站覆盖情况。若确认是号卡质量问题，可联系我们协助换卡处理。",
  },
];

/* ========== 分类配置 ========== */

const CATEGORY_CONFIG: Record<
  string,
  { icon: typeof HelpCircle; color: string; bg: string; desc: string }
> = {
  号卡产品: {
    icon: Smartphone,
    color: "text-blue-600",
    bg: "bg-blue-50",
    desc: "了解号卡来源与资费优势",
  },
  订购激活: {
    icon: CreditCard,
    color: "text-violet-600",
    bg: "bg-violet-50",
    desc: "下单流程与激活方式",
  },
  售后保障: {
    icon: ShieldCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    desc: "注销、续约及退换政策",
  },
};

const ALL_CATEGORIES = ["全部", ...Object.keys(CATEGORY_CONFIG)];

/* ========== 单个 FAQ 折叠项 ========== */

/**
 * 单条 FAQ 折叠展示组件
 * @param idx - 在当前列表中的序号（用于编号显示）
 * @param faq - FAQ 数据
 * @param isOpen - 是否展开
 * @param onToggle - 点击切换回调
 */
function FaqItem({
  idx,
  faq,
  isOpen,
  onToggle,
}: {
  idx: number;
  faq: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const cfg = CATEGORY_CONFIG[faq.category];

  return (
    <div
      className={`group overflow-hidden rounded-md border transition-all duration-300 ${isOpen
        ? "border-blue-200 bg-gradient-to-br from-blue-50/60 to-white"
        : "border-gray-100 bg-white hover:border-blue-100"
        }`}
    >
      {/* 问题按钮 */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left sm:gap-4 sm:px-5 sm:py-4 md:px-6 md:py-5"
      >
        {/* 序号徽章 */}
        <span
          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm text-xs font-bold transition-all duration-200 ${isOpen
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600"
            }`}
        >
          {idx + 1}
        </span>

        {/* 问题文字 */}
        <span
          className={`flex-1 text-sm font-medium leading-relaxed transition-colors duration-200 md:text-base ${isOpen ? "text-blue-700" : "text-gray-800 group-hover:text-blue-600"
            }`}
        >
          {faq.q}
        </span>

        {/* 展开图标 */}
        <span
          className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${isOpen
            ? "bg-blue-600 text-white rotate-180"
            : "bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600"
            }`}
        >
          <ChevronDown className="size-4" />
        </span>
      </button>

      {/* 答案区域 — CSS grid 过渡实现平滑展开 */}
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 md:px-6 md:pb-6">
            <div className="flex items-start gap-3 rounded bg-white/70 p-4 backdrop-blur-sm">
              {cfg && (
                <div
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded ${cfg.bg}`}
                >
                  <cfg.icon className={`size-4 ${cfg.color}`} />
                </div>
              )}
              <p className="text-sm leading-relaxed text-gray-600">{faq.a}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========== 主组件 ========== */

/** 常见问题区域组件 */
export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<string>("全部");

  /** 按分类筛选后的 FAQ 列表（含原始索引，用于展开状态联动） */
  const filteredFaqs = useMemo(() => {
    if (activeCategory === "全部") return FAQS.map((f, i) => ({ ...f, _idx: i }));
    return FAQS.map((f, i) => ({ ...f, _idx: i })).filter(
      (f) => f.category === activeCategory
    );
  }, [activeCategory]);

  return (
    <section className="relative overflow-hidden bg-[url('/background/background-4.png')] bg-cover bg-center bg-no-repeat">


      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        {/* ===== 顶部标题区 ===== */}
        <div className="mb-12 text-center md:mb-14">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Sparkles className="size-4" />
            常见问题
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            流量卡办理常见问题
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            关于号卡产品、订购激活、售后服务的常见疑问，这里都有答案
          </p>
        </div>

        {/* ===== 分类筛选栏（移动端/平板顶部横排） ===== */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:pb-0 lg:hidden">
          {ALL_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const cfg = CATEGORY_CONFIG[cat];
            const count =
              cat === "全部"
                ? FAQS.length
                : FAQS.filter((f) => f.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenIndex(-1);
                }}
                className={`flex shrink-0 items-center gap-3 rounded-md border px-4 py-1.5 text-left transition-all duration-200 ${isActive
                  ? "border-blue-200 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm"
                  : "border-gray-100 bg-white text-gray-700 hover:border-blue-100 hover:bg-blue-50"
                  }`}
              >
                {/* 图标 */}
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded transition-all ${isActive
                    ? "bg-white/20"
                    : cfg
                      ? cfg.bg
                      : "bg-gray-100"
                    }`}
                >
                  {cfg ? (
                    <cfg.icon
                      className={`size-4 ${isActive ? "text-white" : cfg.color}`}
                    />
                  ) : (
                    <Search
                      className={`size-4 ${isActive ? "text-white" : "text-gray-400"}`}
                    />
                  )}
                </div>

                {/* 文字 + 描述 — 仅 sm 及以上 */}
                <div className="hidden min-w-0 flex-1 sm:block">
                  <p
                    className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-800"}`}
                  >
                    {cat}
                  </p>
                  <p
                    className={`mt-0.5 truncate text-xs ${isActive ? "text-white/80" : "text-gray-400"}`}
                  >
                    {cfg ? cfg.desc : "查看全部问题"}
                  </p>
                </div>

                {/* 数量徽章 — 仅 sm 及以上 */}
                <span
                  className={`ml-auto hidden shrink-0 rounded px-2 py-0.5 text-xs font-bold sm:block ${isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
                    }`}
                >
                  {count}
                </span>

                {/* 移动端仅显示分类名 + 数量 */}
                <span className="text-sm font-medium sm:hidden">{cat}</span>
                <span
                  className={`ml-1 rounded px-1.5 py-0.5 text-xs font-bold sm:hidden ${isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ===== 左右双栏（移动端 FAQ 优先显示） ===== */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[300px_1fr] lg:gap-10 xl:grid-cols-[340px_1fr]">
          {/* ===== 左栏：统计 + 联系引导（移动端置于 FAQ 下方） ===== */}
          <div className="order-2 flex flex-col gap-4 lg:order-none">
            {/* 分类标签 — 仅桌面端左侧竖排 */}
            <div className="hidden flex-col gap-2 lg:flex">
              {ALL_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                const cfg = CATEGORY_CONFIG[cat];
                const count =
                  cat === "全部"
                    ? FAQS.length
                    : FAQS.filter((f) => f.category === cat).length;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat);
                      setOpenIndex(-1);
                    }}
                    className={`flex w-full items-center gap-3 rounded-md border px-4 py-2.5 text-left transition-all duration-200 ${isActive
                      ? "border-blue-200 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm"
                      : "border-gray-100 bg-white text-gray-700 hover:border-blue-100 hover:bg-blue-50"
                      }`}
                  >
                    {/* 图标 */}
                    <div
                      className={`flex size-7 shrink-0 items-center justify-center rounded transition-all ${isActive
                        ? "bg-white/20"
                        : cfg
                          ? cfg.bg
                          : "bg-gray-100"
                        }`}
                    >
                      {cfg ? (
                        <cfg.icon
                          className={`size-4 ${isActive ? "text-white" : cfg.color}`}
                        />
                      ) : (
                        <Search
                          className={`size-4 ${isActive ? "text-white" : "text-gray-400"}`}
                        />
                      )}
                    </div>

                    {/* 文字 + 描述 */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-800"}`}
                      >
                        {cat}
                      </p>
                      <p
                        className={`mt-0.5 truncate text-xs ${isActive ? "text-white/80" : "text-gray-400"}`}
                      >
                        {cfg ? cfg.desc : "查看全部问题"}
                      </p>
                    </div>

                    {/* 数量徽章 */}
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-500"
                        }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 统计信息 */}
            <div className="hidden rounded-md border border-gray-100 bg-white p-4 lg:block">
              <div className="grid grid-cols-3 gap-2 text-center">
                {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => (
                  <div key={cat} className="rounded bg-gray-50 p-3">
                    <div
                      className={`mx-auto mb-1.5 flex size-8 items-center justify-center rounded ${cfg.bg}`}
                    >
                      <cfg.icon className={`size-4 ${cfg.color}`} />
                    </div>
                    <p className="text-lg font-bold text-gray-800">
                      {FAQS.filter((f) => f.category === cat).length}
                    </p>
                    <p className="text-xs text-gray-400">{cat}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 联系引导卡片 */}
            <div className="overflow-hidden rounded-md border border-blue-100 bg-gradient-to-br from-blue-600 to-blue-700 p-4 sm:p-5">
              <div className="mb-1 flex items-center gap-2">
                <HelpCircle className="size-4 text-blue-200" />
                <p className="text-sm font-semibold text-white">没有找到答案？</p>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-blue-100">
                我们的客服团队随时为您提供一对一专属帮助
              </p>
              <div className="flex flex-row gap-2 sm:flex-col">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-customer-modal"))}
                  className="flex flex-1 items-center justify-center gap-2 rounded bg-white px-3 py-2 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-50 sm:flex-none sm:px-4 sm:py-2.5"
                >
                  <MessageCircle className="size-4" />
                  <span className="sm:hidden">在线咨询</span>
                  <span className="hidden sm:inline">在线咨询客服</span>
                </button>
                <a
                  href="tel:400-xxx-xxxx"
                  className="flex flex-1 items-center justify-center gap-2 rounded border border-blue-400/40 bg-blue-500/30 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-blue-500/50 sm:flex-none sm:px-4 sm:py-2.5"
                >
                  <Phone className="size-4" />
                  <span className="sm:hidden">电话咨询</span>
                  <span className="hidden sm:inline">拨打客服热线</span>
                </a>
              </div>
            </div>
          </div>

          {/* ===== 右栏：FAQ 折叠面板列表（移动端优先显示） ===== */}
          <div className="order-1 min-w-0 lg:order-none">
            {/* 当前分类标题 */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                共{" "}
                <span className="font-bold text-blue-600">
                  {filteredFaqs.length}
                </span>{" "}
                个问题
                {activeCategory !== "全部" && (
                  <span className="ml-1 text-gray-400">· {activeCategory}</span>
                )}
              </p>
              {activeCategory !== "全部" && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("全部");
                    setOpenIndex(-1);
                  }}
                  className="text-xs text-blue-500 hover:text-blue-600 hover:underline"
                >
                  查看全部
                </button>
              )}
            </div>

            {/* FAQ 列表 */}
            <div className="space-y-2.5 sm:space-y-3">
              {filteredFaqs.map((faq, localIdx) => (
                <FaqItem
                  key={faq._idx}
                  idx={localIdx}
                  faq={faq}
                  isOpen={openIndex === faq._idx}
                  onToggle={() =>
                    setOpenIndex(openIndex === faq._idx ? -1 : faq._idx)
                  }
                />
              ))}
            </div>

            {/* 空状态 */}
            {filteredFaqs.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 py-16">
                <Search className="mb-3 size-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">
                  暂无相关问题
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </section>
  );
}
