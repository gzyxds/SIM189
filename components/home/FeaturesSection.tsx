import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import {
  Wifi,
  Globe,
  CreditCard,
  ShieldCheck,
  Package,
  Headphones,
  Zap,
} from "lucide-react";

/** 核心优势区域组件 */
export default function FeaturesSection() {
  const features = [
    {
      icon: Wifi,
      title: "5G高速网络",
      desc: "支持5G/4G双模，峰值速率可达500Mbps，刷视频、玩游戏、看直播都不卡顿。",
    },
    {
      icon: Globe,
      title: "全国通用流量",
      desc: "流量全国通用，不限地区、不限APP，出差旅行、回家过年都能畅快使用。",
    },
    {
      icon: CreditCard,
      title: "低月租无套路",
      desc: "月租透明，无隐形消费，无强制捆绑业务。套餐内容官方APP随时可查。",
    },
    {
      icon: ShieldCheck,
      title: "官方正规号卡",
      desc: "四大运营商官方授权，11位正规手机号，可接打电话收发短信。",
    },
    {
      icon: Package,
      title: "全国包邮到家",
      desc: "在线下单后京东/EMS快递配送，1-3天送达。自主激活，无需排队等待。",
    },
    {
      icon: Headphones,
      title: "专属客服支持",
      desc: "7×12小时在线客服，从选卡、下单到激活使用，全程一对一指导服务。",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[url('/background/background-10.png')] bg-cover bg-center bg-no-repeat">

      <div className={containerClass("relative py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        {/* ===== 标题区 ===== */}
        <div className="mb-12 text-center md:mb-14">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Zap className="size-4" />
            核心优势
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            为什么推荐
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}号卡之家大流量卡
            </span>
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            聚焦用户真实需求，打造省心、省钱、省力的流量解决方案
          </p>
        </div>

        {/* ===== 优势卡片 移动端2列 / 桌面端3列 ===== */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group flex flex-col items-center rounded-md border border-blue-100/60 bg-gradient-to-b from-white to-blue-50/20 p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md sm:p-6 md:p-7"
            >
              {/* 图标容器 */}
              <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-gradient-to-br from-blue-50 to-indigo-50 transition-transform duration-300 group-hover:scale-110">
                <f.icon className="size-6 text-blue-600" />
              </div>
              {/* 标题与描述 */}
              <h3 className="mb-2 text-base font-semibold sm:text-lg">{f.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
