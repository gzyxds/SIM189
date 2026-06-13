/**
 * 返回顶部浮动按钮（ScrollToTopButton）
 *
 * 固定在页面右下角，当用户向下滚动超过阈值时显示，
 * 点击后平滑滚动回页面顶部。
 * 兼容移动端浏览器（微信内置浏览器 / iOS Safari / Android Chrome）。
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowUp } from "lucide-react";

/** 桌面端显示按钮的滚动阈值（像素） */
const DESKTOP_THRESHOLD = 300;
/** 移动端显示按钮的滚动阈值（像素），更小以适应短屏 */
const MOBILE_THRESHOLD = 120;

/** 获取当前滚动位置（兼容多种浏览器） */
function getScrollTop(): number {
  if (typeof window === "undefined") return 0;
  return (
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

/** 判断是否为移动端 */
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

/** 返回顶部的浮动按钮 */
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  /* ===== 滚动监听 ===== */
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const threshold = isMobileDevice() ? MOBILE_THRESHOLD : DESKTOP_THRESHOLD;
      setVisible(getScrollTop() > threshold);
    });
  }, []);

  useEffect(() => {
    // 初始检测
    handleScroll();

    // 同时监听 window 和 document 滚动事件，确保移动端兼容
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });

    // 窗口大小改变时重新计算
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll]);

  /* ===== 滚动到顶部 ===== */
  const scrollToTop = useCallback(() => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // 降级：不支持 smooth 的浏览器
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="返回顶部"
      className={`fixed right-4 z-[100] inline-flex size-10 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 hover:shadow-xl active:scale-95 sm:right-6 sm:size-11 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
      style={{
        bottom: `calc(1.5rem + env(safe-area-inset-bottom, 0px))`,
        backgroundColor: "rgba(37, 99, 235, 0.92)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <ArrowUp className="size-4 sm:size-5" />
    </button>
  );
}
