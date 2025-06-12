-- list_place_rankings テーブルの RLS ポリシー移行
-- Phase 4: Detail Tables - list_place_rankings

-- =====================================================
-- 1. 既存ポリシーの削除
-- =====================================================

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Allow full access for list owners and editors" ON list_place_rankings;
DROP POLICY IF EXISTS "Allow read access based on list access" ON list_place_rankings;

-- =====================================================
-- 2. 新しい統一されたポリシーの実装
-- =====================================================

-- Public: 公開リストのランキング（未ログインユーザーでも閲覧可能）
CREATE POLICY "list_place_rankings_public_select" ON list_place_rankings
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_place_rankings.list_id
    AND pl.is_public = true
  )
);

-- Authenticated: アクセス可能なリストのランキング
CREATE POLICY "list_place_rankings_authenticated_select" ON list_place_rankings
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_place_rankings.list_id
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

-- Editor: ランキングの追加（オーナーまたは編集権限者）
CREATE POLICY "list_place_rankings_editor_insert" ON list_place_rankings
FOR INSERT TO authenticated
WITH CHECK (
  -- created_by は自分のIDのみ設定可能
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_place_rankings.list_id
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

-- Editor: ランキングの更新（オーナーまたは編集権限者、または自分が作成したランキング）
CREATE POLICY "list_place_rankings_editor_update" ON list_place_rankings
FOR UPDATE TO authenticated
USING (
  -- 自分が作成したランキング、またはリストの編集権限がある場合
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_place_rankings.list_id
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
  -- 更新時も同じ条件、ただしcreated_byは変更不可
  (created_by = auth.uid() OR created_by IS NULL)
  AND EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_place_rankings.list_id
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

-- Editor: ランキングの削除（オーナーまたは編集権限者、または自分が作成したランキング）
CREATE POLICY "list_place_rankings_editor_delete" ON list_place_rankings
FOR DELETE TO authenticated
USING (
  -- 自分が作成したランキング、またはリストの編集権限がある場合
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_place_rankings.list_id
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
CREATE POLICY "list_place_rankings_function_based_select" ON list_place_rankings
FOR SELECT TO anon, authenticated
USING (has_list_access(list_id, 'view'));

CREATE POLICY "list_place_rankings_function_based_edit" ON list_place_rankings
FOR ALL TO authenticated
USING (
  created_by = auth.uid() 
  OR has_list_access(list_id, 'edit')
)
WITH CHECK (
  created_by = auth.uid() 
  AND has_list_access(list_id, 'edit')
);
*/

-- =====================================================
-- 4. ポリシーの検証用ビュー作成
-- =====================================================

CREATE OR REPLACE VIEW list_place_rankings_policy_test AS
SELECT 
  lpr.id,
  lpr.list_id,
  lpr.place_id,
  lpr.rank,
  lpr.comment,
  lpr.created_by,
  lpr.created_at,
  pl.name as list_name,
  pl.is_public as list_is_public,
  pl.created_by as list_owner,
  -- 公開リストに含まれているかどうか
  pl.is_public as in_public_list,
  -- 現在のユーザーがランキング作成者かどうか
  (lpr.created_by = auth.uid()) as is_ranking_creator,
  -- 現在のユーザーがリストオーナーかどうか
  (pl.created_by = auth.uid()) as is_list_owner,
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
    lpr.created_by = auth.uid()
    OR pl.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM shared_lists sl
      WHERE sl.list_id = pl.id
      AND sl.shared_with_user_id = auth.uid()
      AND sl.permission = 'edit'
    )
  ) as can_edit
FROM list_place_rankings lpr
JOIN place_lists pl ON lpr.list_id = pl.id;

-- ビューの使用権限
GRANT SELECT ON list_place_rankings_policy_test TO authenticated;

-- =====================================================
-- 5. インデックスの最適化
-- =====================================================

-- list_id での検索を最適化（place_lists との JOIN 用）
CREATE INDEX IF NOT EXISTS idx_list_place_rankings_list_id 
ON list_place_rankings(list_id);

-- place_id での検索を最適化
CREATE INDEX IF NOT EXISTS idx_list_place_rankings_place_id 
ON list_place_rankings(place_id);

-- created_by での検索を最適化
CREATE INDEX IF NOT EXISTS idx_list_place_rankings_created_by 
ON list_place_rankings(created_by);

-- rank での検索を最適化（ランキング順での取得用）
CREATE INDEX IF NOT EXISTS idx_list_place_rankings_rank 
ON list_place_rankings(list_id, rank);

-- 作成日時での検索を最適化
CREATE INDEX IF NOT EXISTS idx_list_place_rankings_created_at 
ON list_place_rankings(created_at DESC);

-- 複合インデックス（list_id + place_id の組み合わせ検索用）
CREATE INDEX IF NOT EXISTS idx_list_place_rankings_list_place_composite 
ON list_place_rankings(list_id, place_id);

-- =====================================================
-- 6. パフォーマンス監視用の統計情報更新
-- =====================================================

-- テーブルの統計情報を更新してクエリプランナーを最適化
ANALYZE list_place_rankings;
ANALYZE place_lists;
ANALYZE shared_lists;

-- =====================================================
-- コメント
-- =====================================================

COMMENT ON POLICY "list_place_rankings_public_select" ON list_place_rankings IS 
'公開リストのランキングは未ログインユーザーでも閲覧可能';

COMMENT ON POLICY "list_place_rankings_authenticated_select" ON list_place_rankings IS 
'認証済みユーザーは自分がアクセス可能なリストのランキングを閲覧可能';

COMMENT ON POLICY "list_place_rankings_editor_insert" ON list_place_rankings IS 
'オーナーまたは編集権限を持つ共有ユーザーのみランキングを追加可能';

COMMENT ON POLICY "list_place_rankings_editor_update" ON list_place_rankings IS 
'ランキング作成者またはリスト編集権限者のみランキングを更新可能';

COMMENT ON POLICY "list_place_rankings_editor_delete" ON list_place_rankings IS 
'ランキング作成者またはリスト編集権限者のみランキングを削除可能';

COMMENT ON VIEW list_place_rankings_policy_test IS 
'list_place_rankings テーブルのRLSポリシーテスト用ビュー';

-- 移行完了のログ
DO $$
BEGIN
  RAISE NOTICE 'Phase 4: list_place_rankings テーブルのRLSポリシー移行完了 - auth.uid()依存問題を修正し、統一されたポリシーを適用';
END $$; 