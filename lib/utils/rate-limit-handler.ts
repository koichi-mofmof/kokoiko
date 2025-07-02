/**
 * レート制限エラーハンドリング用ユーティリティ
 * クライアント側とサーバー側の両方で使用可能
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  showToast?: boolean;
}

/**
 * レート制限エラーのチェック
 */
export function isRateLimitError(response: Response): boolean {
  return response.status === 429;
}

/**
 * Retry-After ヘッダーから待機時間を取得
 */
export function getRetryDelay(response: Response): number {
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) {
    const delay = parseInt(retryAfter, 10);
    return isNaN(delay) ? 60 : delay; // デフォルト60秒
  }
  return 60;
}

/**
 * エクスポネンシャルバックオフ計算
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // ジッター追加（±20%）
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return Math.round(delay + jitter);
}

/**
 * レート制限エラー発生時の自動リトライ機能付きfetch
 */
export async function fetchWithRateLimit(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    showToast = true,
  } = retryOptions;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (isRateLimitError(response)) {
        if (attempt === maxRetries) {
          if (showToast) {
            showRateLimitToast(response);
          }
          return response; // 最終試行なのでエラーレスポンスを返す
        }

        // リトライ待機時間の計算
        const retryAfterDelay = getRetryDelay(response) * 1000;
        const backoffDelay = calculateBackoffDelay(
          attempt,
          baseDelay,
          maxDelay
        );
        const waitTime = Math.max(retryAfterDelay, backoffDelay);

        console.warn(
          `Rate limit hit. Retrying after ${waitTime}ms (attempt ${
            attempt + 1
          }/${maxRetries + 1})`
        );

        if (showToast) {
          showRetryToast(waitTime / 1000);
        }

        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // 成功レスポンス
      return response;
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // ネットワークエラーの場合もリトライ
      const backoffDelay = calculateBackoffDelay(attempt, baseDelay, maxDelay);
      console.warn(
        `Network error. Retrying after ${backoffDelay}ms (attempt ${
          attempt + 1
        }/${maxRetries + 1})`
      );

      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * レート制限情報を取得
 */
export function getRateLimitInfo(response: Response): {
  limit: number;
  remaining: number;
  reset: Date;
  pageType?: string;
} {
  const limit = parseInt(response.headers.get("X-RateLimit-Limit") || "60", 10);
  const remaining = parseInt(
    response.headers.get("X-RateLimit-Remaining") || "0",
    10
  );
  const reset = new Date(
    parseInt(response.headers.get("X-RateLimit-Reset") || "0", 10) * 1000
  );
  const pageType = response.headers.get("X-Page-Type") || undefined;

  return { limit, remaining, reset, pageType };
}

/**
 * トースト通知（toaster使用）
 * ブラウザ環境でのみ動作
 */
function showRateLimitToast(response: Response) {
  // サーバー環境ではスキップ
  if (typeof window === "undefined") return;

  const { reset } = getRateLimitInfo(response);
  const resetTime = reset.toLocaleTimeString();

  // 動的インポートでtoasterを読み込み
  import("@/hooks/use-toast")
    .then(({ toast }) => {
      toast({
        title: "リクエスト制限に達しました",
        description: `${resetTime}にリセットされます。しばらくお待ちください。`,
        variant: "destructive",
      });
    })
    .catch(console.error);
}

function showRetryToast(seconds: number) {
  // サーバー環境ではスキップ
  if (typeof window === "undefined") return;

  import("@/hooks/use-toast")
    .then(({ toast }) => {
      toast({
        title: "自動的に再試行します",
        description: `${Math.round(seconds)}秒後に再試行します...`,
        variant: "default",
      });
    })
    .catch(console.error);
}

/**
 * ページ読み込み時のレート制限警告チェック
 */
export function checkRateLimitWarning(): void {
  // レスポンスヘッダーは直接取得できないため、
  // カスタムヘッダーをチェックする代替手段
  const rateLimitInfo = sessionStorage.getItem("rate_limit_info");
  if (rateLimitInfo) {
    try {
      const info = JSON.parse(rateLimitInfo);
      if (info.remaining < 10) {
        import("@/hooks/use-toast").then(({ toast }) => {
          toast({
            title: "レート制限警告",
            description: `あと${info.remaining}回のリクエストで制限に達します。`,
            variant: "default",
          });
        });
      }
    } catch (error) {
      console.warn("Failed to parse rate limit info:", error);
    }
  }
}

/**
 * Server Actions用のレート制限対応fetch（トースト機能なし）
 */
export async function fetchWithRateLimitServer(
  url: string,
  options: RequestInit = {},
  retryOptions: Omit<RetryOptions, "showToast"> = {}
): Promise<Response> {
  return fetchWithRateLimit(url, options, {
    ...retryOptions,
    showToast: false,
  });
}

/**
 * ブラウザ用のレート制限対応fetch（トースト機能あり）
 */
export const rateLimitAwareFetch = (input: RequestInfo, init?: RequestInit) => {
  return fetchWithRateLimit(
    typeof input === "string" ? input : input.url,
    init,
    { showToast: true }
  );
};
