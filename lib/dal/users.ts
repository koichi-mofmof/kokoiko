import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProfileSettingsData {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  avatarPath: string | null; //  Store the path for potential updates/deletions
}

interface UserProfileSettingsResult {
  profileSettings: ProfileSettingsData | null;
  error?: string;
  errorKey?: string;
}

/**
 * 指定されたユーザーIDのプロファイル設定情報を取得します。
 * これには、ユーザー名、表示名、自己紹介、アバターURLなどが含まれます。
 * @param supabase Supabaseクライアントインスタンス。
 * @param userId プロファイル情報を取得するユーザーのID。
 * @returns プロファイル設定データとエラー情報を含むオブジェクト。
 */
async function fetchProfileDataInternal(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserProfileSettingsResult> {
  try {
    // profilesテーブルから直接データを取得
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username, display_name, bio, avatar_url")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile for user:", userId, profileError);
      return {
        profileSettings: null,
        errorKey: "errors.common.fetchFailed",
      };
    }

    let avatarUrl = null;
    if (profile?.avatar_url) {
      // GoogleのアバターURLかチェック（http/httpsで始まる場合はそのまま使用）
      if (
        profile.avatar_url.startsWith("http://") ||
        profile.avatar_url.startsWith("https://")
      ) {
        avatarUrl = profile.avatar_url;
      } else {
        // ローカルストレージのファイルの場合はpublic URLを取得
        const { data: imageData } = supabase.storage
          .from("profile_images") // Make sure this is the correct bucket name
          .getPublicUrl(profile.avatar_url);
        avatarUrl = imageData?.publicUrl || null;
      }
    }

    return {
      profileSettings: {
        userId: userId, // ensure userId is always returned
        username: profile?.username || "",
        displayName: profile?.display_name || "",
        bio: profile?.bio || "",
        avatarUrl,
        avatarPath: profile?.avatar_url || null,
      },
    };
  } catch (error) {
    console.error(
      "Unexpected error in fetchProfileDataInternal for user:",
      userId,
      error
    );
    return {
      profileSettings: null,
      errorKey: "errors.unexpected.common",
    };
  }
}

export interface UserWithProfileData extends ProfileSettingsData {
  email: string | undefined;
}

interface FetchUserWithProfileResult {
  userWithProfile: UserWithProfileData | null;
  error?: string;
  errorKey?: string;
  userUnauthenticated?: boolean;
}

/**
 * 現在認証されているユーザーの基本情報（メールアドレスなど）と、
 * それに紐づくプロファイル設定情報（ユーザー名、表示名、自己紹介、アバターURLなど）を取得します。
 * @returns 認証ユーザーの情報とプロファイル設定データ、エラー情報、未認証フラグを含むオブジェクト。
 */
export async function fetchAuthenticatedUserWithProfile(): Promise<FetchUserWithProfileResult> {
  const supabase = await createClient(); // server client

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      userWithProfile: null,
      userUnauthenticated: true,
      error: authError?.message,
      errorKey: "errors.common.unauthorized",
    };
  }

  const profileResult = await fetchProfileDataInternal(supabase, user.id);

  if (profileResult.error || !profileResult.profileSettings) {
    // If profile fetch fails, still return basic user info if available
    // Or decide if this constitutes a full failure
    return {
      userWithProfile: {
        userId: user.id,
        email: user.email,
        username: "",
        displayName: "",
        bio: "",
        avatarUrl: null,
        avatarPath: null,
      },
      error: profileResult.error,
      errorKey: profileResult.errorKey || "errors.common.fetchFailed",
      userUnauthenticated: false,
    };
  }

  return {
    userWithProfile: {
      ...profileResult.profileSettings,
      email: user.email, // Add email from auth user
    },
    userUnauthenticated: false,
  };
}
