import { generateSitemapEntries } from "@/lib/seo/sitemap";
import { MetadataRoute } from "next";

// ISR: 1時間ごとに再生成
export const revalidate = 3600;

// 実行時の環境変数を強制的に使用
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // CloudFlare Workers環境での環境変数取得（OpenNext対応）
    const env =
      typeof globalThis !== "undefined" && "process" in globalThis
        ? (globalThis as { process?: { env?: Record<string, string> } }).process
            ?.env
        : undefined; // process.envは直接渡さず、関数内で処理

    return await generateSitemapEntries(env);
  } catch (error) {
    console.error("Error generating sitemap:", error);

    // エラー時は確実に本番URLを使用
    const baseUrl = "https://clippymap.com"; // ハードコード（最も確実）
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 1,
      },
    ];
  }
}
