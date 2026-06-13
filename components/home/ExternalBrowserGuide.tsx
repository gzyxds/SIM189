/**
 * 外部浏览器引导组件（ExternalBrowserGuide）
 *
 * 检测用户是否在微信或 QQ 内置浏览器中访问，
 * 若是，则显示全屏遮罩引导用户使用系统浏览器打开。
 *
 * 设计参考：浅色简约风格 + 蓝紫渐变品牌色
 * iOS 微信/QQ 内置浏览器无法以编程方式唤起系统浏览器，
 * 因此只展示引导界面 + 复制链接按钮。
 *
 * 使用方式：
 *   <ExternalBrowserGuide />
 *
 * Debug 开关：URL 带 ?debug_browser=1 时强制显示引导层（用于开发调试）
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

/* ========== 组件 Props ========== */

/** ExternalBrowserGuide 组件属性 */
interface ExternalBrowserGuideProps {
  /** 复制链接的目标地址，默认当前页面 URL */
  target?: string;
  /** 额外的 CSS 类名 */
  className?: string;
}

/** 获取当前页面完整 URL（兼容 SSR） */
function getCurrentUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

/** 检测是否为微信内置浏览器 */
function isWeixinBrowser(ua: string): boolean {
  return /micromessenger/i.test(ua);
}

/** 检测是否为 QQ 内置浏览器 */
function isQQBrowser(ua: string): boolean {
  return /qq\//i.test(ua) || /mqqbrowser/i.test(ua);
}

/** 检测是否处于 Debug 模式（URL 参数 ?debug_browser=1） */
function isDebugMode(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("debug_browser") === "1";
}

/**
 * 浮动动画样式注入子组件
 *
 * 通过 useEffect 将 @keyframes 注入到 document.head，
 * 使用 ref 标记确保全局仅注入一次，避免重复。
 */
function ExternalBrowserFloatStyle() {
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current || typeof document === "undefined") return;
    injected.current = true;

    const styleEl = document.createElement("style");
    styleEl.id = "external-browser-float-keyframes";
    styleEl.textContent = `
      @keyframes externalBrowserFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      // 组件卸载时移除样式（可选，保持洁净）
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
        injected.current = false;
      }
    };
  }, []);

  return null;
}

/** 兼容旧浏览器的复制方案（fallback） */
function fallbackCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let success = false;
  try {
    success = document.execCommand("copy");
  } catch {
    // fail silently
  }
  document.body.removeChild(textarea);
  return success;
}

/**
 * 外部浏览器引导组件
 *
 * 在微信/QQ 内置浏览器中显示全屏引导遮罩，
 * 引导用户复制链接并在系统浏览器中打开。
 */
export default function ExternalBrowserGuide({
  target,
  className,
}: ExternalBrowserGuideProps) {
  const targetUrl = target || getCurrentUrl();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ===== 环境检测：仅在客户端挂载后执行，确保 SSR/CSR 初始状态一致，避免 hydration mismatch ===== */
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const inAppBrowser = isWeixinBrowser(ua) || isQQBrowser(ua);

    if (isDebugMode() || inAppBrowser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 必须在客户端挂载后检测环境，SSR 阶段无 navigator 可用
      setVisible(true);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /* ===== 复制链接到剪贴板 ===== */
  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(targetUrl);
      } else {
        fallbackCopy(targetUrl);
      }
    } catch {
      fallbackCopy(targetUrl);
    }

    setCopied(true);

    // 2.5 秒后恢复按钮状态
    copyTimerRef.current = setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  /* ===== 清理定时器 ===== */
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col overflow-hidden",
        className,
      )}
      style={{
        background:
          "linear-gradient(180deg, var(--background) 0%, oklch(0.97 0.01 265) 100%)",
      }}
    >
      {/* ===== 装饰光晕（品牌色） ===== */}
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, oklch(0.62 0.22 260 / 0.18) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, oklch(0.52 0.20 290 / 0.14) 0%, transparent 70%)",
        }}
      />

      {/* ===== 引导内容区 ===== */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-7 pb-6 pt-16 text-center">
        {/* 图标容器：蓝紫渐变圆底 + 浮动动画 */}
        <div
          className="mb-7 flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            boxShadow: "0 8px 32px rgba(59, 130, 246, 0.35)",
          }}
        >
          <Globe
            className="h-10 w-10 text-white"
            style={{ animation: "externalBrowserFloat 1.8s ease-in-out infinite" }}
          />
        </div>

        {/* 标题 */}
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">
          请使用浏览器打开
        </h2>

        {/* 操作指引卡片 */}
        <div
          className="mb-7 w-full max-w-sm rounded-2xl bg-card p-5 text-center"
          style={{
            boxShadow:
              "0 1px 3px rgba(15,23,42,0.05), 0 1px 2px rgba(15,23,42,0.03)",
          }}
        >
          <p className="text-[15px] leading-7 text-muted-foreground">
            当前页面在{" "}
            <span className="font-medium text-green-600">微信</span>
            /
            <span className="font-medium text-blue-600">QQ</span>{" "}
            内打开可能会影响正常办理
          </p>
          <div className="mx-4 mt-3 mb-3 h-px bg-border" />
          <p className="text-[15px] leading-7 text-muted-foreground">
            请点击右上角{" "}
            <span className="font-semibold text-yellow-500">···</span>，选择
            <span className="font-semibold text-yellow-500">
              &quot;在浏览器中打开&quot;
            </span>
          </p>
        </div>

        {/* 复制链接按钮 */}
        <button
          onClick={handleCopy}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5",
            "text-[15px] font-medium text-white transition active:scale-95",
            copied
              ? "shadow-[0_4px_14px_rgba(16,185,129,0.4)]"
              : "shadow-[0_6px_20px_rgba(59,130,246,0.35)]",
          )}
          style={{
            background: copied
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
          }}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span>已复制，请粘贴到浏览器打开</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>复制链接到浏览器打开</span>
            </>
          )}
        </button>
      </div>

      {/* ===== 底部提示 ===== */}
      <div className="relative z-10 px-5 pb-6 text-center text-xs text-muted-foreground/60">
        也可以点击右上角 ··· 手动选择浏览器打开
      </div>

      {/* ===== 浮动动画关键帧（注入全局样式，仅一次） ===== */}
      <ExternalBrowserFloatStyle />
    </div>
  );
}
