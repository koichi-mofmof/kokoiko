import {
  getCacheStrategy,
  checkListPublicStatus,
  getAdaptiveCacheStrategy,
} from "@/lib/cloudflare/cdn-cache";
import {
  CPUTimeMonitor,
  createPerformanceOptimizedResponse,
  PERFORMANCE_CONFIG,
} from "@/lib/cloudflare/performance-optimization";
import {
  getPageRateLimit,
  logSecurityEvent,
  protectAPIEndpoint,
  SECURITY_CONFIG,
  WorkersRateLimit,
} from "@/lib/cloudflare/security";
import { createClient } from "@/lib/supabase/server";
import { recordRateLimitExceeded } from "@/lib/utils/security-monitor";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Edge Runtime対応のCSRFトークン生成
function generateCSRFTokenEdge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

// CSP用のnonce生成
function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

// CSPヘッダー値を生成
function getContentSecurityPolicyHeaderValue(nonce: string): string {
  const isDevelopment = process.env.NODE_ENV === "development";

  // 開発環境用のCSP設定（Next.jsの開発サーバー対応）
  const developmentCSP = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com https://www.google.com https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: http://127.0.0.1:54321 http://localhost:54321 http://192.168.10.104:3000 https://images.pexels.com https://lh3.googleusercontent.com https://maps.googleapis.com https://maps.gstatic.com https://*.openstreetmap.org https://*.tile.openstreetmap.org https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://pagead2.googlesyndication.com https://tpc.googlesyndication.com",
    "connect-src 'self' http://127.0.0.1:54321 http://localhost:54321 http://192.168.10.104:3000 https: *.stripe.com *.googleapis.com *.google-analytics.com *.googletagmanager.com *.googlesyndication.com *.doubleclick.net",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://ep2.adtrafficquality.google",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // 開発環境ではHTTPS強制を無効化
  ];

  // 本番環境用のCSP設定（Next.js 15.3.3対応：style-srcはunsafe-inlineのみ）
  const productionCSP = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com https://maps.googleapis.com https://www.google.com https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com https://pagead2.googlesyndication.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: *.supabase.co *.googleapis.com *.gstatic.com *.google-analytics.com *.googletagmanager.com *.adtrafficquality.google *.googlesyndication.com",
    "connect-src 'self' https: *.supabase.co *.stripe.com *.googleapis.com https://cloudflareinsights.com *.google-analytics.com *.googletagmanager.com *.googlesyndication.com *.doubleclick.net",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://ep2.adtrafficquality.google",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  const csp = isDevelopment ? developmentCSP : productionCSP;
  return csp.join("; ");
}

// Development mode configuration
const isDevelopment = process.env.NODE_ENV === "development";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // パフォーマンス監視開始
  const performanceMonitor = new CPUTimeMonitor();

  // Skip rate limiting for static assets and development-only paths
  if (
    isDevelopment &&
    (pathname.startsWith("/_next/") ||
      pathname.startsWith("/api/_next/") ||
      pathname.includes(".")) // Skip files with extensions (images, css, js, etc.)
  ) {
    return NextResponse.next();
  }

  // 🔍 検索エンジンクローラーの検出と特別処理
  const userAgent = request.headers.get("user-agent") || "";
  const isSearchBot =
    /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator/i.test(
      userAgent
    );

  if (isSearchBot) {
    console.log(`🤖 検索ボット検出: ${userAgent} - 最適化された処理を適用`);

    // 検索ボット向けの最適化されたレスポンス
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-crawler", "true");

    let response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // 検索ボット向けの最小限ヘッダー設定
    response.headers.set("X-Robots-Tag", "index, follow");
    response.headers.set("Cache-Control", "public, max-age=86400"); // 24時間キャッシュ

    return response;
  }

  // CloudFlare Workers 環境での高度なセキュリティチェック
  const clientIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // 負荷テスト用の例外チェック
  const isLoadTestMode = process.env.LOAD_TEST_MODE === "true";
  const isLoadTestUA =
    isLoadTestMode &&
    SECURITY_CONFIG.LOAD_TEST_CONFIG.ALLOWED_USER_AGENTS.some((pattern) =>
      pattern.test(userAgent)
    );

  // CSP用のnonce生成
  const nonce = generateNonce();

  // 負荷テスト時はセキュリティチェックをバイパス
  if (isLoadTestUA && SECURITY_CONFIG.LOAD_TEST_CONFIG.BYPASS_RATE_LIMIT) {
    console.log(
      `🧪 負荷テスト検出: ${userAgent} - セキュリティチェックをバイパス`
    );

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);

    let response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // 基本的なヘッダーのみ設定
    response.headers.set("X-Request-ID", crypto.randomUUID());
    response.headers.set("X-Load-Test-Mode", "true");
    response.headers.set(
      "Content-Security-Policy",
      getContentSecurityPolicyHeaderValue(nonce)
    );

    return response;
  }

  // 🚨 緊急パフォーマンス対策: 重いページの早期フォールバック
  const isHeavyPage =
    pathname === "/" ||
    pathname === "/sample" ||
    pathname.startsWith("/sample/") ||
    pathname.startsWith("/lists/");

  if (isHeavyPage && PERFORMANCE_CONFIG.ENABLE_FALLBACK) {
    // 2秒経過時点でフォールバックを検討
    setTimeout(() => {
      const fallbackResponse = createPerformanceOptimizedResponse(
        request,
        performanceMonitor
      );
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }, 2000);
  }

  try {
    // 初回アクセスでlangクッキーが無い場合、Accept-Languageから自動判定（q値考慮）
    const hasLangCookie = request.cookies.get("lang");
    if (!hasLangCookie) {
      const al = request.headers.get("accept-language") || "";
      const parsed = al
        .split(",")
        .map((p, idx) => {
          const [tagRaw, qPart] = p.trim().split(";");
          const tag = tagRaw.toLowerCase();
          const qm = /q=([0-9.]+)/i.exec(qPart || "");
          const q = qm ? parseFloat(qm[1]) : 1;
          return { tag, q: isNaN(q) ? 0 : q, idx };
        })
        .filter((t) => t.tag);
      parsed.sort((a, b) => (b.q !== a.q ? b.q - a.q : a.idx - b.idx));
      const top = parsed[0]?.tag || "";
      const detected = top.startsWith("ja")
        ? "ja"
        : top.startsWith("en")
        ? "en"
        : "ja";
      const response = NextResponse.next();
      response.cookies.set("lang", detected, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
      return response;
    }

    // DoS攻撃対策
    const dosCheck = WorkersRateLimit.checkDoSProtection(request, clientIp);
    if (dosCheck.blocked) {
      logSecurityEvent(
        "dos_attack_blocked",
        {
          ip: clientIp,
          reason: dosCheck.reason,
          userAgent: request.headers.get("user-agent"),
          path: pathname,
        },
        "high"
      );

      return new NextResponse("Request blocked", {
        status: 403,
        headers: { "X-Block-Reason": dosCheck.reason || "Security violation" },
      });
    }

    // API エンドポイント保護
    if (pathname.startsWith("/api/")) {
      const apiProtection = protectAPIEndpoint(request);
      if (!apiProtection.allowed) {
        logSecurityEvent(
          "api_endpoint_violation",
          {
            ip: clientIp,
            path: pathname,
            method: request.method,
            reason: apiProtection.message,
          },
          "medium"
        );

        return new NextResponse(apiProtection.message || "Forbidden", {
          status: apiProtection.status || 403,
          headers: apiProtection.headers || {},
        });
      }
    }

    // ページ別レート制限チェック
    const pageRateLimit = getPageRateLimit(pathname);
    const rateLimitCheck = WorkersRateLimit.checkRateLimit(
      clientIp,
      pageRateLimit
    );

    if (!rateLimitCheck.allowed) {
      console.warn(
        `Rate limit exceeded for IP: ${clientIp}, Path: ${pathname}, Limit: ${pageRateLimit}`
      );

      // セキュリティ監視システムに記録
      recordRateLimitExceeded(
        clientIp,
        request.headers.get("user-agent") || "unknown",
        pathname
      );

      logSecurityEvent(
        "rate_limit_exceeded",
        {
          ip: clientIp,
          path: pathname,
          count: rateLimitCheck.count,
          violations: rateLimitCheck.violations,
          limit: pageRateLimit,
        },
        "medium"
      );

      return new NextResponse("Rate limit exceeded", {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": pageRateLimit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": Math.ceil(Date.now() / 1000 + 60).toString(),
          "X-Page-Type": pathname.startsWith("/lists/") ? "heavy" : "normal",
        },
      });
    }

    // リクエストヘッダーにnonceを追加
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);

    let response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // セキュリティヘッダーを設定
    response.headers.set("X-Request-ID", crypto.randomUUID());
    response.headers.set("X-RateLimit-Limit", pageRateLimit.toString());
    response.headers.set(
      "X-RateLimit-Remaining",
      (pageRateLimit - rateLimitCheck.count).toString()
    );
    response.headers.set("X-Page-Rate-Limit", pageRateLimit.toString());

    // CSPヘッダーを設定
    response.headers.set(
      "Content-Security-Policy",
      getContentSecurityPolicyHeaderValue(nonce)
    );

    // パフォーマンス監視ヘッダー追加
    response.headers.set(
      "X-Processing-Time",
      performanceMonitor.getElapsedTime().toString()
    );
    response.headers.set(
      "X-Remaining-Time",
      performanceMonitor.getRemainingTime().toString()
    );

    // CSRF Token 管理
    const existingCSRFToken = request.cookies.get("clippymap_csrf_token");

    // CSRFトークンが存在しない場合のみ新しいCookieを設定
    if (!existingCSRFToken) {
      const csrfToken = generateCSRFTokenEdge();

      response.cookies.set("clippymap_csrf_token", csrfToken, {
        httpOnly: false, // CSRFトークンはJavaScriptからアクセス可能である必要がある
        secure: process.env.NODE_ENV === "production", // 本番環境でのみHTTPS必須
        sameSite: "strict", // 厳格なCSRF保護
        maxAge: 60 * 60 * 24, // 24時間
        path: "/",
      });
    }

    // 🚨 CPU時間制限チェック
    if (performanceMonitor.isNearTimeout()) {
      const fallbackResponse = createPerformanceOptimizedResponse(
        request,
        performanceMonitor
      );
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }

    const supabase = await createClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // 🚨 再度CPU時間制限チェック（認証後）
    if (performanceMonitor.isNearTimeout()) {
      const fallbackResponse = createPerformanceOptimizedResponse(
        request,
        performanceMonitor
      );
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }

    // Log authentication errors for monitoring
    if (sessionError) {
      console.error("Authentication error in middleware:", sessionError);
    }

    // 保護されたルートの細かい制御
    const protectedRoutes = ["/settings", "/add-place"];
    const protectedListRoutes = ["/lists"]; // マイリスト一覧のみ保護（個別リストは除外）
    const adminRoutes = ["/admin"];
    const apiRoutes = ["/api/protected"];

    // Admin routes protection
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      // Additional admin role check could be added here
      // const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      // if (profile?.role !== 'admin') {
      //   return new NextResponse('Forbidden', { status: 403 });
      // }
    }

    // API routes protection
    if (apiRoutes.some((route) => pathname.startsWith(route))) {
      if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    // Protected routes for authenticated users
    if (
      !session &&
      protectedRoutes.some((route) => pathname.startsWith(route))
    ) {
      // Prevent potential redirect loops
      if (pathname === "/login") {
        return response;
      }

      // Sanitize redirect URL to prevent open redirects
      const redirectUrl = new URL("/login", request.url);
      const sanitizedRedirect =
        pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/";
      redirectUrl.searchParams.set("redirect_url", sanitizedRedirect);
      return NextResponse.redirect(redirectUrl);
    }

    // マイリスト一覧のみを保護（個別のリスト詳細は除外）
    if (!session && protectedListRoutes.some((route) => pathname === route)) {
      // Prevent potential redirect loops
      if (pathname === "/login") {
        return response;
      }

      // Sanitize redirect URL to prevent open redirects
      const redirectUrl = new URL("/login", request.url);
      const sanitizedRedirect =
        pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/";
      redirectUrl.searchParams.set("redirect_url", sanitizedRedirect);
      return NextResponse.redirect(redirectUrl);
    }

    // Prevent authenticated users from accessing auth pages
    if (session && ["/login", "/signup"].includes(pathname)) {
      const redirectTarget = searchParams.get("redirect_url") || "/lists";
      // Sanitize redirect target
      const sanitizedTarget =
        redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")
          ? redirectTarget
          : "/lists";
      return NextResponse.redirect(new URL(sanitizedTarget, request.url));
    }

    // Additional security for list access
    if (pathname.startsWith("/lists/") && pathname !== "/lists") {
      // Extract list ID from path
      const pathSegments = pathname.split("/");
      const listId = pathSegments[2];

      if (listId && listId !== "join" && session) {
        // Here we could add additional access control for specific lists
        // This would require checking the database, which should be done efficiently
        // For now, we'll let the page component handle the authorization
      }
    }

    // Apply cache headers based on the route
    let cacheControl = getCacheStrategy(pathname);

    // リスト詳細ページの場合は適応的キャッシュ戦略を使用
    const listIdMatch = pathname.match(/^\/lists\/([^\/]+)$/);
    if (listIdMatch) {
      const listId = listIdMatch[1];
      if (listId !== "join") {
        try {
          const isPublic = await checkListPublicStatus(pathname);
          cacheControl = await getAdaptiveCacheStrategy(listId, isPublic);
        } catch (error) {
          console.warn("Failed to apply adaptive cache strategy:", error);
          // エラー時はデフォルト戦略を使用
        }
      }
    }

    // Set cache control headers
    response.headers.set("Cache-Control", cacheControl);

    // Add additional headers for static assets
    if (pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp)$/)) {
      response.headers.set("Vary", "Accept-Encoding");
    }

    // CORS headers for API routes
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
  } catch (error) {
    // エラー時のフォールバック
    console.error("Middleware error:", error);

    const fallbackResponse = createPerformanceOptimizedResponse(
      request,
      performanceMonitor
    );
    if (fallbackResponse) {
      return fallbackResponse;
    }

    // 最終的なエラーレスポンス
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
