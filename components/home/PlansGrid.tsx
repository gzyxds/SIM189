/**
 * 套餐网格组件（客户端交互）
 *
 * 默认显示 8 个商品，每次点击「加载更多」再增加 8 个。
 * 响应式断点：移动端 1 列 → 平板 2 列 → 桌面 3 列 → 大屏 4 列
 */
"use client";

import { useState } from "react";
import type { HaokaProduct } from "@/lib/api/haokavip";
import ProductCard from "@/components/home/ProductCard";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

/** 每次增量加载数量 */
const STEP = 10;

interface PlansGridProps {
  products: HaokaProduct[];
}

/** 套餐网格（含加载更多按钮，支持暗色模式） */
export default function PlansGrid({ products }: PlansGridProps) {
  const [count, setCount] = useState(STEP);
  const visible = products.slice(0, count);
  const hasMore = count < products.length;

  return (
    <>
      {/* 渐进式响应网格：1→2→3→4 列 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {visible.map((plan) => (
          <ProductCard key={plan.product_id} product={plan} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center sm:mt-10">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCount((c) => Math.min(c + STEP, products.length))}
            className="group gap-2 rounded-full border-gray-200 px-6 text-xs font-medium shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 sm:px-8 sm:text-sm"
          >
            <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180 sm:size-4" />
            加载更多
            <span className="ml-1 text-muted-foreground">
              {count}/{products.length}
            </span>
          </Button>
        </div>
      )}
    </>
  );
}
