-- place_listsのRLSポリシーを関数ベースに更新
-- 循環参照を回避しながら共同編集者のアクセスを実現

-- 1. 既存の制限的なポリシーを削除
DROP POLICY IF EXISTS "place_lists_safe_select" ON place_lists;
DROP POLICY IF EXISTS "place_lists_safe_update" ON place_lists;

-- 2. 関数ベースの新しいSELECTポリシー（共同編集者対応）
CREATE POLICY "place_lists_function_select" ON place_lists
FOR SELECT TO authenticated
USING (
  -- パブリックリスト
  is_public = true
  OR
  -- 所有者
  created_by = auth.uid()
  OR
  -- 共有アクセス（関数経由で循環参照回避）
  check_list_access(id, auth.uid(), 'view')
);

-- 3. 関数ベースの新しいUPDATEポリシー（編集権限者のみ）
CREATE POLICY "place_lists_function_update" ON place_lists
FOR UPDATE TO authenticated
USING (
  -- 所有者
  created_by = auth.uid()
  OR
  -- 編集権限者（関数経由で循環参照回避）
  check_list_access(id, auth.uid(), 'edit')
)
WITH CHECK (
  -- 更新時はcreated_byを変更不可
  created_by = (SELECT created_by FROM place_lists WHERE id = place_lists.id)
);

 