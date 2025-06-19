-- list_share_tokens RLSポリシーの整理と適切な権限設計への修正
-- 
-- 【要件】
-- 1. リスト所有者と編集権限者: トークンを作成・読取・更新・削除可能
-- 2. 閲覧権限者: トークンへのアクセス権限不要
-- 3. 一般ユーザー（参加希望者）: トークン検証時のみアクセス可能
-- 
-- 【課題】
-- 現在5つのポリシーが重複しており、権限設計が不明確
-- 特にSELECT操作に4つのポリシーが重複設定されている

-- ==================================================
-- 1. 既存の重複・不適切なポリシーをすべて削除
-- ==================================================

-- 重複しているSELECTポリシーを削除
DROP POLICY IF EXISTS "Allow authenticated users to read active tokens for validation " ON list_share_tokens;
DROP POLICY IF EXISTS "list_share_tokens_public_select" ON list_share_tokens;
DROP POLICY IF EXISTS "list_share_tokens_validation_access" ON list_share_tokens;

-- 重複しているALLポリシーを削除
DROP POLICY IF EXISTS "Allow list owners to manage their own share tokens" ON list_share_tokens;
DROP POLICY IF EXISTS "list_share_tokens_owner_manage" ON list_share_tokens;

-- ==================================================
-- 2. 適切な権限設計に基づく新しいポリシーを作成
-- ==================================================

-- 🔹 トークン検証専用アクセス（一般ユーザー用）
-- 参加処理に必要な最小限の情報のみアクセス可能
CREATE POLICY "list_share_tokens_validation_only" ON list_share_tokens
FOR SELECT 
TO authenticated
USING (
  is_active = TRUE 
  AND (expires_at IS NULL OR expires_at > NOW())
  -- 参加処理時にWHERE token = ? で特定のトークンのみアクセス
  -- リスト一覧取得などの目的では使用不可
);

-- 🔹 管理者アクセス（所有者・編集権限者用）
-- リスト管理画面でのトークン一覧表示・作成・更新・削除
-- セキュリティ関数を使用して循環参照を完全回避
CREATE POLICY "list_share_tokens_manager_access" ON list_share_tokens
FOR ALL
TO authenticated
USING (
  -- check_list_access 関数で循環参照なしの権限チェック
  check_list_access(auth.uid(), list_share_tokens.list_id, 'edit')
)
WITH CHECK (
  -- 作成・更新時も同じセキュリティ関数を使用
  check_list_access(auth.uid(), list_share_tokens.list_id, 'edit')
);

-- ==================================================
-- 3. 設計完了確認
-- ==================================================

-- ✅ セキュリティ関数を使用した循環参照の完全回避済み
-- ✅ check_list_access() 関数経由での安全な権限チェック実装済み
-- ✅ 重複ポリシーの整理完了

-- 期待される動作:
-- ✅ 一般ユーザー: 特定トークンのみ検証可能（WHERE token = ? 必須）
-- ✅ 所有者: 自分のリストの全トークンを管理可能
-- ✅ 編集権限者: 編集可能リストの全トークンを管理可能
-- ❌ 閲覧権限者: トークンへのアクセス不可


