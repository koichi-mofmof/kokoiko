"use server"; // Server Componentであることを明示

import { createClient } from "@/lib/supabase/server";
import { getStoragePublicUrl } from "@/lib/supabase/storage";
import type { Place, User } from "@/types";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

// page.tsx から型定義を移動
type PlaceRow = Database["public"]["Tables"]["places"]["Row"];

// マイページで使用するコラボレーターの型
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
  collaborators: Collaborator[]; // User[] から Collaborator[] に変更
  permission?: string;
};

// page.tsx から関数を移動
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
    notes: "",
    tags: [],
    createdAt: placeRow.created_at ? new Date(placeRow.created_at) : new Date(),
    updatedAt: placeRow.updated_at ? new Date(placeRow.updated_at) : undefined,
    visited: false,
    createdBy: currentUserId,
    imageUrl: undefined,
    rating: undefined,
    googlePlaceId: placeRow.google_place_id || undefined,
  };
};

async function fetchPlacesForList(
  supabase: SupabaseClient,
  listId: string,
  userId: string
): Promise<Place[]> {
  const { data: listPlacesData, error: listPlacesError } = await supabase
    .from("list_places")
    .select(
      `
      id,
      place_id,
      places (*)
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
      if (lp.places) {
        places.push(
          mapPlaceRowToPlace(lp.places as unknown as PlaceRow, userId)
        );
      }
    }
  }
  return places;
}

async function fetchCollaboratorsForList(
  supabase: SupabaseClient,
  listId: string,
  ownerId: string // ownerId を引数に追加
): Promise<Collaborator[]> {
  // User[] から Collaborator[] に変更
  try {
    const { data: sharedData, error: sharedError } = await supabase
      .from("shared_lists")
      .select("shared_with_user_id, permission") // permission_level を permission に修正
      .eq("list_id", listId);

    if (sharedError) {
      console.error("Error fetching shared users:", sharedError);
      return [];
    }

    if (!sharedData || sharedData.length === 0) {
      return [];
    }

    const userIds = sharedData.map((shared) => shared.shared_with_user_id);

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
        const avatarUrl = await getStoragePublicUrl(user.avatar_url);
        const sharedInfo = sharedData.find(
          (s) => s.shared_with_user_id === user.id
        );
        return {
          id: user.id,
          name: user.display_name || "",
          email: "",
          avatarUrl,
          isOwner: user.id === ownerId,
          permission: sharedInfo?.permission || undefined, // permission_level を permission に修正
        } as Collaborator; // 型アサーション
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

interface MyPageData {
  myListsForClient: MyListForClient[];
  userId: string;
  error?: string;
}

export async function MyPageDataLoader(): Promise<MyPageData> {
  const supabase: SupabaseClient = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login"); // 認証エラー時はログインページへリダイレクト
  }

  try {
    const { data: accessibleLists, error: accessError } = await supabase
      .from("user_accessible_lists") // ビュー名は正しいか確認
      .select("*")
      .order("created_at", { ascending: false });

    if (accessError) {
      console.error("Error fetching accessible lists:", accessError);
      return {
        myListsForClient: [],
        userId: user.id,
        error: "リストの取得中にエラーが発生しました。",
      };
    }

    if (!accessibleLists) {
      return { myListsForClient: [], userId: user.id };
    }

    const myListsForClient: MyListForClient[] = [];

    for (const list of accessibleLists) {
      const places = await fetchPlacesForList(supabase, list.id, user.id);
      const collaboratorsWithoutOwner = await fetchCollaboratorsForList(
        supabase,
        list.id,
        list.created_by
      );

      let ownerProfile: Collaborator | undefined =
        collaboratorsWithoutOwner.find((c) => c.id === list.created_by);

      if (!ownerProfile) {
        const { data: ownerData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .eq("id", list.created_by)
          .single();
        if (ownerData) {
          const avatarUrl = await getStoragePublicUrl(ownerData.avatar_url);
          ownerProfile = {
            id: ownerData.id,
            name: ownerData.display_name || "",
            email: "",
            avatarUrl,
            isOwner: true,
            // permission: 'owner', // 所有者のpermissionはここで設定しても良いが、MyListForClient側でaccess_typeを見るので不要かも
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
            : collaboratorsWithoutOwner.find((c) => c.id === user.id)
                ?.permission,
      });
    }

    return { myListsForClient, userId: user.id };
  } catch (error) {
    console.error("Error in MyPageDataLoader:", error);
    return {
      myListsForClient: [],
      userId: user.id,
      error: "ページの読み込み中に予期せぬエラーが発生しました。",
    };
  }
}
