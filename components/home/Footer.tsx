import Link from "next/link";
import Image from "next/image";
import { SITE_WIDTH_STYLE, containerClass } from "@/lib/layout";

/** 页面底部组件 */
export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className={containerClass("py-14 md:py-16")} style={SITE_WIDTH_STYLE}>
        {/* ===== 品牌区域 ===== */}
        <div className="mb-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="号卡之家 Logo"
              width={32}
              height={32}
              className="size-8"
            />
            <span className="text-lg font-bold tracking-tight">
              号卡之家
            </span>
          </Link>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            专注为用户提供正规、优惠、便捷的流量卡办理服务，让上网更自由。
          </p>
        </div>

        {/* ===== 导航区域：4 列布局，与 Header 菜单栏对应 ===== */}
        <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-4 border-t pt-10">
          {/* 号卡平台 */}
          <div>
            <h4 className="mb-4 text-base font-semibold">号卡平台</h4>
            <ul className="space-y-2.5 text-base text-muted-foreground">
              <li>
                <Link href="/lotml" className="transition-colors hover:text-foreground">
                  号卡联盟
                </Link>
              </li>
              <li>
                <Link href="/haoka" className="transition-colors hover:text-foreground">
                  号卡精选
                </Link>
              </li>
              <li>
                <Link href="/yky" className="transition-colors hover:text-foreground">
                  翼卡云
                </Link>
              </li>
              <li>
                <Link href="/linxi" className="transition-colors hover:text-foreground">
                  林夕通信
                </Link>
              </li>
              <li>
                <Link href="/kakatx" className="transition-colors hover:text-foreground">
                  共创通信
                </Link>
              </li>
            </ul>
          </div>

          {/* 功能服务 */}
          <div>
            <h4 className="mb-4 text-base font-semibold">功能服务</h4>
            <ul className="space-y-2.5 text-base text-muted-foreground">
              <li>
                <Link href="/cps" className="transition-colors hover:text-foreground">
                  生活优惠
                </Link>
              </li>
              <li>
                <Link href="/download" className="transition-colors hover:text-foreground">
                  下载 APP
                </Link>
              </li>
              <li>
                <Link href="/join" className="transition-colors hover:text-foreground">
                  代理加盟
                </Link>
              </li>
              <li>
                <Link href="/services" className="transition-colors hover:text-foreground">
                  自助服务
                </Link>
              </li>
            </ul>
          </div>

          {/* 关于与合作 */}
          <div>
            <h4 className="mb-4 text-base font-semibold">关于与合作</h4>
            <ul className="space-y-2.5 text-base text-muted-foreground">
              <li>
                <Link href="/about" className="transition-colors hover:text-foreground">
                  关于我们
                </Link>
              </li>
              <li>
                <Link href="/cooperate" className="transition-colors hover:text-foreground">
                  合作伙伴
                </Link>
              </li>
              <li>
                <a
                  href="https://urlnet.cn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  艺创官网
                </a>
              </li>
              <li>
                <a
                  href="https://www.cnai.art"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  艺创 AI
                </a>
              </li>
            </ul>
          </div>

          {/* 联系我们 */}
          <div>
            <h4 className="mb-4 text-base font-semibold">联系我们</h4>
            {/* 二维码 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="relative mx-auto mb-2 aspect-square w-full max-w-[110px] overflow-hidden rounded-lg border bg-white p-3">
                  <Image
                    src="/wx.png"
                    alt="微信客服二维码"
                    fill
                    className="object-contain"
                    sizes="110px"
                  />
                </div>
                <p className="text-xs text-muted-foreground">微信咨询</p>
              </div>
              <div className="text-center">
                <div className="relative mx-auto mb-2 aspect-square w-full max-w-[110px] overflow-hidden rounded-lg border bg-white p-3">
                  <Image
                    src="/weixin.png"
                    alt="客服二维码"
                    fill
                    className="object-contain"
                    sizes="110px"
                  />
                </div>
                <p className="text-xs text-muted-foreground">客服二维码</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-6 text-sm text-muted-foreground">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            {/* 左侧：版权与声明 */}
            <div className="text-center sm:text-left">
              <p>
                号卡之家平台仅为信息展示与办理入口，号卡及服务由各大运营商提供。
              </p>
              <p className="mt-1">
                &copy; {new Date().getFullYear()} 号卡之家 版权所有
              </p>
            </div>
            {/* 右侧：备案号 */}
            <a
              href="https://beian.miit.gov.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-center transition-colors hover:text-foreground sm:text-right"
            >
              赣ICP备2023002309号
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
