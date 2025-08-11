/**
 * フェーズ1: 緊急対応 - アプリケーション層権限チェック
 * 目的: RLSの循環参照を回避し、アプリケーション層で権限制御を実装
 */

import { createClient } from "@/lib/supabase/server";

export type Permission = "view" | "edit" | "manage";

/**
 * リストに対する権限をチェックする
 * 循環参照を避けるため、段階的にクエリを実行
 */
export async function hasListPermission(
  listId: string,
  userId: string,
  requiredPermission: Permission
): Promise<boolean> {
  if (!listId || !userId) return false;

  const supabase = await createClient();

  try {
    // 1. 所有者チェック（最高権限）
    const { data: list, error: listError } = await supabase
      .from("place_lists")
      .select("created_by")
      .eq("id", listId)
      .single();

    if (listError && listError.code !== "PGRST116") {
      console.error("権限チェックエラー:", listError);
      return false;
    }

    if (list?.created_by === userId) return true;

    // 2. 共有権限チェック
    const { data: shared, error: sharedError } = await supabase
      .from("shared_lists")
      .select("permission")
      .eq("list_id", listId)
      .eq("shared_with_user_id", userId)
      .single();

    if (sharedError && sharedError.code !== "PGRST116") {
      console.error("共有権限チェックエラー:", sharedError);
      return false;
    }

    if (!shared) return false;

    // 3. 権限レベルチェック
    return checkPermissionLevel(shared.permission, requiredPermission);
  } catch (error) {
    console.error("権限チェック中のエラー:", error);
    return false;
  }
}

/**
 * 権限レベルの包含関係をチェック
 */
function checkPermissionLevel(
  userPermission: string,
  requiredPermission: Permission
): boolean {
  const permissionHierarchy = {
    view: ["view"],
    edit: ["view", "edit"],
    manage: ["view", "edit"], // 編集権限者は管理も可能
  };

  return (
    permissionHierarchy[userPermission as Permission]?.includes(
      requiredPermission
    ) ?? false
  );
}

/**
 * 共有リンクの管理権限をチェック
 * 編集権限者以上が共有リンクを管理可能
 */
export async function canManageShareLinks(
  listId: string,
  userId: string
): Promise<boolean> {
  return hasListPermission(listId, userId, "edit");
}

/**
 * トークン経由でのリスト参加が可能かチェック
 * 循環参照を避けるため、直接的なクエリのみ使用
 */
export async function canJoinViaToken(
  token: string,
  userId: string
): Promise<{
  canJoin: boolean;
  listId?: string;
  permission?: string;
  error?: string;
}> {
  if (!token || !userId) {
    return { canJoin: false, error: "errors.validation.invalidInput" };
  }

  const supabase = await createClient();

  try {
    // 1. トークンの有効性をチェック（循環参照なし）
    const { data: tokenData, error: tokenError } = await supabase
      .from("list_share_tokens")
      .select(
        "list_id, default_permission, is_active, expires_at, max_uses, current_uses"
      )
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      return { canJoin: false, error: "errors.validation.invalidToken" };
    }

    // 2. トークンの状態をチェック
    if (!tokenData.is_active) {
      return { canJoin: false, error: "errors.common.forbidden" };
    }

    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return { canJoin: false, error: "errors.common.linkExpired" };
    }

    if (
      tokenData.max_uses &&
      tokenData.max_uses > 0 &&
      tokenData.current_uses >= tokenData.max_uses
    ) {
      return {
        canJoin: false,
        error: "errors.common.limitReached",
      };
    }

    // 3. 既に参加済みかチェック
    const { data: existingShare, error: shareError } = await supabase
      .from("shared_lists")
      .select("permission")
      .eq("list_id", tokenData.list_id)
      .eq("shared_with_user_id", userId)
      .single();

    if (shareError && shareError.code !== "PGRST116") {
      return { canJoin: false, error: "errors.unexpected.common" };
    }

    if (existingShare) {
      return {
        canJoin: false,
        error: "errors.common.forbidden",
        listId: tokenData.list_id,
        permission: existingShare.permission,
      };
    }

    return {
      canJoin: true,
      listId: tokenData.list_id,
      permission: tokenData.default_permission,
    };
  } catch (error) {
    console.error("予期しないエラー:", error);
    return { canJoin: false, error: "errors.unexpected.common" };
  }
}

/**
 * リストが存在し、ユーザーがアクセス可能かチェック
 * 公開リストと共有リストの両方をサポート
 */
export async function canAccessList(
  listId: string,
  userId?: string
): Promise<{
  canAccess: boolean;
  permission: Permission | null;
}> {
  if (!listId) {
    return {
      canAccess: false,
      permission: null,
    };
  }

  const supabase = await createClient();

  try {
    // まず shared_lists から権限チェック（ユーザーが認証済みの場合）
    if (userId) {
      const { data: shared } = await supabase
        .from("shared_lists")
        .select("permission, list_id")
        .eq("list_id", listId)
        .eq("shared_with_user_id", userId)
        .single();

      // 共有リストとしてアクセス権がある場合は即座に許可
      if (shared) {
        return {
          canAccess: true,
          permission: shared.permission as Permission,
        };
      }
    }

    // リスト基本情報取得（公開リストまたは所有者チェック用）
    const { data: list, error: listError } = await supabase
      .from("place_lists")
      .select("created_by, is_public")
      .eq("id", listId)
      .single();

    if (listError || !list) {
      // ユーザーが認証済みで shared_lists からもアクセスできない場合は権限なし
      if (userId) {
        return {
          canAccess: false,
          permission: null,
        };
      }

      return {
        canAccess: false,
        permission: null,
      };
    }
    const isPublic = list.is_public === true;

    // パブリックリストの場合は誰でもアクセス可能
    if (isPublic) {
      let permission: Permission = "view";

      if (userId) {
        if (list.created_by === userId) {
          permission = "manage";
        } else {
          // 共有権限チェック
          const { data: shared } = await supabase
            .from("shared_lists")
            .select("permission")
            .eq("list_id", listId)
            .eq("shared_with_user_id", userId)
            .single();

          if (shared?.permission === "edit") {
            permission = "edit";
          }
        }
      }

      return { canAccess: true, permission };
    }

    // プライベートリストの場合は権限チェックが必要
    if (!userId) {
      return {
        canAccess: false,
        permission: null,
      };
    }

    // 所有者チェック
    if (list.created_by === userId) {
      return { canAccess: true, permission: "manage" };
    }

    // ここまで来た場合は、認証済みユーザーだが所有者でも共有ユーザーでもない
    // （共有権限チェックは関数冒頭で実施済み）
    return {
      canAccess: false,
      permission: null,
    };
  } catch (error) {
    console.error("アクセス権限チェック中のエラー:", error);
    return {
      canAccess: false,
      permission: null,
    };
  }
}
