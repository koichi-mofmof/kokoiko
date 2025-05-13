"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AuthState,
  loginWithGoogle,
  signupWithCredentials,
} from "@/lib/actions/auth";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

// Google Logo SVG
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
      <GoogleLogoIcon className="mr-2 h-4 w-4" />
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
  const [googleState, googleDispatch] = useActionState(
    loginWithGoogle,
    initialState
  );

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
      <form action={googleDispatch} className="space-y-4">
        <GoogleButton />
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
