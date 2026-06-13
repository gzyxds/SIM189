/**
 * 号卡领取记录跑马灯组件
 *
 * 无限循环横向滚动，展示虚拟领取成功记录，增强信任感。
 * 复用于各号卡平台列表页（haoka / linxi / lotml / yky / kakatx）。
 */

import { CLAIM_RECORDS } from "@/lib/data/claim-records";
import { containerClass, SITE_WIDTH_STYLE } from "@/lib/layout";

export default function ClaimTicker() {
  // 复制一份数据实现无缝循环
  const items = [...CLAIM_RECORDS, ...CLAIM_RECORDS];

  return (
    <div className={containerClass("py-3")} style={SITE_WIDTH_STYLE}>
      <div className="relative overflow-hidden rounded-md border border-blue-100 bg-white/80 shadow-sm px-4 py-3.5">
        {/* 左右渐隐遮罩 */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 z-10 bg-linear-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 z-10 bg-linear-to-l from-white to-transparent" />
        {/* 滚动轨道，45s 慢速循环 */}
        <div
          className="flex gap-4 whitespace-nowrap animate-[ticker_45s_linear_infinite]"
          style={{ width: "max-content" }}
        >
          {items.map((record, idx) => (
            <div
              key={idx}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs"
            >
              <span className="inline-block size-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="font-medium text-gray-800">{record.phone}</span>
              <span className="text-gray-500">{record.name}</span>
              <span className="text-blue-600 font-semibold">领取成功</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-400">{record.plan}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
