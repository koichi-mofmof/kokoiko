-- 共有メンバー管理画面でオーナーが共有情報を閲覧できない問題を修正
-- 
-- 【問題分析】
-- 1. shared_listsテーブルに重複するSELECTポリシーが3つ存在
-- 2. 現在のポリシーは共有されたユーザー自身のみアクセス可能
-- 3. リストオーナーが共有メンバー一覧を確認できない
-- 4. place_lists参照による循環参照リスクを避ける必要がある
-- 
-- 【解決策】
-- 1. 重複ポリシーを統合
-- 2. セキュリティ関数check_list_accessを活用（循環参照回避）
-- 3. アプリケーション層での権限チェック強化

-- ステップ1: 重複するSELECTポリシーを削除
DROP POLICY IF EXISTS "shared_lists_collaborator_select" ON shared_lists;
DROP POLICY IF EXISTS "shared_lists_owner_safe_select" ON shared_lists;
-- shared_lists_safe_selectは残す

-- ステップ2: 統合されたSELECTポリシーを作成（セキュリティ関数使用）
DROP POLICY IF EXISTS "shared_lists_safe_select" ON shared_lists;

CREATE POLICY "shared_lists_unified_select" ON shared_lists
FOR SELECT TO authenticated
USING (
  -- 共有されたユーザー自身、または編集権限以上でリストにアクセス可能なユーザー
  shared_with_user_id = auth.uid()
  OR check_list_access(list_id, auth.uid(), 'edit')
);

-- ステップ3: DELETEポリシーも重複削除
DROP POLICY IF EXISTS "shared_lists_collaborator_delete" ON shared_lists;
-- shared_lists_safe_deleteは残す

-- 修正後のポリシー構成コメント
-- 
-- SELECT: shared_lists_unified_select
--   - 共有されたユーザー自身
--   - リストへの編集権限を持つユーザー（オーナー含む）
-- 
-- INSERT: shared_lists_safe_insert（変更なし）
--   - 自分のレコードのみ作成可能
-- 
-- UPDATE: shared_lists_safe_update（変更なし）
--   - 自分のレコードのみ更新可能
-- 
-- DELETE: shared_lists_safe_delete（変更なし）
--   - 自分のレコードのみ削除可能
-- 
-- 【循環参照回避】
-- check_list_access関数は既に修正済みで循環参照を起こさない
-- （place_lists -> shared_lists の参照なし）
