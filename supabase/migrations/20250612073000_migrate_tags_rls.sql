-- tags テーブルの RLS ポリシー移行
-- Phase 4: Detail Tables - tags

-- =====================================================
-- 1. 既存ポリシーの削除
-- =====================================================

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Allow individual delete access" ON tags;
DROP POLICY IF EXISTS "Allow individual insert access" ON tags;
DROP POLICY IF EXISTS "Allow individual update access" ON tags;
DROP POLICY IF EXISTS "Allow read access to tags in accessible lists" ON tags;

-- =====================================================
-- 2. 新しい統一されたポリシーの実装
-- =====================================================

-- Public: 公開リストで使用されているタグ（未ログインユーザーでも閲覧可能）
CREATE POLICY "tags_public_select" ON tags
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_place_tags lpt
    JOIN list_places lp ON lpt.list_place_id = lp.id
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lpt.tag_id = tags.id
    AND pl.is_public = true
  )
);

-- Authenticated: 自分のタグまたはアクセス可能なリストで使用されているタグ
CREATE POLICY "tags_authenticated_select" ON tags
FOR SELECT TO authenticated
USING (
  -- 自分が作成したタグ
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM list_place_tags lpt
    JOIN list_places lp ON lpt.list_place_id = lp.id
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lpt.tag_id = tags.id
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

-- Self: 自分のタグの作成
CREATE POLICY "tags_self_insert" ON tags
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Self: 自分のタグの更新
CREATE POLICY "tags_self_update" ON tags
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Self: 自分のタグの削除
CREATE POLICY "tags_self_delete" ON tags
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- 3. セキュリティ関数を使用した代替ポリシー（将来の拡張用）
-- =====================================================

-- 注意: 現在は直接的なポリシーを使用していますが、
-- 将来的にはセキュリティ関数を使用したポリシーに移行可能

-- 例: セキュリティ関数を使用したポリシー（コメントアウト）
/*
CREATE POLICY "tags_function_based_select" ON tags
FOR SELECT TO anon, authenticated
USING (
  is_own_data(user_id)
  OR EXISTS (
    SELECT 1 FROM list_place_tags lpt
    WHERE lpt.tag_id = tags.id
    AND has_list_place_access(lpt.list_place_id, 'view')
  )
);

CREATE POLICY "tags_function_based_self" ON tags
FOR ALL TO authenticated
USING (is_own_data(user_id))
WITH CHECK (is_own_data(user_id));
*/

-- =====================================================
-- 4. ポリシーの検証用ビュー作成
-- =====================================================

CREATE OR REPLACE VIEW tags_policy_test AS
SELECT 
  t.id,
  t.name,
  t.user_id,
  t.created_at,
  -- 現在のユーザーがタグオーナーかどうか
  (t.user_id = auth.uid()) as is_tag_owner,
  -- 公開リストで使用されているかどうか
  EXISTS (
    SELECT 1 FROM list_place_tags lpt
    JOIN list_places lp ON lpt.list_place_id = lp.id
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lpt.tag_id = t.id
    AND pl.is_public = true
  ) as used_in_public_list,
  -- アクセス可能なリストで使用されているかどうか
  EXISTS (
    SELECT 1 FROM list_place_tags lpt
    JOIN list_places lp ON lpt.list_place_id = lp.id
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lpt.tag_id = t.id
    AND (
      pl.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = auth.uid()
      )
    )
  ) as used_in_accessible_list,
  -- このタグが使用されているリストの数
  (
    SELECT COUNT(DISTINCT pl.id)
    FROM list_place_tags lpt
    JOIN list_places lp ON lpt.list_place_id = lp.id
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lpt.tag_id = t.id
  ) as total_lists_count,
  -- このタグが使用されている公開リストの数
  (
    SELECT COUNT(DISTINCT pl.id)
    FROM list_place_tags lpt
    JOIN list_places lp ON lpt.list_place_id = lp.id
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lpt.tag_id = t.id
    AND pl.is_public = true
  ) as public_lists_count,
  -- アクセス可能かどうか（総合判定）
  (
    t.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM list_place_tags lpt
      JOIN list_places lp ON lpt.list_place_id = lp.id
      JOIN place_lists pl ON lp.list_id = pl.id
      WHERE lpt.tag_id = t.id
      AND (
        pl.is_public = true
        OR pl.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM shared_lists sl
          WHERE sl.list_id = pl.id
          AND sl.shared_with_user_id = auth.uid()
        )
      )
    )
  ) as has_access,
  -- 編集可能かどうか（総合判定）
  (
    t.user_id = auth.uid()
  ) as can_edit
FROM tags t;

-- ビューの使用権限
GRANT SELECT ON tags_policy_test TO authenticated;

-- =====================================================
-- 5. インデックスの最適化
-- =====================================================

-- user_id での検索を最適化（自分のタグ検索用）
CREATE INDEX IF NOT EXISTS idx_tags_user_id 
ON tags(user_id);

-- name での検索を最適化（タグ名検索用）
CREATE INDEX IF NOT EXISTS idx_tags_name 
ON tags(name);

-- 作成日時での検索を最適化
CREATE INDEX IF NOT EXISTS idx_tags_created_at 
ON tags(created_at DESC);

-- 複合インデックス（user_id + name の組み合わせ検索用、重複防止にも有効）
CREATE INDEX IF NOT EXISTS idx_tags_user_name_composite 
ON tags(user_id, name);

-- 複合インデックス（user_id + created_at の組み合わせ検索用）
CREATE INDEX IF NOT EXISTS idx_tags_user_created_composite 
ON tags(user_id, created_at DESC);

-- =====================================================
-- 6. パフォーマンス監視用の統計情報更新
-- =====================================================

-- テーブルの統計情報を更新してクエリプランナーを最適化
ANALYZE tags;
ANALYZE list_place_tags;
ANALYZE list_places;
ANALYZE place_lists;

-- =====================================================
-- 7. タグの重複チェック用制約（オプション）
-- =====================================================

-- 同一ユーザーが同じ名前のタグを複数作成することを防ぐ制約
-- 注意: 既存データに重複がある場合はエラーになる可能性があります
DO $$
BEGIN
  -- 重複チェック
  IF EXISTS (
    SELECT user_id, name, COUNT(*)
    FROM tags
    GROUP BY user_id, name
    HAVING COUNT(*) > 1
  ) THEN
    RAISE WARNING 'Duplicate tags found for same user. Unique constraint not created.';
  ELSE
    -- 重複がない場合のみ制約を作成
    ALTER TABLE tags ADD CONSTRAINT unique_user_tag_name UNIQUE (user_id, name);
    RAISE NOTICE 'Unique constraint created for user_id + name combination';
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE 'Unique constraint already exists';
  WHEN others THEN
    RAISE WARNING 'Could not create unique constraint: %', SQLERRM;
END $$;

-- =====================================================
-- コメント
-- =====================================================

COMMENT ON POLICY "tags_public_select" ON tags IS 
'公開リストで使用されているタグは未ログインユーザーでも閲覧可能';

COMMENT ON POLICY "tags_authenticated_select" ON tags IS 
'認証済みユーザーは自分のタグまたはアクセス可能なリストで使用されているタグを閲覧可能';

COMMENT ON POLICY "tags_self_insert" ON tags IS 
'認証済みユーザーは自分のタグのみ作成可能';

COMMENT ON POLICY "tags_self_update" ON tags IS 
'自分のタグのみ更新可能';

COMMENT ON POLICY "tags_self_delete" ON tags IS 
'自分のタグのみ削除可能';

COMMENT ON VIEW tags_policy_test IS 
'tags テーブルのRLSポリシーテスト用ビュー';

-- 移行完了のログ
DO $$
BEGIN
  RAISE NOTICE 'Phase 4: tags テーブルのRLSポリシー移行完了 - 複雑な条件分岐を簡素化し、ユーザー固有タグの権限設定を適切に実装';
END $$; 