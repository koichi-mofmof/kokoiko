"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Zod スキーマ定義
const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "有効なメールアドレスを入力してください。" }),
  password: z
    .string()
    .min(8, { message: "パスワードは8文字以上で入力してください。" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message:
        "パスワードは英大文字、小文字、数字をそれぞれ1文字以上含める必要があります。",
    }),
});

// サインアップ用 Zod スキーマ定義 (パスワード要件を強化)
const signupSchema = z
  .object({
    email: z
      .string()
      .email({ message: "有効なメールアドレスを入力してください。" }),
    password: z
      .string()
      .min(8, { message: "パスワードは8文字以上で入力してください。" })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/, {
        message:
          'パスワードは英大文字、小文字、数字、記号(!@#$%^&*(),.?\\":{}|<>)をそれぞれ1文字以上含める必要があります。',
      }),
    confirmPassword: z.string(),
    // 利用規約同意のチェックボックスを追加
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "利用規約とプライバシーポリシーへの同意が必要です。",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません。",
    path: ["confirmPassword"],
  });

// 認証状態の型定義 (useFormState用)
export interface AuthState {
  message: string | null;
  errors?: {
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    termsAccepted?: string[]; // termsAccepted のエラーを追加
    general?: string[];
  };
  success: boolean;
}

export async function loginWithCredentials(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // バリデーション失敗
  if (!validatedFields.success) {
    return {
      message: "入力内容を確認してください。",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { email, password } = validatedFields.data;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Supabase 認証エラー
  if (error) {
    console.error("Supabase login error:", error.message);
    return {
      message: "メールアドレスまたはパスワードが正しくありません。",
      errors: {
        general: ["メールアドレスまたはパスワードが正しくありません。"],
      }, // 一般的なエラーとして表示
      success: false,
    };
  }

  // ログイン成功: 本来はここでリダイレクトする方が良い
  // redirect("/"); は try/catch で囲まないと Next.js のエラーになる場合がある
  // 代わりに成功状態を返し、クライアント側でリダイレクトをトリガーすることも可能
  // 今回は redirect を試みます
  try {
    redirect("/lists"); // ログイン後のリダイレクト先を /lists に変更
  } catch (e: unknown) {
    // redirect() は内部的にエラーをスローするため、キャッチしないとビルド時にエラーになる
    if (
      typeof e === "object" &&
      e !== null &&
      "digest" in e &&
      typeof (e as { digest: string }).digest === "string" &&
      (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw e;
    }
    console.error("Redirect failed:", e);
    return {
      message:
        "ログインには成功しましたが、リダイレクト中にエラーが発生しました。",
      success: true, // ログイン自体は成功している
    };
  }

  // redirectが成功した場合、この部分は実行されない
  // return { message: "ログイン成功", success: true };
}

// サインアップ用 Server Action
export async function signupWithCredentials(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const validatedFields = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    termsAccepted: formData.get("termsAccepted") === "on", // HTML checkbox value is "on"
  });

  // バリデーション失敗
  if (!validatedFields.success) {
    console.log("Validation Errors:", validatedFields.error.flatten());
    return {
      message: "入力内容を確認してください。",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { email, password } = validatedFields.data;

  const supabase = await createClient();

  // Supabaseにユーザー登録
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // 確認メール内のリンクをクリックした後のリダイレクト先
      emailRedirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/`,
    },
  });

  // Supabase サインアップエラー
  if (signUpError) {
    console.error("Supabase signup error:", signUpError.message);
    // TODO: より具体的なエラーメッセージを返す（例: User already registered）
    return {
      message: "ユーザー登録に失敗しました。",
      errors: {
        general: [
          "ユーザー登録に失敗しました。時間をおいて再度お試しください。",
        ],
      },
      success: false,
    };
  }

  // メール確認が不要な場合、または自動で確認される場合 (例: localhost)
  if (signUpData.session) {
    // セッションがあればログイン成功とみなしリダイレクト
    try {
      redirect("/lists"); // 登録後のリダイレクト先を /lists に変更
    } catch (e: unknown) {
      if (
        typeof e === "object" &&
        e !== null &&
        "digest" in e &&
        typeof (e as { digest: string }).digest === "string" &&
        (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      )
        throw e;
      console.error("Redirect failed after signup:", e);
      return {
        message:
          "登録には成功しましたが、リダイレクト中にエラーが発生しました。",
        success: true,
      };
    }
  } else if (signUpData.user) {
    // メール確認が必要な場合
    return {
      message:
        "確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。",
      errors: {},
      success: true, // サインアッププロセス自体は開始された
    };
  } else {
    // 予期せぬケース
    return {
      message: "ユーザー登録中に予期せぬエラーが発生しました。",
      errors: { general: ["ユーザー登録中に予期せぬエラーが発生しました。"] },
      success: false,
    };
  }
}

// Googleログイン用 Server Action (OAuthフローを開始)
export async function loginWithGoogle(): Promise<AuthState> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/auth/callback`,
    },
  });

  if (error) {
    console.error("Google OAuth error:", error.message);
    return {
      message: "Googleログインの開始に失敗しました。",
      errors: { general: ["Googleログインの開始に失敗しました。"] },
      success: false,
    };
  }

  if (data.url) {
    redirect(data.url); // Googleの認証ページへリダイレクト
  } else {
    // 通常ここには来ないはずだが、念のため
    return {
      message: "Googleログイン用のURLを取得できませんでした。",
      errors: { general: ["Googleログイン用のURLを取得できませんでした。"] },
      success: false,
    };
  }
}

/**
 * ログアウト処理を行うサーバーアクション
 */
export async function logoutUser() {
  const supabase = await createClient();

  // ログアウト処理
  await supabase.auth.signOut();

  // キャッシュをクリア
  revalidatePath("/", "layout");

  // ホームページにリダイレクト
  redirect("/");
}

// パスワードバリデーションスキーマ (クライアントと共通化も検討)
// updateUserPassword Action用には新しいパスワードのみを検証
const newPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, { message: "パスワードは8文字以上で入力してください。" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/, {
      message:
        'パスワードは英大文字、小文字、数字、記号(!@#$%^&*(),.?":{}|<>)をそれぞれ1文字以上含める必要があります。',
    }),
});

interface ActionResult {
  success: boolean;
  message: string;
  errors?: { field?: string; message: string }[];
}

export async function updateUserPassword(
  prevState: ActionResult | undefined, // useFormState を使う場合
  formData: FormData
): Promise<ActionResult> {
  "use server";

  const supabase = await createClient();

  // 1. まず認証ユーザー情報を取得
  const {
    data: { user },
    error: authUserError,
  } = await supabase.auth.getUser();

  if (authUserError || !user) {
    return {
      success: false,
      message: "認証されていません。パスワードを変更できません。",
    };
  }

  const newPassword = formData.get("newPassword") as string;

  // サーバーサイドでも新しいパスワードのみをバリデーション
  const validationResult = newPasswordSchema.safeParse({
    newPassword,
  });

  if (!validationResult.success) {
    return {
      success: false,
      message: "入力内容に誤りがあります。",
      errors: validationResult.error
        .flatten()
        .fieldErrors.newPassword?.map((e) => ({
          field: "newPassword",
          message: e,
        })),
    };
  }

  // 2. パスワードを更新 (認証済みユーザーとして実行)
  const { error: updateError } = await supabase.auth.updateUser({
    password: validationResult.data.newPassword,
  });

  if (updateError) {
    // updateError.message には "New password should be different from the old password."
    // のようなメッセージが含まれる場合があるため、これを活用できる
    let errorMessage = `パスワードの更新に失敗しました。`;
    if (updateError.message.includes("New password should be different")) {
      errorMessage =
        "新しいパスワードは現在のパスワードと異なる必要があります。";
    } else if (updateError.message.includes("same as the old password")) {
      errorMessage =
        "新しいパスワードは現在のパスワードと同じものは使用できません。";
    }

    return {
      success: false,
      // message: `パスワードの更新に失敗しました: ${updateError.message}`,
      message: errorMessage,
    };
  }

  return {
    success: true,
    message: "パスワードが正常に変更されました。",
  };
}
