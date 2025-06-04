-- 既存のポリシーで循環参照の原因となっているものを削除
DROP POLICY IF EXISTS "Allow list owners to manage shares" ON public.shared_lists;

-- INSERT用ポリシー
CREATE POLICY "Allow authenticated users to INSERT shared list entries"
ON public.shared_lists
FOR INSERT
TO authenticated
WITH CHECK (true); -- Server Actionでのチェックを前提

-- UPDATE用ポリシー
CREATE POLICY "Allow authenticated users to UPDATE shared list entries"
ON public.shared_lists
FOR UPDATE
TO authenticated
USING (true); -- Server Actionでのチェックを前提
-- WITH CHECK (true); -- UPDATEの場合、WITH CHECKはUSINGと同じか省略されることが多い

-- DELETE用ポリシー
CREATE POLICY "Allow authenticated users to DELETE shared list entries"
ON public.shared_lists
FOR DELETE
TO authenticated
USING (true); -- Server Actionでのチェックを前提

COMMENT ON POLICY "Allow authenticated users to INSERT shared list entries" ON public.shared_lists
IS 'RLS循環参照回避のため、認証ユーザーによるshared_listsのINSERTを許可。アプリ層での権限チェック必須。';
COMMENT ON POLICY "Allow authenticated users to UPDATE shared list entries" ON public.shared_lists
IS 'RLS循環参照回避のため、認証ユーザーによるshared_listsのUPDATEを許可。アプリ層での権限チェック必須。';
COMMENT ON POLICY "Allow authenticated users to DELETE shared list entries" ON public.shared_lists
IS 'RLS循環参照回避のため、認証ユーザーによるshared_listsのDELETEを許可。アプリ層での権限チェック必須。';
