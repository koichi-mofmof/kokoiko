-- RLSポリシーの check_list_access 関数引数順序を修正
-- 問題: auth.uid() と list_id の順序が関数定義と逆になっていた

-- list_share_tokens の修正
DROP POLICY IF EXISTS "list_share_tokens_manager_access" ON list_share_tokens;

CREATE POLICY "list_share_tokens_manager_access" ON list_share_tokens
FOR ALL TO authenticated
USING (check_list_access(list_id, auth.uid(), 'edit'))
WITH CHECK (check_list_access(list_id, auth.uid(), 'edit'));

-- 他のテーブルでも同じ問題がある可能性があるため、確認して修正

-- place_lists の修正
DROP POLICY IF EXISTS "place_lists_function_update" ON place_lists;
DROP POLICY IF EXISTS "place_lists_function_delete" ON place_lists;

CREATE POLICY "place_lists_function_update" ON place_lists
FOR UPDATE TO authenticated
USING (check_list_access(id, auth.uid(), 'edit'))
WITH CHECK (check_list_access(id, auth.uid(), 'edit'));

CREATE POLICY "place_lists_function_delete" ON place_lists
FOR DELETE TO authenticated
USING (check_list_access(id, auth.uid(), 'edit'));

-- shared_lists の修正（もしあれば）
-- 注意: shared_lists は循環参照を避けるため、check_list_access関数を使わない 