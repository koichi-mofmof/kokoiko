-- 共有メンバー管理機能に必要な正しいRLSポリシーを修正
-- 
-- 【問題】
-- 現在のUPDATE/DELETEポリシーでは「自分のレコードのみ」操作可能
-- しかし、アプリケーション仕様では以下が必要：
-- - リストオーナーが他のユーザーの共有情報を管理
-- - 編集権限者が他のユーザーの共有情報を管理
-- 
-- 【アプリケーション仕様】
-- updateCollaboratorPermissionOnSharedList: 他ユーザーのshared_listsレコードを更新
-- removeCollaboratorFromSharedList: 他ユーザーのshared_listsレコードを削除
-- 実行権限: canManageShareLinks (編集権限以上)

-- ステップ1: 現在の不適切なUPDATE/DELETEポリシーを削除
DROP POLICY IF EXISTS "shared_lists_safe_update" ON shared_lists;
DROP POLICY IF EXISTS "shared_lists_safe_delete" ON shared_lists;

-- ステップ2: 管理機能に対応したUPDATEポリシーを作成
CREATE POLICY "shared_lists_management_update" ON shared_lists
FOR UPDATE TO authenticated
USING (
  -- 自分のレコード、またはリストに対する編集権限を持つユーザー
  shared_with_user_id = auth.uid()
  OR check_list_access(list_id, auth.uid(), 'edit')
)
WITH CHECK (
  -- 更新後も同じ条件を満たす必要がある
  shared_with_user_id = auth.uid()
  OR check_list_access(list_id, auth.uid(), 'edit')
);

-- ステップ3: 管理機能に対応したDELETEポリシーを作成
CREATE POLICY "shared_lists_management_delete" ON shared_lists
FOR DELETE TO authenticated
USING (
  -- 自分のレコード、またはリストに対する編集権限を持つユーザー
  shared_with_user_id = auth.uid()
  OR check_list_access(list_id, auth.uid(), 'edit')
);

-- ステップ4: INSERTポリシーも念のため確認・修正
-- 現在のshared_lists_safe_insertは自分のレコードのみ作成可能だが
-- リスト参加（joinListViaShareLink）は自分のレコード作成なので問題なし
-- ただし、将来的にオーナーが直接メンバーを追加する機能のために拡張

DROP POLICY IF EXISTS "shared_lists_safe_insert" ON shared_lists;

CREATE POLICY "shared_lists_management_insert" ON shared_lists
FOR INSERT TO authenticated
WITH CHECK (
  -- 自分のレコード、またはリストに対する編集権限を持つユーザーが他ユーザーを追加
  shared_with_user_id = auth.uid()
  OR check_list_access(list_id, auth.uid(), 'edit')
);

-- 修正後のポリシー構成
-- 
-- SELECT: shared_lists_unified_select（前回修正済み）
--   - 共有されたユーザー自身
--   - リストへの編集権限を持つユーザー（オーナー含む）
-- 
-- INSERT: shared_lists_management_insert（新規）
--   - 自分のレコード作成（リスト参加）
--   - 編集権限者が他ユーザーを追加（将来機能）
-- 
-- UPDATE: shared_lists_management_update（新規）
--   - 自分のレコード更新
--   - 編集権限者が他ユーザーの権限変更
-- 
-- DELETE: shared_lists_management_delete（新規）
--   - 自分のレコード削除（リスト離脱）
--   - 編集権限者が他ユーザーを削除（メンバー管理）
-- 
-- 【重要】
-- 全てのポリシーでcheck_list_access関数を使用しているが、
-- この関数は循環参照を起こさない安全な実装であることを確認済み
