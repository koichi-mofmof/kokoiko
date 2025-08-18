/*
 * CloudFlare Workers セキュリティ設定
 */
import type { NextRequest } from "next/server";

/**
 * セキュリティ設定
 */
export const SECURITY_CONFIG = {
  RATE_LIMITS: {
    DEFAULT: 120,
    STRICT: 60,
    API: 120, // 60 → 120 に緩和（決済系API考慮）
    AUTH: 60,
    HEAVY_PAGE: 150,
    HOME_PAGE: 100,
    PAYMENT: 180, // 決済系API専用のより緩い制限
  },
  SECURITY_HEADERS: {
    HSTS_MAX_AGE: 31536000, // 1年
    REFERRER_POLICY: "strict-origin-when-cross-origin",
  },
  DOS_PROTECTION: {
    MAX_REQUESTS_PER_MINUTE: 180, // 100 → 180 に引き上げ（通常ユーザーも考慮）
    SUSPICIOUS_THRESHOLD: 200,
    BLOCK_DURATION: 300000, // 5分
    // 負荷テスト用の設定
    LOAD_TEST_MODE: process.env.LOAD_TEST_MODE === "true",
  },
  API_PROTECTION: {
    MAX_PAYLOAD_SIZE: 1024 * 1024, // 1MB
    ALLOWED_CONTENT_TYPES: [
      "application/json",
      "application/x-www-form-urlencoded",
      "multipart/form-data",
    ],
    BLOCKED_EXTENSIONS: [".php", ".asp", ".jsp", ".cgi"],
  },
  CSRF: {
    TOKEN_LENGTH: 32,
    COOKIE_NAME: "clippymap_csrf_token",
    HEADER_NAME: "x-csrf-token",
  },
  // 負荷テスト設定
  LOAD_TEST_CONFIG: {
    ALLOWED_USER_AGENTS: [
      /Artillery\.io/i,
      /autocannon/i,
      /k6/i,
      /JMeter/i,
      /LoadRunner/i,
      /Gatling/i,
      /wrk/i,
      /bombardier/i,
    ],
    BYPASS_RATE_LIMIT: true,
    BYPASS_DOS_PROTECTION: true,
  },
} as const;

/**
 * ページ別レート制限値を取得
 */
export function getPageRateLimit(pathname: string): number {
  // リスト詳細ページ
  if (pathname.startsWith("/lists/") && pathname !== "/lists") {
    return SECURITY_CONFIG.RATE_LIMITS.HEAVY_PAGE;
  }

  // ホームページ
  if (pathname === "/") {
    return SECURITY_CONFIG.RATE_LIMITS.HOME_PAGE;
  }

  // サンプルページ（データ量が多い）
  if (pathname.startsWith("/sample/")) {
    return SECURITY_CONFIG.RATE_LIMITS.HEAVY_PAGE;
  }

  // 決済系 API エンドポイント
  if (pathname.startsWith("/api/stripe/")) {
    return SECURITY_CONFIG.RATE_LIMITS.PAYMENT;
  }

  // その他の API エンドポイント
  if (pathname.startsWith("/api/")) {
    return SECURITY_CONFIG.RATE_LIMITS.API;
  }

  // 認証関連
  if (
    pathname.startsWith("/auth/") ||
    pathname === "/login" ||
    pathname === "/signup"
  ) {
    return SECURITY_CONFIG.RATE_LIMITS.AUTH;
  }

  // デフォルト
  return SECURITY_CONFIG.RATE_LIMITS.DEFAULT;
}

/**
 * CloudFlare Workers用レート制限
 */
export class WorkersRateLimit {
  private static requestCounts = new Map<
    string,
    { count: number; resetTime: number; violations: number }
  >();

  /**
   * レート制限チェック
   */
  static checkRateLimit(
    identifier: string,
    limit: number = SECURITY_CONFIG.RATE_LIMITS.DEFAULT,
    windowMs: number = 60000 // 1分
  ): { allowed: boolean; count: number; violations: number } {
    const now = Date.now();
    const entry = this.requestCounts.get(identifier);

    if (!entry || now > entry.resetTime) {
      const newEntry = { count: 1, resetTime: now + windowMs, violations: 0 };
      this.requestCounts.set(identifier, newEntry);
      return { allowed: true, count: 1, violations: 0 };
    }

    entry.count++;

    // 制限を超えた場合の違反回数をカウント
    if (entry.count > limit) {
      entry.violations++;
      return {
        allowed: false,
        count: entry.count,
        violations: entry.violations,
      };
    }

    return { allowed: true, count: entry.count, violations: entry.violations };
  }

  /**
   * 悪意のあるリクエストの検出
   */
  static isSuspiciousRequest(request: NextRequest): boolean {
    const userAgent = request.headers.get("user-agent") || "";
    // const referer = request.headers.get("referer") || ""; // 将来の拡張用

    // 負荷テスト用の例外チェック
    if (SECURITY_CONFIG.DOS_PROTECTION.LOAD_TEST_MODE) {
      const isLoadTestUA =
        SECURITY_CONFIG.LOAD_TEST_CONFIG.ALLOWED_USER_AGENTS.some((pattern) =>
          pattern.test(userAgent)
        );
      if (isLoadTestUA) {
        return false; // 負荷テスト用UAは疑わしくない
      }
    }

    // 疑わしいUser-Agentパターン
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /axios/i,
    ];

    // 正当なボットの除外
    const legitimateBots = [
      /googlebot/i,
      /bingbot/i,
      /slurp/i,
      /duckduckbot/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /linkedinbot/i,
    ];

    const hasSuspiciousUA = suspiciousPatterns.some((pattern) =>
      pattern.test(userAgent)
    );
    const isLegitimateBot = legitimateBots.some((pattern) =>
      pattern.test(userAgent)
    );

    // 疑わしいが正当なボットでない場合
    if (hasSuspiciousUA && !isLegitimateBot) {
      return true;
    }

    // 空のUser-Agentも疑わしい
    if (!userAgent.trim()) {
      return true;
    }

    // 異常に長いリクエストヘッダー
    const totalHeaderSize = Array.from(request.headers.entries()).reduce(
      (sum, [key, value]) => sum + key.length + value.length,
      0
    );

    if (totalHeaderSize > 8192) {
      // 8KB制限
      return true;
    }

    return false;
  }

  /**
   * DoS攻撃対策
   */
  static checkDoSProtection(
    request: NextRequest,
    clientIp: string
  ): {
    blocked: boolean;
    reason?: string;
    shouldChallenge?: boolean;
  } {
    const userAgent = request.headers.get("user-agent") || "";

    // 負荷テスト用の例外チェック
    if (SECURITY_CONFIG.DOS_PROTECTION.LOAD_TEST_MODE) {
      const isLoadTestUA =
        SECURITY_CONFIG.LOAD_TEST_CONFIG.ALLOWED_USER_AGENTS.some((pattern) =>
          pattern.test(userAgent)
        );
      if (
        isLoadTestUA &&
        SECURITY_CONFIG.LOAD_TEST_CONFIG.BYPASS_DOS_PROTECTION
      ) {
        return { blocked: false };
      }
    }

    // 疑わしいリクエストの検出
    if (this.isSuspiciousRequest(request)) {
      const entry = this.requestCounts.get(clientIp);

      // 通常の制限よりも厳しい制限を適用
      const strictLimit = SECURITY_CONFIG.RATE_LIMITS.STRICT;
      if (entry && entry.count > strictLimit) {
        return {
          blocked: true,
          reason: "Suspicious request pattern detected",
          shouldChallenge: true,
        };
      }
    }

    // 高頻度リクエストの検出
    const entry = this.requestCounts.get(clientIp);
    if (
      entry &&
      entry.count > SECURITY_CONFIG.DOS_PROTECTION.MAX_REQUESTS_PER_MINUTE
    ) {
      return {
        blocked: true,
        reason: "Rate limit exceeded",
        shouldChallenge: false,
      };
    }

    return { blocked: false };
  }
}

/**
 * API エンドポイント保護
 */
export function protectAPIEndpoint(request: NextRequest): {
  allowed: boolean;
  status?: number;
  message?: string;
  headers?: Record<string, string>;
} {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // 危険な拡張子をブロック
  const hasDangerousExtension =
    SECURITY_CONFIG.API_PROTECTION.BLOCKED_EXTENSIONS.some((ext) =>
      pathname.endsWith(ext)
    );

  if (hasDangerousExtension) {
    return {
      allowed: false,
      status: 403,
      message: "Forbidden file type",
    };
  }

  // POST/PUT/PATCHリクエストの Content-Type チェック
  if (["POST", "PUT", "PATCH"].includes(method)) {
    const contentType = request.headers.get("content-type") || "";
    const isAllowedContentType =
      SECURITY_CONFIG.API_PROTECTION.ALLOWED_CONTENT_TYPES.some((type) =>
        contentType.includes(type)
      );

    if (!isAllowedContentType && contentType !== "") {
      return {
        allowed: false,
        status: 415,
        message: "Unsupported Media Type",
      };
    }
  }

  return { allowed: true };
}

/**
 * セキュリティイベントログ
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
  severity: "low" | "medium" | "high" | "critical" = "medium"
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    severity,
    details,
    source: "cloudflare-workers",
  };

  // ローカル開発環境ではコンソールに出力
  if (process.env.NODE_ENV === "development") {
    console.log(`[SECURITY-${severity.toUpperCase()}]`, logEntry);
  }

  // 本番環境では適切なログ収集サービスに送信
  // TODO: Datadog、CloudWatch、Sentryなどへの送信を実装
}

/**
 * 認証チェック（今後の拡張用）
 */
export async function validateAuthentication(request: NextRequest): Promise<{
  authenticated: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    // TODO: JWT トークンの検証やセッション確認を実装
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return { authenticated: false, error: "No authorization header" };
    }

    // 簡易的な実装（実際には適切なJWT検証を実装）
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return { authenticated: false, error: "Invalid token format" };
    }

    // ここで実際のトークン検証を行う
    return { authenticated: true, userId: "placeholder" };
  } catch (error) {
    return {
      authenticated: false,
      error: `Authentication failed: ${error}`,
    };
  }
}

/**
 * CSRF トークン生成
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(SECURITY_CONFIG.CSRF.TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * CSRF トークン検証
 */
export function validateCSRFToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(SECURITY_CONFIG.CSRF.COOKIE_NAME);
  const headerToken = request.headers.get(SECURITY_CONFIG.CSRF.HEADER_NAME);

  if (!cookieToken?.value || !headerToken) {
    return false;
  }

  return cookieToken.value === headerToken;
}
