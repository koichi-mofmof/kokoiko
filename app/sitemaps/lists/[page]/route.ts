import { getBaseUrl, getPublicListsPaged } from "@/lib/seo/sitemap";

export const revalidate = 3600; // 1h
export const dynamic = "force-dynamic";

const LISTS_PAGE_SIZE = 5000;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ page: string }> }
) {
  try {
    const { page: pageParam } = await ctx.params;
    const page = Math.max(1, Number(pageParam || "1"));

    const env =
      typeof globalThis !== "undefined" && "process" in globalThis
        ? (globalThis as { process?: { env?: Record<string, string> } }).process
            ?.env
        : undefined;
    const baseUrl = getBaseUrl(env);

    const lists = await getPublicListsPaged(page, LISTS_PAGE_SIZE);

    const urlset: string[] = [];
    for (const list of lists) {
      urlset.push(
        `<url>` +
          `<loc>${baseUrl}/lists/${list.id}</loc>` +
          `<lastmod>${(list.updated_at
            ? new Date(list.updated_at)
            : new Date()
          ).toISOString()}</lastmod>` +
          `<changefreq>weekly</changefreq>` +
          `<priority>0.7</priority>` +
          `</url>`
      );
    }

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
    console.error("❌ lists sitemap 生成エラー:", error);
    return new Response("", { status: 500 });
  }
}
