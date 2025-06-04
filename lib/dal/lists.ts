"use server";

import { createClient } from "@/lib/supabase/server";
import { getStoragePublicUrl } from "@/lib/supabase/storage";
import type { Place, User } from "@/types";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

// Type definitions moved from MyPageDataLoader.tsx
type PlaceRow = Database["public"]["Tables"]["places"]["Row"];

export interface Collaborator extends User {
  permission?: string;
  isOwner?: boolean;
}

export type MyListForClient = {
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

export interface MyPageData {
  myListsForClient: MyListForClient[];
  userId: string;
  error?: string;
}

// Helper function moved from MyPageDataLoader.tsx
/**
 * Supabaseのplacesテーブルの行データをクライアントで使用するPlace型に変換します。
 * @param placeRow - Supabaseのplacesテーブルの行データ。
 * @param currentUserId - 現在のユーザーID。PlaceオブジェクトのcreatedByフィールドに設定されます。
 * @returns クライアントで使用するPlace型のオブジェクト。
 */
const mapPlaceRowToPlace = (
  placeRow: PlaceRow,
  currentUserId: string
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
    createdBy: currentUserId,
    imageUrl: undefined,
    rating: undefined,
    googlePlaceId: placeRow.google_place_id || undefined,
    listPlaceId: undefined,
  };
};

// Data fetching functions moved and adapted from MyPageDataLoader.tsx
/**
 * 特定のリストIDに紐づく場所のリストを取得します。
 * @param supabase - Supabaseクライアントインスタンス。
 * @param listId - 場所を取得する対象のリストID。
 * @param userId - 現在のユーザーID。取得した場所情報のcreatedByフィールドに設定されます。
 * @returns 指定されたリストに含まれる場所の配列 (Place[])。
 */
async function fetchPlacesForList(
  supabase: SupabaseClient<Database>,
  listId: string,
  userId: string
): Promise<Place[]> {
  const { data: listPlacesData, error: listPlacesError } = await supabase
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

  if (listPlacesError) {
    console.error("Error fetching places for list:", listPlacesError);
    return [];
  }

  const places: Place[] = [];
  if (listPlacesData && listPlacesData.length > 0) {
    for (const lp of listPlacesData) {
      // 型アサーションをより安全にするか、Zodなどでパースすることを推奨
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
        const place = mapPlaceRowToPlace(
          listPlaceRow.places, // PlaceRow型のはず
          userId
        );
        place.listPlaceId = listPlaceRow.id;
        place.visited = listPlaceRow.visited_status as
          | "visited"
          | "not_visited";

        // タグ情報をマッピング
        place.tags = listPlaceRow.list_place_tags
          .map((lpt) => lpt.tags)
          .filter((tag) => tag !== null) as { id: string; name: string }[];
        places.push(place);
      }
    }
  }
  return places;
}

/**
 * 特定のリストIDに紐づくコラボレーター（共有ユーザー）のリストを取得します。
 * @param supabase - Supabaseクライアントインスタンス。
 * @param listId - コラボレーターを取得する対象のリストID。
 * @param ownerId - リストのオーナーID。コラボレーター情報にisOwnerフラグを設定するために使用されます。
 * @returns 指定されたリストのコラボレーターの配列 (Collaborator[])。
 */
export async function fetchCollaboratorsForList(
  supabase: SupabaseClient<Database>,
  listId: string,
  ownerId: string
): Promise<Collaborator[]> {
  try {
    const { data: shared } = await supabase
      .from("shared_lists")
      .select("shared_with_user_id, permission")
      .eq("list_id", listId);

    if (!shared || shared.length === 0) {
      return [];
    }

    const userIds = shared.map((shared) => shared.shared_with_user_id);

    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    if (userError) {
      console.error("Error fetching profile data:", userError);
      return [];
    }

    const collaboratorsPromises =
      userData?.map(async (user) => {
        const avatarUrl = user.avatar_url
          ? await getStoragePublicUrl(user.avatar_url)
          : undefined;
        const sharedInfo = shared.find(
          (s) => s.shared_with_user_id === user.id
        );
        return {
          id: user.id,
          name: user.display_name || "",
          email: "", // Assuming email is not fetched or needed here
          avatarUrl,
          isOwner: user.id === ownerId,
          permission: sharedInfo?.permission || undefined,
        } as Collaborator;
      }) || [];

    const collaborators: Collaborator[] = await Promise.all(
      collaboratorsPromises
    );
    return collaborators;
  } catch (error) {
    console.error("Unexpected error in fetchCollaboratorsForList:", error);
    return [];
  }
}

// Main data fetching function for MyPage
/**
 * マイページに必要なデータをまとめて取得します。
 * 具体的には、指定されたユーザーIDに基づいてアクセス可能なすべてのリスト、
 * 各リストに含まれる場所、および各リストのコラボレーター情報を取得します。
 * @param userId - データ取得の対象となるユーザーID。
 * @returns マイページ表示に必要なデータ (MyPageData)。成功時はmyListsForClientとuserIdを、エラー時はerrorメッセージを含むオブジェクトを返します。
 */
export async function fetchMyPageData(userId: string): Promise<MyPageData> {
  const supabase = await createClient();

  try {
    const { data: accessibleLists, error: accessError } = await supabase
      .from("user_accessible_lists")
      .select("*")
      .order("created_at", { ascending: false });

    if (accessError) {
      console.error("Error fetching accessible lists:", accessError);
      return {
        myListsForClient: [],
        userId: userId,
        error: "リストの取得中にエラーが発生しました。",
      };
    }

    if (!accessibleLists) {
      return { myListsForClient: [], userId: userId };
    }

    const myListsForClient: MyListForClient[] = [];

    for (const list of accessibleLists) {
      const places = await fetchPlacesForList(supabase, list.id, userId);
      const collaboratorsWithoutOwner = await fetchCollaboratorsForList(
        supabase,
        list.id,
        list.created_by
      );

      let ownerProfile: Collaborator | undefined =
        collaboratorsWithoutOwner.find((c) => c.id === list.created_by);

      if (!ownerProfile && list.created_by) {
        // Check if list.created_by is not null
        const { data: ownerData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .eq("id", list.created_by)
          .single();
        if (ownerData) {
          const avatarUrl = ownerData.avatar_url
            ? await getStoragePublicUrl(ownerData.avatar_url)
            : undefined;
          ownerProfile = {
            id: ownerData.id,
            name: ownerData.display_name || "",
            email: "",
            avatarUrl,
            isOwner: true,
          };
        }
      }

      const finalCollaborators: Collaborator[] = ownerProfile
        ? [
            ownerProfile,
            ...collaboratorsWithoutOwner.filter(
              (c) => c.id !== list.created_by
            ),
          ]
        : [...collaboratorsWithoutOwner];

      // Ensure owner is always present if created_by is the current user and not in collaborators
      if (
        list.created_by === userId &&
        !finalCollaborators.some((c) => c.id === userId && c.isOwner)
      ) {
        const { data: currentUserProfileData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .eq("id", userId)
          .single();
        if (currentUserProfileData) {
          const avatarUrl = currentUserProfileData.avatar_url
            ? await getStoragePublicUrl(currentUserProfileData.avatar_url)
            : undefined;
          const currentUserAsOwner: Collaborator = {
            id: currentUserProfileData.id,
            name: currentUserProfileData.display_name || "",
            email: "",
            avatarUrl,
            isOwner: true,
          };
          // Add if not already present (e.g. as a collaborator)
          if (!finalCollaborators.some((c) => c.id === userId)) {
            finalCollaborators.unshift(currentUserAsOwner); // Add to the beginning
          } else {
            // If present but not marked as owner, update
            const existingUserIndex = finalCollaborators.findIndex(
              (c) => c.id === userId
            );
            finalCollaborators[existingUserIndex] = {
              ...finalCollaborators[existingUserIndex],
              ...currentUserAsOwner,
            };
          }
        }
      }

      myListsForClient.push({
        id: list.id,
        name: list.name || "リスト名未設定",
        description: list.description,
        is_public: list.is_public,
        created_at: list.created_at,
        updated_at: list.updated_at,
        created_by: list.created_by,
        places,
        place_count: places.length,
        collaborators: finalCollaborators,
        permission:
          list.access_type === "owner"
            ? "owner"
            : collaboratorsWithoutOwner.find((c) => c.id === userId)
                ?.permission,
      });
    }

    return { myListsForClient, userId: userId };
  } catch (error) {
    console.error("Error in fetchMyPageData:", error);
    return {
      myListsForClient: [],
      userId: userId,
      error: "ページの読み込み中に予期せぬエラーが発生しました。",
    };
  }
}

// Function to fetch details for a specific list
/**
 * 特定のリストIDに基づいてリスト詳細情報を取得します。
 * これには、リストの基本情報、含まれる場所のリスト、およびコラボレーター（オーナーを含む）のリストが含まれます。
 * @param listId 取得するリストのID。
 * @param userId 現在のユーザーID。場所情報や権限の判定に使用されます。
 * @returns リスト詳細情報 (MyListForClient) 、またはリストが見つからない場合は null。
 */
export async function getListDetails(
  listId: string,
  userId: string
): Promise<MyListForClient | null> {
  const supabase = await createClient();

  try {
    // 1. Fetch basic list information
    const { data: listData, error: listError } = await supabase
      .from("place_lists")
      .select(
        "id, name, description, is_public, created_at, updated_at, created_by"
      )
      .eq("id", listId)
      .single();

    if (listError || !listData) {
      console.warn(
        `Error fetching list details for listId ${listId}:`,
        listError
      );
      return null;
    }

    // 2. アクセス権限チェック
    let permission: string = "view"; // デフォルトはviewに統一
    let hasAccess = false;

    if (listData.is_public) {
      // 公開リスト: 誰でもアクセス可
      hasAccess = true;
      if (listData.created_by === userId) {
        permission = "owner";
      } else {
        // shared_listsでedit権限があればpermissionを上書き
        const { data: sharedEntry } = await supabase
          .from("shared_lists")
          .select("permission")
          .eq("list_id", listId)
          .eq("shared_with_user_id", userId)
          .single();
        if (sharedEntry && sharedEntry.permission === "edit") {
          permission = "edit";
        } else {
          permission = "view";
        }
      }
    } else {
      // 非公開リスト: オーナーまたはshared_listsでview/edit権限が必要
      if (listData.created_by === userId) {
        hasAccess = true;
        permission = "owner";
      } else {
        // shared_listsを参照
        const { data: sharedEntry } = await supabase
          .from("shared_lists")
          .select("permission")
          .eq("list_id", listId)
          .eq("shared_with_user_id", userId)
          .single();
        if (
          sharedEntry &&
          (sharedEntry.permission === "view" ||
            sharedEntry.permission === "edit")
        ) {
          hasAccess = true;
          permission = sharedEntry.permission;
        }
      }
    }

    if (!hasAccess) {
      // アクセス権限なし
      console.warn(
        `User ${userId} attempted to access list ${listId} without permission.`
      );
      return null;
    }

    // 3. Fetch places for the list
    const places = await fetchPlacesForList(supabase, listId, userId);

    // 4. Fetch collaborators
    const collaboratorsWithoutOwner = await fetchCollaboratorsForList(
      supabase,
      listId,
      listData.created_by
    );

    let ownerProfile: Collaborator | undefined;
    ownerProfile = collaboratorsWithoutOwner.find(
      (c) => c.id === listData.created_by && c.isOwner
    );
    if (!ownerProfile && listData.created_by) {
      const { data: ownerDataFromProfiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", listData.created_by)
        .single();
      if (ownerDataFromProfiles) {
        const avatarUrl = ownerDataFromProfiles.avatar_url
          ? await getStoragePublicUrl(ownerDataFromProfiles.avatar_url)
          : undefined;
        ownerProfile = {
          id: ownerDataFromProfiles.id,
          name: ownerDataFromProfiles.display_name || "",
          email: "",
          avatarUrl,
          isOwner: true,
        };
      }
    }
    const finalCollaborators: Collaborator[] = ownerProfile
      ? [
          ownerProfile,
          ...collaboratorsWithoutOwner.filter(
            (c) => c.id !== listData.created_by
          ),
        ]
      : [...collaboratorsWithoutOwner];
    if (
      listData.created_by === userId &&
      !finalCollaborators.some((c) => c.id === userId && c.isOwner)
    ) {
      const currentUserAsOwnerInCollaborators = finalCollaborators.find(
        (c) => c.id === userId
      );
      if (currentUserAsOwnerInCollaborators) {
        currentUserAsOwnerInCollaborators.isOwner = true;
      } else {
        const { data: currentUserProfileData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .eq("id", userId)
          .single();
        if (currentUserProfileData) {
          const avatarUrl = currentUserProfileData.avatar_url
            ? await getStoragePublicUrl(currentUserProfileData.avatar_url)
            : undefined;
          const currentUserAsOwner: Collaborator = {
            id: currentUserProfileData.id,
            name: currentUserProfileData.display_name || "",
            email: "",
            avatarUrl,
            isOwner: true,
          };
          finalCollaborators.unshift(currentUserAsOwner);
        }
      }
    }

    return {
      id: listData.id,
      name: listData.name || "リスト名未設定",
      description: listData.description,
      is_public: listData.is_public,
      created_at: listData.created_at,
      updated_at: listData.updated_at,
      created_by: listData.created_by,
      places,
      place_count: places.length,
      collaborators: finalCollaborators,
      permission: permission,
    };
  } catch (error) {
    console.error(
      `Unexpected error in getListDetails for listId ${listId}:`,
      error
    );
    return null;
  }
}
