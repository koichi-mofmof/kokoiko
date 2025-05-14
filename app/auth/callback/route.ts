import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr"; // CookieOptions をインポート

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") || "/mypage"; // デフォルトのリダイレクト先を /mypage に変更

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // options の型を CookieOptions に変更
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              console.error("Cookie set error:", error);
            }
          },
          async remove(name: string, options: CookieOptions) {
            // options の型を CookieOptions に変更
            try {
              cookieStore.set({ name, value: "", ...options }); // deleteの代わりにsetで空文字と過去の有効期限を設定する
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              console.error("Cookie remove error:", error);
            }
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  console.error("Error in OAuth callback or no code found");
  return NextResponse.redirect(`${origin}/auth/auth-code-error`); // エラーページへリダイレクト
}
