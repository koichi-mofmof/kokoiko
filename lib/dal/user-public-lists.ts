"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import type { ListForClient } from "@/lib/dal/lists";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * ユーザーのプロファイル情報を取得します。
 * @param userId ユーザーID
 * @returns ユーザープロファイル or null
 */
export async function getUserProfile(
  userId: string
): Promise<Pick<
  Profile,
  "id" | "username" | "display_name" | "bio" | "avatar_url"
> | null> {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error.message);
    return null;
  }

  if (profile && profile.avatar_url) {
    // avatar_urlがフルURLでない（=Supabase Storageのパスである）場合のみ公開URLを生成
    if (!profile.avatar_url.startsWith("http")) {
      const { data: publicUrlData } = supabase.storage
        .from("profile_images")
        .getPublicUrl(profile.avatar_url);
      profile.avatar_url = publicUrlData.publicUrl;
    }
  }

  return profile;
}

/**
 * 指定されたユーザーが作成した公開リストと各リストの地点数を取得します。
 * @param userId ユーザーID
 * @returns 公開リストの配列
 */
export async function getUserPublicLists(
  userId: string
): Promise<ListForClient[]> {
  const supabase = await createClient();
  const { data: lists, error } = await supabase
    .from("place_lists")
    .select(
      `
      id,
      name,
      description,
      created_by,
      is_public,
      created_at,
      updated_at,
      list_places(count)
    `
    )
    .eq("created_by", userId)
    .eq("is_public", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching user public lists:", error.message);
    return [];
  }

  type ListWithPlaceCount = (typeof lists)[number];

  return (lists || []).map((list: ListWithPlaceCount) => {
    const { list_places, ...rest } = list;
    return {
      ...rest,
      place_count:
        Array.isArray(list_places) && list_places[0] ? list_places[0].count : 0,
      places: [],
      collaborators: [],
      permission: "view",
    };
  });
}

/**
 * 指定されたユーザーの統計情報（公開リスト数と総地点数）を取得します。
 * @param userId ユーザーID
 * @returns 公開リスト数と総地点数
 */
export async function getUserStats(userId: string): Promise<{
  publicListCount: number;
  totalPlaceCount: number;
}> {
  const supabase = await createClient();
  // 公開リスト数を取得
  const { count: publicListCount, error: listCountError } = await supabase
    .from("place_lists")
    .select("*", { count: "exact", head: true })
    .eq("created_by", userId)
    .eq("is_public", true);

  if (listCountError) {
    console.error("Error fetching public list count:", listCountError.message);
    return { publicListCount: 0, totalPlaceCount: 0 };
  }

  if ((publicListCount || 0) === 0) {
    return { publicListCount: 0, totalPlaceCount: 0 };
  }

  // 公開リストに登録されている総地点数を取得
  // まずユーザーの公開リストのIDを取得
  const { data: listIds, error: listIdsError } = await supabase
    .from("place_lists")
    .select("id")
    .eq("created_by", userId)
    .eq("is_public", true);

  if (listIdsError || !listIds || listIds.length === 0) {
    if (listIdsError) {
      console.error("Error fetching list IDs for stats:", listIdsError.message);
    }
    return { publicListCount: publicListCount || 0, totalPlaceCount: 0 };
  }

  const { count: totalPlaceCount, error: placeCountError } = await supabase
    .from("list_places")
    .select("*", { count: "exact", head: true })
    .in(
      "list_id",
      listIds.map((l) => l.id)
    );

  if (placeCountError) {
    console.error("Error fetching total place count:", placeCountError.message);
    return { publicListCount: publicListCount || 0, totalPlaceCount: 0 };
  }

  return {
    publicListCount: publicListCount || 0,
    totalPlaceCount: totalPlaceCount || 0,
  };
}
