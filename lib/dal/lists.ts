"use server";

import { createClient } from "@/lib/supabase/server";
import { getStoragePublicUrl } from "@/lib/supabase/storage";
import {
  pickPlaceComment,
  type ListPlaceCommentRow,
  type PickedComment,
} from "@/lib/dal/comment-utils";
import type { Place, User } from "@/types";
import type { Database } from "@/types/supabase";

// ===================================
// 🎯 RLS設計を活用した改善されたDAL
// ===================================

// Type definitions
type PlaceRow = Database["public"]["Tables"]["places"]["Row"];

// 階層地域情報を含む拡張PlaceRow型
type ExtendedPlaceRow = PlaceRow & {
  country_code?: string | null;
  country_name?: string | null;
  admin_area_level_1?: string | null;
  region_hierarchy?: { level1: string; level2?: string } | null;
};

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
  permission: "owner" | "edit" | "view" | "manage" | null;
  isBookmarked: boolean;
};

export interface ListsPageData {
  lists: ListForClient[];
  userId: string;
  error?: string;
  errorKey?: string;
  permission?: string;
}

// ===================================
// 🔧 Helper Functions
// ===================================

/**
 * PlaceRowをPlace型に変換するヘルパー関数
 */
const mapPlaceRowToPlace = (
  placeRow: ExtendedPlaceRow,
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
    // 階層地域情報
    countryCode: placeRow.country_code || undefined,
    countryName: placeRow.country_name || undefined,
    adminAreaLevel1: placeRow.admin_area_level_1 || undefined,
    regionHierarchy: placeRow.region_hierarchy || undefined,
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
    // Define types for Supabase query results
    type BaseListInfo = {
      id: string;
      name: string;
      description: string | null;
      is_public: boolean | null;
      created_at: string | null;
      updated_at: string | null;
      created_by: string;
    };

    type SharedListResult = {
      permission: "view" | "edit";
      place_lists: BaseListInfo;
    };

    type BookmarkedListResult = {
      place_lists: BaseListInfo;
    };

    // 1. 自分が作成したリスト、共有されたリスト、ブックマークしたリストを並列で取得
    const [ownedResult, sharedResult, bookmarkedResult] = await Promise.all([
      // 自分が作成したリスト
      supabase
        .from("place_lists")
        .select(
          `id, name, description, is_public, created_at, updated_at, created_by`
        )
        .eq("created_by", userId),
      // 自分に共有されたリスト
      supabase
        .from("shared_lists")
        .select(
          `permission, place_lists!inner(id, name, description, is_public, created_at, updated_at, created_by)`
        )
        .eq("shared_with_user_id", userId),
      // ブックマークしたリスト
      supabase
        .from("list_bookmarks")
        .select(
          `place_lists!inner(id, name, description, is_public, created_at, updated_at, created_by)`
        )
        .eq("user_id", userId),
    ]);

    if (ownedResult.error) {
      console.error("Error fetching owned lists:", ownedResult.error);
    }
    if (sharedResult.error) {
      console.error("Error fetching shared lists:", sharedResult.error);
    }
    if (bookmarkedResult.error) {
      console.error("Error fetching bookmarked lists:", bookmarkedResult.error);
    }

    // 3. 結果をマージして型を統一
    type ListWithoutDetails = Omit<
      ListForClient,
      "places" | "place_count" | "collaborators"
    >;
    const allListsMap = new Map<string, ListWithoutDetails>();

    // 作成したリストを追加
    (ownedResult.data || []).forEach((list) => {
      allListsMap.set(list.id, {
        ...list,
        permission: "owner",
        isBookmarked: false,
      });
    });

    // 共有されたリストを追加（または権限を更新）
    ((sharedResult.data as unknown as SharedListResult[]) || []).forEach(
      (item) => {
        const { permission, place_lists: list } = item;
        if (list && !allListsMap.has(list.id)) {
          allListsMap.set(list.id, {
            ...list,
            permission,
            isBookmarked: false,
          });
        }
      }
    );

    // ブックマークしたリストを処理
    (
      (bookmarkedResult.data as unknown as BookmarkedListResult[]) || []
    ).forEach((item) => {
      const { place_lists: list } = item;
      if (list) {
        if (allListsMap.has(list.id)) {
          // 既知のリスト（作成or共有）なら、isBookmarkedフラグを立てる
          const existing = allListsMap.get(list.id)!;
          allListsMap.set(list.id, { ...existing, isBookmarked: true });
        } else {
          // 未知のリスト（ブックマークのみ）なら、新しいエントリとして追加
          allListsMap.set(list.id, {
            ...list,
            permission: "view",
            isBookmarked: true,
          });
        }
      }
    });

    const allLists = Array.from(allListsMap.values());

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
 * メタデータ生成用の軽量リスト情報取得
 * - 最小限のカラムのみ取得し、場所数はCOUNTヘッダーで取得
 * - 公開リストのみ返す（非公開はnull）
 */
export async function getListMetadataLite(listId: string): Promise<{
  id: string;
  name: string;
  description: string | null;
  is_public: boolean | null;
  created_by: string;
  placesCount: number;
  /** meta descriptionに使う代表的な地点名（先頭3件） */
  samplePlaceNames: string[];
  /** meta descriptionに使う代表的な地域名（最頻の都道府県/州） */
  primaryRegion: string | null;
} | null> {
  const supabase = await createClient();

  // リストの基本情報のみ取得
  const { data: list, error: listError } = await supabase
    .from("place_lists")
    .select("id, name, description, is_public, created_by")
    .eq("id", listId)
    .single();

  if (listError || !list) {
    return null;
  }

  // 公開でない場合はメタデータを返さない
  if (list.is_public !== true) {
    return null;
  }

  // 場所数はCOUNTのみ（データ本体は取得しない）
  const { count, error: countError } = await supabase
    .from("list_places")
    .select("id", { count: "exact", head: true })
    .eq("list_id", listId);

  if (countError) {
    return {
      ...list,
      placesCount: 0,
      samplePlaceNames: [],
      primaryRegion: null,
    };
  }

  // meta description の素材。検索結果で中身が伝わるよう実際の地点名と地域を使う。
  // 件数は絞る（メタデータ生成は全ページビューで走るため）
  const { data: sampleRows } = await supabase
    .from("list_places")
    .select("places!inner (name, admin_area_level_1, country_name)")
    .eq("list_id", listId)
    .order("created_at", { ascending: true })
    .limit(10);

  const samples = (sampleRows ?? []).flatMap((row) => {
    const place = (
      row as unknown as {
        places:
          | {
              name: string | null;
              admin_area_level_1: string | null;
              country_name: string | null;
            }
          | Array<{
              name: string | null;
              admin_area_level_1: string | null;
              country_name: string | null;
            }>;
      }
    ).places;
    return Array.isArray(place) ? place : [place];
  });

  const samplePlaceNames = samples
    .map((p) => p?.name)
    .filter((n): n is string => Boolean(n && n.trim()))
    .slice(0, 3);

  // 最頻の地域を代表地域とする（都道府県・州が無ければ国名）
  const regionCounts = new Map<string, number>();
  for (const p of samples) {
    const region = p?.admin_area_level_1 || p?.country_name;
    if (region) regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1);
  }
  const primaryRegion =
    [...regionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    ...list,
    placesCount: count || 0,
    samplePlaceNames,
    primaryRegion,
  };
}

/**
 * フェーズ1修正: アプリケーション層権限チェックを使用してリスト詳細を取得
 * - RLSに依存せず、permission-check.tsの関数を活用
 * - 公開/非公開、認証/未認証を問わず統一的に処理
 */
export async function getListDetails(
  listId: string,
  userId?: string
): Promise<ListForClient | null> {
  const supabase = await createClient();

  try {
    // フェーズ1: 新しい権限チェック関数を使用
    const { canAccessList } = await import("@/lib/utils/permission-check");

    const accessResult = await canAccessList(listId, userId);

    if (!accessResult.canAccess) {
      return null;
    }

    // リスト基本情報取得（権限チェック済み）
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
      return null;
    }

    const [places, collaborators, bookmarkedResult] = await Promise.all([
      getPlacesForList(listId, userId),
      getCollaboratorsForList(listId, list.created_by),
      userId
        ? supabase
            .from("list_bookmarks")
            .select("id")
            .eq("list_id", listId)
            .eq("user_id", userId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    let permission: ListForClient["permission"];
    if (userId && list.created_by === userId) {
      permission = "owner";
    } else {
      permission = accessResult.permission;
    }

    const isBookmarked = !!bookmarkedResult?.data;

    return {
      ...list,
      places,
      place_count: places.length,
      collaborators,
      permission,
      isBookmarked,
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

    // 各地点のコメントを一括取得（カードで主役化する声）
    const listPlaceIds = listPlaces.map((lp) => (lp as { id: string }).id);
    let commentsData: ListPlaceCommentRow[] = [];
    if (listPlaceIds.length > 0) {
      const { data: comments } = await supabase
        .from("list_place_commnts")
        .select("list_place_id, user_id, comment, created_at")
        .in("list_place_id", listPlaceIds);
      if (comments) commentsData = comments as ListPlaceCommentRow[];
    }

    // 各地点の主役コメントを選定（追加者優先→コラボレーター、著者ID付き）
    const pickedByListPlaceId = new Map<string, PickedComment>();
    for (const lp of listPlaces) {
      const row = lp as { id: string; user_id: string };
      const picked = pickPlaceComment(row.id, row.user_id, commentsData);
      if (picked) pickedByListPlaceId.set(row.id, picked);
    }

    // 必要なプロフィール（追加者 ∪ コメント著者）をまとめて取得し、
    // アバターURLを1回だけ解決したmapを作る
    const userIds = [
      ...new Set([
        ...listPlaces.map((lp) => (lp as { user_id: string }).user_id),
        ...Array.from(pickedByListPlaceId.values()).map((p) => p.userId),
      ]),
    ];
    const profileMap = new Map<
      string,
      { id: string; name: string; avatarUrl?: string }
    >();
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      if (!usersError && users) {
        for (const u of users) {
          const avatarUrl = u.avatar_url
            ? await getStoragePublicUrl(u.avatar_url)
            : undefined;
          profileMap.set(u.id, {
            id: u.id,
            name: u.display_name || "",
            avatarUrl,
          });
        }
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
        places: ExtendedPlaceRow | null;
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

        // 登録者（追加者）情報を追加
        place.createdBy = listPlaceRow.user_id;
        place.createdByUser = profileMap.get(listPlaceRow.user_id);

        // 主役コメントと、その実著者（＝バブルのアバター帰属先）を付与
        const picked = pickedByListPlaceId.get(listPlaceRow.id);
        if (picked) {
          place.comment = picked.comment;
          place.commentAuthor = profileMap.get(picked.userId);
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
      errorKey: "errors.common.fetchFailed",
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

/**
 * 特定のリストで使用されているタグを取得
 */
export async function getListTags(
  listId: string
): Promise<{ id: string; name: string; count: number }[]> {
  const supabase = await createClient();

  try {
    const { data: tags, error } = await supabase
      .from("list_place_tags")
      .select(
        `
        tags!inner (
          id,
          name
        ),
        list_places!inner (
          list_id
        )
      `
      )
      .eq("list_places.list_id", listId);

    if (error) {
      console.error("Error fetching list tags:", error);
      return [];
    }

    // タグ名ごとに使用回数をカウント（同じタグ名の重複を統合）
    const tagCounts = new Map<
      string,
      { id: string; name: string; count: number }
    >();

    tags?.forEach((item) => {
      const tagData = (
        item as unknown as {
          tags: { id: string; name: string };
        }
      ).tags;

      // タグ名をキーとして使用（IDではなく）
      if (tagCounts.has(tagData.name)) {
        tagCounts.get(tagData.name)!.count++;
      } else {
        tagCounts.set(tagData.name, {
          id: tagData.id,
          name: tagData.name,
          count: 1,
        });
      }
    });

    // 使用回数が多い順にソート
    return Array.from(tagCounts.values()).sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("Error in getListTags:", error);
    return [];
  }
}
