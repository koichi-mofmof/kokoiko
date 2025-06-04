-- 既存の関連するSELECTポリシーを削除
DROP POLICY IF EXISTS "Allow individual read access to own lists" ON public.place_lists;
DROP POLICY IF EXISTS "Allow public read access to public lists" ON public.place_lists;
DROP POLICY IF EXISTS "Allow shared users to read place_lists" ON public.place_lists; -- 以前の提案で追加しようとしたものも念のためDROP

-- 既存の関連するUPDATEポリシーを削除
DROP POLICY IF EXISTS "Allow individual update access" ON public.place_lists;
DROP POLICY IF EXISTS "Allow shared editors to update place_lists" ON public.place_lists; -- 以前の提案で追加しようとしたものも念のためDROP

-- 包括的なSELECTポリシーの作成
CREATE POLICY "Enable read access for place_lists based on ownership, publicity, or sharing"
ON public.place_lists
FOR SELECT
TO authenticated, anon -- 公開リストは匿名ユーザーも閲覧できるように anon も追加
USING (
  (is_public = true) OR -- 公開リスト
  (auth.uid() = created_by) OR -- 作成者
  (
    EXISTS ( -- 共有されているユーザー
      SELECT 1
      FROM public.shared_lists sl
      WHERE sl.list_id = place_lists.id AND sl.shared_with_user_id = auth.uid()
    )
  )
);

-- 包括的なUPDATEポリシーの作成
CREATE POLICY "Enable update access for place_lists based on ownership or shared edit permission"
ON public.place_lists
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = created_by) OR -- 作成者
  (
    EXISTS ( -- 編集権限を持つ共有ユーザー
      SELECT 1
      FROM public.shared_lists sl
      WHERE sl.list_id = place_lists.id AND sl.shared_with_user_id = auth.uid() AND sl.permission = 'edit'::shared_list_permission_enum
    )
  )
)
WITH CHECK ( -- USING句と同じ条件をCHECK句にも適用
  (auth.uid() = created_by) OR
  (
    EXISTS (
      SELECT 1
      FROM public.shared_lists sl
      WHERE sl.list_id = place_lists.id AND sl.shared_with_user_id = auth.uid() AND sl.permission = 'edit'::shared_list_permission_enum
    )
  )
);