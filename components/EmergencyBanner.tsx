/**
 * 顶部紧急通知横幅组件
 *
 * 参考设计：Banners.astro
 * 支持关闭（渐隐动画）、移动端单行横向滚动。
 */
"use client";

import { useState, useCallback } from "react";
import { X, Bell } from "lucide-react";

interface EmergencyBannerProps {
    /** 通知文字内容 */
    message?: string;
    /** 紧急标签文字，默认"紧急" */
    badge?: string;
}

/**
 * 紧急通知横幅
 *
 * 固定顶部显示，带渐变蓝色背景、红底白字紧急标签、关闭按钮。
 * 关闭时执行 300ms 渐隐动画后移除 DOM。
 */
export default function EmergencyBanner({
    message = "紧急通知：大流量卡即将下架！超大流量权益全部同步取消，刚需流量党、追剧达人、网课上班族、流量大户，务必抓住最后窗口期",
    badge = "紧急",
}: EmergencyBannerProps) {
    const [visible, setVisible] = useState(true);
    const [closing, setClosing] = useState(false);

    /** 关闭横幅：先渐隐再移除 */
    const handleClose = useCallback(() => {
        setClosing(true);
        setTimeout(() => setVisible(false), 300);
    }, []);

    if (!visible) return null;

    return (
        <div
            className={`flex items-center overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-3 py-2 transition-all duration-300 ease-out sm:px-6 sm:py-2.5 ${
                closing ? "max-h-0 py-0 opacity-0" : "max-h-12 opacity-100"
            }`}
        >
            {/* 通知内容区：单行，窄屏横向滚动（隐藏滚动条） */}
            <div className="min-w-0 flex-1 overflow-x-auto sm:flex sm:justify-center [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <p className="flex items-center gap-2 whitespace-nowrap pr-2 text-sm font-medium text-white">
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                        <Bell className="h-3 w-3" />
                        {badge}
                    </span>
                    <span className="shrink-0">{message}</span>
                </p>
            </div>

            {/* 关闭按钮：固定右侧 */}
            <button
                type="button"
                onClick={handleClose}
                className="-mr-1.5 shrink-0 rounded-md p-1.5 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label="关闭通知"
            >
                <X className="size-4 text-white/80 hover:text-white" />
            </button>
        </div>
    );
}
