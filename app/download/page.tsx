/**
 * 172号卡 APP 下载推广页面
 *
 * 展示 172号卡移动应用的下载入口、功能介绍、界面截图。
 * 纯客户端交互组件，由 DownloadContent 接管所有渲染逻辑。
 * 数据来源：172号卡 App Store / 应用宝官方页面。
 */
import DownloadContent from "./DownloadContent";

export const metadata = {
    title: "下载172号卡APP | 手机大流量卡在线办理 — 号卡之家",
    description:
        "下载172号卡APP，体验运营商直签大流量卡办理、订单管理、高激活率快速提现等核心功能。支持 iOS 与 Android 双平台。",
    keywords: [
        "172号卡",
        "下载APP",
        "流量卡",
        "大流量卡",
        "号卡办理",
        "流量卡办理",
    ],
    alternates: {
        canonical: "/download",
    },
};

/** 172号卡 APP 下载页面入口 */
export default function DownloadPage() {
    return <DownloadContent />;
}
