/**
 * CloudFlare Workers 緊急パフォーマンス最適化
 * 本番デプロイ前の重要な対策
 */

import { NextRequest, NextResponse } from "next/server";

// パフォーマンス最適化設定
export const PERFORMANCE_CONFIG = {
  // CPU時間制限対策
  MAX_PROCESSING_TIME: 8000, // 8秒（Workers制限10秒の80%）
  TIMEOUT_BUFFER: 2000, // 2秒のバッファ

  // データベースクエリ最適化
  MAX_CONCURRENT_QUERIES: 3,
  QUERY_TIMEOUT: 3000, // 3秒

  // キャッシュ設定
  EMERGENCY_CACHE_TTL: 300, // 5分間の緊急キャッシュ
  STATIC_CACHE_TTL: 3600, // 1時間

  // フォールバック設定
  ENABLE_FALLBACK: true,
  FALLBACK_TIMEOUT: 5000, // 5秒でフォールバック
} as const;

/**
 * CPU時間監視とタイムアウト制御
 */
export class CPUTimeMonitor {
  private startTime: number;
  private maxTime: number;

  constructor(maxTime: number = PERFORMANCE_CONFIG.MAX_PROCESSING_TIME) {
    this.startTime = Date.now();
    this.maxTime = maxTime;
  }

  /**
   * 残り時間をチェック
   */
  getRemainingTime(): number {
    const elapsed = Date.now() - this.startTime;
    return Math.max(0, this.maxTime - elapsed);
  }

  /**
   * タイムアウトが近いかチェック
   */
  isNearTimeout(buffer: number = PERFORMANCE_CONFIG.TIMEOUT_BUFFER): boolean {
    return this.getRemainingTime() <= buffer;
  }

  /**
   * 処理継続可能かチェック
   */
  canContinue(): boolean {
    return this.getRemainingTime() > PERFORMANCE_CONFIG.TIMEOUT_BUFFER;
  }

  /**
   * 経過時間を取得
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * 緊急フォールバック機能
 */
export class EmergencyFallback {
  /**
   * 軽量なエラーページレスポンス
   */
  static getMinimalErrorPage(): string {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ClippyMap - 一時的な高負荷</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; background: #f8fafc; text-align: center; }
        .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; }
        .status { background: #fef3c7; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
        .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="status">⚡ 一時的な高負荷のため、軽量モードで動作中です</div>
        <h1>📍 ClippyMap</h1>
        <p>申し訳ございません。現在サーバーが高負荷状態です。</p>
        <a href="/" class="btn">ホームに戻る</a>
        <a href="/sample" class="btn">サンプルを見る</a>
    </div>
</body>
</html>`;
  }
}

/**
 * パフォーマンス最適化ミドルウェア
 */
export function createPerformanceOptimizedResponse(
  request: NextRequest,
  monitor: CPUTimeMonitor
): NextResponse | null {
  const pathname = request.nextUrl.pathname;

  // タイムアウトが近い場合はフォールバック
  if (monitor.isNearTimeout()) {
    console.warn(
      `Performance fallback triggered for ${pathname} after ${monitor.getElapsedTime()}ms`
    );

    const contentType = "text/html; charset=utf-8";

    // 全てのページで統一されたエラーページを表示
    const fallbackContent = EmergencyFallback.getMinimalErrorPage();

    return new NextResponse(fallbackContent, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=60, s-maxage=60", // 1分間キャッシュ
        "X-Performance-Fallback": "true",
        "X-Processing-Time": monitor.getElapsedTime().toString(),
      },
    });
  }

  return null;
}

/**
 * データベースクエリのタイムアウト制御
 */
export function withQueryTimeout<T>(
  promise: Promise<T>,
  timeout: number = PERFORMANCE_CONFIG.QUERY_TIMEOUT
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout")), timeout)
    ),
  ]);
}

/**
 * 並列処理の制限
 */
export async function limitConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number = PERFORMANCE_CONFIG.MAX_CONCURRENT_QUERIES
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map((task) => task()));
    results.push(...batchResults);
  }

  return results;
}

/**
 * 緊急キャッシュ機能
 */
export class EmergencyCache {
  private static cache = new Map<string, { data: unknown; expires: number }>();

  static set(
    key: string,
    data: unknown,
    ttl: number = PERFORMANCE_CONFIG.EMERGENCY_CACHE_TTL
  ): void {
    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { data, expires });
  }

  static get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  static clear(): void {
    this.cache.clear();
  }

  static size(): number {
    return this.cache.size;
  }
}
