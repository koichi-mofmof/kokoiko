"use server";

import { normalizeLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import {
  getCSRFTokenServer,
  verifyCSRFTokenServer,
} from "@/lib/utils/csrf-server";
import { recordCSRFViolation } from "@/lib/utils/security-monitor";
import {
  deleteAccountSchema,
  loginSchema,
  signupSchema,
} from "@/lib/validators/auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { bookmarkList } from "./lists";

// 認証状態の型定義 (useFormState用)
export interface AuthState {
  message: string | null;
  messageKey?: string; // i18n用メッセージキー
  errors?: {
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    termsAccepted?: string[]; // termsAccepted のエラーを追加
    general?: string[];
    generalKey?: string; // i18n用エラーキー
  };
  success: boolean;
  googleUrl?: string; // Googleログイン用の認証URLを追加
}

export async function loginWithCredentials(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  // リクエスト情報を取得
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";

  // CSRF protection with fallback
  let csrfToken = formData.get("csrf_token") as string;

  // フォームからトークンが取得できない場合の緊急回避策
  if (!csrfToken) {
    const cookieToken = await getCSRFTokenServer();
    if (cookieToken) {
      csrfToken = cookieToken;
    }
  }

  if (!csrfToken || !(await verifyCSRFTokenServer(csrfToken))) {
    // CSRF違反を記録
    recordCSRFViolation(ip, userAgent, {
      endpoint: "/login",
      csrfTokenPresent: !!csrfToken,
      formData: {
        email: formData.get("email") || "not_provided",
      },
    });

    return {
      message: "無効なリクエストです。",
      messageKey: "errors.request.invalid",
      errors: {
        general: ["セキュリティエラー: ページを再読み込みしてください。"],
        generalKey: "errors.security.reloadPage",
      },
      success: false,
    };
  }

  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // バリデーション失敗
  if (!validatedFields.success) {
    return {
      message: "入力内容を確認してください。",
      messageKey: "errors.validation.checkInput",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { email, password } = validatedFields.data;

  const supabase = await createClient();

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Supabase 認証エラー
  if (error) {
    console.error("Supabase login error:", {
      message: error.message,
      status: error.status,
      details: error,
      timestamp: new Date().toISOString(),
      email: email,
      ip: ip,
      userAgent: userAgent,
    });

    return {
      message:
        "ログインに失敗しました。メールアドレスとパスワードを確認してください。",
      messageKey: "auth.login.failed",
      errors: {
        general: ["メールアドレスまたはパスワードが正しくありません。"],
        generalKey: "auth.login.incorrectEmailOrPassword",
      },
      success: false,
    };
  }

  // ログイン成功 - ブックマーク情報を処理
  if (signInData.session) {
    // セッションがあればログイン成功
    const bookmark = formData.get("bookmark")?.toString();
    const returnTo = formData.get("returnTo")?.toString() || "/lists";

    // ブックマーク情報がある場合は、ここで直接処理
    if (bookmark) {
      console.log(
        `ログイン成功。リストID: ${bookmark} のブックマーク処理を開始します。`
      );
      const result = await bookmarkList(bookmark);
      if (result.success) {
        console.log(`リストID: ${bookmark} のブックマークに成功しました。`);
      } else {
        console.error(
          `リストID: ${bookmark} のブックマークに失敗しました。`,
          result.error
        );
        // ここではエラーをログに出力するのみで、リダイレクトは継続
      }
    }

    // 認証後にキャッシュを無効化してセッション状態を即座に反映
    revalidatePath("/", "layout");
    revalidatePath("/lists"); // マイリストページのキャッシュも無効化

    redirect(returnTo);
  } else if (signInData.user) {
    // メール確認が必要な場合
    return {
      message:
        "確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。",
      messageKey: "auth.email.confirmationSent",
      errors: {},
      success: true,
      googleUrl: undefined, // AuthStateに合わせる
    };
  } else {
    // 予期せぬケース
    return {
      message: "ユーザー登録中に予期せぬエラーが発生しました。",
      messageKey: "errors.unexpected.signup",
      errors: {
        general: ["ユーザー登録中に予期せぬエラーが発生しました。"],
        generalKey: "errors.unexpected.signup",
      },
      success: false,
    };
  }
}

// サインアップ用 Server Action
export async function signupWithCredentials(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  // CSRF protection
  const csrfToken = formData.get("csrf_token") as string;

  if (!csrfToken || !(await verifyCSRFTokenServer(csrfToken))) {
    return {
      message: "無効なリクエストです。",
      messageKey: "errors.request.invalid",
      errors: {
        general: ["セキュリティエラー: ページを再読み込みしてください。"],
        generalKey: "errors.security.reloadPage",
      },
      success: false,
    };
  }

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
      messageKey: "errors.validation.checkInput",
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
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/`,
    },
  });

  // Supabase サインアップエラー
  if (signUpError) {
    console.error("Supabase signup error:", {
      message: signUpError.message,
      status: signUpError.status,
      details: signUpError,
      timestamp: new Date().toISOString(),
    });

    return {
      message: "ユーザー登録に失敗しました。",
      messageKey: "auth.signup.failed",
      errors: {
        general: [
          "ユーザー登録に失敗しました。時間をおいて再度お試しください。",
        ],
        generalKey: "auth.signup.retryLater",
      },
      success: false,
    };
  }

  // メール確認が不要な場合、または自動で確認される場合 (例: localhost)
  if (signUpData.session) {
    // セッションがあればログイン成功とみなしリダイレクト
    const bookmark = formData.get("bookmark")?.toString();
    const returnTo = formData.get("returnTo")?.toString() || "/lists";

    // ブックマーク情報がある場合は、ここで直接処理
    if (bookmark) {
      console.log(
        `サインアップ成功。リストID: ${bookmark} のブックマーク処理を開始します。`
      );
      const result = await bookmarkList(bookmark);
      if (result.success) {
        console.log(`リストID: ${bookmark} のブックマークに成功しました。`);
      } else {
        console.error(
          `リストID: ${bookmark} のブックマークに失敗しました。`,
          result.error
        );
      }
    }

    revalidatePath("/", "layout");
    revalidatePath("/lists");

    redirect(returnTo);
  } else if (signUpData.user) {
    // メール確認が必要な場合
    return {
      message:
        "確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。",
      messageKey: "auth.email.confirmationSent",
      errors: {},
      success: true,
      googleUrl: undefined, // AuthStateに合わせる
    };
  } else {
    // 予期せぬケース
    return {
      message: "ユーザー登録中に予期せぬエラーが発生しました。",
      messageKey: "errors.unexpected.signup",
      errors: {
        general: ["ユーザー登録中に予期せぬエラーが発生しました。"],
        generalKey: "errors.unexpected.signup",
      },
      success: false,
    };
  }
}

// Googleログイン用 Server Action (OAuthフローを開始)
export async function loginWithGoogle(
  redirectUrl?: string
): Promise<AuthState> {
  const supabase = await createClient();

  let redirectTo: URL;

  // redirectUrlが既に/auth/callbackで始まる場合（ブックマーク情報を含む場合）
  if (redirectUrl && redirectUrl.startsWith("/auth/callback")) {
    redirectTo = new URL(
      redirectUrl,
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    );
  } else {
    // 通常の場合は従来通りredirect_urlパラメータとして追加
    redirectTo = new URL(
      "/auth/callback",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    );
    if (redirectUrl) {
      redirectTo.searchParams.set("redirect_url", redirectUrl);
    }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo.toString(),
      skipBrowserRedirect: true, // サーバーサイドでURLを取得するため
      queryParams: {
        // Google OAuth 画面のUI言語を現在のアプリ言語に合わせる
        hl: normalizeLocale((await cookies()).get("lang")?.value || "ja"),
      },
    },
  });

  if (error) {
    console.error("Google OAuth error:", error.message);
    return {
      message: "Googleログインの開始に失敗しました。",
      messageKey: "auth.google.startFailed",
      errors: {
        general: ["Googleログインの開始に失敗しました。"],
        generalKey: "auth.google.startFailed",
      },
      success: false,
    };
  }

  if (data.url) {
    // redirect(data.url); // サーバーサイドのリダイレクトを削除
    return {
      message: null,
      errors: {},
      success: true,
      googleUrl: data.url, // Googleの認証URLを返す
    };
  } else {
    // 通常ここには来ないはずだが、念のため
    return {
      message: "Googleログイン用のURLを取得できませんでした。",
      messageKey: "auth.google.urlAcquireFailed",
      errors: {
        general: ["Googleログイン用のURLを取得できませんでした。"],
        generalKey: "auth.google.urlAcquireFailed",
      },
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
  messageKey?: string;
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
      messageKey: "errors.common.unauthorized",
    };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  // 2. 現在のパスワードで再認証
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });
  if (signInError) {
    return {
      success: false,
      message: "現在のパスワードが正しくありません。",
      messageKey: "auth.password.currentIncorrect",
      errors: [
        {
          field: "currentPassword",
          message: "現在のパスワードが正しくありません。",
        },
      ],
    };
  }

  // サーバーサイドでも新しいパスワードのみをバリデーション
  const validationResult = newPasswordSchema.safeParse({
    newPassword,
  });

  if (!validationResult.success) {
    return {
      success: false,
      message: "入力内容に誤りがあります。",
      messageKey: "errors.validation.checkInput",
      errors: validationResult.error
        .flatten()
        .fieldErrors.newPassword?.map((e) => ({
          field: "newPassword",
          message: e,
        })),
    };
  }

  // 3. パスワードを更新 (認証済みユーザーとして実行)
  const { error: updateError } = await supabase.auth.updateUser({
    password: validationResult.data.newPassword,
  });

  if (updateError) {
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
      message: errorMessage,
      messageKey: "auth.password.updateFailed",
    };
  }

  return {
    success: true,
    message: "パスワードが正常に変更されました。",
    messageKey: "auth.password.updateSuccess",
  };
}

/**
 * ユーザーのサブスクリプション状態を確認するサーバーアクション
 */
export async function checkUserSubscriptionStatus(): Promise<{
  hasActiveSubscription: boolean;
  subscriptionType?: string;
  subscriptionStatus?: string;
  message?: string;
  messageKey?: string;
  isWarningLevel?: boolean;
}> {
  const supabase = await createClient();

  // 認証ユーザー情報を取得
  const {
    data: { user },
    error: authUserError,
  } = await supabase.auth.getUser();

  if (authUserError || !user) {
    return {
      hasActiveSubscription: false,
      message: "認証されていません。",
      messageKey: "errors.common.unauthorized",
    };
  }

  try {
    // 削除を阻止すべきサブスクリプション状態を確認
    const blockingStatuses = ["active", "trialing", "past_due"];
    const warningStatuses = ["incomplete", "unpaid", "paused"];

    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", [...blockingStatuses, ...warningStatuses])
      .order("created_at", { ascending: false });

    if (subscriptionError) {
      console.error("サブスクリプション確認エラー:", subscriptionError);
      return {
        hasActiveSubscription: false,
        message: "サブスクリプション状態の確認に失敗しました。",
        messageKey: "errors.common.fetchFailed",
      };
    }

    if (subscriptions && subscriptions.length > 0) {
      // キャンセル済み（cancel_at_period_end: true）のサブスクリプションを除外
      const activeSubscriptions = subscriptions.filter(
        (sub) => !sub.cancel_at_period_end
      );

      if (activeSubscriptions.length === 0) {
        // すべてのサブスクリプションがキャンセル済みの場合
        return {
          hasActiveSubscription: false,
          message: "すべてのサブスクリプションがキャンセル済みです。",
          messageKey: "subscription.allCanceled",
        };
      }

      // 最も重要度の高いアクティブなサブスクリプションを特定
      const blockingSubscription = activeSubscriptions.find((sub) =>
        blockingStatuses.includes(sub.status)
      );

      if (blockingSubscription) {
        return {
          hasActiveSubscription: true,
          subscriptionType: blockingSubscription.price_id || "premium",
          subscriptionStatus: blockingSubscription.status,
          message: `${blockingSubscription.status}状態のサブスクリプションがあります。`,
          messageKey: "subscription.activeBlocking",
        };
      }

      // 警告レベルのアクティブなサブスクリプション
      const warningSubscription = activeSubscriptions[0];
      return {
        hasActiveSubscription: true,
        subscriptionType: warningSubscription.price_id || "premium",
        subscriptionStatus: warningSubscription.status,
        message: `${warningSubscription.status}状態のサブスクリプションがあります。`,
        messageKey: "subscription.activeWarning",
        isWarningLevel: true,
      };
    }

    return {
      hasActiveSubscription: false,
      message: "アクティブなサブスクリプションはありません。",
      messageKey: "subscription.noneActive",
    };
  } catch (error) {
    console.error("サブスクリプション確認処理エラー:", error);
    return {
      hasActiveSubscription: false,
      message: "サブスクリプション状態の確認中にエラーが発生しました。",
      messageKey: "errors.unexpected.common",
    };
  }
}

/**
 * アカウント削除処理を行うサーバーアクション
 */
export async function deleteUserAccount(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  // 1. 認証ユーザー情報を取得
  const {
    data: { user },
    error: authUserError,
  } = await supabase.auth.getUser();

  if (authUserError || !user) {
    return {
      success: false,
      message: "認証されていません。アカウントを削除できません。",
      messageKey: "errors.common.unauthorized",
    };
  }

  // 2. フォームデータの検証
  const validatedFields = deleteAccountSchema.safeParse({
    password: formData.get("password"),
    confirmText: formData.get("confirmText"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "入力内容を確認してください。",
      messageKey: "errors.validation.checkInput",
      errors:
        validatedFields.error.flatten().fieldErrors.password?.map((e) => ({
          field: "password",
          message: e,
        })) ||
        validatedFields.error.flatten().fieldErrors.confirmText?.map((e) => ({
          field: "confirmText",
          message: e,
        })),
    };
  }

  const { password } = validatedFields.data;

  // 3. パスワードで再認証
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  });

  if (signInError) {
    return {
      success: false,
      message: "パスワードが正しくありません。",
      messageKey: "auth.password.currentIncorrect",
      errors: [
        {
          field: "password",
          message: "パスワードが正しくありません。",
        },
      ],
    };
  }

  try {
    // 4. 環境変数の確認
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        success: false,
        message: "サーバー設定に問題があります。管理者にお問い合わせください。",
        messageKey: "errors.common.serverMisconfigured",
      };
    }

    // 5. Admin クライアントを使用してユーザーデータを削除
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 6. データベースの関連データをトランザクション処理で削除
    const { data: deleteResult, error: deleteDataError } =
      await adminSupabase.rpc("delete_user_data_transaction", {
        target_user_id: user.id,
      });

    if (deleteDataError) {
      return {
        success: false,
        message: `関連データの削除に失敗しました: ${deleteDataError.message}`,
        messageKey: "errors.common.deleteFailed",
      };
    }

    // RPC関数からのレスポンスをチェック
    if (!deleteResult?.success || !deleteResult?.ready_for_account_deletion) {
      return {
        success: false,
        message:
          deleteResult?.message || "関連データの削除中にエラーが発生しました。",
        messageKey: "errors.common.deleteFailed",
      };
    }

    // 7. ストレージファイルを削除（RPC関数から取得した情報を使用）
    if (deleteResult.storage_files && deleteResult.storage_files.length > 0) {
      try {
        const { data: files, error: listError } = await adminSupabase.storage
          .from("profile_images")
          .list(user.id);

        if (!listError && files && files.length > 0) {
          const filePaths = files.map((file) => `${user.id}/${file.name}`);
          await adminSupabase.storage.from("profile_images").remove(filePaths);
        }
      } catch (storageError) {
        // ストレージエラーは処理を停止しない（ログ出力のみ）
        console.warn("ストレージファイル削除エラー:", storageError);
      }
    }

    // 8. 削除準備の最終確認
    const { data: confirmResult, error: confirmError } =
      await adminSupabase.rpc("confirm_account_deletion_ready", {
        target_user_id: user.id,
      });

    if (confirmError || !confirmResult?.ready_for_deletion) {
      return {
        success: false,
        message: `アカウント削除の準備確認に失敗しました: ${
          confirmError?.message || confirmResult?.message || "不明なエラー"
        }`,
        messageKey: "errors.common.deleteFailed",
      };
    }

    // 9. ユーザーアカウント自体を削除
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      return {
        success: false,
        message: `アカウントの削除に失敗しました: ${deleteError.message}`,
        messageKey: "errors.common.deleteFailed",
      };
    }

    // 10. セッションをクリアしてログアウト
    await supabase.auth.signOut();

    // 11. キャッシュをクリア
    revalidatePath("/", "layout");
  } catch (error) {
    console.error("アカウント削除処理エラー詳細:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      message: `アカウントの削除中にエラーが発生しました: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      messageKey: "errors.unexpected.common",
      errors: [],
    };
  }

  // 12. ホームページにリダイレクト（削除完了）
  redirect("/");
}
