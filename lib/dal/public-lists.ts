import { createAnonymousClient } from "@/lib/supabase/server";

// RPC関数の戻り値の型定義
interface PublicListRPCResult {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  place_count: number;
}

export interface PublicListForHome {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  creatorUsername: string;
  creatorDisplayName: string | null;
  creatorAvatarUrl: string | null;
  placeCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * TOPページ用の公開リスト取得
 * 登録地点数の上位4件を取得、基本情報のみ
 */
export async function getPublicListsForHome(
  limit: number = 4
): Promise<PublicListForHome[]> {
  try {
    const supabase = createAnonymousClient();

    // RPCを使用して登録地点数でソートしたリストを取得
    const { data, error } = await supabase.rpc(
      "get_public_lists_by_place_count",
      {
        limit_count: limit,
      }
    );

    if (error) {
      console.error("Error fetching public lists for home:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // 個別にプロフィール情報を取得
    const creatorIds = [
      ...new Set(data.map((list: PublicListRPCResult) => list.created_by)),
    ];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", creatorIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    return data.map((list: PublicListRPCResult) => {
      const profile = profileMap.get(list.created_by);

      // avatar_urlの処理：手動でURLを構築
      let avatarUrl = profile?.avatar_url;
      if (avatarUrl && !avatarUrl.startsWith("http")) {
        // 手動でSupabase StorageのURLを構築
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        avatarUrl = `${supabaseUrl}/storage/v1/object/public/profile_images/${avatarUrl}`;
      }

      return {
        id: list.id,
        name: list.name,
        description: list.description,
        createdBy: list.created_by,
        creatorUsername: profile?.username || "",
        creatorDisplayName: profile?.display_name,
        creatorAvatarUrl: avatarUrl,
        placeCount: list.place_count,
        createdAt: list.created_at,
        updatedAt: list.updated_at,
      };
    });
  } catch (error) {
    console.error("Unexpected error in getPublicListsForHome:", error);
    return [];
  }
}

/**
 * 公開リスト一覧用（ページネーション・ソート対応）
 */
export async function getPublicListsPaginated(
  limit: number = 20,
  offset: number = 0,
  sortBy: string = "updated_at",
  sortOrder: "asc" | "desc" = "desc"
): Promise<{
  lists: PublicListForHome[];
  totalCount: number;
}> {
  try {
    const supabase = createAnonymousClient();

    // 総数取得
    const { count } = await supabase
      .from("place_lists")
      .select("*", { count: "exact", head: true })
      .eq("is_public", true);

    // ソート条件の設定
    let orderBy = "updated_at";
    let ascending = false;

    switch (sortBy) {
      case "created_at":
        orderBy = "created_at";
        ascending = sortOrder === "asc";
        break;
      case "name":
        orderBy = "name";
        ascending = sortOrder === "asc";
        break;
      case "updated_at":
      default:
        orderBy = "updated_at";
        ascending = sortOrder === "asc";
        break;
    }

    // データ取得
    const { data, error } = await supabase
      .from("place_lists")
      .select(
        `
        id,
        name,
        description,
        created_by,
        created_at,
        updated_at,
        list_places(count)
      `
      )
      .eq("is_public", true)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching paginated public lists:", error);
      return { lists: [], totalCount: 0 };
    }

    // 個別にプロフィール情報を取得
    const creatorIds = [
      ...new Set((data || []).map((list) => list.created_by)),
    ];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", creatorIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const lists = (data || []).map((list) => {
      const profile = profileMap.get(list.created_by);

      // avatar_urlの処理：手動でURLを構築
      let avatarUrl = profile?.avatar_url;
      if (avatarUrl && !avatarUrl.startsWith("http")) {
        // 手動でSupabase StorageのURLを構築
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        avatarUrl = `${supabaseUrl}/storage/v1/object/public/profile_images/${avatarUrl}`;
      }

      return {
        id: list.id,
        name: list.name,
        description: list.description,
        createdBy: list.created_by,
        creatorUsername: profile?.username || "",
        creatorDisplayName: profile?.display_name,
        creatorAvatarUrl: avatarUrl,
        placeCount: list.list_places[0]?.count || 0,
        createdAt: list.created_at,
        updatedAt: list.updated_at,
      };
    });

    return {
      lists,
      totalCount: count || 0,
    };
  } catch (error) {
    console.error("Unexpected error in getPublicListsPaginated:", error);
    return { lists: [], totalCount: 0 };
  }
}
