import { createClient } from "@/lib/supabase/server";
import { sanitizeInternalPath } from "@/lib/utils/auth-redirect";
import type { EmailOtpType } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * メール確認リンクの着地点（token_hash 方式）。
 *
 * 既定の {{ .ConfirmationURL }} は PKCE のコード交換になるため、登録した
 * ブラウザに残る code_verifier のcookieが必須で、別ブラウザ・別端末でメールを
 * 開くと "both auth code and code verifier should be non-empty" で必ず失敗する。
 * token_hash はcookieに依存しないので、どこで開いても確認が成立する。
 *
 * Supabase の「Confirm signup」テンプレートを次の形にすることで有効になる:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next={{ .RedirectTo }}
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") || "signup") as EmailOtpType;

  // next はテンプレート次第で絶対URLにも相対パスにもなる。パス部分だけを使う。
  const rawNext = searchParams.get("next");
  let nextPath = "/lists";
  if (rawNext) {
    try {
      const parsed = new URL(rawNext, origin);
      // 別ホストのURLは、パスだけ取り出して使うこともしない
      nextPath =
        parsed.origin === origin
          ? sanitizeInternalPath(parsed.pathname + parsed.search)
          : "/lists";
    } catch {
      nextPath = sanitizeInternalPath(rawNext);
    }
  }

  const failure = () => {
    const url = new URL("/login", origin);
    url.searchParams.set("auth_error", "confirm");
    return NextResponse.redirect(url);
  };

  if (!tokenHash) return failure();

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    console.error("Email confirmation failed", { type, message: error.message });
    return failure();
  }

  revalidatePath("/", "layout");

  // クライアント側で sign_up を計測するためのパラメータを付与する
  const destination = new URL(nextPath, origin);
  destination.searchParams.set("auth_event", "signup_email");
  return NextResponse.redirect(destination);
}
