-- place_lists テーブルの RLS ポリシー移行
-- Phase 2: Core Tables - place_lists

-- =====================================================
-- 1. 既存ポリシーの削除
-- =====================================================

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Allow individual delete access" ON place_lists;
DROP POLICY IF EXISTS "Allow individual insert access" ON place_lists;
DROP POLICY IF EXISTS "Enable read access for place_lists based on ownership, publicit" ON place_lists;
DROP POLICY IF EXISTS "Enable update access for place_lists based on ownership or shar" ON place_lists;

-- =====================================================
-- 2. 新しい統一されたポリシーの実装
-- =====================================================

-- Public: 公開リストの基本情報（未ログインユーザーでも閲覧可能）
CREATE POLICY "place_lists_public_select" ON place_lists
FOR SELECT TO anon, authenticated
USING (is_public = true);

-- Authenticated: オーナー・共有ユーザーのリスト
CREATE POLICY "place_lists_authenticated_select" ON place_lists
FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM shared_lists
    WHERE list_id = place_lists.id
    AND shared_with_user_id = auth.uid()
  )
);

-- Owner: リストの作成（認証済みユーザーのみ）
CREATE POLICY "place_lists_owner_insert" ON place_lists
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

-- Owner: リストの更新（オーナーまたは編集権限者）
CREATE POLICY "place_lists_editor_update" ON place_lists
FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM shared_lists
    WHERE list_id = place_lists.id
    AND shared_with_user_id = auth.uid()
    AND permission = 'edit'
  )
)
WITH CHECK (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM shared_lists
    WHERE list_id = place_lists.id
    AND shared_with_user_id = auth.uid()
    AND permission = 'edit'
  )
);

-- Owner: リストの削除（オーナーのみ）
CREATE POLICY "place_lists_owner_delete" ON place_lists
FOR DELETE TO authenticated
USING (created_by = auth.uid());

-- =====================================================
-- 3. セキュリティ関数を使用した代替ポリシー（将来の拡張用）
-- =====================================================

-- 注意: 現在は直接的なポリシーを使用していますが、
-- 将来的にはセキュリティ関数を使用したポリシーに移行可能

-- 例: セキュリティ関数を使用したポリシー（コメントアウト）
/*
CREATE POLICY "place_lists_function_based_select" ON place_lists
FOR SELECT TO anon, authenticated
USING (has_list_access(id, 'view'));

CREATE POLICY "place_lists_function_based_update" ON place_lists
FOR UPDATE TO authenticated
USING (has_list_access(id, 'edit'))
WITH CHECK (has_list_access(id, 'edit'));
*/

-- =====================================================
-- 4. ポリシーの検証用ビュー作成
-- =====================================================

CREATE OR REPLACE VIEW place_lists_policy_test AS
SELECT 
  pl.id,
  pl.name,
  pl.is_public,
  pl.created_by,
  -- 公開リストかどうか
  pl.is_public as is_public_list,
  -- 現在のユーザーがオーナーかどうか
  (pl.created_by = auth.uid()) as is_owner,
  -- 共有されているかどうか
  EXISTS (
    SELECT 1 FROM shared_lists sl
    WHERE sl.list_id = pl.id
    AND sl.shared_with_user_id = auth.uid()
  ) as is_shared,
  -- 編集権限があるかどうか
  EXISTS (
    SELECT 1 FROM shared_lists sl
    WHERE sl.list_id = pl.id
    AND sl.shared_with_user_id = auth.uid()
    AND sl.permission = 'edit'
  ) as has_edit_permission
FROM place_lists pl;

-- ビューの使用権限
GRANT SELECT ON place_lists_policy_test TO authenticated;

-- =====================================================
-- 5. インデックスの最適化
-- =====================================================

-- 公開リスト用のインデックス（既存の場合はスキップ）
CREATE INDEX IF NOT EXISTS idx_place_lists_public_optimized 
ON place_lists(is_public, created_at DESC) 
WHERE is_public = true;

-- オーナー検索用のインデックス（既存の場合はスキップ）
CREATE INDEX IF NOT EXISTS idx_place_lists_created_by_optimized 
ON place_lists(created_by, created_at DESC);

-- =====================================================
-- コメント
-- =====================================================

COMMENT ON POLICY "place_lists_public_select" ON place_lists IS 
'公開リストは未ログインユーザーでも閲覧可能';

COMMENT ON POLICY "place_lists_authenticated_select" ON place_lists IS 
'認証済みユーザーは自分のリストと共有されたリストを閲覧可能';

COMMENT ON POLICY "place_lists_owner_insert" ON place_lists IS 
'認証済みユーザーのみリスト作成可能、created_byは自分のIDのみ';

COMMENT ON POLICY "place_lists_editor_update" ON place_lists IS 
'オーナーまたは編集権限を持つ共有ユーザーのみ更新可能';

COMMENT ON POLICY "place_lists_owner_delete" ON place_lists IS 
'リストの削除はオーナーのみ可能';

COMMENT ON VIEW place_lists_policy_test IS 
'place_lists テーブルのRLSポリシーテスト用ビュー';

-- 移行完了のログ
DO $$
BEGIN
  RAISE NOTICE 'Phase 2: place_lists テーブルのRLSポリシー移行完了 - 統一された命名規則とアクセス制御を適用';
END $$; 