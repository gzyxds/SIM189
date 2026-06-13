/**
 * FAQ 常见问题页面 — 服务端入口
 *
 * 提供号卡办理相关的常见问题解答，包含套餐问题、物流相关、支付问题、
 * 其他问题四大分类，支持关键词搜索和热门问题快速定位。
 * 数据来源：雅朋科技 H5 客服页面
 */
import type { Metadata } from "next";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import FaqContent from "./FaqContent";

/** FAQ 页面 SEO 元数据 */
export const metadata: Metadata = {
    title: "常见问题",
    description:
        "号卡之家常见问题解答 — 涵盖流量卡套餐、物流配送、支付充值、实名认证等常见疑问，帮助您快速了解和办理正规手机流量卡。",
    keywords: [
        "流量卡",
        "常见问题",
        "流量卡FAQ",
        "流量卡办理问题",
        "号卡问题解答",
        "流量卡套餐咨询",
        "号卡物流查询",
        "流量卡激活",
    ],
    alternates: {
        canonical: "/faq",
    },
    openGraph: {
        title: "常见问题 | 号卡之家",
        description:
            "号卡之家常见问题解答 — 涵盖流量卡套餐、物流配送、支付充值、实名认证等常见疑问。",
        type: "website",
    },
};

/** FAQ 常见问题页面入口组件 */
export default function FaqPage() {
    return (
        <div className="flex min-h-svh flex-col">
            <Header />
            {/* ===== JSON-LD 结构化数据 — FAQPage Schema ===== */}
            <script
                type="application/ld+json"
                // eslint-disable-next-line react/no-dangerously-set-innerhtml
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: [
                            {
                                "@type": "Question",
                                name: "次月返佣金结算规则",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "次月返费根据运营商账单周期结算，通常在每月15-20日统一发放至您的账户。",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "为什么没有收到返费？",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "联通查返费：登录联通APP，点击服务，缴费记录。电信查返费：通过电信APP，搜索全网充值记录。",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "为什么第一个月扣话费了？",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "首月我们会赠送给您30元/40元话费体验金用于抵扣月租，对您来说是免月租体验的。",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "下单后多久能收到卡？发什么快递？",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "审核通过后24小时内发货，默认京东/顺丰，偏远地区发邮政，1-3天送达。",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "这是正规手机卡吗？和物联网卡有什么区别？",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "是的，我们提供的均为四大运营商官方发行的正规11位手机号码卡，支持打电话、发短信、开热点。",
                                },
                            },
                        ],
                    }),
                }}
            />
            <main className="flex-1">
                <FaqContent />
            </main>
            <Footer />
        </div>
    );
}
