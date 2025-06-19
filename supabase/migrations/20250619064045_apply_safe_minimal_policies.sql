-- フェーズ1: 緊急対応 - 安全な最小限ポリシーの適用
-- 目的: 循環参照のない基本的なセキュリティ確保
-- 方針: 最小権限の原則、複雑な権限チェックはアプリケーション層に移譲

-- 1. shared_lists の安全なポリシー
-- 基本方針: ユーザーは自分に関連するレコードのみアクセス可能

CREATE POLICY "shared_lists_safe_select" ON shared_lists
FOR SELECT TO authenticated
USING (
  shared_with_user_id = auth.uid()  -- 自分が共有されているレコードのみ閲覧可能
);

CREATE POLICY "shared_lists_safe_insert" ON shared_lists
FOR INSERT TO authenticated
WITH CHECK (
  shared_with_user_id = auth.uid()  -- 自分のレコードのみ作成可能
);

CREATE POLICY "shared_lists_safe_update" ON shared_lists
FOR UPDATE TO authenticated
USING (shared_with_user_id = auth.uid())  -- 自分のレコードのみ更新可能
WITH CHECK (shared_with_user_id = auth.uid());

CREATE POLICY "shared_lists_safe_delete" ON shared_lists
FOR DELETE TO authenticated
USING (shared_with_user_id = auth.uid());  -- 自分のレコードのみ削除可能

-- 2. list_share_tokens の安全なポリシー
-- 基本方針: 所有者（created_by）のみ管理可能、一般ユーザーは参加時の検証のみ

CREATE POLICY "list_share_tokens_owner_manage" ON list_share_tokens
FOR ALL TO authenticated
USING (created_by = auth.uid())  -- 作成者のみ全操作可能
WITH CHECK (created_by = auth.uid());

-- トークン検証用の最小限アクセス（参加機能で必要）
CREATE POLICY "list_share_tokens_validation_access" ON list_share_tokens
FOR SELECT TO authenticated
USING (
  is_active = TRUE 
  AND (expires_at IS NULL OR expires_at > NOW())
  -- created_by制限なし（参加時のトークン検証で必要）
);


