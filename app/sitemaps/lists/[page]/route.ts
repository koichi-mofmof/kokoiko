import {
  buildLocalizedUrlEntries,
  getBaseUrl,
  getPublicListsPaged,
  LISTS_SITEMAP_PAGE_SIZE as LISTS_PAGE_SIZE,
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

    const lists = await getPublicListsPaged(page, LISTS_PAGE_SIZE);

    const urlset: string[] = [];
    for (const list of lists) {
      urlset.push(
        ...buildLocalizedUrlEntries({
          baseUrl,
          path: `/lists/${list.id}`,
          lastModified: list.updated_at
            ? new Date(list.updated_at)
            : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
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
    console.error("❌ lists sitemap 生成エラー:", error);
    return new Response("", { status: 500 });
  }
}
