import {
  buildLocalizedUrlEntries,
  getBaseUrl,
  getPublicPlacePagesPaged,
  PLACES_SITEMAP_PAGE_SIZE as PLACES_PAGE_SIZE,
  SITEMAP_URLSET_ATTRS,
} from "@/lib/seo/sitemap";

export const revalidate = 3600; // 1h
export const dynamic = "force-dynamic";

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

    const placePages = await getPublicPlacePagesPaged(page, PLACES_PAGE_SIZE);

    const urlset: string[] = [];
    for (const row of placePages) {
      urlset.push(
        ...buildLocalizedUrlEntries({
          baseUrl,
          path: `/lists/${row.list_id}/place/${row.place_id}`,
          lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
          changeFrequency: "monthly",
          priority: 0.5,
        })
      );
    }

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<urlset ${SITEMAP_URLSET_ATTRS}>` +
      urlset.join("") +
      `</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("❌ places sitemap 生成エラー:", error);
    return new Response("", { status: 500 });
  }
}
