import { getBaseUrl, staticPages } from "@/lib/seo/sitemap";

export const revalidate = 3600; // 1h
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const env =
      typeof globalThis !== "undefined" && "process" in globalThis
        ? (globalThis as { process?: { env?: Record<string, string> } }).process
            ?.env
        : undefined;
    const baseUrl = getBaseUrl(env);

    const urlset: string[] = [];

    for (const page of staticPages) {
      urlset.push(
        `<url>` +
          `<loc>${baseUrl}${page.url}</loc>` +
          `<lastmod>${new Date(page.lastModified).toISOString()}</lastmod>` +
          `<changefreq>${page.changeFrequency}</changefreq>` +
          `<priority>${page.priority}</priority>` +
          `</url>`
      );
    }

    // sampleページは現在未提供のため、サイトマップへの出力対象外

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
      urlset.join("") +
      `</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("❌ static sitemap 生成エラー:", error);
    return new Response("", { status: 500 });
  }
}
