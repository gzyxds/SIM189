/**
 * 套餐网格组件（客户端交互）
 *
 * 默认显示 8 个商品，每次点击「加载更多」再增加 8 个。
 * 响应式断点渐进：移动端 2 列 → 平板 3 列 → 桌面 4 列
 */
"use client";

import { useState } from "react";
import type { HaokaProduct } from "@/lib/api/haokavip";
import ProductCard from "@/components/home/ProductCard";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

/** 每次增量加载数量 */
const STEP = 8;

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
      {/* 渐进式响应网格：2→3→4 列 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {visible.map((plan) => (
          <ProductCard key={plan.product_id} product={plan} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCount((c) => Math.min(c + STEP, products.length))}
            className="group gap-2 rounded-full border-gray-200 px-8 text-sm font-medium shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
          >
            <ChevronDown className="size-4 transition-transform group-hover:rotate-180" />
            加载更多
            <span className="ml-1 text-xs text-muted-foreground">
              （{count} / {products.length}）
            </span>
          </Button>
        </div>
      )}
    </>
  );
}
