-- list_place_commnts テーブルの RLS ポリシー移行
-- Phase 4: Detail Tables - list_place_commnts

-- =====================================================
-- 1. 既存ポリシーの削除
-- =====================================================

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Allow delete own comment" ON list_place_commnts;
DROP POLICY IF EXISTS "Allow insert for list editors" ON list_place_commnts;
DROP POLICY IF EXISTS "Allow read for list viewers" ON list_place_commnts;
DROP POLICY IF EXISTS "Allow update own comment" ON list_place_commnts;

-- =====================================================
-- 2. 新しい統一されたポリシーの実装
-- =====================================================

-- Public: 公開リストのコメント（未ログインユーザーでも閲覧可能）
CREATE POLICY "list_place_commnts_public_select" ON list_place_commnts
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_commnts.list_place_id
    AND pl.is_public = true
  )
);

-- Authenticated: アクセス可能なリストのコメント
CREATE POLICY "list_place_commnts_authenticated_select" ON list_place_commnts
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_commnts.list_place_id
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

-- Editor: コメントの追加（オーナーまたは編集権限者）
CREATE POLICY "list_place_commnts_editor_insert" ON list_place_commnts
FOR INSERT TO authenticated
WITH CHECK (
  -- user_id は自分のIDのみ設定可能
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_commnts.list_place_id
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

-- Self: 自分のコメントの更新
CREATE POLICY "list_place_commnts_self_update" ON list_place_commnts
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_commnts.list_place_id
    AND (
      pl.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  -- 更新時もuser_idは変更不可
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_commnts.list_place_id
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

-- Self: 自分のコメントの削除
CREATE POLICY "list_place_commnts_self_delete" ON list_place_commnts
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Owner: リストオーナーによるコメント削除（モデレーション）
CREATE POLICY "list_place_commnts_owner_delete" ON list_place_commnts
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_commnts.list_place_id
    AND pl.created_by = auth.uid()
  )
);

-- =====================================================
-- 3. セキュリティ関数を使用した代替ポリシー（将来の拡張用）
-- =====================================================

-- 注意: 現在は直接的なポリシーを使用していますが、
-- 将来的にはセキュリティ関数を使用したポリシーに移行可能

-- 例: セキュリティ関数を使用したポリシー（コメントアウト）
/*
CREATE POLICY "list_place_commnts_function_based_select" ON list_place_commnts
FOR SELECT TO anon, authenticated
USING (has_list_place_access(list_place_id, 'view'));

CREATE POLICY "list_place_commnts_function_based_insert" ON list_place_commnts
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND has_list_place_access(list_place_id, 'edit')
);
*/

-- =====================================================
-- 4. ポリシーの検証用ビュー作成
-- =====================================================

CREATE OR REPLACE VIEW list_place_commnts_policy_test AS
SELECT 
  lpc.id,
  lpc.list_place_id,
  lpc.user_id,
  lpc.comment,
  lpc.created_at,
  lpc.updated_at,
  lp.list_id,
  lp.place_id,
  pl.name as list_name,
  pl.is_public as list_is_public,
  pl.created_by as list_owner,
  -- 公開リストに含まれているかどうか
  pl.is_public as in_public_list,
  -- 現在のユーザーがコメント作成者かどうか
  (lpc.user_id = auth.uid()) as is_comment_author,
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
  -- コメント可能かどうか（総合判定）
  (
    pl.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM shared_lists sl
      WHERE sl.list_id = pl.id
      AND sl.shared_with_user_id = auth.uid()
      AND sl.permission = 'edit'
    )
  ) as can_comment,
  -- 編集可能かどうか（総合判定）
  (
    lpc.user_id = auth.uid()
  ) as can_edit_comment,
  -- 削除可能かどうか（総合判定）
  (
    lpc.user_id = auth.uid()
    OR pl.created_by = auth.uid()
  ) as can_delete_comment
FROM list_place_commnts lpc
JOIN list_places lp ON lpc.list_place_id = lp.id
JOIN place_lists pl ON lp.list_id = pl.id;

-- ビューの使用権限
GRANT SELECT ON list_place_commnts_policy_test TO authenticated;

-- =====================================================
-- 5. インデックスの最適化
-- =====================================================

-- list_place_id での検索を最適化（list_places との JOIN 用）
CREATE INDEX IF NOT EXISTS idx_list_place_commnts_list_place_id 
ON list_place_commnts(list_place_id);

-- user_id での検索を最適化
CREATE INDEX IF NOT EXISTS idx_list_place_commnts_user_id 
ON list_place_commnts(user_id);

-- 作成日時での検索を最適化（コメント一覧表示用）
CREATE INDEX IF NOT EXISTS idx_list_place_commnts_created_at 
ON list_place_commnts(created_at DESC);

-- 更新日時での検索を最適化
CREATE INDEX IF NOT EXISTS idx_list_place_commnts_updated_at 
ON list_place_commnts(updated_at DESC);

-- 複合インデックス（list_place_id + created_at の組み合わせ検索用）
CREATE INDEX IF NOT EXISTS idx_list_place_commnts_list_place_created_composite 
ON list_place_commnts(list_place_id, created_at DESC);

-- =====================================================
-- 6. パフォーマンス監視用の統計情報更新
-- =====================================================

-- テーブルの統計情報を更新してクエリプランナーを最適化
ANALYZE list_place_commnts;
ANALYZE list_places;
ANALYZE place_lists;

-- =====================================================
-- コメント
-- =====================================================

COMMENT ON POLICY "list_place_commnts_public_select" ON list_place_commnts IS 
'公開リストのコメントは未ログインユーザーでも閲覧可能';

COMMENT ON POLICY "list_place_commnts_authenticated_select" ON list_place_commnts IS 
'認証済みユーザーは自分がアクセス可能なリストのコメントを閲覧可能';

COMMENT ON POLICY "list_place_commnts_editor_insert" ON list_place_commnts IS 
'オーナーまたは編集権限を持つ共有ユーザーのみコメントを追加可能';

COMMENT ON POLICY "list_place_commnts_self_update" ON list_place_commnts IS 
'自分のコメントのみ更新可能';

COMMENT ON POLICY "list_place_commnts_self_delete" ON list_place_commnts IS 
'自分のコメントのみ削除可能';

COMMENT ON POLICY "list_place_commnts_owner_delete" ON list_place_commnts IS 
'リストオーナーはモデレーションとして任意のコメントを削除可能';

COMMENT ON VIEW list_place_commnts_policy_test IS 
'list_place_commnts テーブルのRLSポリシーテスト用ビュー';

-- 移行完了のログ
DO $$
BEGIN
  RAISE NOTICE 'Phase 4: list_place_commnts テーブルのRLSポリシー移行完了 - コメント権限とプライバシー設定を適切に実装';
END $$; 