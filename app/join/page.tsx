/**
 * 代理加盟页面
 *
 * 展示代理加盟政策、优势、流程及在线申请表单。
 * 纯客户端交互组件，由 JoinContent 接管。
 */
import JoinContent from "@/app/join/JoinContent";

export const metadata = {
  title: "流量卡代理加盟 | 大流量卡分销平台 — 号卡之家",
  description:
    "号卡之家代理加盟计划 — 零门槛、高佣金、全支持。加入流量卡代理，轻松开启副业增收之路。",
  keywords: [
    "流量卡代理",
    "流量卡分销",
    "流量卡",
    "大流量卡",
    "代理加盟",
    "流量卡代理平台",
    "流量卡佣金",
    "号卡之家",
  ],
  alternates: {
    canonical: "/join",
  },
};

export default function JoinPage() {
  return <JoinContent />;
}
