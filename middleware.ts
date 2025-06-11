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

// Rate limiting configuration - adjust for development vs production
const isDevelopment = process.env.NODE_ENV === "development";
const REQUESTS_PER_MINUTE = isDevelopment ? 300 : 60; // More lenient in development
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function getRateLimitInfo(identifier: string) {
  const now = Date.now();
  const entry = requestCounts.get(identifier);

  if (!entry || now > entry.resetTime) {
    const newEntry = { count: 1, resetTime: now + 60000 }; // 60 seconds
    requestCounts.set(identifier, newEntry);
    return { allowed: true, count: 1 };
  }

  entry.count++;
  return { allowed: entry.count <= REQUESTS_PER_MINUTE, count: entry.count };
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip rate limiting for static assets and development-only paths
  if (
    isDevelopment &&
    (pathname.startsWith("/_next/") ||
      pathname.startsWith("/api/_next/") ||
      pathname.includes(".")) // Skip files with extensions (images, css, js, etc.)
  ) {
    return NextResponse.next();
  }

  // Basic rate limiting (IP-based)
  const clientIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rateLimit = getRateLimitInfo(clientIp);
  if (!rateLimit.allowed) {
    console.warn(`Rate limit exceeded for IP: ${clientIp}, Path: ${pathname}`);

    // セキュリティ監視システムに記録
    recordRateLimitExceeded(
      clientIp,
      request.headers.get("user-agent") || "unknown",
      pathname
    );

    return new NextResponse("Rate limit exceeded", {
      status: 429,
      headers: {
        "Retry-After": "60",
        "X-RateLimit-Limit": REQUESTS_PER_MINUTE.toString(),
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
  response.headers.set("X-RateLimit-Limit", REQUESTS_PER_MINUTE.toString());
  response.headers.set(
    "X-RateLimit-Remaining",
    (REQUESTS_PER_MINUTE - rateLimit.count).toString()
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

  const supabase = await createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  // Log authentication errors for monitoring
  if (sessionError) {
    console.error("Authentication error in middleware:", sessionError);
  }

  // 保護されたルートのリスト - より細かい制御
  const protectedRoutes = ["/lists", "/settings", "/add-place"];
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
  if (!session && protectedRoutes.some((route) => pathname.startsWith(route))) {
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

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
