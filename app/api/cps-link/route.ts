/**
 * CPS 活动转链接口
 * GET /api/cps-link?act_id=3
 *
 * 接收活动 ID，调用聚推客联盟转链接口获取推广链接。
 */

import { NextResponse } from "next/server";
import { fetchActLink } from "@/lib/api/jutuike";

/**
 * GET /api/cps-link?act_id=3
 *
 * @param act_id - 活动 ID（必填）
 * @returns 推广链接信息 { h5, long_h5, we_app_info, act_name }
 */
export async function GET(request: Request) {
    try {
        /* ===== 解析参数 ===== */
        const { searchParams } = new URL(request.url);
        const actIdStr = searchParams.get("act_id");

        /* ===== 参数校验 ===== */
        if (!actIdStr || isNaN(Number(actIdStr))) {
            return NextResponse.json(
                { error: "请提供有效的活动 ID (act_id)" },
                { status: 400 },
            );
        }

        const actId = Number(actIdStr);

        /* ===== 调用转链接口 ===== */
        const linkData = await fetchActLink(actId);

        /* ===== 返回结果 ===== */
        return NextResponse.json(linkData);
    } catch (e) {
        const message = e instanceof Error ? e.message : "获取推广链接失败";
        console.error("[API CpsLink]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
