import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // プライベートな内容や不要なファイルを除外
        disallow: [
          "/api/",
          "/auth/",
          "/settings/",
          "/tokushoho",
          "/_next/",
          "/admin/",
          "/_vercel/",
          "/debug/",
          "/cookies/",
          "*?*", // クエリパラメータ付きURL
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    // Googleが推奨するCrawl-delayを削除（現代では不要）
  };
}
