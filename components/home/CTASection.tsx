"use client";

import { containerClass, SITE_WIDTH_STYLE } from "@/lib/layout";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

/** CTA（行动号召）区域组件 */
export default function CTASection() {
  return (
    <section className="relative overflow-hidden">
      {/* 背景渐变 */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />

      <div className={containerClass("py-16 md:py-24")} style={SITE_WIDTH_STYLE}>
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90">
            <Rocket className="mr-1.5 size-4" />
            代理合作
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            还等什么？开启您的流量卡代理之旅
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            立即注册成为代理，开启您的赚钱之旅
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50"
              onClick={() => (window.location.href = "/join")}
            >
              立即加入
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
