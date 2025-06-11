"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { markAuthCallbackPending } from "@/hooks/use-auth-sync";
import {
  AuthState,
  loginWithGoogle,
  signupWithCredentials,
} from "@/lib/actions/auth";
import { getCSRFTokenFromCookie } from "@/lib/utils/csrf-client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

// Google Logo SVG
export const GoogleLogoIcon = () => (
  <svg
    width="256px"
    height="262px"
    viewBox="0 0 256 262"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    preserveAspectRatio="xMidYMid"
  >
    <g>
      <path
        d="M255.878,133.451 C255.878,122.717 255.007,114.884 253.122,106.761 L130.55,106.761 L130.55,155.209 L202.497,155.209 C201.047,167.249 193.214,185.381 175.807,197.565 L175.563,199.187 L214.318,229.21 L217.003,229.478 C241.662,206.704 255.878,173.196 255.878,133.451"
        fill="#4285F4"
      />
      <path
        d="M130.55,261.1 C165.798,261.1 195.389,249.495 217.003,229.478 L175.807,197.565 C164.783,205.253 149.987,210.62 130.55,210.62 C96.027,210.62 66.726,187.847 56.281,156.37 L54.75,156.5 L14.452,187.687 L13.925,189.152 C35.393,231.798 79.49,261.1 130.55,261.1"
        fill="#34A853"
      />
      <path
        d="M56.281,156.37 C53.525,148.247 51.93,139.543 51.93,130.55 C51.93,121.556 53.525,112.853 56.136,104.73 L56.063,103 L15.26,71.312 L13.925,71.947 C5.077,89.644 0,109.517 0,130.55 C0,151.583 5.077,171.455 13.925,189.152 L56.281,156.37"
        fill="#FBBC05"
      />
      <path
        d="M130.55,50.479 C155.064,50.479 171.6,61.068 181.029,69.917 L217.873,33.943 C195.245,12.91 165.798,0 130.55,0 C79.49,0 35.393,29.301 13.925,71.947 L56.136,104.73 C66.726,73.253 96.027,50.479 130.55,50.479"
        fill="#EB4335"
      />
    </g>
  </svg>
);

// Google ログイン/登録ボタン
function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      className="w-full"
      disabled={pending}
    >
      <GoogleLogoIcon />
      {pending ? "処理中..." : "Google で登録"}
    </Button>
  );
}

// サインアップ用 Submit ボタン
function SignupSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "作成中..." : "アカウントを作成"}
    </Button>
  );
}

export function SignupForm() {
  const initialState: AuthState = { message: null, errors: {}, success: false };
  const [state, dispatch] = useActionState(signupWithCredentials, initialState);

  const searchParams = useSearchParams();
  const [googleError, setGoogleError] = useState<string | null>(
    searchParams.get("google_error")
  );

  useEffect(() => {
    const error = searchParams.get("google_error");
    if (error) {
      setGoogleError("Googleでの登録に失敗しました。");
    }
  }, [searchParams]);

  const googleLoginAction = async () => {
    // 認証コールバック待機状態をマーク
    markAuthCallbackPending();
    // 新規登録画面からはリダイレクトURLを引き継がないので引数はなし
    await loginWithGoogle();
  };

  if (state.success && state.message?.includes("確認メール")) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-semibold">登録ありがとうございます</h2>
        <p>{state.message}</p>
        <p>
          メールをご確認の上、記載されたリンクをクリックして登録を完了してください。
        </p>
        <Button asChild>
          <Link href="/login">ログインページへ</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form action={dispatch} className="space-y-4">
        <input
          type="hidden"
          name="csrf_token"
          value={getCSRFTokenFromCookie() || ""}
        />
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            aria-describedby="email-error"
          />
          <p className="text-xs text-muted-foreground">
            メールアドレスの@より前の部分がユーザーIDとして使用されます
          </p>
          <div id="email-error" aria-live="polite" aria-atomic="true">
            {state.errors?.email &&
              state.errors.email.map((error: string) => (
                <p className="text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>
        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">パスワード</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type="password"
              required
              aria-describedby="password-error"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            8文字以上で、大文字・小文字・数字・記号をそれぞれ1文字以上含める必要があります。
          </p>
          <div id="password-error" aria-live="polite" aria-atomic="true">
            {state.errors?.password &&
              state.errors.password.map((error: string) => (
                <p className="text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>
        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">パスワード（確認用）</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              aria-describedby="confirmPassword-error"
            />
          </div>
          <div id="confirmPassword-error" aria-live="polite" aria-atomic="true">
            {state.errors?.confirmPassword &&
              state.errors.confirmPassword.map((error: string) => (
                <p className="text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="items-top flex space-x-2">
          <Checkbox id="termsAccepted" name="termsAccepted" required />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="termsAccepted"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <Link
                href="/terms"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                利用規約
              </Link>
              と
              <Link
                href="/privacy"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                プライバシーポリシー
              </Link>
              に同意する
            </label>
            <p className="text-xs text-muted-foreground">
              登録を続けるには同意が必要です。
            </p>
            <div id="terms-error" aria-live="polite" aria-atomic="true">
              {state.errors?.termsAccepted &&
                state.errors.termsAccepted.map((error: string) => (
                  <p className="text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
        </div>

        {/* General Error */}
        {state.errors?.general && (
          <div aria-live="polite" aria-atomic="true">
            {state.errors.general.map((error: string) => (
              <p className="text-sm text-red-500" key={error}>
                {error}
              </p>
            ))}
          </div>
        )}
        <SignupSubmitButton />
      </form>

      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            または
          </span>
        </div>
      </div>

      {/* Google Signup Form */}
      <form action={googleLoginAction} className="space-y-4">
        <GoogleButton />
        {googleError && (
          <div aria-live="polite" aria-atomic="true">
            <p className="text-sm text-red-500">{googleError}</p>
          </div>
        )}
      </form>

      {/* Login Link */}
      <div className="mt-4 text-center text-sm">
        すでにアカウントをお持ちの場合は{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          ログイン
        </Link>
      </div>
    </div>
  );
}
