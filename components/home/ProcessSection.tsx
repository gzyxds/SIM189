import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import {
  Smartphone,
  ScrollText,
  Package,
  Zap,
  Clock,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";

/** 办理流程区域组件 */
export default function ProcessSection() {
  const steps = [
    {
      num: "01",
      title: "在线选卡",
      desc: "浏览对比不同套餐，选择最符合您需求的流量卡。",
      icon: Smartphone,
    },
    {
      num: "02",
      title: "提交申请",
      desc: "填写实名信息并下单，全程加密保护您的隐私安全。",
      icon: ScrollText,
    },
    {
      num: "03",
      title: "快递送达",
      desc: "京东/EMS包邮到家，1-3个工作日内即可收到号卡。",
      icon: Package,
    },
    {
      num: "04",
      title: "自主激活",
      desc: "按说明书指引在线激活，充值后即可畅享高速流量。",
      icon: Zap,
    },
  ];

  return (
    <section id="process" className="relative overflow-hidden bg-[url('/background/background-6.png')] bg-cover bg-center bg-no-repeat">


      <div className={containerClass("relative py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        {/* ===== 标题区 ===== */}
        <div className="mb-12 text-center md:mb-14">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
            <ClipboardCheck className="size-4" />
            办理流程
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            四步轻松办理
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}大流量卡
            </span>
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            全程线上办理，无需线下排队，平均3天即可用上新卡
          </p>
        </div>

        {/* ===== 步骤卡片区 移动端2列×2行 / 桌面端4列 ===== */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {steps.map((step, idx) => (
            <div key={step.num} className="relative">
              <div className="group flex flex-col items-center rounded-md border border-blue-100/60 bg-gradient-to-b from-white to-blue-50/20 p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md sm:p-6">
                {/* 图标容器 */}
                <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-gradient-to-br from-blue-50 to-indigo-50 transition-transform duration-300 group-hover:scale-110">
                  <step.icon className="size-6 text-blue-600" />
                </div>
                {/* 步骤编号 */}
                <span className="mb-2 rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-700">
                  步骤 {step.num}
                </span>
                <h3 className="mb-1 text-base font-semibold sm:text-lg">{step.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {step.desc}
                </p>
              </div>

              {/* 步骤间连接线（仅桌面端4列模式可见，跨越gap居中） */}
              {idx < steps.length - 1 && (
                <div className="absolute top-1/2 left-full hidden h-px w-5 -translate-y-1/2 border-t-2 border-dashed border-blue-300 lg:block" />
              )}
            </div>
          ))}
        </div>

        {/* ===== 底部完成提示 ===== */}
        <div className="mt-12 sm:mt-14">
          <div className="flex flex-col items-center gap-5 rounded-md border border-blue-100/60 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/30 p-6 text-center shadow-sm sm:flex-row sm:text-left sm:p-8 md:p-10">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-100 to-indigo-100">
              <Clock className="size-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">平均 3 天即可用上新卡</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                从在线选卡到自主激活，全程线上完成。无需线下排队、无需复杂手续，
                京东/EMS 极速配送，让您足不出户畅享高速流量。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

