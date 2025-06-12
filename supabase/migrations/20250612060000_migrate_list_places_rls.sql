-- list_places テーブルの RLS ポリシー移行
-- Phase 3: Relationship Tables - list_places

-- =====================================================
-- 1. 既存ポリシーの削除
-- =====================================================

-- 既存の複雑で重複したポリシーをすべて削除
DROP POLICY IF EXISTS "Allow delete access for list owners or editors" ON list_places;
DROP POLICY IF EXISTS "Allow individual read access to list_places via list ownership" ON list_places;
DROP POLICY IF EXISTS "Allow individual read access to list_places via shared list" ON list_places;
DROP POLICY IF EXISTS "Allow insert access for list owners or editors" ON list_places;
DROP POLICY IF EXISTS "Allow public read access to list_places via public list" ON list_places;
DROP POLICY IF EXISTS "Allow update access for list owners or editors" ON list_places;

-- =====================================================
-- 2. 新しい統一されたポリシーの実装
-- =====================================================

-- Public: 公開リストの場所（未ログインユーザーでも閲覧可能）
CREATE POLICY "list_places_public_select" ON list_places
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_places.list_id
    AND pl.is_public = true
  )
);

-- Authenticated: アクセス可能なリストの場所
CREATE POLICY "list_places_authenticated_select" ON list_places
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_places.list_id
    AND (
      pl.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = auth.uid()
      )
    )
  )
);

-- Editor: 場所の追加（オーナーまたは編集権限者）
CREATE POLICY "list_places_editor_insert" ON list_places
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_places.list_id
    AND (
      pl.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = auth.uid()
        AND sl.permission = 'edit'
      )
    )
  )
);

-- Editor: 場所の更新（オーナーまたは編集権限者）
CREATE POLICY "list_places_editor_update" ON list_places
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_places.list_id
    AND (
      pl.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = auth.uid()
        AND sl.permission = 'edit'
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_places.list_id
    AND (
      pl.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = auth.uid()
        AND sl.permission = 'edit'
      )
    )
  )
);

-- Editor: 場所の削除（オーナーまたは編集権限者）
CREATE POLICY "list_places_editor_delete" ON list_places
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_places.list_id
    AND (
      pl.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = auth.uid()
        AND sl.permission = 'edit'
      )
    )
  )
);

-- =====================================================
-- 3. セキュリティ関数を使用した代替ポリシー（将来の拡張用）
-- =====================================================

-- 注意: 現在は直接的なポリシーを使用していますが、
-- 将来的にはセキュリティ関数を使用したポリシーに移行可能

-- 例: セキュリティ関数を使用したポリシー（コメントアウト）
/*
CREATE POLICY "list_places_function_based_select" ON list_places
FOR SELECT TO anon, authenticated
USING (has_list_place_access(id, 'view'));

CREATE POLICY "list_places_function_based_edit" ON list_places
FOR ALL TO authenticated
USING (has_list_place_access(id, 'edit'))
WITH CHECK (has_list_place_access(id, 'edit'));
*/

-- =====================================================
-- 4. ポリシーの検証用ビュー作成
-- =====================================================

CREATE OR REPLACE VIEW list_places_policy_test AS
SELECT 
  lp.id,
  lp.list_id,
  lp.place_id,
  lp.visited_status,
  pl.name as list_name,
  pl.is_public as list_is_public,
  pl.created_by as list_owner,
  p.name as place_name,
  -- 公開リストに含まれているかどうか
  pl.is_public as in_public_list,
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
  ) as has_edit_permission,
  -- アクセス可能かどうか（総合判定）
  (
    pl.is_public = true
    OR pl.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM shared_lists sl
      WHERE sl.list_id = pl.id
      AND sl.shared_with_user_id = auth.uid()
    )
  ) as has_access
FROM list_places lp
JOIN place_lists pl ON lp.list_id = pl.id
JOIN places p ON lp.place_id = p.id;

-- ビューの使用権限
GRANT SELECT ON list_places_policy_test TO authenticated;

-- =====================================================
-- 5. インデックスの最適化
-- =====================================================

-- list_id での検索を最適化（place_lists との JOIN 用）
CREATE INDEX IF NOT EXISTS idx_list_places_list_id_optimized 
ON list_places(list_id);

-- place_id での検索を最適化（places との JOIN 用）
CREATE INDEX IF NOT EXISTS idx_list_places_place_id_optimized 
ON list_places(place_id);

-- 複合インデックス（list_id + place_id の組み合わせ検索用）
CREATE INDEX IF NOT EXISTS idx_list_places_list_place_composite 
ON list_places(list_id, place_id);

-- visited_status での検索を最適化
CREATE INDEX IF NOT EXISTS idx_list_places_visited_status 
ON list_places(visited_status);

-- 作成日時での検索を最適化
CREATE INDEX IF NOT EXISTS idx_list_places_created_at 
ON list_places(created_at DESC);

-- =====================================================
-- 6. パフォーマンス監視用の統計情報更新
-- =====================================================

-- テーブルの統計情報を更新してクエリプランナーを最適化
ANALYZE list_places;
ANALYZE place_lists;
ANALYZE shared_lists;

-- =====================================================
-- コメント
-- =====================================================

COMMENT ON POLICY "list_places_public_select" ON list_places IS 
'公開リストの場所は未ログインユーザーでも閲覧可能';

COMMENT ON POLICY "list_places_authenticated_select" ON list_places IS 
'認証済みユーザーは自分がアクセス可能なリストの場所を閲覧可能';

COMMENT ON POLICY "list_places_editor_insert" ON list_places IS 
'オーナーまたは編集権限を持つ共有ユーザーのみ場所を追加可能';

COMMENT ON POLICY "list_places_editor_update" ON list_places IS 
'オーナーまたは編集権限を持つ共有ユーザーのみ場所を更新可能';

COMMENT ON POLICY "list_places_editor_delete" ON list_places IS 
'オーナーまたは編集権限を持つ共有ユーザーのみ場所を削除可能';

COMMENT ON VIEW list_places_policy_test IS 
'list_places テーブルのRLSポリシーテスト用ビュー';

-- 移行完了のログ
DO $$
BEGIN
  RAISE NOTICE 'Phase 3: list_places テーブルのRLSポリシー移行完了 - 6つの複雑なポリシーを5つの統一されたポリシーに整理';
END $$; 