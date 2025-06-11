import { generateSitemapEntries } from "@/lib/seo/sitemap";
import { MetadataRoute } from "next";

// ISR: 1時間ごとに再生成
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    return await generateSitemapEntries();
  } catch (error) {
    console.error("Error generating sitemap:", error);

    // エラー時は最低限のエントリを返す
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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
