// CloudFlare CDN キャッシュ設定
//
// ⚠️ 言語とキャッシュの前提:
//   ページの表示言語は「URL」だけで決まる（既定ロケールはプレフィックス無し、
//   それ以外は /en/... のようにプレフィックス付き。middleware.ts を参照）。
//   したがって言語はキャッシュキーに含まれており、Vary: Cookie は不要。
//
//   逆に、クッキーやAccept-Languageで表示言語を切り替える実装に戻すと、
//   下の public キャッシュに載ったHTMLが別言語の利用者へ配信される。
//   ロケール解決は必ず lib/i18n/server.ts の getRequestLocale を経由させること。
import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// キャッシュ設定の定数
export const CACHE_CONTROL = {
  // 静的アセット（1年間）
  STATIC_ASSETS: "public, max-age=31536000, immutable",

  // 画像・メディア（1ヶ月）
  IMAGES: "public, max-age=2592000",

  // API レスポンス（5分）
  API_SHORT: "public, max-age=300, s-maxage=300",

  // 公開リスト（2分）- 段階的最適化: リアルタイム性とコストのバランス
  PUBLIC_LISTS: "public, max-age=120, s-maxage=120",

  // 公開リスト（Stale-While-Revalidate）- 高頻度更新時の最適化
  PUBLIC_LISTS_SWR:
    "public, max-age=60, s-maxage=60, stale-while-revalidate=300",

  // プライベートデータ（キャッシュしない）
  PRIVATE: "private, no-cache, no-store, must-revalidate",

  // セッション依存データ（5分、プライベート）
  SESSION_DEPENDENT: "private, max-age=300",

  // サイトマップ・SEO（1時間）
  SEO_CONTENT: "public, max-age=3600, s-maxage=3600",
} as const;

/**
 * リクエストパスに基づいてキャッシュ戦略を決定
 */
export function getCacheStrategy(pathname: string, isPublic?: boolean): string {
  // 静的アセット
  if (pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp)$/)) {
    return CACHE_CONTROL.STATIC_ASSETS;
  }

  // サイトマップ・robots.txt（分割サイトマップも含む）
  if (
    pathname.match(/\/(sitemap\.xml|robots\.txt|manifest\.json)$/) ||
    pathname.startsWith("/sitemaps/")
  ) {
    return CACHE_CONTROL.SEO_CONTENT;
  }

  // API ルート
  if (pathname.startsWith("/api/")) {
    return CACHE_CONTROL.API_SHORT;
  }

  // サンプルページ（公開）
  if (pathname.startsWith("/sample/")) {
    return CACHE_CONTROL.PUBLIC_LISTS;
  }

  // リスト詳細ページ：公開/非公開で適切に分岐
  if (pathname.startsWith("/lists/") && pathname !== "/lists") {
    // isPublicが明示的に指定された場合はそれを使用
    if (typeof isPublic === "boolean") {
      return isPublic ? CACHE_CONTROL.PUBLIC_LISTS : CACHE_CONTROL.PRIVATE;
    }

    // isPublicが不明な場合はセキュア側（キャッシュ無効）に倒す
    return CACHE_CONTROL.PRIVATE;
  }

  // その他のページ（ホーム、About等）
  if (pathname === "/" || pathname.match(/^\/(about|privacy|terms)/)) {
    return CACHE_CONTROL.SEO_CONTENT;
  }

  // デフォルト（プライベート）
  return CACHE_CONTROL.PRIVATE;
}

/**
 * キャッシュヘッダーを設定するミドルウェア
 * 注意: リスト詳細ページの正確な判定は各ページコンポーネントで行う
 */
export function applyCacheHeaders(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const pathname = request.nextUrl.pathname;

  // ミドルウェアでは安全側（非公開）として処理
  const cacheControl = getCacheStrategy(pathname);

  // Cache-Control ヘッダーを設定
  response.headers.set("Cache-Control", cacheControl);

  // 静的アセットには追加のヘッダー
  if (pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp)$/)) {
    response.headers.set("Vary", "Accept-Encoding");
    response.headers.set("ETag", generateETag(pathname));
  }

  // CORS ヘッダー（API用）
  if (pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }

  return response;
}

/**
 * URLパスからlistIdを抽出してデータベースから公開状態を確認
 * セキュリティ上、不明な場合は非公開として扱う
 */
export async function checkListPublicStatus(
  pathname: string
): Promise<boolean> {
  // URLパターンマッチング: /lists/[listId] または /lists/[listId]/place/[placeId]
  const listIdMatch = pathname.match(/^\/lists\/([^\/]+)/);

  if (!listIdMatch) {
    return false; // リストページでない場合は非公開扱い
  }

  const listId = listIdMatch[1];

  // 特殊なパス（join等）は非公開扱い
  if (listId === "join") {
    return false;
  }

  try {
    const supabase = await createClient();

    // データベースから公開状態を確認
    const { data, error } = await supabase
      .from("place_lists")
      .select("is_public")
      .eq("id", listId)
      .single();

    if (error || !data) {
      // エラーまたはリストが見つからない場合は非公開扱い
      return false;
    }

    return data.is_public === true;
  } catch (error) {
    // エラーが発生した場合は安全側に倒して非公開扱い
    console.warn("Failed to check list public status:", error);
    return false;
  }
}

/**
 * リスト詳細ページ用の適切なキャッシュヘッダーを設定
 * ページコンポーネント内で呼び出し、リストの公開状態と更新頻度に基づいて最適なキャッシュを設定
 */
export async function setListPageCacheHeaders(
  isPublic: boolean,
  listId?: string
): Promise<string> {
  if (!isPublic) {
    return CACHE_CONTROL.PRIVATE;
  }

  // listIdが提供されている場合は適応的キャッシュ戦略を使用
  if (listId) {
    return await getAdaptiveCacheStrategy(listId, isPublic);
  }

  // listIdが不明な場合はデフォルト（2分キャッシュ）
  return CACHE_CONTROL.PUBLIC_LISTS;
}

/**
 * ファイルパスからETagを生成
 */
function generateETag(pathname: string): string {
  // 実際の実装では、ファイルのハッシュまたは更新日時を使用
  const hash = Buffer.from(pathname).toString("base64");
  return `"${hash}"`;
}

/**
 * Next.js のキャッシュタグを使用したキャッシュ無効化
 */
export const CacheTags = {
  USER_LISTS: (userId: string) => `user-lists-${userId}`,
  LIST_DETAILS: (listId: string) => `list-${listId}`,
  PUBLIC_LISTS: "public-lists",
  SAMPLE_DATA: "sample-data",
  USER_PROFILE: (userId: string) => `profile-${userId}`,
} as const;

/**
 * キャッシュタグを使用してキャッシュを無効化
 */
export async function revalidateCache(tags: string[]): Promise<void> {
  // Next.js App Router の revalidateTag を使用
  if (typeof revalidateTag !== "undefined") {
    for (const tag of tags) {
      try {
        revalidateTag(tag);
      } catch (error) {
        console.error(`Failed to revalidate tag ${tag}:`, error);
      }
    }
  }
}

/**
 * ユーザー関連キャッシュの無効化
 */
export async function revalidateUserCache(userId: string): Promise<void> {
  await revalidateCache([
    CacheTags.USER_LISTS(userId),
    CacheTags.USER_PROFILE(userId),
  ]);
}

/**
 * リスト関連キャッシュの無効化
 * 公開リストの場合は即座にキャッシュクリア
 */
export async function revalidateListCache(listId: string): Promise<void> {
  await revalidateCache([
    CacheTags.LIST_DETAILS(listId),
    CacheTags.PUBLIC_LISTS,
  ]);

  // CloudFlare Workers Cache API を使用してエッジキャッシュもクリア
  await purgeListFromEdgeCache(listId);
}

/**
 * CloudFlare Workers Cache API を使用したエッジキャッシュクリア
 * データ更新時に特定リストのキャッシュを即座に無効化
 */
export async function purgeListFromEdgeCache(listId: string): Promise<void> {
  if (typeof globalThis !== "undefined" && "caches" in globalThis) {
    try {
      const cache = (
        globalThis as unknown as { caches: { default: CloudFlareCache } }
      ).caches.default;

      // 環境変数からベースURLを取得
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://clippymap.com";

      // 対象リストの完全URLパターンを生成
      const listUrls = [
        new URL(`/lists/${listId}`, baseUrl).toString(),
        new URL(`/lists/${listId}/`, baseUrl).toString(),
      ];

      // 各URLのキャッシュを削除
      for (const url of listUrls) {
        const request = new Request(url);
        await cache.delete(request);
      }

      console.log(`✅ Edge cache cleared for list: ${listId}`);
    } catch (error) {
      console.warn("❌ Failed to clear edge cache:", error);
    }
  }
}

/**
 * CloudFlare Workers 用のキャッシュAPI統合
 * 注意: 実際のCloudFlare Workers環境でのみ動作します
 */
export class WorkersCacheAPI {
  /**
   * CloudFlare Workers の Cache API を使用してレスポンスをキャッシュ
   * 開発環境では何もしません
   */
  static async cacheResponse(
    request: Request,
    response: Response,
    ttl: number = 300
  ): Promise<Response> {
    // CloudFlare Workers環境でのみ実行
    if (typeof globalThis !== "undefined" && "caches" in globalThis) {
      try {
        const cache = (
          globalThis as unknown as { caches: { default: CloudFlareCache } }
        ).caches.default;
        const cacheKey = new Request(request.url, request);

        // TTL を設定したレスポンスを作成
        const cachedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...response.headers,
            "Cache-Control": `public, max-age=${ttl}`,
            "Cached-At": new Date().toISOString(),
          },
        });

        // キャッシュに保存
        await cache.put(cacheKey, cachedResponse.clone());

        return cachedResponse;
      } catch (error) {
        console.warn("Cache API not available:", error);
      }
    }

    return response;
  }

  /**
   * キャッシュからレスポンスを取得
   * 開発環境では常にnullを返します
   */
  static async getCachedResponse(request: Request): Promise<Response | null> {
    // CloudFlare Workers環境でのみ実行
    if (typeof globalThis !== "undefined" && "caches" in globalThis) {
      try {
        const cache = (
          globalThis as unknown as { caches: { default: CloudFlareCache } }
        ).caches.default;
        const cacheKey = new Request(request.url, request);

        const cachedResponse = await cache.match(cacheKey);

        if (cachedResponse) {
          const cachedAt = cachedResponse.headers.get("Cached-At");
          if (cachedAt) {
            const cacheAge = Date.now() - new Date(cachedAt).getTime();
            const maxAge =
              parseInt(
                cachedResponse.headers
                  .get("Cache-Control")
                  ?.match(/max-age=(\d+)/)?.[1] || "0"
              ) * 1000;

            // 期限切れチェック
            if (cacheAge > maxAge) {
              await cache.delete(cacheKey);
              return null;
            }
          }

          return cachedResponse;
        }
      } catch (error) {
        console.warn("Cache API not available:", error);
      }
    }

    return null;
  }

  // Note: パターンマッチでのキャッシュ削除は CloudFlare Workers では制限があるため、
  // タグベースの削除（revalidateCache関数）を使用してください。
}

/**
 * 適応的キャッシュ戦略
 * リストの更新頻度に基づいて最適なキャッシュ時間を決定
 */
export async function getAdaptiveCacheStrategy(
  listId: string,
  isPublic: boolean
): Promise<string> {
  if (!isPublic) {
    return CACHE_CONTROL.PRIVATE;
  }

  try {
    const supabase = await createClient();

    // 過去1時間の更新履歴を確認
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentUpdates } = await supabase
      .from("list_places")
      .select("id")
      .eq("list_id", listId)
      .gte("updated_at", oneHourAgo)
      .limit(5);

    const updateCount = recentUpdates?.length || 0;

    // 更新頻度に応じたキャッシュ戦略
    if (updateCount >= 3) {
      // 高頻度更新: Stale-While-Revalidate戦略
      return CACHE_CONTROL.PUBLIC_LISTS_SWR;
    } else if (updateCount >= 1) {
      // 中頻度更新: 短期キャッシュ
      return CACHE_CONTROL.PUBLIC_LISTS;
    } else {
      // 低頻度更新: 長期キャッシュ（10分）
      return "public, max-age=600, s-maxage=600";
    }
  } catch (error) {
    console.warn("Failed to determine adaptive cache strategy:", error);
    // エラー時は安全側に倒す
    return CACHE_CONTROL.PUBLIC_LISTS;
  }
}

/**
 * クライアントサイド楽観的更新のヘルパー
 */
export const OptimisticUpdateHelpers = {
  /**
   * リスト更新の楽観的更新用キー生成
   */
  getListUpdateKey: (listId: string) => `optimistic-list-${listId}`,

  /**
   * 場所追加の楽観的更新用キー生成
   */
  getPlaceUpdateKey: (listId: string, placeId: string) =>
    `optimistic-place-${listId}-${placeId}`,

  /**
   * 楽観的更新のタイムスタンプ
   */
  getTimestamp: () => Date.now(),
} as const;

/**
 * リスト詳細ページ用の簡易ログ関数
 * 適応的キャッシュ戦略の動作確認用
 */
export async function logAdaptiveCacheStrategy(
  listId: string,
  isPublic: boolean
): Promise<string> {
  const cacheControl = await getAdaptiveCacheStrategy(listId, isPublic);
  console.log(`📊 Adaptive cache strategy for list ${listId}: ${cacheControl}`);
  return cacheControl;
}
