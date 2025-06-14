import { getCacheStrategy } from "@/lib/cloudflare/cdn-cache";
import {
  CPUTimeMonitor,
  createPerformanceOptimizedResponse,
  logPerformanceMetrics,
  PERFORMANCE_CONFIG,
} from "@/lib/cloudflare/performance-optimization";
import {
  logSecurityEvent,
  protectAPIEndpoint,
  SECURITY_CONFIG,
  setSecurityHeaders,
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

  // CloudFlare Workers 環境での高度なセキュリティチェック
  const clientIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // 負荷テスト用の例外チェック
  const userAgent = request.headers.get("user-agent") || "";
  const isLoadTestMode = process.env.LOAD_TEST_MODE === "true";
  const isLoadTestUA =
    isLoadTestMode &&
    SECURITY_CONFIG.LOAD_TEST_CONFIG.ALLOWED_USER_AGENTS.some((pattern) =>
      pattern.test(userAgent)
    );

  // 負荷テスト時はセキュリティチェックをバイパス
  if (isLoadTestUA && SECURITY_CONFIG.LOAD_TEST_CONFIG.BYPASS_RATE_LIMIT) {
    console.log(
      `🧪 負荷テスト検出: ${userAgent} - セキュリティチェックをバイパス`
    );

    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // 基本的なヘッダーのみ設定
    response.headers.set("X-Request-ID", crypto.randomUUID());
    response.headers.set("X-Load-Test-Mode", "true");

    // CloudFlare Workers 用セキュリティヘッダーの適用（軽量版）
    response = setSecurityHeaders(response);

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
        logPerformanceMetrics(
          pathname,
          performanceMonitor,
          false,
          "Early fallback triggered"
        );
        return fallbackResponse;
      }
    }, 2000);
  }

  try {
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

    // WorkersRateLimit による統合レート制限チェック
    const rateLimitCheck = WorkersRateLimit.checkRateLimit(clientIp);
    if (!rateLimitCheck.allowed) {
      console.warn(
        `Rate limit exceeded for IP: ${clientIp}, Path: ${pathname}`
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
        },
        "medium"
      );

      return new NextResponse("Rate limit exceeded", {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "60",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": Math.ceil(Date.now() / 1000 + 60).toString(),
        },
      });
    }

    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Add security headers to all responses
    response.headers.set("X-Request-ID", crypto.randomUUID());
    response.headers.set("X-RateLimit-Limit", "60");
    response.headers.set(
      "X-RateLimit-Remaining",
      (60 - rateLimitCheck.count).toString()
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
        logPerformanceMetrics(
          pathname,
          performanceMonitor,
          false,
          "CPU timeout fallback"
        );
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
        logPerformanceMetrics(
          pathname,
          performanceMonitor,
          false,
          "Post-auth timeout fallback"
        );
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
    const isPublicRoute =
      pathname.startsWith("/sample/") ||
      (pathname.startsWith("/lists/") && pathname !== "/lists");
    const cacheControl = getCacheStrategy(pathname, isPublicRoute);

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

    // CloudFlare Workers 用セキュリティヘッダーの適用
    response = setSecurityHeaders(response);

    // パフォーマンス監視ログ
    logPerformanceMetrics(pathname, performanceMonitor, true);

    return response;
  } catch (error) {
    // エラー時のフォールバック
    console.error("Middleware error:", error);

    const fallbackResponse = createPerformanceOptimizedResponse(
      request,
      performanceMonitor
    );
    if (fallbackResponse) {
      logPerformanceMetrics(
        pathname,
        performanceMonitor,
        false,
        `Middleware error: ${error}`
      );
      return fallbackResponse;
    }

    // 最終的なエラーレスポンス
    logPerformanceMetrics(
      pathname,
      performanceMonitor,
      false,
      `Critical error: ${error}`
    );
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
