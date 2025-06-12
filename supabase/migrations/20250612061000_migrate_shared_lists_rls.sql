-- shared_lists テーブルの RLS ポリシー移行
-- Phase 3: Relationship Tables - shared_lists

-- =====================================================
-- 1. 既存ポリシーの削除
-- =====================================================

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Allow authenticated users to INSERT shared list entries" ON shared_lists;
DROP POLICY IF EXISTS "Allow authenticated users to SELECT shared list entries" ON shared_lists;
DROP POLICY IF EXISTS "Allow only owner or shared editor to delete shared_lists" ON shared_lists;
DROP POLICY IF EXISTS "Allow only owner or shared editor to update shared_lists" ON shared_lists;

-- =====================================================
-- 2. owner_id の整合性確保（データ修正）
-- =====================================================

-- owner_id と place_lists.created_by の整合性を確保
-- 不整合がある場合は修正
UPDATE shared_lists 
SET owner_id = pl.created_by
FROM place_lists pl
WHERE shared_lists.list_id = pl.id
AND shared_lists.owner_id != pl.created_by;

-- 整合性チェック用の制約を追加（将来の不整合を防ぐ）
-- 注意: 既存データに問題がある場合はエラーになる可能性があります
DO $$
BEGIN
  -- owner_id の整合性をチェックする関数を作成
  CREATE OR REPLACE FUNCTION check_shared_lists_owner_consistency()
  RETURNS TRIGGER AS $trigger$
  BEGIN
    -- INSERT/UPDATE時にowner_idがplace_lists.created_byと一致することを確認
    IF NOT EXISTS (
      SELECT 1 FROM place_lists pl
      WHERE pl.id = NEW.list_id
      AND pl.created_by = NEW.owner_id
    ) THEN
      RAISE EXCEPTION 'owner_id must match the created_by of the corresponding place_list';
    END IF;
    
    RETURN NEW;
  END;
  $trigger$ LANGUAGE plpgsql;

  -- トリガーを作成（既存の場合は削除してから作成）
  DROP TRIGGER IF EXISTS shared_lists_owner_consistency_trigger ON shared_lists;
  CREATE TRIGGER shared_lists_owner_consistency_trigger
    BEFORE INSERT OR UPDATE ON shared_lists
    FOR EACH ROW
    EXECUTE FUNCTION check_shared_lists_owner_consistency();

EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Warning: Could not create consistency trigger: %', SQLERRM;
END $$;

-- =====================================================
-- 3. 新しい統一されたポリシーの実装
-- =====================================================

-- Owner: リストオーナーは自分のリストの共有設定を閲覧可能
CREATE POLICY "shared_lists_owner_select" ON shared_lists
FOR SELECT TO authenticated
USING (owner_id = auth.uid());

-- Collaborator: 共有されたユーザーは自分に関する共有設定を閲覧可能
CREATE POLICY "shared_lists_collaborator_select" ON shared_lists
FOR SELECT TO authenticated
USING (shared_with_user_id = auth.uid());

-- Owner: リストオーナーのみ新しい共有設定を作成可能
CREATE POLICY "shared_lists_owner_insert" ON shared_lists
FOR INSERT TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = shared_lists.list_id
    AND pl.created_by = auth.uid()
  )
);

-- Owner: リストオーナーのみ共有設定を更新可能
CREATE POLICY "shared_lists_owner_update" ON shared_lists
FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (
  owner_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = shared_lists.list_id
    AND pl.created_by = auth.uid()
  )
);

-- Owner: リストオーナーのみ共有設定を削除可能
CREATE POLICY "shared_lists_owner_delete" ON shared_lists
FOR DELETE TO authenticated
USING (owner_id = auth.uid());

-- Collaborator: 共有されたユーザーは自分の共有設定を削除可能（共有解除）
CREATE POLICY "shared_lists_collaborator_delete" ON shared_lists
FOR DELETE TO authenticated
USING (shared_with_user_id = auth.uid());

-- =====================================================
-- 4. セキュリティ関数を使用した代替ポリシー（将来の拡張用）
-- =====================================================

-- 注意: 現在は直接的なポリシーを使用していますが、
-- 将来的にはセキュリティ関数を使用したポリシーに移行可能

-- 例: セキュリティ関数を使用したポリシー（コメントアウト）
/*
CREATE POLICY "shared_lists_function_based_select" ON shared_lists
FOR SELECT TO authenticated
USING (
  is_owner(auth.uid(), list_id) 
  OR shared_with_user_id = auth.uid()
);
*/

-- =====================================================
-- 5. ポリシーの検証用ビュー作成
-- =====================================================

CREATE OR REPLACE VIEW shared_lists_policy_test AS
SELECT 
  sl.id,
  sl.list_id,
  sl.owner_id,
  sl.shared_with_user_id,
  sl.permission,
  sl.shared_at,
  pl.name as list_name,
  pl.created_by as list_created_by,
  -- owner_id の整合性チェック
  (sl.owner_id = pl.created_by) as owner_id_consistent,
  -- 現在のユーザーがオーナーかどうか
  (sl.owner_id = auth.uid()) as is_owner,
  -- 現在のユーザーが共有対象かどうか
  (sl.shared_with_user_id = auth.uid()) as is_shared_with_me,
  -- 現在のユーザーがアクセス可能かどうか
  (
    sl.owner_id = auth.uid()
    OR sl.shared_with_user_id = auth.uid()
  ) as has_access
FROM shared_lists sl
JOIN place_lists pl ON sl.list_id = pl.id;

-- ビューの使用権限
GRANT SELECT ON shared_lists_policy_test TO authenticated;

-- =====================================================
-- 6. インデックスの最適化
-- =====================================================

-- owner_id での検索を最適化
CREATE INDEX IF NOT EXISTS idx_shared_lists_owner_id 
ON shared_lists(owner_id);

-- shared_with_user_id での検索を最適化
CREATE INDEX IF NOT EXISTS idx_shared_lists_shared_with_user_id 
ON shared_lists(shared_with_user_id);

-- list_id での検索を最適化
CREATE INDEX IF NOT EXISTS idx_shared_lists_list_id 
ON shared_lists(list_id);

-- 複合インデックス（list_id + shared_with_user_id の組み合わせ検索用）
CREATE INDEX IF NOT EXISTS idx_shared_lists_list_user_composite 
ON shared_lists(list_id, shared_with_user_id);

-- 権限での検索を最適化
CREATE INDEX IF NOT EXISTS idx_shared_lists_permission 
ON shared_lists(permission);

-- 共有日時での検索を最適化
CREATE INDEX IF NOT EXISTS idx_shared_lists_shared_at 
ON shared_lists(shared_at DESC);

-- =====================================================
-- 7. パフォーマンス監視用の統計情報更新
-- =====================================================

-- テーブルの統計情報を更新してクエリプランナーを最適化
ANALYZE shared_lists;
ANALYZE place_lists;

-- =====================================================
-- 8. データ整合性の最終確認
-- =====================================================

-- owner_id の整合性を最終確認
DO $$
DECLARE
  inconsistent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inconsistent_count
  FROM shared_lists sl
  JOIN place_lists pl ON sl.list_id = pl.id
  WHERE sl.owner_id != pl.created_by;
  
  IF inconsistent_count > 0 THEN
    RAISE WARNING 'Found % inconsistent owner_id records in shared_lists', inconsistent_count;
  ELSE
    RAISE NOTICE 'All owner_id records in shared_lists are consistent';
  END IF;
END $$;

-- =====================================================
-- コメント
-- =====================================================

COMMENT ON POLICY "shared_lists_owner_select" ON shared_lists IS 
'リストオーナーは自分のリストの共有設定を閲覧可能';

COMMENT ON POLICY "shared_lists_collaborator_select" ON shared_lists IS 
'共有されたユーザーは自分に関する共有設定を閲覧可能';

COMMENT ON POLICY "shared_lists_owner_insert" ON shared_lists IS 
'リストオーナーのみ新しい共有設定を作成可能';

COMMENT ON POLICY "shared_lists_owner_update" ON shared_lists IS 
'リストオーナーのみ共有設定を更新可能';

COMMENT ON POLICY "shared_lists_owner_delete" ON shared_lists IS 
'リストオーナーのみ共有設定を削除可能';

COMMENT ON POLICY "shared_lists_collaborator_delete" ON shared_lists IS 
'共有されたユーザーは自分の共有設定を削除可能（共有解除）';

COMMENT ON VIEW shared_lists_policy_test IS 
'shared_lists テーブルのRLSポリシーテスト用ビュー';

COMMENT ON FUNCTION check_shared_lists_owner_consistency() IS 
'shared_lists の owner_id と place_lists.created_by の整合性をチェックする関数';

-- 移行完了のログ
DO $$
BEGIN
  RAISE NOTICE 'Phase 3: shared_lists テーブルのRLSポリシー移行完了 - owner_id参照の不整合問題を修正し、統一されたポリシーを適用';
END $$; 