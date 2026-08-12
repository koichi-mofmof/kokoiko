import {
  buildLocalizedUrlEntries,
  getBaseUrl,
  getPublicProfilesPaged,
  SITEMAP_URLSET_ATTRS,
  USERS_SITEMAP_PAGE_SIZE as USERS_PAGE_SIZE,
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

    const profiles = await getPublicProfilesPaged(page, USERS_PAGE_SIZE);

    const urlset: string[] = [];
    for (const profile of profiles) {
      urlset.push(
        ...buildLocalizedUrlEntries({
          baseUrl,
          path: `/users/${profile.id}`,
          lastModified: profile.updated_at
            ? new Date(profile.updated_at)
            : new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
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
    console.error("❌ users sitemap 生成エラー:", error);
    return new Response("", { status: 500 });
  }
}
