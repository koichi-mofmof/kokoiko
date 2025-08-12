import { countPublicListsTotal, getBaseUrl } from "@/lib/seo/sitemap";

export const revalidate = 3600; // 1h
export const dynamic = "force-dynamic";

const LISTS_PAGE_SIZE = 5000; // sitemap 1ファイルの上限に余裕を持たせる

export async function GET() {
  try {
    const env =
      typeof globalThis !== "undefined" && "process" in globalThis
        ? (globalThis as { process?: { env?: Record<string, string> } }).process
            ?.env
        : undefined;

    const baseUrl = getBaseUrl(env);
    const total = await countPublicListsTotal();
    const totalPages = Math.max(1, Math.ceil(total / LISTS_PAGE_SIZE));

    const now = new Date().toISOString();

    const sitemaps: string[] = [];
    // 静的 + サンプル
    sitemaps.push(
      `<sitemap><loc>${baseUrl}/sitemaps/static.xml</loc><lastmod>${now}</lastmod></sitemap>`
    );
    // リスト（ページング）
    for (let page = 1; page <= totalPages; page++) {
      sitemaps.push(
        `<sitemap><loc>${baseUrl}/sitemaps/lists/${page}</loc><lastmod>${now}</lastmod></sitemap>`
      );
    }

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
      sitemaps.join("") +
      `</sitemapindex>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("❌ sitemap index 生成エラー:", error);
    return new Response("", { status: 500 });
  }
}
