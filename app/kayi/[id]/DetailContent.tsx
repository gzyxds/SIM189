/**
 * 卡易号卡平台商品详情页面（客户端组件）
 *
 * 根据商品 ID 展示商品详细信息，包括月租、流量、归属地、激活方式等。
 * 数据来源：卡易号卡平台 API /openapi/goods/details
 *
 * 布局参考 /lotml 设计：主图白底内间距、按钮行「返回列表→立即办理→订单查询」、
 * 下方 lg:grid-cols-[5fr_3fr] 左右布局（左=套餐资料介绍，右=套餐详情/激活说明/温馨提示/常见问题）。
 */

"use client";

import Link from "next/link";
import type { KayiProductWithMeta, KayiOperator } from "@/lib/api/kayi";
import { KAYI_OPERATOR_LABEL, KAYI_ORDER_QUERY_URL } from "@/lib/api/kayi";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import {
    Signal,
    ArrowLeft,
    ShoppingCart,
    ChevronRight,
    ShieldCheck,
    Info,
    ExternalLink,
    CheckCircle2,
    Mail,
    Phone,
    Clock,
    MapPin,
    Truck,
    UserCheck,
    Search,
} from "lucide-react";

/* ========== Props 类型 ========== */

interface DetailContentProps {
    /** 商品数据（含预计算元数据），null 表示未找到 */
    product: KayiProductWithMeta | null;
    /** 错误信息，null 表示无错误 */
    error: string | null;
}

/* ========== 运营商 UI 配置 ========== */

const OPERATOR_UI: Record<string, { badge: string }> = {
    mobile: { badge: "bg-green-50 text-green-700 border-green-200" },
    telecom: { badge: "bg-blue-50 text-blue-700 border-blue-200" },
    unicom: { badge: "bg-orange-50 text-orange-700 border-orange-200" },
    broadcast: { badge: "bg-purple-50 text-purple-700 border-purple-200" },
    unknown: { badge: "bg-gray-50 text-gray-700 border-gray-200" },
};

/* ========== 错误/未找到页面 ========== */

function NotFoundPage({ error }: { error?: string }) {
    return (
        <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
            <Header />
            <main className="flex flex-1 items-center justify-center px-4">
                <div className="text-center">
                    <Signal className="mx-auto mb-4 size-12 text-red-300" />
                    <h2 className="mb-1 text-lg font-semibold text-gray-700">
                        {error ? "数据加载失败" : "商品未找到"}
                    </h2>
                    <p className="mb-4 text-sm text-gray-400">
                        {error || "该商品不存在或已下架"}
                    </p>
                    <Link
                        href="/kayi"
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                        <ArrowLeft className="size-4" /> 返回商品列表
                    </Link>
                </div>
            </main>
            <Footer />
        </div>
    );
}

/* ========== 面包屑导航 ========== */

function Breadcrumb({ productName }: { productName: string }) {
    return (
        <nav className="border-b bg-white py-3">
            <div className={containerClass()} style={SITE_WIDTH_STYLE}>
                <ol className="flex items-center gap-2 text-sm text-gray-500">
                    <li>
                        <Link href="/" className="hover:text-blue-600">
                            首页
                        </Link>
                    </li>
                    <li className="text-gray-300">/</li>
                    <li>
                        <Link href="/kayi" className="hover:text-blue-600">
                            卡易号卡
                        </Link>
                    </li>
                    <li className="text-gray-300">/</li>
                    <li className="max-w-[200px] truncate font-medium text-gray-800">
                        {productName}
                    </li>
                </ol>
            </div>
        </nav>
    );
}

/* ========== 核心参数卡片 ========== */

function ParamCard({
    label,
    value,
    unit,
    gradientFrom,
    gradientTo,
    textColor,
}: {
    label: string;
    value: string;
    unit?: string;
    gradientFrom?: string;
    gradientTo?: string;
    textColor?: string;
}) {
    return (
        <div
            className={`rounded-xl bg-linear-to-br p-4 text-center ${gradientFrom || "from-blue-50"} ${gradientTo || "to-indigo-50"}`}
        >
            <p className="mb-1 text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-black ${textColor || "text-gray-800"}`}>
                {value}
            </p>
            {unit && <p className="text-xs text-gray-400">{unit}</p>}
        </div>
    );
}

/* ========== 商品详情主体 ========== */

function ProductDetail({ product }: { product: KayiProductWithMeta }) {
    const provider: KayiOperator = product._provider;
    const ui = OPERATOR_UI[provider] || OPERATOR_UI.unknown;
    const operatorLabel = KAYI_OPERATOR_LABEL[provider] || "未知";
    const price = product._price || "?";
    const flowText = product._flow || "";
    const callText = product._call || "";
    const location = product._location || "全国";
    const tags = product._tags || [];
    const orderUrl = product._orderUrl;

    /* 原价（若优惠月租低于标准月租，则展示划线原价） */
    const hasDiscount = product.favourMonthFee > 0 && product.monthFee > product.favourMonthFee;

    return (
        <div className={containerClass("py-6 lg:py-10")} style={SITE_WIDTH_STYLE}>
            {/* ===== 上部分：图片 + 信息 ===== */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* 商品封面图片（白底相框 + 内间距，完整展示不裁切） */}
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                    <div className="relative aspect-square overflow-hidden bg-white p-6">
                        {product.tips ? (
                            <div className="h-full w-full">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={product.tips}
                                    alt={product.name}
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-300">
                                <Signal className="size-16" />
                            </div>
                        )}
                    </div>
                </div>

                {/* 商品信息区域 */}
                <div>
                    {/* 标签行 */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${ui.badge}`}
                        >
                            <Signal className="mr-1 size-3.5" />
                            {operatorLabel}
                        </span>
                        {product.status === 1 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                                <ShieldCheck className="size-3.5" />
                                在售中
                            </span>
                        )}
                        {product.selectNumber > 0 && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                                支持选号
                            </span>
                        )}
                    </div>

                    {/* 标题与摘要 */}
                    <h1 className="mb-2 text-xl font-bold text-gray-900 lg:text-2xl">
                        {product.name}
                    </h1>
                    <p className="mb-4 text-sm text-gray-500">
                        {product.des}
                        {location ? ` · ${location}` : ""}
                    </p>

                    {/* 核心参数卡片 */}
                    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <ParamCard
                            label="月租费用"
                            value={`¥${price}`}
                            unit="/月"
                            gradientFrom="from-blue-50"
                            gradientTo="to-indigo-50"
                            textColor="text-blue-600"
                        />
                        <ParamCard
                            label="月流量"
                            value={flowText || "—"}
                            unit="全国通用"
                            gradientFrom="from-blue-50"
                            gradientTo="to-cyan-50"
                            textColor="text-blue-600"
                        />
                        <ParamCard
                            label="通话时长"
                            value={callText || "—"}
                            gradientFrom="from-green-50"
                            gradientTo="to-emerald-50"
                            textColor="text-green-600"
                        />
                        <ParamCard
                            label="归属地"
                            value={location}
                            gradientFrom="from-purple-50"
                            gradientTo="to-pink-50"
                            textColor="text-purple-600"
                        />
                    </div>

                    {/* 配送 + 套餐特点 */}
                    <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <p className="mb-1 text-xs font-semibold text-gray-700">
                                配送方式
                            </p>
                            <p className="text-sm font-medium text-blue-600">
                                快递包邮
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                                {location}
                            </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <p className="mb-1 text-xs font-semibold text-gray-700">
                                套餐特点
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {tags.slice(0, 5).map((t, i) => (
                                    <span
                                        key={i}
                                        className={`inline-block rounded px-2 py-0.5 text-[11px] ${t.className}`}
                                    >
                                        {t.text}
                                    </span>
                                ))}
                                {tags.length === 0 && (
                                    <span className="text-xs text-gray-400">大流量套餐</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 办理条件 */}
                    <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <h3 className="mb-2 text-sm font-bold text-gray-800">办理条件</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                            {product._ageLimit && (
                                <div className="flex items-center gap-2">
                                    <UserCheck className="size-4 text-gray-400" />
                                    {product._ageLimit}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-gray-400" />
                                需实名认证
                            </div>
                            <div className="flex items-center gap-2">
                                <Info className="size-4 text-gray-400" />
                                一人限办一张
                            </div>
                            <div className="flex items-center gap-2">
                                <Truck className="size-4 text-gray-400" />
                                快递包邮
                            </div>
                        </div>
                    </div>

                    {/* 操作按钮：返回列表 → 立即办理 → 订单查询 */}
                    <div className="flex gap-3">
                        <Link
                            href="/kayi"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-blue-600 bg-white px-6 py-3 text-sm font-bold text-blue-600 transition-all hover:bg-blue-50"
                        >
                            <ArrowLeft className="size-4" />
                            返回列表
                        </Link>
                        <a
                            href={orderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                        >
                            <ShoppingCart className="size-5" />
                            立即办理
                        </a>
                        <a
                            href={KAYI_ORDER_QUERY_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50"
                        >
                            <Search className="size-4" />
                            订单查询
                        </a>
                    </div>
                </div>
            </div>

            {/* ===== 下方左右布局：左侧套餐资料介绍 / 右侧套餐详情等 ===== */}
            <div className="mt-10 grid items-start gap-8 lg:grid-cols-[5fr_3fr]">
                {/* 左侧：套餐资料介绍（资费详情图） */}
                <div className="flex flex-col gap-4">
                    <section className="rounded-2xl border border-gray-100 bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="h-5 w-1 rounded-full bg-blue-600" />
                            <h2 className="text-base font-bold text-gray-800">套餐资料介绍</h2>
                        </div>
                        {product.details && product.details.length > 0 ? (
                            <div className="space-y-4">
                                {product.details.map((src, i) => (
                                    <div key={i} className="overflow-hidden rounded-xl border border-gray-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={src}
                                            alt={`${product.name} 套餐资料图${i + 1}`}
                                            className="h-auto w-full"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : orderUrl ? (
                            <div>
                                <p className="mb-4 text-sm text-gray-500">
                                    查看完整的商品介绍、套餐细则及注意事项
                                </p>
                                <a
                                    href={orderUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 px-6 py-4 text-sm font-semibold text-blue-600 transition-all hover:border-blue-400 hover:bg-blue-100"
                                >
                                    <ExternalLink className="size-5" />
                                    查看完整商品详情
                                    <ChevronRight className="size-4" />
                                </a>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">暂无套餐资料图片</p>
                        )}
                    </section>
                </div>

                {/* 右侧：套餐详情 + 激活说明 + 温馨提示 + 常见问题 */}
                <div className="flex flex-col gap-4">
                    {/* ===== 套餐详情 ===== */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="h-5 w-1 rounded-full bg-blue-600" />
                            <h2 className="text-base font-bold text-gray-800">套餐详情</h2>
                        </div>
                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                                <div>
                                    <span className="font-semibold text-gray-800">月租费用：</span>
                                    每月仅需{" "}
                                    <span className="font-bold text-blue-600">¥{price}</span>
                                    {hasDiscount && (
                                        <span className="ml-1 text-xs text-gray-400 line-through">
                                            ¥{product.monthFee}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {flowText && (
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                                    <div>
                                        <span className="font-semibold text-gray-800">月流量：</span>
                                        <span className="font-bold">{flowText}</span> 全国通用流量
                                    </div>
                                </div>
                            )}
                            {callText && (
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                                    <div>
                                        <span className="font-semibold text-gray-800">通话时长：</span>
                                        <span className="font-bold">{callText}</span> 全国通话
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                                <div>
                                    <span className="font-semibold text-gray-800">网络制式：</span>
                                    支持5G/4G网络
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                                <div>
                                    <span className="font-semibold text-gray-800">归属地：</span>
                                    {location}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                                <div>
                                    <span className="font-semibold text-gray-800">发货方式：</span>
                                    快递包邮到家
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                                <div>
                                    <span className="font-semibold text-gray-800">结算模式：</span>
                                    {product._settleModeLabel}
                                </div>
                            </div>
                            {product.commission ? (
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                                    <div>
                                        <span className="font-semibold text-gray-800">佣金金额：</span>
                                        <span className="font-bold text-blue-600">¥{product.commission}</span>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </section>

                    {/* ===== 激活说明 ===== */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="h-5 w-1 rounded-full bg-blue-600" />
                            <h2 className="text-base font-bold text-gray-800">激活说明</h2>
                        </div>
                        <ol className="space-y-3 text-sm text-gray-600">
                            {[
                                "收到SIM卡后，扫描卡板上的二维码下载运营商官方APP",
                                "准备好本人身份证，按照APP指引完成实名认证（需进行人脸识别）",
                                "认证通过后插入SIM卡，按套餐要求完成首充激活",
                                "激活成功后流量一般在24小时内到账，即可正常使用",
                            ].map((step, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                        {i + 1}
                                    </span>
                                    <div>{step}</div>
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* ===== 温馨提示 ===== */}
                    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-700">
                            <Info className="size-4" />
                            温馨提示
                        </h3>
                        <ul className="ml-5 list-disc space-y-1.5 text-xs leading-relaxed text-amber-700">
                            <li>本套餐仅限新用户办理，同一身份证限办一张</li>
                            <li>收到SIM卡后请尽快完成实名激活，激活后按套餐要求首充</li>
                            {product._ageLimit && (
                                <li>办理年龄限制：{product._ageLimit}</li>
                            )}
                            {product._forbiddenArea && (
                                <li>本套餐不支持发货至：{product._forbiddenArea}</li>
                            )}
                            {product.compliance && (
                                <li>结算要求：{product.compliance}</li>
                            )}
                            <li>如有疑问请联系客服咨询，切勿轻信非官方渠道信息</li>
                        </ul>
                    </section>

                    {/* ===== 常见问题 ===== */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="h-5 w-1 rounded-full bg-blue-600" />
                            <h2 className="text-base font-bold text-gray-800">常见问题</h2>
                        </div>
                        <div className="space-y-3">
                            {[
                                {
                                    q: "套餐资费如何计算？",
                                    a: `本套餐月租为¥${price}/月${flowText ? `，包含${flowText}流量` : ""}${callText ? `和${callText}通话时长` : ""}。具体资费以运营商实际扣费为准，激活后请留意首月资费说明。`,
                                },
                                {
                                    q: "如何激活卡片？",
                                    a: "收到SIM卡后，请按照随卡附带的激活指引完成实名认证和激活操作。一般需要下载对应运营商APP或扫描卡片上的二维码进行自助激活。",
                                },
                                {
                                    q: "流量什么时候到账？",
                                    a: "激活成功后，流量一般在24小时内到账，部分卡品可能需要在指定渠道首充后才能全额到账。首月流量可能按剩余天数比例发放，次月起全额发放。",
                                },
                                {
                                    q: "归属地是哪里？可以选号吗？",
                                    a: `归属地为${location}。${product.selectNumber > 0 ? "本商品支持选号，可在下单时选择心仪号码。" : "大部分卡品不支持选号，号码随机分配。"}`,
                                },
                                {
                                    q: "佣金如何结算？",
                                    a: product.commission
                                        ? `本套餐返佣模式为${product._settleModeLabel}，佣金金额为¥${product.commission}。`
                                        : `本套餐返佣模式为${product._settleModeLabel}。`,
                                },
                                {
                                    q: "发货和物流时效？",
                                    a: "订单审核通过后，一般1-3个工作日内发货，采用快递包邮配送。",
                                },
                            ].map((faq, i) => (
                                <details
                                    key={i}
                                    className="group rounded-xl border border-gray-100 bg-white"
                                >
                                    <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-semibold text-gray-800">
                                        <span className="flex items-center gap-2">
                                            <span className="flex size-6 items-center justify-center rounded-full bg-blue-600/10 text-xs font-bold text-blue-600">
                                                Q
                                            </span>
                                            {faq.q}
                                        </span>
                                        <ChevronRight className="size-4 text-gray-400 transition-transform duration-300 group-open:rotate-90" />
                                    </summary>
                                    <div className="border-t border-gray-100 px-4 pb-4 pt-3 text-sm leading-relaxed text-gray-500">
                                        {faq.a}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* ===== 禁发区域 ===== */}
            {product._forbiddenArea && (
                <section className="mt-10 rounded-2xl border border-red-100 bg-red-50 p-6">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-red-700">
                        <MapPin className="size-4" />
                        禁发区域
                    </h3>
                    <p className="text-xs leading-relaxed text-red-600">
                        {product._forbiddenArea}
                    </p>
                </section>
            )}

            {/* ===== 套餐标签 ===== */}
            {tags.length > 0 && (
                <section className="mt-10 rounded-2xl border border-gray-100 bg-white p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="h-5 w-1 rounded-full bg-blue-600" />
                        <h2 className="text-base font-bold text-gray-800">套餐标签</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((t, i) => (
                            <span
                                key={i}
                                className={`inline-block rounded-lg border px-3 py-1.5 text-xs font-medium ${t.className}`}
                            >
                                {t.text}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* ===== 联系我们 ===== */}
            <section className="mt-10 rounded-2xl border border-gray-100 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-blue-600" />
                    <h2 className="text-base font-bold text-gray-800">联系我们</h2>
                </div>
                <p className="mb-4 text-sm text-gray-500">
                    如有任何疑问，请通过以下方式联系我们
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <Phone className="size-5 text-blue-600" />
                        <div>
                            <p className="text-xs text-gray-400">客服电话</p>
                            <p className="text-sm font-semibold text-gray-800">
                                400-xxx-xxxx
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <Mail className="size-5 text-blue-600" />
                        <div>
                            <p className="text-xs text-gray-400">客服邮箱</p>
                            <p className="text-sm font-semibold text-gray-800">
                                service@kayi123.com
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <Clock className="size-5 text-blue-600" />
                        <div>
                            <p className="text-xs text-gray-400">服务时间</p>
                            <p className="text-sm font-semibold text-gray-800">
                                周一至周日 9:00-21:00
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

/* ========== 主入口 ========== */

export default function DetailContent({ product, error }: DetailContentProps) {
    if (error || !product) {
        return <NotFoundPage error={error ?? undefined} />;
    }

    return (
        <div className="min-h-screen bg-[#f5f7fa]">
            <Header />
            <Breadcrumb productName={product.name} />
            <main>
                <ProductDetail product={product} />
            </main>
            <Footer />
        </div>
    );
}
