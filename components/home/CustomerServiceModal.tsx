/**
 * 客服弹出组件（CustomerServiceModal）
 *
 * 参考 Modalwith.astro 设计，提供联系客服的弹窗功能：
 * - 顶部公告条：引导用户联系客服 / 关注公众号
 * - 双栏二维码：微信客服 + 微信公众号
 * - 自动弹出：页面加载 20 秒后自动显示
 * - 关闭方式：ESC 键 / 点击遮罩 / 点击关闭按钮
 * - 缩放动画：打开时 scale-95 → scale-100，关闭时反向
 *
 * 使用方式：
 * ```tsx
 * const modalRef = useRef<CustomerServiceModalHandle>(null);
 * <button onClick={() => modalRef.current?.open()}>联系客服</button>
 * <CustomerServiceModal ref={modalRef} />
 * ```
 */
"use client";

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { X } from "lucide-react";

/* ========== 导出 handle 类型 ========== */

/** 暴露给父组件的命令式方法 */
export interface CustomerServiceModalHandle {
  open: () => void;
  close: () => void;
}

/* ========== Props ========== */

interface CustomerServiceModalProps {
  /** 微信客服二维码图片路径 */
  wxQrSrc?: string;
  /** 微信公众号二维码图片路径 */
  publicQrSrc?: string;
  /** 自动弹出延迟（毫秒），默认 20000 */
  autoOpenDelay?: number;
  /** 客服联系链接 */
  contactHref?: string;
  /** 公众号链接 */
  publicHref?: string;
}

/* ========== 组件 ========== */

/** 客服弹窗组件（forwardRef 暴露 open/close 方法） */
const CustomerServiceModal = forwardRef<CustomerServiceModalHandle, CustomerServiceModalProps>(
  function CustomerServiceModal(
    {
      wxQrSrc = "/wx.png",
      publicQrSrc = "/weixin.png",
      autoOpenDelay = 20000,
      contactHref = "/contact",
      publicHref = "#",
    },
    ref,
  ) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const hasAutoOpened = useRef(false);

    /* ===== 打开弹窗 ===== */
    const open = useCallback(() => {
      setIsOpen(true);
      // 延迟触发缩放动画（让 display 先生效）
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
      document.body.style.overflow = "hidden";
    }, []);

    /* ===== 关闭弹窗 ===== */
    const close = useCallback(() => {
      setIsAnimating(false);
      // 等待缩放动画结束后再隐藏
      setTimeout(() => {
        setIsOpen(false);
        document.body.style.overflow = "";
      }, 200);
    }, []);

    /* ===== 暴露命令式方法给父组件 ===== */
    useImperativeHandle(ref, () => ({ open, close }), [open, close]);

    /* ===== 自动弹出（延迟 autoOpenDelay 毫秒） ===== */
    useEffect(() => {
      if (hasAutoOpened.current) return;
      const timer = setTimeout(() => {
        hasAutoOpened.current = true;
        open();
      }, autoOpenDelay);
      return () => clearTimeout(timer);
    }, [autoOpenDelay, open]);

    /* ===== ESC 键关闭 ===== */
    useEffect(() => {
      if (!isOpen) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") close();
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, close]);

    /* ===== 清理 body 样式 ===== */
    useEffect(() => {
      return () => {
        document.body.style.overflow = "";
      };
    }, []);

    if (!isOpen) return null;

    return (
      /* ===== 遮罩层 ===== */
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-3 py-4 sm:px-4 sm:py-5"
        onClick={(e) => {
          // 点击遮罩关闭
          if (e.target === overlayRef.current) close();
        }}
      >
        {/* ===== 弹窗内容 ===== */}
        <div
          ref={contentRef}
          className={`relative w-full max-w-[600px] max-h-[92vh] overflow-y-auto rounded-lg bg-white shadow-xl transition-all duration-300 ${isAnimating ? "scale-100" : "scale-95"
            } dark:bg-gray-800`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ===== 顶部公告条 ===== */}
          <div className="flex items-start justify-between gap-2 bg-blue-50 px-4 py-3 sm:px-5 dark:bg-blue-900/30">
            <div className="flex flex-wrap items-center gap-x-1 text-xs leading-relaxed sm:text-sm">
              <span className="mr-1 inline-flex items-center shrink-0">
                <span className="mr-1.5 size-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-gray-600 dark:text-gray-300">公告：</span>
              </span>
              <a
                href={contactHref}
                className="font-medium text-blue-600 dark:text-blue-400"
              >
                联系客服
              </a>
              <span className="text-gray-600 dark:text-gray-300">
                咨询产品/代理，关注公众号
              </span>
              <a
                href={publicHref}
                className="font-medium text-blue-600 dark:text-blue-400"
              >
                优惠活动
              </a>
              <span className="text-gray-600 dark:text-gray-300">和</span>
              <a
                href={publicHref}
                className="font-medium text-blue-600 dark:text-blue-400"
              >
                产品更新
              </a>
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={close}
              className="shrink-0 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
              title="关闭弹窗"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* ===== 主内容区域 ===== */}
          <div className="px-5 py-6 sm:px-10 sm:py-10">
            {/* 标题区域 */}
            <div className="mb-6">
              <div className="mb-3 flex items-center">
                <span className="mr-3 h-[2px] w-6 bg-blue-600" />
                <span className="text-[10px] font-medium tracking-widest text-blue-600 sm:text-xs">
                  CONNECT SUPPORT
                </span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                联系客服
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                扫描二维码添加客服微信，专业代理指导和优质服务支持
              </p>
            </div>

            {/* 二维码区域 */}
            <div className="grid grid-cols-2 gap-4 sm:gap-8">
              {/* 微信客服 */}
              <div className="text-center">
                <div className="mx-auto mb-3 aspect-square w-full max-w-[160px] overflow-hidden rounded-lg border border-gray-200 bg-white p-3 sm:max-w-[200px] sm:p-5 dark:border-gray-700">
                  <img
                    src={wxQrSrc}
                    alt="微信客服二维码"
                    className="size-full object-contain"
                    loading="lazy"
                  />
                </div>
                <h4 className="mb-1 text-sm font-semibold text-gray-900 sm:text-base dark:text-white">
                  添加客服微信
                </h4>
                <p className="text-[11px] text-gray-500 sm:text-xs dark:text-gray-400">
                  产品咨询 / 代理加盟
                </p>
              </div>

              {/* 公众号 */}
              <div className="text-center">
                <div className="mx-auto mb-3 aspect-square w-full max-w-[160px] overflow-hidden rounded-lg border border-gray-200 bg-white p-3 sm:max-w-[200px] sm:p-5 dark:border-gray-700">
                  <img
                    src={publicQrSrc}
                    alt="微信公众号二维码"
                    className="size-full object-contain"
                    loading="lazy"
                  />
                </div>
                <h4 className="mb-1 text-sm font-semibold text-gray-900 sm:text-base dark:text-white">
                  扫码联系客服
                </h4>
                <p className="text-[11px] text-gray-500 sm:text-xs dark:text-gray-400">
                  优惠活动 / 产品更新
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default CustomerServiceModal;
