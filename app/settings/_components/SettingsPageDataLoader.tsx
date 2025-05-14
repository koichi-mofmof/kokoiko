"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProfileSettingsData {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  avatarPath: string | null;
}

interface SettingsPageData {
  initialData: ProfileSettingsData | null;
  error?: string;
  userUnauthenticated?: boolean;
}

export async function SettingsPageDataLoader(): Promise<SettingsPageData> {
  const supabase: SupabaseClient = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // redirect("/login") はここでは行わず、page.tsx側で処理する
    return { initialData: null, userUnauthenticated: true };
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username, display_name, bio, avatar_url")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      // プロフィール取得エラーでも、ユーザーID等は返せるようにする
      // あるいはエラーメッセージを返してページ側でハンドリング
      return {
        initialData: {
          userId: user.id,
          username: "",
          displayName: "",
          bio: "",
          avatarUrl: null,
          avatarPath: null,
        },
        error: "プロファイル情報の取得に失敗しました。",
      };
    }

    let avatarUrl = null;
    if (profile?.avatar_url) {
      const { data: imageData } = supabase.storage
        .from("profile_images")
        .getPublicUrl(profile.avatar_url);
      avatarUrl = imageData?.publicUrl || null;
    }

    return {
      initialData: {
        userId: user.id,
        username: profile?.username || "",
        displayName: profile?.display_name || "",
        bio: profile?.bio || "",
        avatarUrl,
        avatarPath: profile?.avatar_url || null,
      },
    };
  } catch (error) {
    console.error("Error in SettingsPageDataLoader:", error);
    return {
      initialData: {
        // ここでも最低限のユーザーIDは返す
        userId: user.id,
        username: "",
        displayName: "",
        bio: "",
        avatarUrl: null,
        avatarPath: null,
      },
      error: "設定情報の読み込み中に予期せぬエラーが発生しました。",
    };
  }
}
