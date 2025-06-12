-- list_place_tags テーブルの RLS ポリシー移行
-- Phase 4: Detail Tables - list_place_tags

-- =====================================================
-- 1. 既存ポリシーの削除
-- =====================================================

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Allow full access for list owners and editors" ON list_place_tags;
DROP POLICY IF EXISTS "Allow read access based on list access" ON list_place_tags;

-- =====================================================
-- 2. 新しい統一されたポリシーの実装
-- =====================================================

-- Public: 公開リストのタグ（未ログインユーザーでも閲覧可能）
CREATE POLICY "list_place_tags_public_select" ON list_place_tags
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_tags.list_place_id
    AND pl.is_public = true
  )
);

-- Authenticated: アクセス可能なリストのタグ
CREATE POLICY "list_place_tags_authenticated_select" ON list_place_tags
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_tags.list_place_id
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

-- Editor: タグの追加（オーナーまたは編集権限者）
CREATE POLICY "list_place_tags_editor_insert" ON list_place_tags
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_tags.list_place_id
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
  -- タグが存在し、かつアクセス可能であることを確認
  AND EXISTS (
    SELECT 1 FROM tags t
    WHERE t.id = list_place_tags.tag_id
    AND (
      t.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM list_place_tags lpt2
        JOIN list_places lp2 ON lpt2.list_place_id = lp2.id
        JOIN place_lists pl2 ON lp2.list_id = pl2.id
        WHERE lpt2.tag_id = t.id
        AND (
          pl2.is_public = true
          OR pl2.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM shared_lists sl2
            WHERE sl2.list_id = pl2.id
            AND sl2.shared_with_user_id = auth.uid()
          )
        )
      )
    )
  )
);

-- Editor: タグの削除（オーナーまたは編集権限者）
CREATE POLICY "list_place_tags_editor_delete" ON list_place_tags
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_tags.list_place_id
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
CREATE POLICY "list_place_tags_function_based_select" ON list_place_tags
FOR SELECT TO anon, authenticated
USING (has_list_place_access(list_place_id, 'view'));

CREATE POLICY "list_place_tags_function_based_edit" ON list_place_tags
FOR ALL TO authenticated
USING (has_list_place_access(list_place_id, 'edit'))
WITH CHECK (has_list_place_access(list_place_id, 'edit'));
*/

-- =====================================================
-- 4. ポリシーの検証用ビュー作成
-- =====================================================

CREATE OR REPLACE VIEW list_place_tags_policy_test AS
SELECT 
  lpt.list_place_id,
  lpt.tag_id,
  lpt.assigned_at,
  lp.list_id,
  lp.place_id,
  pl.name as list_name,
  pl.is_public as list_is_public,
  pl.created_by as list_owner,
  t.name as tag_name,
  t.user_id as tag_owner,
  -- 公開リストに含まれているかどうか
  pl.is_public as in_public_list,
  -- 現在のユーザーがリストオーナーかどうか
  (pl.created_by = auth.uid()) as is_list_owner,
  -- 現在のユーザーがタグオーナーかどうか
  (t.user_id = auth.uid()) as is_tag_owner,
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
  ) as has_access,
  -- 編集可能かどうか（総合判定）
  (
    pl.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM shared_lists sl
      WHERE sl.list_id = pl.id
      AND sl.shared_with_user_id = auth.uid()
      AND sl.permission = 'edit'
    )
  ) as can_edit
FROM list_place_tags lpt
JOIN list_places lp ON lpt.list_place_id = lp.id
JOIN place_lists pl ON lp.list_id = pl.id
JOIN tags t ON lpt.tag_id = t.id;

-- ビューの使用権限
GRANT SELECT ON list_place_tags_policy_test TO authenticated;

-- =====================================================
-- 5. インデックスの最適化
-- =====================================================

-- list_place_id での検索を最適化（list_places との JOIN 用）
CREATE INDEX IF NOT EXISTS idx_list_place_tags_list_place_id 
ON list_place_tags(list_place_id);

-- tag_id での検索を最適化（tags との JOIN 用）
CREATE INDEX IF NOT EXISTS idx_list_place_tags_tag_id 
ON list_place_tags(tag_id);

-- 複合インデックス（list_place_id + tag_id の組み合わせ検索用）
CREATE INDEX IF NOT EXISTS idx_list_place_tags_list_place_tag_composite 
ON list_place_tags(list_place_id, tag_id);

-- 作成日時での検索を最適化
CREATE INDEX IF NOT EXISTS idx_list_place_tags_assigned_at 
ON list_place_tags(assigned_at DESC);

-- =====================================================
-- 6. パフォーマンス監視用の統計情報更新
-- =====================================================

-- テーブルの統計情報を更新してクエリプランナーを最適化
ANALYZE list_place_tags;
ANALYZE list_places;
ANALYZE place_lists;
ANALYZE tags;

-- =====================================================
-- コメント
-- =====================================================

COMMENT ON POLICY "list_place_tags_public_select" ON list_place_tags IS 
'公開リストのタグは未ログインユーザーでも閲覧可能';

COMMENT ON POLICY "list_place_tags_authenticated_select" ON list_place_tags IS 
'認証済みユーザーは自分がアクセス可能なリストのタグを閲覧可能';

COMMENT ON POLICY "list_place_tags_editor_insert" ON list_place_tags IS 
'オーナーまたは編集権限を持つ共有ユーザーのみタグを追加可能';

COMMENT ON POLICY "list_place_tags_editor_delete" ON list_place_tags IS 
'オーナーまたは編集権限を持つ共有ユーザーのみタグを削除可能';

COMMENT ON VIEW list_place_tags_policy_test IS 
'list_place_tags テーブルのRLSポリシーテスト用ビュー';

-- 移行完了のログ
DO $$
BEGIN
  RAISE NOTICE 'Phase 4: list_place_tags テーブルのRLSポリシー移行完了 - 複雑なJOIN処理を最適化し、統一されたポリシーを適用';
END $$; 