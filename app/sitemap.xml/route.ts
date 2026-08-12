import {
  countPublicListsTotal,
  countPublicPlacePagesTotal,
  countPublicProfilesTotal,
  getBaseUrl,
  LISTS_SITEMAP_PAGE_SIZE as LISTS_PAGE_SIZE,
  PLACES_SITEMAP_PAGE_SIZE as PLACES_PAGE_SIZE,
  USERS_SITEMAP_PAGE_SIZE as USERS_PAGE_SIZE,
} from "@/lib/seo/sitemap";

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

    // 各種別の件数を並列取得
    const [listsTotal, placesTotal, profilesTotal] = await Promise.all([
      countPublicListsTotal(),
      countPublicPlacePagesTotal(),
      countPublicProfilesTotal(),
    ]);

    const now = new Date().toISOString();

    const sitemaps: string[] = [];
    const pushPaged = (segment: string, total: number, pageSize: number) => {
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      for (let page = 1; page <= totalPages; page++) {
        sitemaps.push(
          `<sitemap><loc>${baseUrl}/sitemaps/${segment}/${page}</loc><lastmod>${now}</lastmod></sitemap>`
        );
      }
    };

    // 静的ページ
    sitemaps.push(
      `<sitemap><loc>${baseUrl}/sitemaps/static.xml</loc><lastmod>${now}</lastmod></sitemap>`
    );
    // 公開リスト
    pushPaged("lists", listsTotal, LISTS_PAGE_SIZE);
    // 地点詳細（公開リスト配下）
    pushPaged("places", placesTotal, PLACES_PAGE_SIZE);
    // 公開プロフィール
    pushPaged("users", profilesTotal, USERS_PAGE_SIZE);

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
