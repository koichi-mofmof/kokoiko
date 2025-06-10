import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // 保護されたルートのリスト
  const protectedRoutes = ["/lists", "/settings", "/add-place"];

  // ユーザーが認証されておらず、保護されたルートにアクセスしようとした場合
  if (!session && protectedRoutes.some((route) => pathname.startsWith(route))) {
    // ログインページにリダイレクトし、リダイレクト先のURLをクエリパラメータとして追加
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth routes like login, signup, callback)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|auth).*)",
  ],
};
