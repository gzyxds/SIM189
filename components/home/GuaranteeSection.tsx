import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import {
  ShieldCheck,
  Users,
  MapPin,
  Phone,
  BadgeCheck,
} from "lucide-react";

/** 服务保障区域组件 */
export default function GuaranteeSection() {
  const items = [
    {
      icon: ShieldCheck,
      title: "官方授权",
      desc: "所有号卡均来自四大运营商官方渠道，可在官方APP查询套餐详情。",
    },
    {
      icon: Users,
      title: "真实用户",
      desc: "严格实名认证，一证五号政策合规办理，保障通信安全。",
    },
    {
      icon: MapPin,
      title: "全国覆盖",
      desc: "支持全国大部分地区发货，偏远地区请以实际下单页提示为准。",
    },
    {
      icon: Phone,
      title: "售后无忧",
      desc: "提供专属客服服务，用卡过程中遇到问题可随时咨询解决。",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/30 via-white to-white">
      {/* ===== 装饰光晕 ===== */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl"
      />

      <div className={containerClass("relative py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        {/* ===== 标题区 ===== */}
        <div className="mb-12 text-center md:mb-14">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
            <BadgeCheck className="size-4" />
            服务承诺
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            流量卡用户
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}权益保障
            </span>
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            您的每一分钱都花得明明白白，每一张卡都用得安安心心
          </p>
        </div>

        {/* ===== 保障卡片 移动端2列×2行 / 桌面端4列 ===== */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="group flex flex-col items-center rounded-md border border-blue-100/60 bg-gradient-to-b from-white to-blue-50/20 p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md sm:p-6 md:p-7"
            >
              {/* 图标容器 */}
              <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-gradient-to-br from-blue-50 to-indigo-50 transition-transform duration-300 group-hover:scale-110">
                <item.icon className="size-6 text-blue-600" />
              </div>
              {/* 标题与描述 */}
              <h3 className="mb-2 text-base font-semibold sm:text-lg">{item.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
