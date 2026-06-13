/**
 * 卡世界商品详情页面内容组件
 *
 * 根据商品ID展示商品详细信息（月租/流量/通话/归属地/佣金等）
 * 数据来源：卡世界号卡管理系统
 */

"use client";

import Link from "next/link";
import type { KsjProductWithMeta } from "@/lib/api/ksj";
import { KSJ_OPERATOR_LABEL, KSJ_OPERATOR_STYLE, getKsjApplyUrl } from "@/lib/api/ksj";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";
import {
    Signal,
    ArrowLeft,
    ChevronRight,
    ShieldCheck,
    Info,
    ExternalLink,
    CheckCircle2,
    Mail,
    Phone,
    Clock,
    Truck,
    User,
} from "lucide-react";

/* ========== Props 类型 ========== */

interface DetailContentProps {
    product: KsjProductWithMeta | null;
    error: string | null;
}

/* ========== 工具函数 ========== */

/** 从商品名称提取月租价格 */
function parsePrice(name: string): string {
    return name.match(/(\d+\.?\d*)元/)?.[1] || "?";
}

/** 从套餐组成提取流量 */
function parseFlow(composition: string): string {
    return composition.match(/(\d+)G/)?.[0] || "";
}

/** 从套餐组成提取通话 */
function parseVoice(composition: string): string {
    return composition.match(/(\d+)分钟/)?.[0] || "";
}

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
                    <p className="mb-4 text-sm text-gray-400">{error || "该商品不存在或已下架"}</p>
                    <Link href="/ksj" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500">
                        <ArrowLeft className="size-4" /> 返回商品列表
                    </Link>
                </div>
            </main>
            <Footer />
        </div>
    );
}

/* ========== 面包屑 ========== */

function Breadcrumb({ productName }: { productName: string }) {
    return (
        <nav className="border-b bg-white py-3">
            <div className={containerClass()} style={SITE_WIDTH_STYLE}>
                <ol className="flex items-center gap-2 text-sm text-gray-500">
                    <li><Link href="/" className="hover:text-blue-600">首页</Link></li>
                    <li className="text-gray-300">/</li>
                    <li><Link href="/ksj" className="hover:text-blue-600">卡世界</Link></li>
                    <li className="text-gray-300">/</li>
                    <li className="max-w-[200px] truncate font-medium text-gray-800">{productName}</li>
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
        <div className={`rounded-xl bg-linear-to-br p-4 text-center ${gradientFrom || "from-blue-50"} ${gradientTo || "to-indigo-50"}`}>
            <p className="mb-1 text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-black ${textColor || "text-gray-800"}`}>{value}</p>
            {unit && <p className="text-xs text-gray-400">{unit}</p>}
        </div>
    );
}

/* ========== 商品详情主体 ========== */

function ProductDetail({ product }: { product: KsjProductWithMeta }) {
    const opStyle = KSJ_OPERATOR_STYLE[product._operator] || KSJ_OPERATOR_STYLE.unknown;
    const price = parsePrice(product.name);
    const flowText = parseFlow(product.package_composition);
    const voiceText = parseVoice(product.package_composition);

    return (
        <div className={containerClass("py-6 lg:py-10")} style={SITE_WIDTH_STYLE}>
            {/* ===== 上部分：图片 + 信息 ===== */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* 商品图片 */}
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                    <div className="relative aspect-square overflow-hidden">
                        {product._mainImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={product._mainImageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        ) : product._imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={product._imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center bg-gray-100">
                                <span className="text-sm text-gray-400">暂无图片</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 商品信息 */}
                <div>
                    {/* 标签 */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${opStyle.badge}`}>
                            <Signal className="mr-1 size-3.5" />{KSJ_OPERATOR_LABEL[product._operator]}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                            <ShieldCheck className="size-3.5" />在售中
                        </span>
                        {product.agent_brokerage > 0 && (
                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                                佣金¥{product.agent_brokerage}
                            </span>
                        )}
                    </div>

                    <h1 className="mb-2 text-xl font-bold text-gray-900 lg:text-2xl">{product.name}</h1>
                    <p className="mb-4 text-sm text-gray-500">
                        月租¥{price} · {flowText || "流量"}{voiceText ? ` · ${voiceText}` : ""} · {product.package_attribution || "全国"}
                    </p>

                    {/* 核心参数 */}
                    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <ParamCard label="月租费用" value={`¥${price}`} unit="/月" gradientFrom="from-blue-50" gradientTo="to-indigo-50" textColor="text-blue-600" />
                        <ParamCard label="通用流量" value={flowText || "—"} unit="全国通用" gradientFrom="from-blue-50" gradientTo="to-cyan-50" textColor="text-blue-600" />
                        <ParamCard label="通话时长" value={voiceText ? voiceText.replace("分钟", "") : "—"} unit={voiceText ? "分钟" : ""} gradientFrom="from-green-50" gradientTo="to-emerald-50" textColor="text-green-600" />
                        <ParamCard label="代理佣金" value={`¥${product.agent_brokerage}`} unit="每单" gradientFrom="from-red-50" gradientTo="to-orange-50" textColor="text-red-600" />
                    </div>

                    {/* 发货区域 + 套餐特点 */}
                    <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <p className="mb-1 text-xs font-semibold text-gray-700">归属地</p>
                            <p className="text-sm font-medium text-blue-600">{product.package_attribution || "全国"}</p>
                            <p className="mt-0.5 text-xs text-gray-400">不发区域：{product.forbidden_area || "无（全国可发）"}</p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <p className="mb-1 text-xs font-semibold text-gray-700">配送方式</p>
                            <p className="text-sm font-medium text-blue-600">{product.delivery || "免费包邮"}</p>
                            <p className="mt-0.5 text-xs text-gray-400">{product.activate_type || "快递激活"}</p>
                        </div>
                    </div>

                    {/* 办理条件 */}
                    <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <h3 className="mb-2 text-sm font-bold text-gray-800">办理条件</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <Clock className="size-4 text-gray-400" />
                                {product.package_contract_text || "标准套餐"}
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="size-4 text-gray-400" />
                                {product.age_limit || "18-65岁"}
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-gray-400" />
                                需实名认证
                            </div>
                            <div className="flex items-center gap-2">
                                <Truck className="size-4 text-gray-400" />
                                {product.delivery || "包邮"}
                            </div>
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                        <a
                            href={getKsjApplyUrl(product.goods_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-linear-to-r from-blue-600 to-blue-700 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                        >
                            <ExternalLink className="size-5" />立即办理
                        </a>
                        <Link
                            href="/ksj"
                            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-blue-600 bg-white px-6 py-3 text-sm font-bold text-blue-600 transition-all hover:bg-blue-50"
                        >
                            <ArrowLeft className="size-4" />返回列表
                        </Link>
                    </div>
                </div>
            </div>

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
                            每月仅需 <span className="font-bold text-blue-600">¥{price}</span>
                        </div>
                    </div>
                    {flowText && (
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                            <div>
                                <span className="font-semibold text-gray-800">月流量：</span>
                                <span className="font-bold">{flowText}</span> 全国通用流量，不限APP
                            </div>
                        </div>
                    )}
                    {voiceText && (
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                            <div>
                                <span className="font-semibold text-gray-800">语音通话：</span>
                                <span className="font-bold">{voiceText}</span> 全国通话
                            </div>
                        </div>
                    )}
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <div><span className="font-semibold text-gray-800">网络制式：</span>支持5G/4G网络</div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <div><span className="font-semibold text-gray-800">合约期限：</span>{product.package_contract_text || "以运营商实际政策为准"}</div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <div><span className="font-semibold text-gray-800">配送方式：</span>{product.delivery || "包邮"}，1-3天送达</div>
                    </div>
                </div>
            </section>

            {/* ===== 佣金与结算信息 ===== */}
            {product.agent_brokerage > 0 && (
                <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="h-5 w-1 rounded-full bg-red-500" />
                        <h2 className="text-base font-bold text-gray-800">佣金与结算</h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-100 bg-red-50 p-4">
                            <p className="mb-1 text-xs text-gray-500">单笔佣金</p>
                            <p className="text-2xl font-bold text-red-600">¥{product.agent_brokerage}</p>
                            <p className="mt-1 text-xs text-gray-400">{product.brokerage_type_text || "次月结算"}</p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <p className="mb-1 text-xs text-gray-500">结算规则</p>
                            <p className="text-sm font-medium text-gray-700">{product.commission || "以平台规则为准"}</p>
                            <p className="mt-1 text-xs text-gray-400">首充: {product.initial_charge_channel || "按提示操作"}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* ===== 激活说明 ===== */}
            <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-blue-600" />
                    <h2 className="text-base font-bold text-gray-800">激活说明</h2>
                </div>
                <ol className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
                        <div>收到SIM卡后，根据激活方式（{product.activate_type || "自助激活"}）完成操作</div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
                        <div>准备好本人身份证，按照指引完成实名认证（需进行人脸识别）</div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
                        <div>认证通过后插入SIM卡，按套餐要求完成首充激活</div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">4</span>
                        <div>激活成功后流量一般在24小时内到账，即可正常使用</div>
                    </li>
                </ol>
            </section>

            {/* ===== 套餐标签 ===== */}
            {product._tags.length > 0 && (
                <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="h-5 w-1 rounded-full bg-blue-600" />
                        <h2 className="text-base font-bold text-gray-800">套餐标签</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {product._tags.map((t, i) => (
                            <span key={i} className={`inline-block rounded-lg border px-3 py-1.5 text-xs font-medium ${t.className}`}>
                                {t.text}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* ===== 温馨提示 ===== */}
            <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-700">
                    <Info className="size-4" />温馨提示
                </h3>
                <ul className="ml-5 list-disc space-y-1.5 text-xs leading-relaxed text-amber-700">
                    <li>本套餐仅限新用户办理，同一身份证30天内限办一张</li>
                    <li>收到SIM卡后请尽快完成实名激活，激活后按套餐要求首充</li>
                    {product.forbidden_area && (
                        <li>发货限制：{product.forbidden_area}</li>
                    )}
                    <li>如有疑问请联系客服咨询，切勿轻信非官方渠道信息</li>
                </ul>
            </section>

            {/* ===== 常见问题 ===== */}
            <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-blue-600" />
                    <h2 className="text-base font-bold text-gray-800">常见问题</h2>
                </div>
                <div className="space-y-3">
                    {[
                        { q: "套餐资费如何计算？", a: `本套餐月租为¥${price}/月，包含${flowText || "大流量"}流量${voiceText ? `和${voiceText}通话时长` : ""}。具体资费以运营商实际扣费为准。` },
                        { q: "如何激活卡片？", a: `本商品采用${product.activate_type || "自助激活"}方式。收到SIM卡后，请按照随卡附带的激活指引完成实名认证和激活操作。激活时可能需要首充，请按页面提示操作。` },
                        { q: "流量什么时候到账？", a: "激活成功后，流量一般在24小时内到账，部分卡品可能需要在指定渠道首充后才能全额到账。首月流量可能按剩余天数比例发放。" },
                        { q: "归属地是哪里？可以选号吗？", a: `归属地为${product.package_attribution || "运营商系统自动分配"}。大部分卡品不支持选号，号码随机分配。` },
                        { q: "合约期多久？可以注销吗？", a: `本套餐合约期为${product.package_contract_text || "以运营商政策为准"}。合约期内注销可能需要支付违约金。${product.logout_mode ? `注销方式：${product.logout_mode}` : ""}` },
                        { q: "发货和物流时效？", a: `采用${product.delivery || "快递包邮"}配送，订单审核通过后一般1-3个工作日内发货。` },
                    ].map((faq, i) => (
                        <details key={i} className="group rounded-xl border border-gray-100 bg-white">
                            <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-semibold text-gray-800">
                                <span className="flex items-center gap-2">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-blue-600/10 text-xs font-bold text-blue-600">Q</span>
                                    {faq.q}
                                </span>
                                <ChevronRight className="size-4 text-gray-400 transition-transform duration-300 group-open:rotate-90" />
                            </summary>
                            <div className="border-t border-gray-100 px-4 pb-4 pt-3 text-sm leading-relaxed text-gray-500">{faq.a}</div>
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
                        <div><p className="text-xs text-gray-400">客服电话</p><p className="text-sm font-semibold text-gray-800">400-xxx-xxxx</p></div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <Mail className="size-5 text-blue-600" />
                        <div><p className="text-xs text-gray-400">客服邮箱</p><p className="text-sm font-semibold text-gray-800">service@example.com</p></div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <Clock className="size-5 text-blue-600" />
                        <div><p className="text-xs text-gray-400">服务时间</p><p className="text-sm font-semibold text-gray-800">周一至周日 9:00-21:00</p></div>
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
            <Breadcrumb productName={product.short_name || product.name} />
            <main>
                <ProductDetail product={product} />
            </main>
            <Footer />
        </div>
    );
}
