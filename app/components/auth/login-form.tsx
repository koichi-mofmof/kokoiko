"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AuthState,
  loginWithCredentials,
  loginWithGoogle,
} from "@/lib/actions/auth";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { GoogleLogoIcon } from "./signup-form";

// Submit ボタンコンポーネント (useFormStatusを使用)
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "ログイン中..." : "ログイン"}
    </Button>
  );
}

// Google ログインボタンコンポーネント (useFormStatusを使用)
function GoogleLoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit" // form action をトリガーするために type="submit" に変更
      variant="outline"
      className="w-full"
      disabled={pending}
    >
      <GoogleLogoIcon />
      {pending ? "処理中..." : "Google でログイン"}
    </Button>
  );
}

export function LoginForm() {
  // useFormState を useActionState に変更
  const initialState: AuthState = { message: null, errors: {}, success: false };
  const [state, dispatch] = useActionState(loginWithCredentials, initialState);
  // Googleログイン用の状態も別途管理（または共通の状態を使うかは設計次第）
  const [googleState, googleDispatch] = useActionState(
    loginWithGoogle,
    initialState
  );

  return (
    <div className="space-y-4">
      {/* メール/パスワードログインフォーム */}
      <form
        action={dispatch}
        className="space-y-4"
        data-testid="credentials-login-form"
      >
        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            name="email" // Server Action で受け取るために name 属性を追加
            type="email"
            required
            placeholder="you@example.com"
            aria-describedby="email-error"
          />
          {/* Zod バリデーションエラー表示 */}
          <div id="email-error" aria-live="polite" aria-atomic="true">
            {state.errors?.email &&
              state.errors.email.map((error: string) => (
                <p className="text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">パスワード</Label>
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
                  {error}
                </p>
              ))}
          </div>
        </div>
        <SubmitButton /> {/* Submitボタンコンポーネントを使用 */}
      </form>

      {/* 区切り線 */}
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

      {/* Googleログインフォーム (別のform要素でactionを指定) */}
      <form action={googleDispatch} className="space-y-4">
        <GoogleLoginButton /> {/* Googleログインボタンコンポーネントを使用 */}
        {/* Googleログイン開始時のエラー表示 */}
        {googleState.errors?.general && (
          <div aria-live="polite" aria-atomic="true">
            {googleState.errors.general.map((error: string) => (
              <p className="text-sm text-red-500" key={error}>
                {error}
              </p>
            ))}
          </div>
        )}
      </form>

      {/* パスワード忘れリンク */}
      <div className="text-center text-sm">
        <p className="cursor-pointer text-muted-foreground hover:underline">
          パスワードをお忘れですか？
        </p>
      </div>

      {/* 一般的な認証エラー表示 (メール/パスワード) */}
      {state.errors?.general && (
        <div aria-live="polite" aria-atomic="true">
          {state.errors.general.map((error: string) => (
            <p className="text-sm text-red-500" key={error}>
              {error}
            </p>
          ))}
        </div>
      )}

      {/* 新規登録リンク */}
      <div className="mt-4 text-center text-sm">
        アカウントをお持ちでない場合 は{" "}
        <Link
          href="/signup"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          新規登録
        </Link>
      </div>
    </div>
  );
}
