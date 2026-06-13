/**
 * 卡业联盟商品详情页面（客户端组件）
 *
 * 根据商品编码（codeNumber）展示商品详细信息，包括月租、流量、归属地、激活方式等。
 * 数据来源：卡业联盟 API /api/api/selectProduct
 * 接口文档：https://gantanhao.apifox.cn/9004453m0.md
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { GantanhaoProductWithMeta, GantanhaoOperator } from "@/lib/api/gantanhao";
import { mapGantanhaoOperator, GANTANHAO_OPERATOR_LABEL } from "@/lib/api/gantanhao";
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
    CreditCard,
    Copy,
    Share2,
    Loader2,
} from "lucide-react";

/* ========== Props 类型 ========== */

interface DetailContentProps {
    /** 商品数据（含预计算元数据），null 表示未找到 */
    product: GantanhaoProductWithMeta | null;
    /** 错误信息，null 表示无错误 */
    error: string | null;
}

/* ========== 运营商 UI 配置 ========== */

/** 运营商对应的徽章样式 */
const OPERATOR_UI: Record<string, { badge: string }> = {
    mobile: { badge: "bg-green-50 text-green-700 border-green-200" },
    telecom: { badge: "bg-blue-50 text-blue-700 border-blue-200" },
    unicom: { badge: "bg-orange-50 text-orange-700 border-orange-200" },
    broadcast: { badge: "bg-purple-50 text-purple-700 border-purple-200" },
    unknown: { badge: "bg-gray-50 text-gray-700 border-gray-200" },
};

/* ========== 错误/未找到页面 ========== */

/** 商品未找到或加载失败时展示的页面 */
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
                        href="/gantanhao"
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

/** 面包屑导航组件 */
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
                        <Link href="/gantanhao" className="hover:text-blue-600">
                            卡业联盟
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

/** 单个参数展示卡片 */
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
            className={`rounded-xl bg-gradient-to-br p-4 text-center ${gradientFrom || "from-blue-50"} ${gradientTo || "to-indigo-50"}`}
        >
            <p className="mb-1 text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-black ${textColor || "text-gray-800"}`}>
                {value}
            </p>
            {unit && <p className="text-xs text-gray-400">{unit}</p>}
        </div>
    );
}

/* ========== 推广文案区块 ========== */

/**
 * 根据商品数据生成基础推广文案（降级方案）
 * 当卡业联盟文案接口不可用时，基于已有字段自动生成
 */
function buildFallbackCopywriting(product: GantanhaoProductWithMeta): string {
    const name = product.name.replace(/^\d+-/, "");
    const price = product._price || "?";
    const flow = product._flow || "";
    const operatorLabel = GANTANHAO_OPERATOR_LABEL[product._provider] || "运营商";
    const location = product._location || "全国";
    const delivery = product.deliveryMethod || "快递";
    const age = product.ageLimit || "";
    const contract = product.packageContract || "";
    const openCard = product.openCardMethod || "";
    const firstCharge = product.firstChargeChannel || "";

    const lines: string[] = [];
    lines.push(`🔥给大家推荐一款${operatorLabel}超划算的卡 —— ${name}！`);
    lines.push("");
    if (price !== "?") {
        lines.push(`💰月租仅需${price}元${flow ? `，包含${flow}流量` : ""}！`);
    }
    lines.push(`📍归属地：${location}，配送方式：${delivery}包邮${age ? `，年龄限制${age}` : ""}。`);
    if (contract) lines.push(`📝套餐合约${contract}${openCard ? `，${openCard}` : ""}。`);
    if (firstCharge) lines.push(`💳首充渠道：${firstCharge}。`);
    lines.push("");
    lines.push("正规渠道、全国包邮，有需要的宝子别错过！🤗");

    return lines.join("\n");
}

/** 朋友圈推广文案组件（客户端异步加载 + 复制，支持降级生成） */
function CopywritingSection({ product }: { product: GantanhaoProductWithMeta }) {
    const [copywriting, setCopywriting] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isFallback, setIsFallback] = useState(false);

    /** 加载推广文案（通过 API 路由代理，不暴露 API Key） */
    async function handleLoad() {
        if (copywriting) return;
        setLoading(true);
        try {
            const res = await fetch(
                `/api/gantanhao-copywriting?codeNumber=${encodeURIComponent(product.codeNumber)}`
            );
            const data = await res.json();
            if (res.ok && data.copywriting) {
                /* API 成功：使用官方文案 */
                setCopywriting(data.copywriting);
                setIsFallback(false);
            } else {
                /* API 失败：降级使用本地生成的基础文案 */
                setCopywriting(buildFallbackCopywriting(product));
                setIsFallback(true);
            }
        } catch {
            /* 网络异常等：同样降级 */
            setCopywriting(buildFallbackCopywriting(product));
            setIsFallback(true);
        } finally {
            setLoading(false);
        }
    }

    /** 复制文案到剪贴板 */
    async function handleCopy() {
        if (!copywriting) return;
        try {
            await navigator.clipboard.writeText(copywriting);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* 兼容旧版浏览器 */
            const textarea = document.createElement("textarea");
            textarea.value = copywriting;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    return (
        <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-blue-600" />
                <h2 className="text-base font-bold text-gray-800">推广文案</h2>
            </div>
            <p className="mb-4 text-sm text-gray-500">
                一键生成朋友圈营销文案，复制即可分享推广
            </p>

            {/* 未加载状态：显示加载按钮 */}
            {!copywriting && !loading && (
                <button
                    type="button"
                    onClick={handleLoad}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 px-6 py-4 text-sm font-semibold text-blue-600 transition-all hover:border-blue-400 hover:bg-blue-100"
                >
                    <Share2 className="size-5" />
                    加载推广文案
                </button>
            )}

            {/* 加载中状态 */}
            {loading && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
                    <Loader2 className="size-4 animate-spin" />
                    正在生成文案…
                </div>
            )}

            {/* 已加载：展示文案 + 复制按钮 */}
            {copywriting && (
                <div>
                    {isFallback && (
                        <p className="mb-2 text-xs text-amber-600">
                            ⚠️ 官方文案暂未生成，以下为基于商品信息自动生成的推广文案
                        </p>
                    )}
                    <div className="max-h-64 overflow-y-auto rounded-xl bg-gray-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-gray-700 scrollbar-hide">
                        {copywriting}
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button
                            type="button"
                            onClick={handleCopy}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${copied
                                    ? "bg-green-500 text-white"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                        >
                            {copied ? (
                                <>
                                    <CheckCircle2 className="size-4" />
                                    已复制
                                </>
                            ) : (
                                <>
                                    <Copy className="size-4" />
                                    复制文案
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

/* ========== 商品详情主体 ========== */

/** 商品详情核心展示区域 */
function ProductDetail({ product }: { product: GantanhaoProductWithMeta }) {
    /* ===== 预计算元数据 ===== */
    const provider: GantanhaoOperator = product._provider;
    const ui = OPERATOR_UI[provider] || OPERATOR_UI.unknown;
    const operatorLabel = GANTANHAO_OPERATOR_LABEL[provider] || "未知";
    const price = product._price || "?";
    const flowText = product._flow || "";
    const duration = product._duration || "未知";
    const tags = product._tags || [];
    const orderUrl = product._orderUrl;

    return (
        <div className={containerClass("py-6 lg:py-10")} style={SITE_WIDTH_STYLE}>
            {/* ===== 上部分：图片 + 信息 ===== */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* 商品封面图片 */}
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                    <div className="relative aspect-square overflow-hidden">
                        {product.img ? (
                            <Image
                                src={product.img}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />
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
                        {product.isOnSale === 1 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                                <ShieldCheck className="size-3.5" />
                                在售中
                            </span>
                        )}
                        {product.isSelectNumber === 1 && (
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
                        {product.subName}
                        {product.location ? ` · ${product.location}` : ""}
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
                            label="套餐时长"
                            value={duration !== "未知" ? duration : "—"}
                            gradientFrom="from-green-50"
                            gradientTo="to-emerald-50"
                            textColor="text-green-600"
                        />
                        <ParamCard
                            label="归属地"
                            value={product._location || "—"}
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
                                {product.deliveryMethod || "快递包邮"}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                                {product.location || "全国可办理"}
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
                            {product.ageLimit && (
                                <div className="flex items-center gap-2">
                                    <UserCheck className="size-4 text-gray-400" />
                                    {product.ageLimit}
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
                                {product.deliveryMethod || "快递"}包邮
                            </div>
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                        <a
                            href={orderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                        >
                            <ShoppingCart className="size-5" />
                            立即办理
                        </a>
                        <Link
                            href="/gantanhao"
                            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-blue-600 bg-white px-6 py-3 text-sm font-bold text-blue-600 transition-all hover:bg-blue-50"
                        >
                            <ArrowLeft className="size-4" />
                            返回列表
                        </Link>
                    </div>
                </div>
            </div>

            {/* ===== 推广文案（朋友圈分享） ===== */}
            <CopywritingSection product={product} />

            {/* ===== 套餐详情 ===== */}
            <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6">
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
                            <span className="font-semibold text-gray-800">套餐时长：</span>
                            {duration !== "未知" ? duration : "以运营商实际政策为准"}
                        </div>
                    </div>
                    {product.packageContract && (
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                            <div>
                                <span className="font-semibold text-gray-800">
                                    合约周期：
                                </span>
                                {product.packageContract}
                            </div>
                        </div>
                    )}
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <div>
                            <span className="font-semibold text-gray-800">发货方式：</span>
                            {product.deliveryMethod || "快递"}包邮到家
                        </div>
                    </div>
                    {product.firstChargeChannel && (
                        <div className="flex items-start gap-3">
                            <CreditCard className="mt-0.5 size-4 shrink-0 text-green-500" />
                            <div>
                                <span className="font-semibold text-gray-800">
                                    首充渠道：
                                </span>
                                {product.firstChargeChannel}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ===== 激活说明 ===== */}
            <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-blue-600" />
                    <h2 className="text-base font-bold text-gray-800">激活说明</h2>
                </div>
                <ol className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            1
                        </span>
                        <div>
                            {product.openCardMethod
                                ? product.openCardMethod
                                : "收到SIM卡后，扫描卡板上的二维码下载运营商官方APP"}
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            2
                        </span>
                        <div>
                            准备好本人身份证，按照APP指引完成实名认证（需进行人脸识别）
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            3
                        </span>
                        <div>
                            {product.firstChargeChannel
                                ? `认证通过后插入SIM卡，${product.firstChargeChannel}完成首充激活`
                                : "认证通过后插入SIM卡，按套餐要求完成首充激活"}
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            4
                        </span>
                        <div>
                            激活成功后流量一般在24小时内到账，即可正常使用
                        </div>
                    </li>
                </ol>
                {/* 激活参考图片 */}
                {product.activationImg && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
                        <Image
                            src={product.activationImg}
                            alt={`${product.name} 激活指引`}
                            width={600}
                            height={400}
                            className="w-full"
                        />
                    </div>
                )}
            </section>

            {/* ===== 商品详情图 ===== */}
            {product.descImg && (
                <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="h-5 w-1 rounded-full bg-blue-600" />
                        <h2 className="text-base font-bold text-gray-800">宝贝详情</h2>
                    </div>
                    <div className="overflow-hidden rounded-xl">
                        <Image
                            src={product.descImg}
                            alt={`${product.name} 详情图`}
                            width={800}
                            height={1200}
                            className="w-full"
                        />
                    </div>
                </section>
            )}

            {/* ===== 外部链接跳转 ===== */}
            {orderUrl && !product.descImg && (
                <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="h-5 w-1 rounded-full bg-blue-600" />
                        <h2 className="text-base font-bold text-gray-800">宝贝详情</h2>
                    </div>
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
                </section>
            )}

            {/* ===== 禁发区域 ===== */}
            {product.forbiddenArea && (
                <section className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-6">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-red-700">
                        <MapPin className="size-4" />
                        禁发区域
                    </h3>
                    <p className="text-xs leading-relaxed text-red-600">
                        {product.forbiddenArea}
                    </p>
                </section>
            )}

            {/* ===== 温馨提示 ===== */}
            <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-700">
                    <Info className="size-4" />
                    温馨提示
                </h3>
                <ul className="ml-5 list-disc space-y-1.5 text-xs leading-relaxed text-amber-700">
                    <li>本套餐仅限新用户办理，同一身份证30天内限办一张</li>
                    <li>
                        收到SIM卡后请尽快完成实名激活，激活后按套餐要求首充
                    </li>
                    {product.ageLimit && (
                        <li>办理年龄限制：{product.ageLimit}</li>
                    )}
                    {product.otherRemarks && (
                        <li>备注：{product.otherRemarks}</li>
                    )}
                    <li>如有疑问请联系客服咨询，切勿轻信非官方渠道信息</li>
                </ul>
            </section>

            {/* ===== 套餐标签 ===== */}
            {tags.length > 0 && (
                <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
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

            {/* ===== 常见问题 ===== */}
            <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-blue-600" />
                    <h2 className="text-base font-bold text-gray-800">常见问题</h2>
                </div>
                <div className="space-y-3">
                    {[
                        {
                            q: "套餐资费如何计算？",
                            a: `本套餐月租为¥${price}/月${flowText ? `，包含${flowText}流量` : ""}。具体资费以运营商实际扣费为准，激活后请留意首月资费说明。`,
                        },
                        {
                            q: "如何激活卡片？",
                            a: product.openCardMethod ||
                                "收到SIM卡后，请按照随卡附带的激活指引完成实名认证和激活操作。一般需要下载对应运营商APP或扫描卡片上的二维码进行自助激活。",
                        },
                        {
                            q: "流量什么时候到账？",
                            a: "激活成功后，流量一般在24小时内到账，部分卡品可能需要在指定渠道首充后才能全额到账。首月流量可能按剩余天数比例发放，次月起全额发放。",
                        },
                        {
                            q: "归属地是哪里？可以选号吗？",
                            a: `${product._location ? `归属地为${product._location}` : "归属地由运营商系统自动分配"}。${product.isSelectNumber === 1 ? "本商品支持选号" : "大部分卡品不支持选号，号码随机分配。"}`,
                        },
                        {
                            q: "合约期多久？可以注销吗？",
                            a: product.packageContract
                                ? `本套餐合约周期为${product.packageContract}。合约期内注销可能需要支付违约金，具体以运营商政策为准。`
                                : `${duration !== "未知" ? `本套餐为${duration}` : "一般为6-24个月"}。合约期内注销可能需要支付违约金，具体以运营商政策为准。`,
                        },
                        {
                            q: "发货和物流时效？",
                            a: `订单审核通过后，一般1-3个工作日内发货，采用${product.deliveryMethod || "快递"}包邮配送。`,
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

            {/* ===== 联系我们 ===== */}
            <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
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
                                service@liuliangpai.com
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

/** 卡业联盟商品详情客户端组件入口 */
export default function DetailContent({ product, error }: DetailContentProps) {
    // 商品未找到或加载出错时展示错误页面
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
