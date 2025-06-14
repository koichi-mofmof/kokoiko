/**
 * CloudFlare CDN キャッシュ設定
 * Phase 3.2: キャッシュ戦略実装
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// キャッシュ設定の定数
export const CACHE_CONTROL = {
  // 静的アセット（1年間）
  STATIC_ASSETS: "public, max-age=31536000, immutable",

  // 画像・メディア（1ヶ月）
  IMAGES: "public, max-age=2592000",

  // API レスポンス（5分）
  API_SHORT: "public, max-age=300, s-maxage=300",

  // 公開リスト（10分）
  PUBLIC_LISTS: "public, max-age=600, s-maxage=600",

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
export function getCacheStrategy(
  pathname: string,
  isPublic: boolean = false
): string {
  // 静的アセット
  if (pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp)$/)) {
    return CACHE_CONTROL.STATIC_ASSETS;
  }

  // サイトマップ・robots.txt
  if (pathname.match(/\/(sitemap\.xml|robots\.txt|manifest\.json)$/)) {
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

  // 公開リスト
  if (pathname.match(/^\/lists\/[^/]+$/) && isPublic) {
    return CACHE_CONTROL.PUBLIC_LISTS;
  }

  // プライベートページ
  if (pathname.startsWith("/lists/") && !isPublic) {
    return CACHE_CONTROL.SESSION_DEPENDENT;
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
 */
export function applyCacheHeaders(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const pathname = request.nextUrl.pathname;

  // パブリックリストかどうかの判定（実際の実装では動的に判定）
  const isPublicList = checkIfPublicList(pathname);

  const cacheControl = getCacheStrategy(pathname, isPublicList);

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
 * パブリックリストかどうかの簡易判定
 */
function checkIfPublicList(pathname: string): boolean {
  // 実際の実装では、データベースから取得するか、
  // リクエストコンテキストから判定する
  return pathname.startsWith("/sample/");
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
 */
export async function revalidateListCache(listId: string): Promise<void> {
  await revalidateCache([
    CacheTags.LIST_DETAILS(listId),
    CacheTags.PUBLIC_LISTS,
  ]);
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
