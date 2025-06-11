import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "redirect_url" is in param, use it as the redirect URL
  const redirectUrl = searchParams.get("redirect_url") || "/lists";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // OAuth認証成功後、プロファイルが存在するかチェック
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // プロファイルの存在確認
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        // プロファイルが存在しない場合、作成する
        if (profileError || !profile) {
          console.log("プロファイルが存在しません。作成します:", user.id);

          // Googleアカウントの情報を取得
          const googleDisplayName =
            user.user_metadata?.full_name || user.user_metadata?.name;
          const googleAvatarUrl =
            user.user_metadata?.avatar_url || user.user_metadata?.picture;

          console.log("Google OAuth metadata:", {
            full_name: user.user_metadata?.full_name,
            name: user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url,
            picture: user.user_metadata?.picture,
          });

          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              username: `user_${user.id.slice(0, 8)}`,
              display_name: googleDisplayName || null,
              bio: null,
              avatar_url: googleAvatarUrl || null,
            });

          if (insertError) {
            console.error("プロファイル作成エラー:", insertError);
          } else {
            console.log("プロファイルを正常に作成しました:", user.id, {
              display_name: googleDisplayName,
              avatar_url: googleAvatarUrl,
            });
          }
        }
      }

      // 認証後にキャッシュを無効化してセッション状態を即座に反映
      revalidatePath("/", "layout");
      revalidatePath("/lists");

      return NextResponse.redirect(`${origin}${redirectUrl}`);
    }
  }

  // return the user to an error page with instructions
  console.error("Error in OAuth callback or no code found");
  const errorRedirect = new URL("/login", request.url);
  errorRedirect.searchParams.set("google_error", "true");
  return NextResponse.redirect(errorRedirect);
}
