import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";

    // Development環境用のCSP設定（ローカルSupabaseアクセス許可）
    const developmentCSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://maps.googleapis.com https://www.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.pexels.com https://lh3.googleusercontent.com https://maps.googleapis.com https://maps.gstatic.com https://*.openstreetmap.org https://*.tile.openstreetmap.org https://i.pravatar.cc http://127.0.0.1:54321",
      "connect-src 'self' https://api.stripe.com https://maps.googleapis.com https://places.googleapis.com wss://realtime.supabase.co https://*.supabase.co http://127.0.0.1:54321 ws://127.0.0.1:54321",
      "frame-src 'self' https://js.stripe.com https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    // Production環境用のCSP設定（より厳格）
    const productionCSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://maps.googleapis.com https://www.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.pexels.com https://lh3.googleusercontent.com https://maps.googleapis.com https://maps.gstatic.com https://*.openstreetmap.org https://*.tile.openstreetmap.org https://i.pravatar.cc",
      "connect-src 'self' https://api.stripe.com https://maps.googleapis.com https://places.googleapis.com wss://realtime.supabase.co https://*.supabase.co",
      "frame-src 'self' https://js.stripe.com https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ];

    return [
      {
        source: "/(.*)",
        headers: [
          // Content Security Policy（環境別）
          {
            key: "Content-Security-Policy",
            value: (isDevelopment ? developmentCSP : productionCSP).join("; "),
          },
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
