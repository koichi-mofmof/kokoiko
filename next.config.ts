import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // CloudFlare Workers対応設定
  serverExternalPackages: ["@opennextjs/cloudflare"],
  // Webpack使用を強制（Turbopack無効化）
  webpack: (config) => {
    return config;
  },

  images: {
    // Cloudflare Workers環境では画像最適化を無効化
    unoptimized: process.env.CLOUDFLARE_WORKERS === "true",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // HTTP Strict Transport Security
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Prevent XSS attacks
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Referrer Policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions Policy
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=(self)",
              "payment=(self)",
              "usb=()",
              "display-capture=()",
            ].join(", "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

// OpenNext Cloudflare統合（推奨設定）
if (process.env.NODE_ENV === "development") {
  try {
    const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
    initOpenNextCloudflareForDev();
  } catch (error) {
    // OpenNext開発環境統合が利用できない場合は無視
    console.warn(
      "OpenNext Cloudflare dev integration not available:",
      (error as Error).message
    );
  }
}
