/**
 * CloudFlare Workers セキュリティ設定
 * Phase 3.3: セキュリティ設定強化
 */

import { NextRequest, NextResponse } from "next/server";

// CloudFlare Workers環境での設定値
export const SECURITY_CONFIG = {
  // レート制限設定（Workers環境用）
  RATE_LIMITS: {
    API: 100, // API呼び出し: 100req/min
    AUTH: 10, // 認証エンドポイント: 10req/min
    UPLOAD: 20, // ファイルアップロード: 20req/min
    DEFAULT: 300, // その他: 300req/min
    // 負荷テスト用の緩和設定
    LOAD_TEST: 1000, // 負荷テスト時: 1000req/min
  },

  // DoS攻撃対策
  DOS_PROTECTION: {
    MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_CONCURRENT_REQUESTS: 50,
    BLOCK_SUSPICIOUS_USER_AGENTS: true,
    CHALLENGE_THRESHOLD: 500, // 500req/minでチャレンジ発動
    // 負荷テスト用の緩和設定
    LOAD_TEST_MODE: process.env.LOAD_TEST_MODE === "true",
    LOAD_TEST_CHALLENGE_THRESHOLD: 2000, // 負荷テスト時: 2000req/min
  },

  // セキュリティヘッダー
  SECURITY_HEADERS: {
    HSTS_MAX_AGE: 31536000, // 1年
    CSP_NONCE_LENGTH: 16,
    REFERRER_POLICY: "strict-origin-when-cross-origin",
  },

  // 負荷テスト用の許可設定
  LOAD_TEST_CONFIG: {
    ALLOWED_USER_AGENTS: [
      /load.?test/i,
      /performance.?test/i,
      /artillery/i,
      /node/i,
      /simple.?load.?test/i,
    ],
    ALLOWED_IPS: [
      // 開発環境のIPアドレス（必要に応じて追加）
    ],
    BYPASS_RATE_LIMIT: true,
    BYPASS_DOS_PROTECTION: true,
  },
} as const;

/**
 * Content Security Policy 設定（CloudFlare Workers用）
 */
export function generateCSP(nonce?: string): string {
  const isDevelopment = process.env.NODE_ENV === "development";

  // 開発環境用の追加設定（ローカルSupabaseアクセス許可）
  const developmentExtensions = isDevelopment
    ? {
        imgSrc: " http://127.0.0.1:54321",
        connectSrc: " http://127.0.0.1:54321 ws://127.0.0.1:54321",
      }
    : {
        imgSrc: "",
        connectSrc: "",
      };

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${
      nonce ? `'nonce-${nonce}'` : ""
    } https://js.stripe.com https://maps.googleapis.com https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: https: *.supabase.co *.googleapis.com *.gstatic.com${developmentExtensions.imgSrc}`,
    `connect-src 'self' https: *.supabase.co *.stripe.com *.googleapis.com${developmentExtensions.connectSrc}`,
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  // 本番環境のみupgrade-insecure-requestsを追加
  if (!isDevelopment) {
    cspDirectives.push("upgrade-insecure-requests");
  }

  return cspDirectives.join("; ");
}

/**
 * セキュリティヘッダーの設定
 */
export function setSecurityHeaders(
  response: NextResponse,
  nonce?: string
): NextResponse {
  // CSP設定
  response.headers.set("Content-Security-Policy", generateCSP(nonce));

  // HSTS設定
  response.headers.set(
    "Strict-Transport-Security",
    `max-age=${SECURITY_CONFIG.SECURITY_HEADERS.HSTS_MAX_AGE}; includeSubDomains; preload`
  );

  // その他のセキュリティヘッダー
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Referrer-Policy",
    SECURITY_CONFIG.SECURITY_HEADERS.REFERRER_POLICY
  );

  // Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(self)"
  );

  // CSRF保護
  response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");

  return response;
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
    // 負荷テスト用の例外チェック
    if (SECURITY_CONFIG.DOS_PROTECTION.LOAD_TEST_MODE) {
      const userAgent = request.headers.get("user-agent") || "";
      const isLoadTestUA =
        SECURITY_CONFIG.LOAD_TEST_CONFIG.ALLOWED_USER_AGENTS.some((pattern) =>
          pattern.test(userAgent)
        );

      if (
        isLoadTestUA &&
        SECURITY_CONFIG.LOAD_TEST_CONFIG.BYPASS_DOS_PROTECTION
      ) {
        return { blocked: false }; // 負荷テスト時はDoS保護をバイパス
      }
    }

    // リクエストサイズチェック
    const contentLength = request.headers.get("content-length");
    if (
      contentLength &&
      parseInt(contentLength) > SECURITY_CONFIG.DOS_PROTECTION.MAX_REQUEST_SIZE
    ) {
      return { blocked: true, reason: "Request too large" };
    }

    // 疑わしいリクエストの検出
    if (
      SECURITY_CONFIG.DOS_PROTECTION.BLOCK_SUSPICIOUS_USER_AGENTS &&
      this.isSuspiciousRequest(request)
    ) {
      return { blocked: true, reason: "Suspicious user agent" };
    }

    // 高頻度アクセスのチェック（チャレンジ発動）
    const challengeThreshold = SECURITY_CONFIG.DOS_PROTECTION.LOAD_TEST_MODE
      ? SECURITY_CONFIG.DOS_PROTECTION.LOAD_TEST_CHALLENGE_THRESHOLD
      : SECURITY_CONFIG.DOS_PROTECTION.CHALLENGE_THRESHOLD;

    const highFreqLimit = this.checkRateLimit(
      `challenge:${clientIp}`,
      challengeThreshold,
      60000
    );

    if (!highFreqLimit.allowed) {
      return {
        blocked: false,
        shouldChallenge: true,
        reason: "High frequency access",
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

  // HTTPメソッド制限
  const allowedMethods: Record<string, string[]> = {
    "/api/stripe/checkout": ["POST"],
    "/api/stripe/webhook": ["POST"],
    "/api/security/stats": ["GET"],
  };

  const allowed = allowedMethods[pathname];
  if (allowed && !allowed.includes(method)) {
    return {
      allowed: false,
      status: 405,
      message: "Method not allowed",
      headers: { Allow: allowed.join(", ") },
    };
  }

  // Content-Type検証（POSTリクエスト）
  if (method === "POST" && !request.headers.get("content-type")) {
    return {
      allowed: false,
      status: 400,
      message: "Content-Type header required",
    };
  }

  return { allowed: true };
}

/**
 * セキュリティイベントのログ記録
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
  severity: "low" | "medium" | "high" | "critical" = "medium"
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    severity,
    details,
    environment: process.env.NODE_ENV,
  };

  // 本番環境では外部ログサービスに送信
  if (process.env.NODE_ENV === "production") {
    // TODO: 外部ログサービス（Cloudflare Analytics、Sentry等）に送信
    console.warn("SECURITY_EVENT:", JSON.stringify(logEntry));
  } else {
    console.warn("SECURITY_EVENT:", logEntry);
  }
}

/**
 * CloudFlare Workers環境での認証チェック
 */
export async function validateAuthentication(request: NextRequest): Promise<{
  authenticated: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    // Authorization ヘッダーのチェック
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return {
        authenticated: false,
        error: "Missing or invalid authorization header",
      };
    }

    // JWTトークンの検証（簡易版）
    const token = authHeader.slice(7);
    if (!token || token.length < 10) {
      return { authenticated: false, error: "Invalid token format" };
    }

    // 実際の実装では、Supabaseクライアントでトークン検証
    // const { data, error } = await supabase.auth.getUser(token);

    return { authenticated: true, userId: "user-id" };
  } catch (error) {
    logSecurityEvent("authentication_error", { error: String(error) }, "high");
    return { authenticated: false, error: "Authentication failed" };
  }
}

/**
 * CSRFトークンの生成（Workers用）
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * CSRFトークンの検証
 */
export function validateCSRFToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get("clippymap_csrf_token")?.value;
  const headerToken = request.headers.get("x-csrf-token");
  const formToken = request.headers.get("x-requested-with"); // XHRリクエストの場合

  if (!cookieToken) {
    return false;
  }

  // ヘッダーまたはフォームからのトークンチェック
  return headerToken === cookieToken || formToken === "XMLHttpRequest";
}
