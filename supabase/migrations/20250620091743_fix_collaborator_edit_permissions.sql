-- 共同編集者リスト編集権限問題の修正
-- 
-- 【問題】
-- update_place_list RPC関数が所有者のみに制限されており、
-- edit権限を持つ共同編集者がリストを編集できない。
-- 
-- 【修正内容】
-- 1. update_place_list関数で共同編集者の編集権限を復活
-- 2. place_lists_function_delete RLSポリシーを所有者のみに変更（仕様明確化）

-- =====================================================
-- 1. update_place_list RPC関数の修正
-- =====================================================

-- 共同編集者の編集権限を復活させた update_place_list 関数
CREATE OR REPLACE FUNCTION public.update_place_list(
  p_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_is_public BOOLEAN,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 所有者または編集権限者のみ更新可能
  UPDATE public.place_lists
  SET name = p_name,
      description = p_description,
      is_public = p_is_public,
      updated_at = NOW()
  WHERE id = p_id 
    AND (
      created_by = p_user_id  -- 所有者
      OR EXISTS (
        SELECT 1 FROM public.shared_lists sl
        WHERE sl.list_id = p_id
        AND sl.shared_with_user_id = p_user_id
        AND sl.permission = 'edit'  -- 編集権限者
      )
    );
  
  -- 更新行数が0の場合は権限不足または存在しないリストを示すFALSEを返す
  RETURN FOUND;
END;
$$;

-- =====================================================
-- 2. place_lists削除RLSポリシーの修正（所有者のみ）
-- =====================================================

-- 現在の共同編集者も削除可能なポリシーを削除
DROP POLICY IF EXISTS "place_lists_function_delete" ON place_lists;

-- 所有者のみ削除可能な新しいポリシーを作成
CREATE POLICY "place_lists_owner_delete" ON place_lists
FOR DELETE TO authenticated
USING (created_by = auth.uid());

-- =====================================================
-- 修正後の権限マトリックス
-- =====================================================
-- 
-- リスト編集:
-- - 所有者: ✅ 編集可能
-- - edit権限の共同編集者: ✅ 編集可能（今回修正で復活）
-- - view権限の共同編集者: ❌ 編集不可
-- - 権限なしユーザー: ❌ 編集不可
-- 
-- リスト削除:
-- - 所有者: ✅ 削除可能
-- - edit権限の共同編集者: ❌ 削除不可（今回仕様明確化）
-- - view権限の共同編集者: ❌ 削除不可
-- - 権限なしユーザー: ❌ 削除不可

-- =====================================================
-- コメントと確認ログ
-- =====================================================

-- 修正完了ログ
DO $$
BEGIN
  RAISE NOTICE '共同編集者リスト編集権限問題の修正完了';
  RAISE NOTICE '1. update_place_list関数: 共同編集者の編集権限を復活';
  RAISE NOTICE '2. place_lists削除ポリシー: 所有者のみに変更';
  RAISE NOTICE '3. 回帰問題を修正し、適切な権限マトリックスを確立';
END $$;
