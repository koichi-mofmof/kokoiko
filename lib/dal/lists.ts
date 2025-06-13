"use server";

import { createClient } from "@/lib/supabase/server";
import { getStoragePublicUrl } from "@/lib/supabase/storage";
import type { Place, User } from "@/types";
import type { Database } from "@/types/supabase";

// ===================================
// 🎯 RLS設計を活用した改善されたDAL
// ===================================

// Type definitions
type PlaceRow = Database["public"]["Tables"]["places"]["Row"];

export interface Collaborator extends User {
  permission?: string;
  isOwner?: boolean;
}

export type ListForClient = {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string;
  places: Place[];
  place_count: number;
  collaborators: Collaborator[];
  permission?: string;
};

export interface ListsPageData {
  lists: ListForClient[];
  userId: string;
  error?: string;
}

// ===================================
// 🔧 Helper Functions
// ===================================

/**
 * PlaceRowをPlace型に変換するヘルパー関数
 */
const mapPlaceRowToPlace = (
  placeRow: PlaceRow,
  currentUserId?: string
): Place => {
  return {
    id: placeRow.id,
    name: placeRow.name,
    address: placeRow.address || "",
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${
      placeRow.latitude || 0
    },${placeRow.longitude || 0}&query_place_id=${
      placeRow.google_place_id || ""
    }`,
    latitude: placeRow.latitude || 0,
    longitude: placeRow.longitude || 0,
    tags: [],
    createdAt: placeRow.created_at ? new Date(placeRow.created_at) : new Date(),
    updatedAt: placeRow.updated_at ? new Date(placeRow.updated_at) : undefined,
    visited: "not_visited",
    createdBy: currentUserId || "",
    imageUrl: undefined,
    rating: undefined,
    googlePlaceId: placeRow.google_place_id || undefined,
    listPlaceId: undefined,
  };
};

// ===================================
// 🎯 RLS活用型データ取得関数
// ===================================

/**
 * RLSを活用してリスト一覧を取得
 * - RLSポリシーが自動的にアクセス権限をフィルタリング
 * - アプリケーション層での複雑な権限チェックが不要
 */
export async function getAccessibleLists(
  userId?: string
): Promise<ListForClient[]> {
  const supabase = await createClient();

  if (!userId) return [];

  try {
    // 1. 自分が作成したリストを取得
    const { data: ownedLists, error: ownedError } = await supabase
      .from("place_lists")
      .select(
        `
        id,
        name,
        description,
        is_public,
        created_at,
        updated_at,
        created_by
      `
      )
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (ownedError) {
      console.error("Error fetching owned lists:", ownedError);
      return [];
    }

    // 2. 明示的に共有されたリストを取得
    const { data: sharedListIds, error: sharedError } = await supabase
      .from("shared_lists")
      .select(
        `
        list_id,
        permission,
        place_lists!inner (
          id,
          name,
          description,
          is_public,
          created_at,
          updated_at,
          created_by
        )
      `
      )
      .eq("shared_with_user_id", userId);

    if (sharedError) {
      console.error("Error fetching shared lists:", sharedError);
      return [];
    }

    // 3. 結果をマージ
    const allLists = [
      ...(ownedLists || []).map((list) => ({ ...list, permission: "owner" })),
      ...(sharedListIds || []).map((item) => {
        const sharedItem = item as unknown as {
          permission: string;
          place_lists: {
            id: string;
            name: string;
            description: string | null;
            is_public: boolean | null;
            created_at: string | null;
            updated_at: string | null;
            created_by: string;
          };
        };
        return {
          ...sharedItem.place_lists,
          permission: sharedItem.permission,
        };
      }),
    ];

    // 4. 各リストの詳細情報を並列取得
    const listsWithDetails = await Promise.all(
      allLists.map(async (list) => {
        const [places, collaborators] = await Promise.all([
          getPlacesForList(list.id, userId),
          getCollaboratorsForList(list.id, list.created_by),
        ]);

        return {
          ...list,
          places,
          place_count: places.length,
          collaborators,
        };
      })
    );

    return listsWithDetails.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    );
  } catch (error) {
    console.error("Error in getAccessibleLists:", error);
    return [];
  }
}

/**
 * RLSを活用してリスト詳細を取得
 * - 公開/非公開、認証/未認証を問わず統一的に処理
 * - RLSポリシーが自動的にアクセス権限をチェック
 */
export async function getListDetails(
  listId: string,
  userId?: string
): Promise<ListForClient | null> {
  const supabase = await createClient();

  try {
    // RLSポリシーが自動的にアクセス権限をチェック
    const { data: list, error } = await supabase
      .from("place_lists")
      .select(
        `
        id,
        name,
        description,
        is_public,
        created_at,
        updated_at,
        created_by
      `
      )
      .eq("id", listId)
      .single();

    if (error || !list) {
      // RLSポリシーによりアクセス拒否された場合もここに来る
      return null;
    }

    // 詳細情報を並列取得
    const [places, collaborators] = await Promise.all([
      getPlacesForList(listId, userId || list.created_by),
      getCollaboratorsForList(listId, list.created_by),
    ]);

    // 権限の判定
    let permission = "view";
    if (userId === list.created_by) {
      permission = "owner";
    } else if (userId) {
      const { data: sharedEntry } = await supabase
        .from("shared_lists")
        .select("permission")
        .eq("list_id", listId)
        .eq("shared_with_user_id", userId)
        .single();

      if (sharedEntry?.permission === "edit") {
        permission = "edit";
      }
    }

    return {
      ...list,
      places,
      place_count: places.length,
      collaborators,
      permission,
    };
  } catch (error) {
    console.error("Error in getListDetails:", error);
    return null;
  }
}

/**
 * RLSを活用してリストの場所一覧を取得
 */
async function getPlacesForList(
  listId: string,
  userId?: string
): Promise<Place[]> {
  const supabase = await createClient();

  try {
    // RLSポリシーが自動的にアクセス権限をチェック
    const { data: listPlaces, error } = await supabase
      .from("list_places")
      .select(
        `
        id,
        list_id,
        place_id,
        user_id,
        visited_status,
        places (*),
        list_place_tags (
          tags (id, name)
        )
      `
      )
      .eq("list_id", listId);

    if (error) {
      console.error("Error fetching places for list:", error);
      return [];
    }

    if (!listPlaces) return [];

    // ユーザー情報を別途取得
    const userIds = [
      ...new Set(
        listPlaces.map((lp) => {
          const row = lp as { user_id: string };
          return row.user_id;
        })
      ),
    ];
    let usersData: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
    }[] = [];

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      if (!usersError && users) {
        usersData = users;
      }
    }

    const places: Place[] = [];
    for (const lp of listPlaces) {
      const listPlaceRow = lp as unknown as {
        id: string;
        list_id: string;
        place_id: string;
        user_id: string;
        visited_status: string | null;
        places: PlaceRow | null;
        list_place_tags: {
          tags: { id: string; name: string } | null;
        }[];
      };

      if (listPlaceRow.places) {
        const place = mapPlaceRowToPlace(listPlaceRow.places, userId);
        place.listPlaceId = listPlaceRow.id;
        place.visited = listPlaceRow.visited_status as
          | "visited"
          | "not_visited";
        place.tags = listPlaceRow.list_place_tags
          .map((lpt) => lpt.tags)
          .filter((tag) => tag !== null) as { id: string; name: string }[];

        // 登録者情報を追加
        place.createdBy = listPlaceRow.user_id;
        const userProfile = usersData.find(
          (u) => u.id === listPlaceRow.user_id
        );
        if (userProfile) {
          const avatarUrl = userProfile.avatar_url
            ? await getStoragePublicUrl(userProfile.avatar_url)
            : undefined;

          place.createdByUser = {
            id: userProfile.id,
            name: userProfile.display_name || "匿名ユーザー",
            avatarUrl,
          };
        }

        places.push(place);
      }
    }

    return places;
  } catch (error) {
    console.error("Error in getPlacesForList:", error);
    return [];
  }
}

/**
 * RLSを活用してコラボレーター一覧を取得
 */
export async function getCollaboratorsForList(
  listId: string,
  ownerId: string
): Promise<Collaborator[]> {
  const supabase = await createClient();

  try {
    // 所有者と共有されたユーザーの両方を取得
    const [ownerResult, sharedResult] = await Promise.all([
      // 所有者の情報を取得
      supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", ownerId)
        .single(),
      // 共有されたユーザーを取得
      supabase
        .from("shared_lists")
        .select("shared_with_user_id, permission")
        .eq("list_id", listId),
    ]);

    const collaborators: Collaborator[] = [];

    // 所有者を追加
    if (ownerResult.data && !ownerResult.error) {
      const ownerAvatarUrl = ownerResult.data.avatar_url
        ? await getStoragePublicUrl(ownerResult.data.avatar_url)
        : undefined;

      collaborators.push({
        id: ownerResult.data.id,
        name: ownerResult.data.display_name || "",
        email: "",
        avatarUrl: ownerAvatarUrl,
        isOwner: true,
        permission: "owner",
      });
    }

    // 共有ユーザーを追加
    if (
      sharedResult.data &&
      !sharedResult.error &&
      sharedResult.data.length > 0
    ) {
      const userIds = sharedResult.data.map((s) => s.shared_with_user_id);

      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      if (!userError && userData) {
        const sharedCollaborators = await Promise.all(
          userData.map(async (user) => {
            const avatarUrl = user.avatar_url
              ? await getStoragePublicUrl(user.avatar_url)
              : undefined;
            const sharedInfo = sharedResult.data.find(
              (s) => s.shared_with_user_id === user.id
            );

            return {
              id: user.id,
              name: user.display_name || "",
              email: "",
              avatarUrl,
              isOwner: false,
              permission: sharedInfo?.permission || "view",
            } as Collaborator;
          })
        );

        collaborators.push(...sharedCollaborators);
      }
    }

    return collaborators;
  } catch (error) {
    console.error("Error in getCollaboratorsForList:", error);
    return [];
  }
}

// ===================================
// 🎯 高レベルAPI関数
// ===================================

/**
 * マイページ用データ取得（認証済みユーザー向け）
 */
export async function getMyPageData(userId: string): Promise<ListsPageData> {
  try {
    const lists = await getAccessibleLists(userId);
    return {
      lists,
      userId,
    };
  } catch (error) {
    console.error("Error in getMyPageData:", error);
    return {
      lists: [],
      userId,
      error: "ページの読み込み中にエラーが発生しました。",
    };
  }
}

/**
 * 公開リスト用データ取得（未ログインユーザー向け）
 */
export async function getPublicListData(
  listId: string
): Promise<ListForClient | null> {
  // RLSポリシーが自動的に公開リストのみを返すため、
  // getListDetailsと同じ関数を使用可能
  return getListDetails(listId);
}

// ===================================
// 🔍 RLS活用型検索・フィルタリング関数
// ===================================

/**
 * タグによるリスト検索（RLS適用）
 */
export async function searchListsByTag(
  tagName: string,
  userId?: string
): Promise<ListForClient[]> {
  const supabase = await createClient();

  try {
    // RLSポリシーが自動的にアクセス権限をフィルタリング
    const { data: listIds, error } = await supabase
      .from("list_place_tags")
      .select(
        `
        list_places!inner (
          list_id,
          place_lists!inner (
            id,
            name,
            description,
            is_public,
            created_at,
            updated_at,
            created_by
          )
        ),
        tags!inner (name)
      `
      )
      .eq("tags.name", tagName);

    if (error) {
      console.error("Error searching lists by tag:", error);
      return [];
    }

    // 重複を除去してリスト詳細を取得
    const uniqueListIds = Array.from(
      new Set(
        listIds?.flatMap((item) =>
          (
            item as unknown as {
              list_places: { place_lists: { id: string }[] };
            }
          ).list_places.place_lists.map((list) => list.id)
        ) || []
      )
    );

    const lists = await Promise.all(
      uniqueListIds.map((listId) => getListDetails(listId, userId))
    );

    return lists.filter((list): list is ListForClient => list !== null);
  } catch (error) {
    console.error("Error in searchListsByTag:", error);
    return [];
  }
}

/**
 * 場所名によるリスト検索（RLS適用）
 */
export async function searchListsByPlace(
  placeName: string,
  userId?: string
): Promise<ListForClient[]> {
  const supabase = await createClient();

  try {
    // RLSポリシーが自動的にアクセス権限をフィルタリング
    const { data: listIds, error } = await supabase
      .from("list_places")
      .select(
        `
        list_id,
        places!inner (name),
        place_lists!inner (
          id,
          name,
          description,
          is_public,
          created_at,
          updated_at,
          created_by
        )
      `
      )
      .ilike("places.name", `%${placeName}%`);

    if (error) {
      console.error("Error searching lists by place:", error);
      return [];
    }

    // 重複を除去してリスト詳細を取得
    const uniqueListIds = Array.from(
      new Set(
        listIds?.map(
          (item) =>
            (item as unknown as { place_lists: { id: string } }).place_lists.id
        ) || []
      )
    );

    const lists = await Promise.all(
      uniqueListIds.map((listId) => getListDetails(listId, userId))
    );

    return lists.filter((list): list is ListForClient => list !== null);
  } catch (error) {
    console.error("Error in searchListsByPlace:", error);
    return [];
  }
}

// ===================================
// 🎯 統計情報取得関数（RLS適用）
// ===================================

/**
 * ユーザーのリスト統計情報を取得
 */
export async function getUserListStats(userId: string) {
  const supabase = await createClient();

  try {
    // RLSポリシーが自動的にアクセス権限をフィルタリング
    const [ownedLists, sharedLists, totalPlaces] = await Promise.all([
      // 自分が作成したリスト数
      supabase
        .from("place_lists")
        .select("id", { count: "exact" })
        .eq("created_by", userId),

      // 共有されているリスト数
      supabase
        .from("shared_lists")
        .select("id", { count: "exact" })
        .eq("shared_with_user_id", userId),

      // アクセス可能な総場所数
      supabase.from("list_places").select("id", { count: "exact" }),
    ]);

    return {
      ownedListsCount: ownedLists.count || 0,
      sharedListsCount: sharedLists.count || 0,
      totalPlacesCount: totalPlaces.count || 0,
    };
  } catch (error) {
    console.error("Error in getUserListStats:", error);
    return {
      ownedListsCount: 0,
      sharedListsCount: 0,
      totalPlacesCount: 0,
    };
  }
}

// ===================================
// 🔄 レガシー関数との互換性
// ===================================

/**
 * 既存のfetchMyPageData関数との互換性を保つ
 * @deprecated 新しいgetMyPageData関数を使用してください
 */
export async function fetchMyPageData(userId: string) {
  const result = await getMyPageData(userId);
  return {
    myListsForClient: result.lists,
    userId: result.userId,
    error: result.error,
  };
}

/**
 * 既存のgetPublicListDetails関数との互換性を保つ
 * @deprecated 新しいgetPublicListData関数を使用してください
 */
export async function getPublicListDetails(listId: string) {
  return getPublicListData(listId);
}
