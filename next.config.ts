import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // CloudFlare Workers対応設定
  serverExternalPackages: ["@opennextjs/cloudflare"],

  // パフォーマンス最適化
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  // Turbopack設定（Next.js 15対応）
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
    resolveAlias: {
      // 必要に応じてエイリアス設定
    },
  },

  // Webpack最適化（Turbopack使用時はスキップ）
  webpack: (config, { dev, isServer, nextRuntime }) => {
    // Turbopack使用時は従来のWebpack設定をスキップ
    if (process.env.NEXT_DEV && process.env.TURBOPACK) {
      return config;
    }

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

  // バンドル分析（開発時のみ、Turbopack非使用時）
  ...(process.env.ANALYZE === "true" &&
    !process.env.TURBOPACK && {
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
    // Cloudflare Workers環境または開発時のネットワークアクセスでは画像最適化を無効化
    unoptimized:
      process.env.CLOUDFLARE_WORKERS === "true" ||
      process.env.NODE_ENV === "development",
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 200, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30日間キャッシュ
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "typroopuejyfkpkgsjsa.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // キャッシュとヘッダー最適化
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";

    return [
      {
        source: "/(.*)",
        headers: [
          // HTTP Strict Transport Security（本番環境のみ）
          ...(isProduction
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
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
        source: "/icon0.webp",
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
      {
        source: "/sitemaps/:path*",
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
