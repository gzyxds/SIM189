/**
 * 林夕通信商品详情客户端组件
 *
 * 展示林夕通信商品的完整套餐信息：
 * - 运营商/归属地/禁发区域
 * - 月租/流量/语音/套餐时长
 * - 套餐描述（shop_des）/ 套餐资料（shop_rule）
 * - 年龄要求/选号/返佣类型
 * - 激活说明/常见问题/温馨提示
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import type { LinxiProductWithMeta, LinxiOperator } from "@/lib/api/linxi";
import {
  mapLinxiOperator,
  LINXI_OPERATOR_LABEL,
  parseLinxiPrice,
  parseLinxiFlow,
  parseLinxiVoice,
  parseLinxiDuration,
  parseLinxiTags,
} from "@/lib/api/linxi";
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
  MapPin,
  Users,
  Clock,
  BadgeCheck,
  Banknote,
  Phone,
  Mail,
} from "lucide-react";

/* ========== Props ========== */

interface LinxiDetailContentProps {
  product: LinxiProductWithMeta | null;
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

/** 返佣类型标签配置 */
const COMMISSION_LABEL: Record<string, string> = {
  "0": "次月返佣金",
  "1": "秒返佣金",
  "2": "月月返佣金",
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
            href="/linxi"
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
            <Link href="/linxi" className="hover:text-blue-600">
              林夕通信
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
function ProductDetail({ product }: { product: LinxiProductWithMeta }) {
  const operator = mapLinxiOperator(product.shop_yys) as LinxiOperator;
  const ui = OPERATOR_UI[operator] || OPERATOR_UI.unknown;
  const price = parseLinxiPrice(product.shop_des || product.shop_name);
  const flow = parseLinxiFlow(product.shop_des || product.shop_name);
  const voice = parseLinxiVoice(product.shop_des || product.shop_name);
  const duration = parseLinxiDuration(product.shop_des || product.shop_name);
  const tags = parseLinxiTags(product);

  /** 返佣类型文本 */
  const commissionText =
    COMMISSION_LABEL[product.shop_money] || "次月返佣金";

  /** 办理链接（由服务端预计算的精准带 uid+pid 链接） */
  const orderUrl = product._orderUrl;

  return (
    <div className={containerClass("py-6 lg:py-10")} style={SITE_WIDTH_STYLE}>
      {/* ===== 上部分：图片 + 基本信息 ===== */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 商品图片 */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
          <div className="relative aspect-square overflow-hidden">
            {product.shop_img ? (
              <Image
                src={product.shop_img}
                alt={product.shop_name}
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
              {LINXI_OPERATOR_LABEL[operator]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
              <ShieldCheck className="size-3.5" />
              在售中
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
              {commissionText}
            </span>
          </div>

          {/* 套餐名称 */}
          <h1 className="mb-2 text-xl font-bold text-gray-900 lg:text-2xl">
            {product.shop_name}
          </h1>

          {/* 简要描述 */}
          <p className="mb-4 text-sm text-gray-500">
            {product.shop_yys}
            {product.gsd_province ? ` · 归属地：${product.gsd_province}${product.gsd_city ? product.gsd_city : ""}` : ""}
            {product.Prohibited ? ` · 禁发：${product.Prohibited}` : ""}
          </p>

          {/* 核心参数 */}
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ParamCard
              label="月租费用"
              value={price > 0 ? `¥${price}` : "面议"}
              unit="/月"
              gradientFrom="from-blue-50"
              gradientTo="to-indigo-50"
              textColor="text-blue-600"
            />
            <ParamCard
              label="月流量"
              value={flow || "—"}
              unit="全国通用"
              gradientFrom="from-blue-50"
              gradientTo="to-cyan-50"
              textColor="text-blue-600"
            />
            <ParamCard
              label="语音通话"
              value={voice ? voice.replace("分钟", "") : "—"}
              unit={voice ? "分钟" : ""}
              gradientFrom="from-green-50"
              gradientTo="to-emerald-50"
              textColor="text-green-600"
            />
            <ParamCard
              label="套餐时长"
              value={duration}
              gradientFrom="from-purple-50"
              gradientTo="to-pink-50"
              textColor="text-purple-600"
            />
          </div>

          {/* 基础信息行 */}
          <div className="mb-4 space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <InfoRow
              icon={MapPin}
              label="归属地"
              value={
                product.gsd_province
                  ? `${product.gsd_province}${product.gsd_city ? " " + product.gsd_city : ""}`
                  : "随机归属地"
              }
            />
            <InfoRow
              icon={Users}
              label="年龄要求"
              value={`${product.min_age || 18} ~ ${product.max_age || 60} 岁`}
            />
            <InfoRow icon={Clock} label="套餐时长" value={duration} />
            <InfoRow
              icon={BadgeCheck}
              label="选号支持"
              value={product.shop_number ? "支持选号" : "不支持选号，号码随机"}
            />
            <InfoRow
              icon={Banknote}
              label="返佣类型"
              value={commissionText}
            />
            {product.Prohibited && (
              <InfoRow icon={MapPin} label="禁发地区" value={product.Prohibited} />
            )}
          </div>

          {/* 套餐标签 */}
          {tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className={`inline-block rounded-lg border px-3 py-1 text-xs font-medium ${tag.className}`}
                >
                  {tag.text}
                </span>
              ))}
            </div>
          )}

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
              href="/linxi"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-blue-600 bg-white px-6 py-3 text-sm font-bold text-blue-600 transition-all hover:bg-blue-50"
            >
              <ArrowLeft className="size-4" />
              返回列表
            </Link>
          </div>
        </div>
      </div>

      {/* ===== 套餐描述 ===== */}
      {product.shop_des && (
        <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-blue-600" />
            <h2 className="text-base font-bold text-gray-800">套餐描述</h2>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
            {product.shop_des}
          </p>
        </section>
      )}

      {/* ===== 套餐资料 ===== */}
      {product.shop_rule && (
        <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-blue-600" />
            <h2 className="text-base font-bold text-gray-800">套餐资料</h2>
          </div>
          <div
            className="shop-rule-content text-sm leading-relaxed text-gray-600"
            dangerouslySetInnerHTML={{ __html: product.shop_rule }}
          />
        </section>
      )}

      {/* ===== 可发货省份 ===== */}
      {product.shop_provinces && (
        <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-blue-600" />
            <h2 className="text-base font-bold text-gray-800">可发货省份</h2>
          </div>
          <p className="text-sm text-gray-600">{product.shop_provinces}</p>
        </section>
      )}

      {/* ===== 套餐详情 ===== */}
      <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-blue-600" />
          <h2 className="text-base font-bold text-gray-800">套餐详情</h2>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          {price > 0 && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
              <div>
                <span className="font-semibold text-gray-800">月租费用：</span>
                每月仅需{" "}
                <span className="font-bold text-blue-600">¥{price}</span>
              </div>
            </div>
          )}
          {flow && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
              <div>
                <span className="font-semibold text-gray-800">月流量：</span>
                <span className="font-bold">{flow}</span> 全国通用流量
              </div>
            </div>
          )}
          {voice && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
              <div>
                <span className="font-semibold text-gray-800">语音通话：</span>
                <span className="font-bold">{voice}</span> 全国通话
              </div>
            </div>
          )}
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
              <span className="font-semibold text-gray-800">运营商：</span>
              {product.shop_yys || LINXI_OPERATOR_LABEL[operator]}
            </div>
          </div>
          {product.Prohibited && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-red-400" />
              <div>
                <span className="font-semibold text-gray-800">禁发地区：</span>
                <span className="text-red-500">{product.Prohibited}</span>
              </div>
            </div>
          )}
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
              <span className="font-semibold text-gray-800">佣金金额：</span>
              <span className="font-bold text-blue-600">¥{product.shop_bkge}</span>
              {" "}({commissionText})
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
          <li>
            本套餐仅限年龄 {product.min_age || 18} ~ {product.max_age || 60} 岁用户办理，同一身份证限办一张
          </li>
          <li>收到SIM卡后请尽快完成实名激活，激活后按套餐要求首充</li>
          {product.Prohibited && (
            <li>
              本套餐不支持发货至：
              <span className="font-semibold">{product.Prohibited}</span>
            </li>
          )}
          {product.shop_photos !== "0" && (
            <li>本套餐需要上传身份证照片及个人半身照，请提前准备</li>
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
            {
              q: "套餐资费如何计算？",
              a: `本套餐月租为${price > 0 ? `¥${price}/月` : "面议"}，${flow ? `包含${flow}流量` : ""}${voice ? `和${voice}通话时长` : ""}。具体资费以运营商实际扣费为准，激活后请留意首月资费说明。`,
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
              a: `归属地为 ${product.gsd_province || "随机分配"}${product.gsd_city ? " " + product.gsd_city : ""}。${product.shop_number ? "支持选号，可在下单时选择心仪号码。" : "大部分卡品不支持选号，号码随机分配。"}`,
            },
            {
              q: "佣金如何结算？",
              a: `本套餐返佣模式为${commissionText}，佣金金额为¥${product.shop_bkge}。${product.rebate_num && product.rebate_num !== "0" ? `共计返利${product.rebate_num}个月。` : ""}`,
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
              <p className="text-sm font-semibold text-gray-800">service@vip12300.cn</p>
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

      {/* ===== 固定底部办理按钮 ===== */}
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

/* ========== 套餐资料样式 ========== */

/** 注入套餐资料 HTML 内容的全局样式（客户端注入） */
function ShopRuleStyles() {
  return (
    <style jsx global>{`
      .shop-rule-content p {
        margin-bottom: 0.5rem;
        line-height: 1.7;
      }
      .shop-rule-content p:last-child {
        margin-bottom: 0;
      }
    `}</style>
  );
}

/* ========== 页面入口 ========== */

/** 林夕通信商品详情页主组件 */
export default function LinxiDetailContent({
  product,
  error,
}: LinxiDetailContentProps) {
  if (!product || error) {
    return <NotFoundPage error={error || undefined} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
      <ShopRuleStyles />
      <Header />
      <Breadcrumb productName={product.shop_name} />
      <main className="flex-1">
        <ProductDetail product={product} />
      </main>
      <Footer />
    </div>
  );
}
