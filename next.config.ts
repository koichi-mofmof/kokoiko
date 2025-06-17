import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // CloudFlare Workers対応設定
  serverExternalPackages: ["@opennextjs/cloudflare"],

  // パフォーマンス最適化
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },

  // Webpack最適化
  webpack: (config, { dev, isServer }) => {
    // プロダクション環境でのバンドルサイズ最適化
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }

    return config;
  },

  // バンドル分析（開発時のみ）
  ...(process.env.ANALYZE === "true" && {
    webpack: (config: any) => {
      if (process.env.ANALYZE === "true") {
        const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: "static",
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),

  images: {
    // Cloudflare Workers環境では画像最適化を無効化
    unoptimized: process.env.CLOUDFLARE_WORKERS === "true",
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
    ],
  },

  // キャッシュとヘッダー最適化
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
      // 静的アセットのキャッシュ
      {
        source: "/screenshots/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(favicon.ico|robots.txt|sitemap.xml)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
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
