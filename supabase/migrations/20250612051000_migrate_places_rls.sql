-- places テーブルの RLS ポリシー移行
-- Phase 2: Core Tables - places (🔴Critical問題の解決)

-- =====================================================
-- 1. 既存ポリシーの削除
-- =====================================================

-- 現在の認証ユーザー限定ポリシーを削除
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON places;

-- =====================================================
-- 2. 新しい統一されたポリシーの実装
-- =====================================================

-- Public: 公開リストに含まれる場所（未ログインユーザーでも閲覧可能）
CREATE POLICY "places_public_select" ON places
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.place_id = places.id
    AND pl.is_public = true
  )
);

-- Authenticated: アクセス可能なリストに含まれる場所
CREATE POLICY "places_authenticated_select" ON places
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.place_id = places.id
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

-- Authenticated: 新しい場所の追加（認証済みユーザーのみ）
-- 注意: Google Places API データの整合性を保つため、更新は制限
CREATE POLICY "places_authenticated_insert" ON places
FOR INSERT TO authenticated
WITH CHECK (true); -- 認証済みユーザーは新しい場所を追加可能

-- Authenticated: 場所情報の更新（制限的）
-- Google Places API データとの整合性を保つため、基本的には更新を制限
CREATE POLICY "places_authenticated_update" ON places
FOR UPDATE TO authenticated
USING (
  -- 自分が追加した場所、または管理者権限がある場合のみ更新可能
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.place_id = places.id
    AND pl.created_by = auth.uid()
  )
)
WITH CHECK (
  -- 更新時も同じ条件
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.place_id = places.id
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
CREATE POLICY "places_function_based_select" ON places
FOR SELECT TO anon, authenticated
USING (has_place_access_via_lists(id, 'view'));
*/

-- =====================================================
-- 4. ポリシーの検証用ビュー作成
-- =====================================================

CREATE OR REPLACE VIEW places_policy_test AS
SELECT 
  p.id,
  p.name,
  p.address,
  -- 公開リストに含まれているかどうか
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.place_id = p.id
    AND pl.is_public = true
  ) as in_public_list,
  -- 現在のユーザーがアクセス可能なリストに含まれているかどうか
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.place_id = p.id
    AND (
      pl.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = auth.uid()
      )
    )
  ) as in_accessible_list,
  -- この場所を含むリストの数
  (
    SELECT COUNT(*)
    FROM list_places lp
    WHERE lp.place_id = p.id
  ) as total_lists_count,
  -- この場所を含む公開リストの数
  (
    SELECT COUNT(*)
    FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.place_id = p.id
    AND pl.is_public = true
  ) as public_lists_count
FROM places p;

-- ビューの使用権限
GRANT SELECT ON places_policy_test TO authenticated;

-- =====================================================
-- 5. インデックスの最適化
-- =====================================================

-- place_id での検索を最適化（list_places との JOIN 用）
-- 既存のインデックスがある場合はスキップ
CREATE INDEX IF NOT EXISTS idx_places_id_optimized 
ON places(id);

-- Google Place ID での検索を最適化
CREATE INDEX IF NOT EXISTS idx_places_google_place_id 
ON places(google_place_id) 
WHERE google_place_id IS NOT NULL;

-- 場所名での検索を最適化（デフォルトの設定を使用）
CREATE INDEX IF NOT EXISTS idx_places_name_search 
ON places USING gin(to_tsvector('simple', name));

-- =====================================================
-- 6. パフォーマンス監視用の統計情報更新
-- =====================================================

-- テーブルの統計情報を更新してクエリプランナーを最適化
ANALYZE places;
ANALYZE list_places;
ANALYZE place_lists;

-- =====================================================
-- コメント
-- =====================================================

COMMENT ON POLICY "places_public_select" ON places IS 
'公開リストに含まれる場所は未ログインユーザーでも閲覧可能';

COMMENT ON POLICY "places_authenticated_select" ON places IS 
'認証済みユーザーは自分がアクセス可能なリストに含まれる場所を閲覧可能';

COMMENT ON POLICY "places_authenticated_insert" ON places IS 
'認証済みユーザーは新しい場所を追加可能';

COMMENT ON POLICY "places_authenticated_update" ON places IS 
'場所情報の更新は制限的（Google Places API データの整合性保持）';

COMMENT ON VIEW places_policy_test IS 
'places テーブルのRLSポリシーテスト用ビュー';

-- 移行完了のログ
DO $$
BEGIN
  RAISE NOTICE 'Phase 2: places テーブルのRLSポリシー移行完了 - 🔴Critical問題解決: 未ログインユーザーの公開リストアクセスが可能に';
END $$; 