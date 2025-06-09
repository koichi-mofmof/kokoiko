"use server";

import { SUBSCRIPTION_LIMITS } from "@/lib/constants/config/subscription";
import { createClient } from "@/lib/supabase/server";
import { getSharedListCount } from "@/lib/utils/subscription-utils";
import { createListSchema, updateListSchema } from "@/lib/validators/list";
import { nanoid } from "nanoid";
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

// 共有リンクトークン検証アクション
export async function verifyShareToken(token: string) {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return {
      success: false,
      reason: "トークンが指定されていません。",
    };
  }

  const supabase = await createClient();

  // list_share_tokens テーブルからトークン情報を取得
  const { data: tokenData, error: tokenError } = await supabase
    .from("list_share_tokens")
    .select(
      "id, list_id, default_permission, is_active, expires_at, max_uses, current_uses, list_name, owner_name, owner_id"
    )
    .eq("token", token)
    .single();

  if (tokenError || !tokenData) {
    return {
      success: false,
      reason:
        "共有リンクが削除された可能性がありますので、リストの所有者にご確認ください。",
    };
  }

  if (!tokenData.is_active) {
    return {
      success: false,
      reason:
        "この共有リンクは無効化されています。リストの所有者にご確認ください。",
    };
  }

  if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
    return {
      success: false,
      reason: "この共有リンクの有効期限が切れています。",
    };
  }

  if (
    typeof tokenData.max_uses === "number" &&
    typeof tokenData.current_uses === "number" &&
    tokenData.max_uses > 0 &&
    tokenData.current_uses >= tokenData.max_uses
  ) {
    return {
      success: false,
      reason: "この共有リンクは利用上限に達しています。",
    };
  }

  // list_share_tokensのlist_name, owner_name, ownerIdを返す
  return {
    success: true,
    listId: tokenData.list_id,
    permission: tokenData.default_permission,
    expiresAt: tokenData.expires_at,
    maxUses: tokenData.max_uses,
    currentUses: tokenData.current_uses,
    listName: tokenData.list_name || "",
    ownerName: tokenData.owner_name || "",
    ownerId: tokenData.owner_id || "",
  };
}

// 共有リンク経由でリストに参加するアクション
export async function joinListViaShareLink(
  token: string,
  userId: string,
  ownerId: string
) {
  console.log("joinListViaShareLink", token, userId, ownerId);
  if (!token || !userId || !ownerId) {
    return {
      success: false,
      error: "トークン、ユーザーID、またはオーナーIDが指定されていません。",
    };
  }

  const supabase = await createClient();

  // 1. トークンの有効性を再検証
  const verifyResult = await verifyShareToken(token);
  if (!verifyResult.success) {
    return {
      success: false,
      error: verifyResult.reason || "トークンが無効です。",
    };
  }
  const { listId, permission } = verifyResult;

  // 2. shared_listsに参加ユーザーを登録（既存なら権限をupdate）
  const { data: existing } = await supabase
    .from("shared_lists")
    .select("id, permission")
    .eq("list_id", listId)
    .eq("shared_with_user_id", userId)
    .single();

  if (existing) {
    // 既存レコードがある場合は権限をupdate
    const { error: updateError } = await supabase
      .from("shared_lists")
      .update({ permission })
      .eq("id", existing.id);
    if (updateError) {
      return { success: false, error: "参加処理中にエラーが発生しました。" };
    }
  } else {
    // 新規参加
    const { error: insertError } = await supabase.from("shared_lists").insert({
      list_id: listId,
      shared_with_user_id: userId,
      permission,
      owner_id: ownerId,
    });
    if (insertError) {
      return { success: false, error: "参加処理中にエラーが発生しました。" };
    }
  }

  // 3. list_share_tokensのcurrent_usesをインクリメント
  const { error: updateTokenError } = await supabase
    .from("list_share_tokens")
    .update({ current_uses: supabase.rpc("increment", { x: 1 }) })
    .eq("token", token);
  // 上記はPostgresのincrement関数が必要。なければcurrent_uses+1でupdateする実装に修正可。
  if (updateTokenError) {
    return {
      success: false,
      error: "利用回数の更新中にエラーが発生しました。",
    };
  }

  return { success: true, listId, permission };
}

// 指定リストの共有リンク一覧を取得
export async function fetchShareLinksForList(listId: string) {
  if (!listId) {
    return { success: false, error: "リストIDが指定されていません。" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("list_share_tokens")
    .select(
      "id, token, default_permission, is_active, expires_at, max_uses, current_uses, created_at"
    )
    .eq("list_id", listId)
    .order("created_at", { ascending: false });
  if (error) {
    return { success: false, error: "共有リンク一覧の取得に失敗しました。" };
  }
  return { success: true, links: data };
}

// 共有リンク発行アクション
export async function createShareLink({
  listId,
  permission,
  expiresAt,
  maxUses,
}: {
  listId: string;
  permission: "view" | "edit";
  expiresAt?: string | null;
  maxUses?: number | null;
}) {
  if (!listId || !permission) {
    return { success: false, error: "リストIDと権限は必須です。" };
  }
  const supabase = await createClient();
  // ユーザー認証
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "認証エラー: ログインが必要です" };
  }
  // オーナーまたは編集権限者か検証
  const { data: listData, error: listError } = await supabase
    .from("place_lists")
    .select("created_by, name")
    .eq("id", listId)
    .single();
  if (listError || !listData) {
    return { success: false, error: "リスト情報の取得に失敗しました。" };
  }
  let isAllowed = false;
  if (listData.created_by === user.id) {
    isAllowed = true;
  } else {
    const { data: shared } = await supabase
      .from("shared_lists")
      .select("permission")
      .eq("list_id", listId)
      .eq("shared_with_user_id", user.id)
      .single();
    if (shared && shared.permission === "edit") isAllowed = true;
  }
  if (!isAllowed) {
    return { success: false, error: "この操作を行う権限がありません。" };
  }
  // 作成者名を取得
  let ownerName = "";
  if (listData.created_by) {
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", listData.created_by)
      .single();
    if (ownerProfile && ownerProfile.display_name) {
      ownerName = ownerProfile.display_name;
    }
  }
  // フリープランの共有リスト数上限チェック
  // サブスクリプション情報取得
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .order("current_period_end", { ascending: false })
    .limit(1)
    .single();
  const isPremium =
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing");
  if (!isPremium) {
    // 共通ユーティリティで判定
    const { count: sharedCount, sharedListNames } = await getSharedListCount(
      supabase,
      user.id,
      listId
    );
    if (sharedCount >= SUBSCRIPTION_LIMITS.free.MAX_SHARED_LISTS) {
      return {
        success: false,
        error: `フリープランでは共有できるリストは${
          SUBSCRIPTION_LIMITS.free.MAX_SHARED_LISTS
        }件までです。\n\n現在共有中のリスト: ${sharedListNames.join(
          ", "
        )}\n\nプレミアムプランにアップグレードすると、無制限に共有できます。`,
        upgradeRecommended: true,
        sharedListNames,
      };
    }
  }
  // 共有リンク発行
  const token = nanoid(24);
  const { data, error } = await supabase
    .from("list_share_tokens")
    .insert({
      list_id: listId,
      default_permission: permission,
      token,
      expires_at: expiresAt || null,
      max_uses: typeof maxUses === "number" ? maxUses : null,
      is_active: true,
      list_name: listData.name || null,
      owner_name: ownerName || null,
      owner_id: listData.created_by,
    })
    .select()
    .single();
  if (error || !data) {
    console.error(error);
    return { success: false, error: "共有リンクの発行に失敗しました。" };
  }
  // 発行したリンクURLも返す
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const shareUrl = `${baseUrl}/lists/join?token=${token}`;
  return { success: true, link: data, shareUrl };
}

// 共有リンク削除アクション
export async function deleteShareLink(id: string) {
  if (!id) {
    return { success: false, error: "共有リンクIDが指定されていません。" };
  }
  const supabase = await createClient();
  // ユーザー認証
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "認証エラー: ログインが必要です" };
  }
  // リンク情報取得
  const { data: link, error: linkError } = await supabase
    .from("list_share_tokens")
    .select("id, list_id")
    .eq("id", id)
    .single();
  if (linkError || !link) {
    return { success: false, error: "リンク情報の取得に失敗しました。" };
  }
  // オーナーまたは編集権限者か検証
  const { data: listData, error: listError } = await supabase
    .from("place_lists")
    .select("created_by")
    .eq("id", link.list_id)
    .single();
  if (listError || !listData) {
    return { success: false, error: "リスト情報の取得に失敗しました。" };
  }
  let isAllowed = false;
  if (listData.created_by === user.id) {
    isAllowed = true;
  } else {
    const { data: shared } = await supabase
      .from("shared_lists")
      .select("permission")
      .eq("list_id", link.list_id)
      .eq("shared_with_user_id", user.id)
      .single();
    if (shared && shared.permission === "edit") isAllowed = true;
  }
  if (!isAllowed) {
    return { success: false, error: "この操作を行う権限がありません。" };
  }
  // 削除
  const { error: delError } = await supabase
    .from("list_share_tokens")
    .delete()
    .eq("id", id);
  if (delError) {
    return { success: false, error: "共有リンクの削除に失敗しました。" };
  }
  return { success: true };
}

// 共有リンク編集アクション
export async function updateShareLink({
  id,
  default_permission,
  is_active,
}: {
  id: string;
  default_permission: "view" | "edit";
  is_active: boolean;
}) {
  if (!id) {
    return { success: false, error: "共有リンクIDが指定されていません。" };
  }
  const supabase = await createClient();
  // ユーザー認証
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "認証エラー: ログインが必要です" };
  }
  // リンク情報取得
  const { data: link, error: linkError } = await supabase
    .from("list_share_tokens")
    .select("id, list_id")
    .eq("id", id)
    .single();
  if (linkError || !link) {
    return { success: false, error: "リンク情報の取得に失敗しました。" };
  }
  // オーナーまたは編集権限者か検証
  const { data: listData, error: listError } = await supabase
    .from("place_lists")
    .select("created_by")
    .eq("id", link.list_id)
    .single();
  if (listError || !listData) {
    return { success: false, error: "リスト情報の取得に失敗しました。" };
  }
  let isAllowed = false;
  if (listData.created_by === user.id) {
    isAllowed = true;
  } else {
    const { data: shared } = await supabase
      .from("shared_lists")
      .select("permission")
      .eq("list_id", link.list_id)
      .eq("shared_with_user_id", user.id)
      .single();
    if (shared && shared.permission === "edit") isAllowed = true;
  }
  if (!isAllowed) {
    return { success: false, error: "この操作を行う権限がありません。" };
  }
  // 更新
  const { error: updError } = await supabase
    .from("list_share_tokens")
    .update({ default_permission, is_active })
    .eq("id", id);
  if (updError) {
    return { success: false, error: "共有リンクの更新に失敗しました。" };
  }
  return { success: true };
}

// 共有メンバー権限変更アクション
export async function updateCollaboratorPermissionOnSharedList({
  listId,
  targetUserId,
  newPermission,
}: {
  listId: string;
  targetUserId: string;
  newPermission: "view" | "edit";
}) {
  if (!listId || !targetUserId || !newPermission) {
    return { success: false, error: "必要なパラメータが不足しています。" };
  }
  const supabase = await createClient();
  // ユーザー認証
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "認証エラー: ログインが必要です" };
  }
  // オーナーまたは編集権限者か検証
  const { data: listData, error: listError } = await supabase
    .from("place_lists")
    .select("created_by")
    .eq("id", listId)
    .single();
  if (listError || !listData) {
    return { success: false, error: "リスト情報の取得に失敗しました。" };
  }
  let isAllowed = false;
  if (listData.created_by === user.id) {
    isAllowed = true;
  } else {
    const { data: shared } = await supabase
      .from("shared_lists")
      .select("permission")
      .eq("list_id", listId)
      .eq("shared_with_user_id", user.id)
      .single();
    if (shared && shared.permission === "edit") isAllowed = true;
  }
  if (!isAllowed) {
    return { success: false, error: "この操作を行う権限がありません。" };
  }
  // オーナー自身の権限は変更不可
  if (listData.created_by === targetUserId) {
    return { success: false, error: "オーナーの権限は変更できません。" };
  }
  // 更新
  const { error: updError } = await supabase
    .from("shared_lists")
    .update({ permission: newPermission })
    .eq("list_id", listId)
    .eq("shared_with_user_id", targetUserId);
  if (updError) {
    return { success: false, error: "権限変更に失敗しました。" };
  }
  return { success: true };
}

// 共有メンバー解除アクション
export async function removeCollaboratorFromSharedList({
  listId,
  targetUserId,
}: {
  listId: string;
  targetUserId: string;
}) {
  if (!listId || !targetUserId) {
    return { success: false, error: "必要なパラメータが不足しています。" };
  }
  const supabase = await createClient();
  // ユーザー認証
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "認証エラー: ログインが必要です" };
  }
  // オーナーまたは編集権限者か検証
  const { data: listData, error: listError } = await supabase
    .from("place_lists")
    .select("created_by")
    .eq("id", listId)
    .single();
  if (listError || !listData) {
    return { success: false, error: "リスト情報の取得に失敗しました。" };
  }
  let isAllowed = false;
  if (listData.created_by === user.id) {
    isAllowed = true;
  } else {
    const { data: shared } = await supabase
      .from("shared_lists")
      .select("permission")
      .eq("list_id", listId)
      .eq("shared_with_user_id", user.id)
      .single();
    if (shared && shared.permission === "edit") isAllowed = true;
  }
  if (!isAllowed) {
    return { success: false, error: "この操作を行う権限がありません。" };
  }
  // オーナー自身は解除不可
  if (listData.created_by === targetUserId) {
    return { success: false, error: "オーナーは共有解除できません。" };
  }
  // 削除
  const { error: delError } = await supabase
    .from("shared_lists")
    .delete()
    .eq("list_id", listId)
    .eq("shared_with_user_id", targetUserId);
  if (delError) {
    return { success: false, error: "共有解除に失敗しました。" };
  }
  return { success: true };
}
