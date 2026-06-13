/**
 * 合作伙伴页面
 *
 * 展示号卡之家生态合作伙伴品牌 Logo，彰显平台实力与资源整合能力。
 * 纯客户端交互组件，由 CooperateContent 接管。
 */
import CooperateContent from "./CooperateContent";

export const metadata = {
  title: "合作伙伴 | 流量卡代理加盟平台 — 号卡之家",
  description:
    "号卡之家合作伙伴生态 — 与四大运营商、京东物流、顺丰速运等一线品牌深度合作，共建大流量卡行业领先平台。",
  keywords: [
    "号卡之家",
    "流量卡",
    "大流量卡",
    "流量卡代理",
    "合作伙伴",
    "运营商授权",
  ],
  alternates: {
    canonical: "/cooperate",
  },
};

export default function CooperatePage() {
  return <CooperateContent />;
}
