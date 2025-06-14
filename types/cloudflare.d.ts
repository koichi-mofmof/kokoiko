/**
 * CloudFlare Workers 型定義
 * Phase 3.2: キャッシュ戦略実装
 */

// CloudFlare Workers KV Namespace 型定義
declare global {
  interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: { prefix?: string; limit?: number }): Promise<{
      keys: Array<{ name: string }>;
      list_complete: boolean;
    }>;
  }

  // CloudFlare Workers Cache API 型定義
  interface CloudFlareCache {
    put(request: Request, response: Response): Promise<void>;
    match(request: Request): Promise<Response | undefined>;
    delete(request: Request): Promise<boolean>;
  }

  interface CloudFlareCacheStorage {
    default: CloudFlareCache;
  }

  // CloudFlare Workers 環境のグローバル変数
  const CACHE: KVNamespace;
  const SESSION_CACHE: KVNamespace;
  const caches: CloudFlareCacheStorage;
}

export {};
