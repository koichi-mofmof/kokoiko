import { bookmarkList } from "@/lib/actions/lists";
import { createClient } from "@/lib/supabase/server";
import { isNewSignup } from "@/lib/utils/is-new-signup";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "redirect_url" is in param, use it as the redirect URL
  const redirectUrl = searchParams.get("redirect_url") || "/lists";
  // ブックマーク対象のリストID
  const bookmarkListId = searchParams.get("bookmark");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // OAuth認証成功後、プロファイルが存在するかチェック
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 新規登録かどうかは auth.users のタイムスタンプで判定する。
      // プロファイル有無で判定すると、DBトリガー handle_new_user が先に作るため
      // 新規登録が常に login として計測されてしまう。
      // 確認メールのリンクは登録時にこちらが発行しているので、その意図を優先する。
      // 時間差で踏まれると created_at と last_sign_in_at が離れ、時刻判定では
      // 登録がログインに化けるため。
      const isNewUser =
        searchParams.get("auth_intent") === "signup" || isNewSignup(user);

      if (user) {
        // プロファイルの存在確認（トリガーが失敗していた場合の保険）
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

      // ブックマーク処理（ユーザーがブックマーク意図でサインアップ/ログインした場合）
      if (bookmarkListId && user) {
        try {
          const bookmarkResult = await bookmarkList(bookmarkListId);
          if (bookmarkResult.success) {
            console.log(`リスト ${bookmarkListId} を自動ブックマークしました`);
          } else {
            console.error("自動ブックマーク失敗:", bookmarkResult.error);
          }
        } catch (error) {
          console.error("自動ブックマーク処理エラー:", error);
        }
      }

      // 認証後にキャッシュを無効化してセッション状態を即座に反映
      revalidatePath("/", "layout");
      revalidatePath("/lists");

      // クライアント側（use-auth-sync）で sign_up / login を発火させるための計測パラメータを付与
      // （元コードと同じ文字列連結方式。new URL() による例外リスクを避ける）
      // 認証方法はコールバックURLに自分で載せた auth_method を信用する。
      // app_metadata.provider は「アカウントを最初に作った方法」であり、
      // メール登録後に Google を連携した人は Google ログインでも "email" のまま残るため使えない。
      // 付いていない場合（過去に発行された確認メールのリンク等）は従来通り google 扱い。
      const authMethod =
        searchParams.get("auth_method") === "email" ? "email" : "google";
      const authEvent = isNewUser
        ? `signup_${authMethod}`
        : `login_${authMethod}`;
      const separator = redirectUrl.includes("?") ? "&" : "?";
      const destination = `${origin}${redirectUrl}${separator}auth_event=${authEvent}`;

      return NextResponse.redirect(destination);
    }
  }

  // 認証に失敗した場合はログイン画面へ。原因を取り違えないよう、
  // このコールバックがメール確認だったのか Google だったのかで出し分ける。
  console.error("Auth callback failed", {
    authMethod: searchParams.get("auth_method"),
    hasCode: Boolean(code),
  });
  const errorRedirect = new URL("/login", request.url);
  if (searchParams.get("auth_method") === "email") {
    errorRedirect.searchParams.set("auth_error", "confirm");
  } else {
    errorRedirect.searchParams.set("google_error", "true");
  }
  return NextResponse.redirect(errorRedirect);
}
