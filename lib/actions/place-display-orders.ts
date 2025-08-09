"use server";

import { createClient } from "@/lib/supabase/server";
import { getListDetails } from "@/lib/dal/lists";
import { hasListPermission } from "@/lib/utils/permission-check";

// 表示順序のデータ型
export interface DisplayOrderedPlace {
  placeId: string;
  displayOrder: number;
}

// 表示順序更新のためのAPI
export async function updateDisplayOrders({
  listId,
  displayOrders,
}: {
  listId: string;
  displayOrders: Array<{ placeId: string; displayOrder: number }>;
}): Promise<{ success?: true; error?: string; errorKey?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      errorKey: "errors.common.unauthorized",
      error: "認証エラー: ログインが必要です",
    };
  }

  // 権限チェック
  const hasEditPermission = await hasListPermission(listId, user.id, "edit");

  if (!hasEditPermission) {
    return {
      errorKey: "errors.common.listNotFoundOrNoPermission",
      error: "リストが見つからないか、編集権限がありません",
    };
  }

  // 競合を避けるための安全な更新処理
  try {
    // 方法1: 削除してから再挿入（最も確実な方法）
    const { error: deleteError } = await supabase
      .from("list_place_display_order")
      .delete()
      .eq("list_id", listId);

    if (deleteError) {
      console.warn("Failed to delete existing orders:", deleteError);
    }

    // 新しい順序でインサート
    const inserts = displayOrders.map(({ placeId, displayOrder }) => ({
      list_id: listId,
      place_id: placeId,
      display_order: displayOrder,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("list_place_display_order")
      .insert(inserts);

    if (insertError) {
      return {
        errorKey: "errors.common.insertFailed",
        error: insertError.message,
      };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Error in updateDisplayOrders:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update display orders";
    return { errorKey: "errors.common.updateFailed", error: errorMessage };
  }
}

// 表示順序を含むリストデータ取得
export async function getListWithDisplayOrders(
  listId: string,
  userId?: string
) {
  const supabase = await createClient();

  // リスト詳細と表示順序を同時取得
  const [listResult, displayOrdersResult] = await Promise.all([
    getListDetails(listId, userId),
    supabase
      .from("list_place_display_order")
      .select("place_id, display_order")
      .eq("list_id", listId)
      .order("display_order", { ascending: true }),
  ]);

  if (listResult && displayOrdersResult.data) {
    return {
      ...listResult,
      displayOrders: displayOrdersResult.data.map((d) => ({
        placeId: d.place_id,
        displayOrder: d.display_order,
      })),
    };
  }

  return listResult;
}

// 特定リストの表示順序のみ取得
export async function getDisplayOrdersForList(listId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("list_place_display_order")
    .select("place_id, display_order")
    .eq("list_id", listId)
    .order("display_order", { ascending: true });

  if (error) {
    return { errorKey: "errors.common.fetchFailed", error: error.message };
  }

  return {
    success: true,
    displayOrders:
      data?.map((d) => ({
        placeId: d.place_id,
        displayOrder: d.display_order,
      })) || [],
  };
}

// 表示順序の正規化（順序番号の連番化）
export async function normalizeDisplayOrders(listId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      errorKey: "errors.common.unauthorized",
      error: "認証エラー: ログインが必要です",
    };
  }

  // 権限チェック
  const hasEditPermission = await hasListPermission(listId, user.id, "edit");

  if (!hasEditPermission) {
    return {
      errorKey: "errors.common.listNotFoundOrNoPermission",
      error: "リストが見つからないか、編集権限がありません",
    };
  }

  // 現在の表示順序を取得
  const { data: currentOrders, error: fetchError } = await supabase
    .from("list_place_display_order")
    .select("id, place_id, display_order")
    .eq("list_id", listId)
    .order("display_order", { ascending: true });

  if (fetchError) {
    return { errorKey: "errors.common.fetchFailed", error: fetchError.message };
  }

  if (!currentOrders || currentOrders.length === 0) {
    return { success: true }; // 何もすることがない
  }

  // 連番に正規化
  const normalizedUpdates = currentOrders.map((order, index) => ({
    id: order.id,
    display_order: index + 1,
    updated_at: new Date().toISOString(),
  }));

  const { error: updateError } = await supabase
    .from("list_place_display_order")
    .upsert(normalizedUpdates);

  if (updateError) {
    return {
      errorKey: "errors.common.updateFailed",
      error: updateError.message,
    };
  }

  return { success: true };
}
