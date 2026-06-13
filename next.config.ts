import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // 172号卡（lot-ml）商品图片域名
      { protocol: "https", hostname: "*.lot-ml.com" },
      { protocol: "https", hostname: "lot-ml.com" },
      // 浩卡联盟商品图片域名（xxxx.com/upload/...）
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
