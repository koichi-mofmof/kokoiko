-- shared_listsのUPDATE/DELETE RLS強化
-- 既存のUPDATE/DELETEポリシーを削除
DROP POLICY IF EXISTS "Allow authenticated users to UPDATE shared list entries" ON public.shared_lists;
DROP POLICY IF EXISTS "Allow authenticated users to DELETE shared list entries" ON public.shared_lists;

-- UPDATE: オーナーまたは編集権限者のみ
CREATE POLICY "Allow only owner or shared editor to update shared_lists"
ON public.shared_lists
FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid() OR (shared_with_user_id = auth.uid() AND permission = 'edit')
);

-- DELETE: オーナーまたは編集権限者のみ
CREATE POLICY "Allow only owner or shared editor to delete shared_lists"
ON public.shared_lists
FOR DELETE
TO authenticated
USING (
  owner_id = auth.uid() OR (shared_with_user_id = auth.uid() AND permission = 'edit')
);
