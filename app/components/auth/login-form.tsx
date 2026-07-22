"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { markAuthCallbackPending } from "@/hooks/use-auth-sync";
import { useI18n } from "@/hooks/use-i18n";
import {
  AuthState,
  loginWithCredentials,
  loginWithGoogle,
} from "@/lib/actions/auth";
import {
  buildAuthHref,
  resolvePostAuthRedirect,
} from "@/lib/utils/auth-redirect";
import { isGoogleOAuthBlocked } from "@/lib/utils/browser-detection";
import { getCSRFTokenFromCookie } from "@/lib/utils/csrf-client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { GoogleLogoIcon } from "./signup-form";
import { WebViewWarning } from "./webview-warning";

// Submit ボタンコンポーネント (useFormStatusを使用)
function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useI18n();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? t("auth.login.submit.pending") : t("auth.common.login")}
    </Button>
  );
}

// Google ログインボタンコンポーネント (useFormStatusを使用)
function GoogleLoginButton() {
  const { pending } = useFormStatus();
  const { t } = useI18n();

  return (
    <Button
      type="submit"
      variant="outline"
      className="w-full"
      disabled={pending}
    >
      <GoogleLogoIcon />
      {pending ? t("common.processing") : t("auth.login.google")}
    </Button>
  );
}

export function LoginForm() {
  const initialState: AuthState = { message: null, errors: {}, success: false };
  const [state, dispatch] = useActionState(loginWithCredentials, initialState);
  const { t } = useI18n();

  const searchParams = useSearchParams();
  // redirect_url / returnTo のどちらで来ても同じ遷移先に解決する（招待リンク対応）
  const postAuthRedirect = resolvePostAuthRedirect(searchParams);
  const [googleError, setGoogleError] = useState<string | null>(
    searchParams.get("google_error")
  );
  const [isWebViewBlocked, setIsWebViewBlocked] = useState(false);

  // CSRFトークンの取得
  const [csrfToken, setCsrfToken] = useState<string>("");

  useEffect(() => {
    const token = getCSRFTokenFromCookie();
    setCsrfToken(token || "");
  }, []);

  useEffect(() => {
    // URLからエラーを取得して表示
    if (searchParams.get("google_error")) {
      setGoogleError(t("auth.login.error.googleFailed"));
      return;
    }
    // メール確認リンクが期限切れ・使用済み・別ブラウザで開かれた場合
    if (searchParams.get("auth_error") === "confirm") {
      setGoogleError(t("auth.confirm.failed"));
    }
  }, [searchParams, t]);

  useEffect(() => {
    // WebViewからのアクセスかチェック
    setIsWebViewBlocked(isGoogleOAuthBlocked());
  }, []);

  const googleLoginAction = async () => {
    // 認証コールバック待機状態をマーク
    markAuthCallbackPending();

    // ブックマーク情報とリダイレクト先を取得
    const bookmark = searchParams.get("bookmark");

    // 認証コールバックURLにブックマーク情報を含める
    let finalRedirectUrl = postAuthRedirect;
    if (bookmark) {
      const params = new URLSearchParams();
      params.set("bookmark", bookmark);
      params.set("redirect_url", postAuthRedirect);
      finalRedirectUrl = `/auth/callback?${params.toString()}`;
    }

    const result = await loginWithGoogle(finalRedirectUrl);

    if (result.success && result.googleUrl) {
      // クライアントサイドでGoogleの認証ページにリダイレクト
      window.location.href = result.googleUrl;
    } else {
      // エラー処理
      setGoogleError(
        (result as { messageKey?: string; message?: string }).messageKey
          ? t((result as { messageKey?: string }).messageKey!)
          : result.message || t("auth.login.error.googleStartFailed")
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* WebView警告表示 */}
      <WebViewWarning />

      {/* メール/パスワードログインフォーム */}
      <form
        action={dispatch}
        className="space-y-4"
        data-testid="credentials-login-form"
      >
        {/* サーバーアクションは returnTo のみを読むため、redirect_url で来た場合もここへ寄せる */}
        <input type="hidden" name="returnTo" value={postAuthRedirect} />
        {searchParams.get("bookmark") && (
          <input
            type="hidden"
            name="bookmark"
            value={searchParams.get("bookmark")!}
          />
        )}
        <input type="hidden" name="csrf_token" value={csrfToken} />
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.common.email")}</Label>
          <Input
            id="email"
            name="email" // Server Action で受け取るために name 属性を追加
            type="email"
            required
            placeholder={t("auth.common.email.placeholder")}
            aria-describedby="email-error"
          />
          {/* Zod バリデーションエラー表示 */}
          <div id="email-error" aria-live="polite" aria-atomic="true">
            {state.errors?.email &&
              state.errors.email.map((error: string) => (
                <p className="text-sm text-red-500" key={error}>
                  {t(error)}
                </p>
              ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.common.password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            aria-describedby="password-error"
          />
          {/* Zod バリデーションエラー表示 */}
          <div id="password-error" aria-live="polite" aria-atomic="true">
            {state.errors?.password &&
              state.errors.password.map((error: string) => (
                <p className="text-sm text-red-500" key={error}>
                  {t(error)}
                </p>
              ))}
          </div>
        </div>
        <SubmitButton /> {/* Submitボタンコンポーネントを使用 */}
      </form>

      {/* WebViewでない場合、またはユーザーが続行を選択した場合のみGoogleログインを表示 */}
      {!isWebViewBlocked && (
        <>
          {/* 区切り線 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("home.pricing.or")}
              </span>
            </div>
          </div>

          {/* Googleログインフォーム (別のform要素でactionを指定) */}
          {!isWebViewBlocked && (
            <form action={googleLoginAction} className="space-y-4">
              <GoogleLoginButton />{" "}
              {/* Googleログインボタンコンポーネントを使用 */}
              {/* Googleログイン開始時のエラー表示 */}
              {googleError && (
                <div aria-live="polite" aria-atomic="true">
                  <p className="text-sm text-red-500">{googleError}</p>
                </div>
              )}
            </form>
          )}
        </>
      )}

      {/* パスワード忘れリンク */}
      <div className="text-center text-sm">
        <p className="cursor-pointer text-muted-foreground hover:underline">
          {t("auth.login.forgotPassword")}
        </p>
      </div>

      {/* 一般的な認証エラー表示（重複表示を防ぐため messageKey > generalKey > general の優先で1つだけ表示） */}
      {(state.messageKey ||
        state.errors?.generalKey ||
        state.errors?.general?.length) && (
        <div aria-live="polite" aria-atomic="true">
          {state.messageKey ? (
            <p className="text-sm text-red-500">{t(state.messageKey)}</p>
          ) : state.errors?.generalKey ? (
            <p className="text-sm text-red-500">{t(state.errors.generalKey)}</p>
          ) : (
            state.errors?.general?.map((error: string) => (
              <p className="text-sm text-red-500" key={error}>
                {error}
              </p>
            ))
          )}
        </div>
      )}

      {/* 新規登録リンク */}
      <div className="mt-4 text-center text-sm">
        {t("auth.common.noAccountYet")}{" "}
        <Link
          href={buildAuthHref("/signup", searchParams)}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("auth.common.signup")}
        </Link>
      </div>
    </div>
  );
}
