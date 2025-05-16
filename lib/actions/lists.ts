"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// リスト作成用のスキーマ
const createListSchema = z.object({
  name: z.string().min(1, "リスト名は必須です"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

// リスト編集用のスキーマ
const updateListSchema = z.object({
  id: z.string().uuid("無効なリストIDです"),
  name: z.string().min(1, "リスト名は必須です"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

// リスト作成アクション
export async function createList(formData: FormData) {
  const supabase = await createClient();

  // ユーザー認証確認
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "認証エラー: ログインが必要です",
    };
  }

  // フォームデータの取得と検証
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || "",
    isPublic: formData.get("isPublic") === "true",
  };

  const validation = createListSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { name, description, isPublic } = validation.data;

  try {
    // リストの作成
    const { data: newList, error: insertError } = await supabase
      .from("place_lists")
      .insert({
        name,
        description,
        is_public: isPublic,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("リスト作成エラー:", insertError);
      return {
        success: false,
        error: "リストの作成中にエラーが発生しました",
      };
    }

    // キャッシュを更新してリスト一覧ページにリダイレクト
    revalidatePath("/lists");
    return {
      success: true,
      listId: newList.id,
    };
  } catch (error) {
    console.error("予期せぬエラー:", error);
    return {
      success: false,
      error: "リスト作成中に予期せぬエラーが発生しました",
    };
  }
}

// リスト更新アクション
export async function updateList(formData: {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
}) {
  const supabase = await createClient();

  // ユーザー認証確認
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "認証エラー: ログインが必要です",
    };
  }

  // データの検証
  const validation = updateListSchema.safeParse(formData);

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { id, name, description, isPublic } = validation.data;

  try {
    // リストの更新処理
    const { data, error: updateError } = await supabase
      .from("place_lists")
      .update({
        name,
        description: description || null,
        is_public: isPublic,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("created_by", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("リスト更新エラー:", updateError);
      return {
        success: false,
        error: `リストの更新中にエラーが発生しました: ${
          updateError.message || "不明なエラー"
        }`,
      };
    }

    // キャッシュを更新
    revalidatePath("/lists");
    return {
      success: true,
      list: data,
    };
  } catch (error) {
    console.error("予期せぬエラー:", error);
    return {
      success: false,
      error: "リスト更新中に予期せぬエラーが発生しました",
    };
  }
}

// リスト削除アクション
export async function deleteList(listId: string) {
  if (!listId || typeof listId !== "string" || listId.trim() === "") {
    return {
      success: false,
      error: "有効なリストIDが必要です。",
    };
  }

  const supabase = await createClient();

  // ユーザー認証確認
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "認証エラー: ログインが必要です",
    };
  }

  try {
    // トランザクション的に扱うため、順番に削除を実行

    // 1. リスト共有トークンの削除
    const { error: tokenDeleteError } = await supabase
      .from("list_share_tokens")
      .delete()
      .eq("list_id", listId);

    if (tokenDeleteError) {
      console.error("共有トークン削除エラー:", tokenDeleteError);
      // エラーがあっても処理継続（主要なデータではないため）
    }

    // 2. リスト共有設定の削除
    const { error: shareDeleteError } = await supabase
      .from("shared_lists")
      .delete()
      .eq("list_id", listId);

    if (shareDeleteError) {
      console.error("共有設定削除エラー:", shareDeleteError);
      // エラーがあっても処理継続
    }

    // 3. リスト内の場所に関連するタグの削除
    // list_place_idsを取得してからlist_place_tagsを削除
    const { data: listPlaces } = await supabase
      .from("list_places")
      .select("id")
      .eq("list_id", listId);

    if (listPlaces && listPlaces.length > 0) {
      const listPlaceIds = listPlaces.map((place) => place.id);

      // list_place_tagsの削除
      if (listPlaceIds.length > 0) {
        const { error: tagDeleteError } = await supabase
          .from("list_place_tags")
          .delete()
          .in("list_place_id", listPlaceIds);

        if (tagDeleteError) {
          console.error("場所タグ削除エラー:", tagDeleteError);
          // エラーがあっても処理継続
        }
      }
    }

    // 4. リスト内の場所の削除
    const { error: placeDeleteError } = await supabase
      .from("list_places")
      .delete()
      .eq("list_id", listId);

    if (placeDeleteError) {
      console.error("リスト内場所削除エラー:", placeDeleteError);
      return {
        success: false,
        error: "リスト内の場所削除中にエラーが発生しました",
      };
    }

    // 5. リスト自体の削除
    const { error: deleteError } = await supabase
      .from("place_lists")
      .delete()
      .eq("id", listId)
      .eq("created_by", user.id);

    if (deleteError) {
      console.error("リスト削除エラー:", deleteError);
      return {
        success: false,
        error: "リストの削除中にエラーが発生しました",
      };
    }

    // キャッシュを更新
    revalidatePath("/lists");
    return {
      success: true,
    };
  } catch (error) {
    console.error("予期せぬエラー:", error);
    return {
      success: false,
      error: "リスト削除中に予期せぬエラーが発生しました",
    };
  }
}
