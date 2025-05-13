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

// Google Logo SVG Component (or direct SVG)
const GoogleLogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="1em"
    height="1em"
    {...props}
  >
    <path
      fill="currentColor"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="currentColor"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="currentColor"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <path
      fill="currentColor"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C39.708,34.622,44,28.718,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

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
      <GoogleLogoIcon className="mr-2 h-4 w-4" />
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
      <form action={dispatch} className="space-y-4">
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
