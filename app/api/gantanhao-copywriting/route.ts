/**
 * 卡业联盟朋友圈推广文案接口
 * GET /api/gantanhao-copywriting?codeNumber=52616
 *
 * 接收商品编号，调用卡业联盟 getProductCopywriting 接口返回预写的营销文案。
 * 服务端代理，避免将 API Key 暴露给客户端。
 */

import { NextResponse } from "next/server";
import { fetchGantanhaoCopywriting } from "@/lib/api/gantanhao";

/**
 * GET /api/gantanhao-copywriting?codeNumber=52616
 *
 * @param codeNumber - 商品编号（必填，即 codeNumber）
 * @returns 朋友圈营销文案 { copywriting: string }
 */
export async function GET(request: Request) {
    try {
        /* ===== 解析参数 ===== */
        const { searchParams } = new URL(request.url);
        const codeNumber = searchParams.get("codeNumber");

        /* ===== 参数校验 ===== */
        if (!codeNumber) {
            return NextResponse.json(
                { error: "请提供商品编号 (codeNumber)" },
                { status: 400 }
            );
        }

        /* ===== 调用卡业联盟文案接口 ===== */
        const copywriting = await fetchGantanhaoCopywriting(codeNumber);

        /* ===== 返回结果 ===== */
        return NextResponse.json({ copywriting });
    } catch (e) {
        const message = e instanceof Error ? e.message : "获取推广文案失败";
        console.error("[API GantanhaoCopywriting]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
