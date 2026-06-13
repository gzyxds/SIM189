/**
 * 聚推客联盟 CPS 生活优惠页面
 *
 * 聚合美团、饿了么、出行、连锁餐饮、电影、生活服务、电商等多品类优惠活动。
 * 数据来源：聚推客联盟 /union/act_list + /union/act
 */
import { fetchAllActivities, type JutuikeActivity } from "@/lib/api/jutuike";
import CpsContent from "./CpsContent";

export const metadata = {
    title: "生活优惠 | 外卖红包/打车券/电影票/电商返利 — 号卡之家CPS联盟",
    description:
        "聚合美团外卖红包、饿了么优惠券、打车出行折扣、连锁餐饮折扣、电影票优惠、生活服务福利、电商返利等一站式生活优惠，省钱又省心",
    keywords: [
        "生活优惠",
        "外卖红包",
        "美团红包",
        "饿了么优惠券",
        "打车券",
        "电影票优惠",
        "电商返利",
        "本地生活",
        "连锁餐饮折扣",
        "流量卡",
    ],
    alternates: {
        canonical: "/cps",
    },
};

export default async function CpsPage() {
    let activities: JutuikeActivity[] = [];
    let error: string | null = null;

    try {
        activities = await fetchAllActivities();
    } catch (e) {
        error = e instanceof Error ? e.message : "获取优惠活动失败";
        console.error("[CpsPage]", error);
    }

    /* ===== 按用户需求预分组，传客户端直接渲染 ===== */
    const targetCategories = ["美团", "饿了么", "打车出行", "连锁餐饮", "电影票", "本地生活", "电商"];

    return (
        <CpsContent
            activities={activities}
            targetCategories={targetCategories}
            error={error}
        />
    );
}
