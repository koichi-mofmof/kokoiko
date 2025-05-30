"use server";

import { createClient } from "@/lib/supabase/server";
import { createListSchema, updateListSchema } from "@/lib/validators/list";
import { revalidatePath } from "next/cache";

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
    // RPCでリストの作成
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "create_place_list",
      {
        p_name: name,
        p_description: description,
        p_is_public: isPublic,
        p_created_by: user.id,
      }
    );

    if (rpcError || !rpcData) {
      console.error("リスト作成エラー(RPC):", rpcError);
      return {
        success: false,
        error: "リストの作成中にエラーが発生しました",
      };
    }

    // キャッシュを更新してリスト一覧ページにリダイレクト
    revalidatePath("/lists");
    return {
      success: true,
      listId: rpcData.id || rpcData,
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
    // RPCでリストの更新
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "update_place_list",
      {
        p_id: id,
        p_name: name,
        p_description: description || null,
        p_is_public: isPublic,
        p_user_id: user.id,
      }
    );

    if (rpcError) {
      console.error("リスト更新エラー(RPC):", rpcError);
      return {
        success: false,
        error: `リストの更新中にエラーが発生しました: ${
          rpcError.message || "不明なエラー"
        }`,
      };
    }

    // キャッシュを更新
    revalidatePath("/lists");
    return {
      success: true,
      list: {
        id: rpcData.id,
        name: rpcData.name,
      },
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
    // RPCでリスト削除
    const { error: rpcError } = await supabase.rpc("delete_place_list", {
      p_id: listId,
      p_user_id: user.id,
    });

    if (rpcError) {
      console.error("リスト削除エラー(RPC):", rpcError);
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
