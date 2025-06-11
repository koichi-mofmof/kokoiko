-- 既存のSELECTポリシーを削除
DROP POLICY IF EXISTS "Allow shared users to view their share" ON shared_lists;
DROP POLICY IF EXISTS "Allow list access users to view all collaborators" ON shared_lists;

-- 新しいSELECTポリシーを作成
-- 循環参照回避のため、認証ユーザーによる shared_lists の SELECT を許可
-- アプリケーション層での権限チェック必須
CREATE POLICY "Allow authenticated users to SELECT shared list entries"
ON public.shared_lists
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "Allow authenticated users to SELECT shared list entries" ON public.shared_lists
IS 'RLS循環参照回避のため、認証ユーザーによるshared_listsのSELECTを許可。アプリ層での権限チェック必須。'; 