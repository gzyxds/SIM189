/**
 * 首页合作伙伴 Logo 展示组件（CooperateSection）
 *
 * 展示号卡之家核心合作伙伴品牌 Logo，包括运营商与物流伙伴。
 * Logo 来源：/public/cooperate/ 目录下的品牌图片。
 * 可复用于首页底部及合作伙伴独立页面。
 */
"use client";

import Image from "next/image";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import { Building2 } from "lucide-react";

/* ========== 合作伙伴数据 ========== */

/**
 * 核心合作伙伴品牌数据
 * logo 为 /public/cooperate/ 目录下文件名（不含 .webp）
 */
const CORE_PARTNERS = [
  {
    logo: "中国移动",
    desc: "全球最大移动通信运营商，号卡资源最丰富",
    category: "运营商",
  },
  {
    logo: "中国联通",
    desc: "覆盖全国的优质通信网络，资费灵活多样",
    category: "运营商",
  },
  {
    logo: "中国电信",
    desc: "宽带与移动业务双优，网络信号稳定可靠",
    category: "运营商",
  },
  {
    logo: "中国广电",
    desc: "新兴第四大运营商，700MHz 黄金频段覆盖广",
    category: "运营商",
  },
  {
    logo: "京东物流",
    desc: "全国仓配一体，号卡订单极速配送到家",
    category: "物流伙伴",
  },
  {
    logo: "顺丰速运",
    desc: "高品质快递服务，保障号卡安全准时送达",
    category: "物流伙伴",
  },
];

/** 首页合作伙伴 Logo 展示组件 */
export default function CooperateSection() {
  /** 按分类分组 */
  const carriers = CORE_PARTNERS.filter((p) => p.category === "运营商");
  const logistics = CORE_PARTNERS.filter((p) => p.category === "物流伙伴");

  return (
    <section id="partners" className="bg-white">
      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        <div className="mb-12 text-center md:mb-14">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Building2 className="size-4" />
            核心伙伴
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            合作伙伴生态
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            与行业头部品牌深度合作，构建号卡供应链全链路服务体系
          </p>
        </div>

        {/* ===== 运营商 ===== */}
        <div className="mb-12">
          <div className="mb-6 flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-blue-600" />
            <h3 className="text-lg font-semibold text-foreground">通信运营商</h3>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {carriers.map((partner) => (
              <div
                key={partner.logo}
                className="group flex flex-col items-center rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Logo 图片 */}
                <div className="relative mb-4 flex h-20 w-full items-center justify-center">
                  <Image
                    src={`/cooperate/${partner.logo}.webp`}
                    alt={partner.logo}
                    width={160}
                    height={80}
                    className="max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  {partner.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 物流伙伴 ===== */}
        <div>
          <div className="mb-6 flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-emerald-600" />
            <h3 className="text-lg font-semibold text-foreground">物流配送伙伴</h3>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
            {logistics.map((partner) => (
              <div
                key={partner.logo}
                className="group flex flex-col items-center rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative mb-4 flex h-20 w-full items-center justify-center">
                  <Image
                    src={`/cooperate/${partner.logo}.webp`}
                    alt={partner.logo}
                    width={160}
                    height={80}
                    className="max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  {partner.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
