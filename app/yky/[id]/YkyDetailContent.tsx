/**
 * 翼卡云商品详情客户端组件
 *
 * 展示翼卡云商品的完整套餐信息：
 * - 运营商/月租/流量/语音/套餐时长
 * - 商品描述/详情图/选号模式
 * - 佣金信息/结算要求
 * - 激活说明/常见问题/温馨提示
 * 数据来源：翼卡云开放API /openapi/goods/details
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import type { YkyProductDetail, YkyOperator } from "@/lib/api/yky";
import {
    mapYkyOperator,
    YKY_OPERATOR_LABEL,
    parseYkyVoice,
    parseYkyTotalFlow,
    parseYkyDuration,
    getSettleModeText,
    getSelectNumberText,
    getYkyOrderUrl,
} from "@/lib/api/yky";
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
    CheckCircle2,
    Banknote,
    Phone,
    Mail,
    Clock,
    Star,
    Zap,
    MapPin,
    BadgeCheck,
} from "lucide-react";

/* ========== Props ========== */

interface YkyDetailContentProps {
    product: YkyProductDetail | null;
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

/** 商品未找到或加载失败时的回退页 */
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
                        href="/yky"
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

/** 页面顶部面包屑 */
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
                        <Link href="/yky" className="hover:text-blue-600">
                            翼卡云
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

/** 参数展示卡片（渐变背景） */
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

/* ========== 信息行组件 ========== */

/** 带图标的信息行 */
function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-3 text-sm text-gray-600">
            <Icon className="size-4 shrink-0 text-gray-400" />
            <span className="font-medium text-gray-700">{label}：</span>
            <span>{value}</span>
        </div>
    );
}

/* ========== 商品详情主体 ========== */

/** 商品详情主展示组件 */
function ProductDetail({ product }: { product: YkyProductDetail }) {
    const operator = mapYkyOperator(product.operatorType) as YkyOperator;
    const ui = OPERATOR_UI[operator] || OPERATOR_UI.unknown;
    const voice = parseYkyVoice(product);
    const totalFlow = parseYkyTotalFlow(product);
    const duration = parseYkyDuration(product);
    const settleText = getSettleModeText(product.settleMode);
    const selectText = getSelectNumberText(product.selectNumber);
    // 使用优惠月租作为展示价格
    const displayPrice = product.favourMonthFee || product.monthFee;
    const orderUrl = getYkyOrderUrl(product.id);

    /* ===== 生成标签列表 ===== */
    const tags = product.tagsSelect || [];
    // 从产品数据生成详情标签
    const detailTags: { text: string; className: string }[] = [];

    if (totalFlow) {
        detailTags.push({
            text: `${totalFlow}流量`,
            className: "bg-blue-50 text-blue-600 border-blue-100",
        });
    }
    if (voice) {
        detailTags.push({
            text: voice,
            className: "bg-green-50 text-green-600 border-green-100",
        });
    }
    if (settleText) {
        detailTags.push({
            text: settleText,
            className: "bg-amber-50 text-amber-600 border-amber-100",
        });
    }
    if (duration && duration !== "以套餐为准") {
        detailTags.push({
            text: duration,
            className: "bg-purple-50 text-purple-600 border-purple-100",
        });
    }

    return (
        <div className={containerClass("py-6 lg:py-10")} style={SITE_WIDTH_STYLE}>
            {/* ===== 上部分：图片 + 基本信息 ===== */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* 商品图片 */}
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                    <div className="relative aspect-square overflow-hidden">
                        {product.tips ? (
                            <Image
                                src={product.tips}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                <Signal className="size-16 text-gray-300" />
                            </div>
                        )}
                    </div>
                </div>

                {/* 商品信息 */}
                <div>
                    {/* 运营商标签 + 状态 */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${ui.badge}`}
                        >
                            <Signal className="mr-1 size-3.5" />
                            {YKY_OPERATOR_LABEL[operator]}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                            <ShieldCheck className="size-3.5" />
                            在售中
                        </span>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                            {settleText}
                        </span>
                        {product.star >= 4 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                <Star className="size-3 fill-amber-500 text-amber-500" />
                                {product.star}星推荐
                            </span>
                        )}
                    </div>

                    {/* 商品名称 */}
                    <h1 className="mb-2 text-xl font-bold text-gray-900 lg:text-2xl">
                        {product.name}
                    </h1>

                    {/* 简要描述 */}
                    <p className="mb-4 text-sm text-gray-500">
                        售价¥{product.price}
                        {product.monthFee > 0 && ` · 月租¥${product.monthFee}`}
                        {product.favourMonthFee > 0 && product.favourMonthFee !== product.monthFee && ` · 优惠月租¥${product.favourMonthFee}`}
                    </p>

                    {/* 核心参数 */}
                    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <ParamCard
                            label="月租费用"
                            value={`¥${displayPrice}`}
                            unit="/月"
                            gradientFrom="from-blue-50"
                            gradientTo="to-indigo-50"
                            textColor="text-blue-600"
                        />
                        <ParamCard
                            label="通用流量"
                            value={product.commonFlow > 0 ? `${product.commonFlow}GB` : "—"}
                            unit="全国通用"
                            gradientFrom="from-blue-50"
                            gradientTo="to-cyan-50"
                            textColor="text-blue-600"
                        />
                        <ParamCard
                            label="通话时长"
                            value={product.callDuration > 0 ? `${product.callDuration}` : "—"}
                            unit={product.callDuration > 0 ? "分钟" : ""}
                            gradientFrom="from-green-50"
                            gradientTo="to-emerald-50"
                            textColor="text-green-600"
                        />
                        <ParamCard
                            label="定向流量"
                            value={product.fixedFlow > 0 ? `${product.fixedFlow}GB` : "—"}
                            unit="定向专属"
                            gradientFrom="from-purple-50"
                            gradientTo="to-pink-50"
                            textColor="text-purple-600"
                        />
                    </div>

                    {/* 基础信息行 */}
                    <div className="mb-4 space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <InfoRow
                            icon={Banknote}
                            label="佣金金额"
                            value={`¥${product.commission || 0}${settleText ? ` (${settleText})` : ""}`}
                        />
                        <InfoRow
                            icon={MapPin}
                            label="选号模式"
                            value={selectText}
                        />
                        <InfoRow
                            icon={Clock}
                            label="套餐时长"
                            value={duration}
                        />
                        <InfoRow
                            icon={Zap}
                            label="短信验证"
                            value={product.smsCode === 1 ? "需要短信验证码" : "无需短信验证码"}
                        />
                        <InfoRow
                            icon={BadgeCheck}
                            label="上传照片"
                            value={product.uploadPhoto !== "0" ? "需要上传证件照" : "无需上传照片"}
                        />
                        {product.compliance && (
                            <InfoRow
                                icon={ShieldCheck}
                                label="结算要求"
                                value={product.compliance}
                            />
                        )}
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
                            href="/yky"
                            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-blue-600 bg-white px-6 py-3 text-sm font-bold text-blue-600 transition-all hover:bg-blue-50"
                        >
                            <ArrowLeft className="size-4" />
                            返回列表
                        </Link>
                    </div>
                </div>
            </div>

            {/* ===== 商品详情图 ===== */}
            {product.details && product.details.length > 0 && (
                <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="h-5 w-1 rounded-full bg-blue-600" />
                        <h2 className="text-base font-bold text-gray-800">商品详情</h2>
                    </div>
                    <div className="space-y-3">
                        {product.details.map((imgUrl, i) => (
                            <div key={i} className="relative aspect-video w-full overflow-hidden rounded-lg">
                                <Image
                                    src={imgUrl}
                                    alt={`${product.name} 详情图 ${i + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 768px"
                                />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ===== 商品描述 ===== */}
            {product.des && (
                <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="h-5 w-1 rounded-full bg-blue-600" />
                        <h2 className="text-base font-bold text-gray-800">套餐描述</h2>
                    </div>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                        {product.des}
                    </p>
                </section>
            )}

            {/* ===== 佣金详情 ===== */}
            <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-blue-600" />
                    <h2 className="text-base font-bold text-gray-800">佣金详情</h2>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <div>
                            <span className="font-semibold text-gray-800">结算模式：</span>
                            {settleText}
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <div>
                            <span className="font-semibold text-gray-800">达标佣金：</span>
                            <span className="font-bold text-blue-600">¥{product.commission || 0}</span>
                        </div>
                    </div>
                    {product.monthCommission && product.monthCommission.length > 0 && (
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                            <div>
                                <span className="font-semibold text-gray-800">月返佣金：</span>
                                {product.monthCommission.map((mc, i) => (
                                    <span key={i} className="mr-2 text-blue-600">
                                        第{mc.month}月 ¥{mc.commission}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {product.compliance && (
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                            <div>
                                <span className="font-semibold text-gray-800">结算要求：</span>
                                {product.compliance}
                            </div>
                        </div>
                    )}
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <div>
                            <span className="font-semibold text-gray-800">售价：</span>
                            <span className="font-bold">¥{product.price || 0}</span>
                            {product.monthFee > 0 && ` (月租 ¥${product.monthFee})`}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== 套餐详情 ===== */}
            <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-blue-600" />
                    <h2 className="text-base font-bold text-gray-800">套餐详情</h2>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <div>
                            <span className="font-semibold text-gray-800">月租费用：</span>
                            每月
                            <span className="font-bold text-blue-600">
                                ¥{displayPrice}
                            </span>
                            {product.favourTerm > 0 && ` (优惠${product.favourTerm}个月)`}
                        </div>
                    </div>
                    {product.commonFlow > 0 && (
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                            <div>
                                <span className="font-semibold text-gray-800">通用流量：</span>
                                <span className="font-bold">{product.commonFlow}GB</span> 全国通用流量
                            </div>
                        </div>
                    )}
                    {product.fixedFlow > 0 && (
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                            <div>
                                <span className="font-semibold text-gray-800">定向流量：</span>
                                <span className="font-bold">{product.fixedFlow}GB</span> 指定APP专属流量
                            </div>
                        </div>
                    )}
                    {product.callDuration > 0 && (
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                            <div>
                                <span className="font-semibold text-gray-800">语音通话：</span>
                                <span className="font-bold">{product.callDuration}分钟</span> 全国通话
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
                            {duration}
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <div>
                            <span className="font-semibold text-gray-800">发货方式：</span>
                            京东/顺丰包邮到家，1-3天送达
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <div>
                            <span className="font-semibold text-gray-800">运营商：</span>
                            {YKY_OPERATOR_LABEL[operator]}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== 激活说明 ===== */}
            <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
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
            <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-700">
                    <Info className="size-4" />
                    温馨提示
                </h3>
                <ul className="ml-5 list-disc space-y-1.5 text-xs leading-relaxed text-amber-700">
                    <li>本套餐仅限新用户办理，同一身份证限办一张</li>
                    <li>收到SIM卡后请尽快完成实名激活，激活后按套餐要求首充</li>
                    {product.smsCode === 1 && (
                        <li>办理本套餐需要短信验证码验证，请保持手机畅通</li>
                    )}
                    {product.uploadPhoto !== "0" && (
                        <li>本套餐需要上传身份证照片及个人半身照，请提前准备</li>
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
                        {tags.map((tag, i) => (
                            <span
                                key={i}
                                className="inline-block rounded-lg border bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600"
                            >
                                {tag.label}
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
                            a: `本套餐月租为¥${displayPrice}/月${product.favourTerm > 0 ? `（优惠期${product.favourTerm}个月）` : ""}，包含${product.commonFlow + product.fixedFlow}GB流量${product.callDuration > 0 ? `和${product.callDuration}分钟通话时长` : ""}。具体资费以运营商实际扣费为准。`,
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
                            q: "可以选号吗？归属地如何？",
                            a: `${selectText}。归属地由运营商系统根据选号模式自动分配。`,
                        },
                        {
                            q: "佣金如何结算？",
                            a: `本套餐返佣模式为${settleText}，达标佣金为¥${product.commission || 0}。${product.compliance ? `结算要求：${product.compliance}` : ""}`,
                        },
                        {
                            q: "发货和物流时效？",
                            a: "订单审核通过后，一般1-3个工作日内发货，采用京东或顺丰快递包邮配送。审核时间一般为1-2个工作日。",
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
                <p className="mb-4 text-sm text-gray-500">如有任何疑问，请通过以下方式联系我们</p>
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <Phone className="size-5 text-blue-600" />
                        <div>
                            <p className="text-xs text-gray-400">客服电话</p>
                            <p className="text-sm font-semibold text-gray-800">400-xxx-xxxx</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <Mail className="size-5 text-blue-600" />
                        <div>
                            <p className="text-xs text-gray-400">客服邮箱</p>
                            <p className="text-sm font-semibold text-gray-800">service@87haoka.cn</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <Clock className="size-5 text-blue-600" />
                        <div>
                            <p className="text-xs text-gray-400">服务时间</p>
                            <p className="text-sm font-semibold text-gray-800">周一至周日 9:00-21:00</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== 固定底部办理按钮（移动端） ===== */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm lg:hidden">
                <a
                    href={orderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 text-sm font-bold text-white shadow-lg"
                >
                    <ShoppingCart className="size-5" />
                    立即免费办理
                </a>
            </div>

            {/* 移动端底部安全间距 */}
            <div className="h-20 lg:hidden" />
        </div>
    );
}

/* ========== 页面入口 ========== */

/** 翼卡云商品详情页主组件 */
export default function YkyDetailContent({
    product,
    error,
}: YkyDetailContentProps) {
    if (!product || error) {
        return <NotFoundPage error={error || undefined} />;
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
            <Header />
            <Breadcrumb productName={product.name} />
            <main className="flex-1">
                <ProductDetail product={product} />
            </main>
            <Footer />
        </div>
    );
}
