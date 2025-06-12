-- 共有リンク経由でのリスト参加を許可するRLSポリシー修正
-- 参照: docs/rls/rls-developer-guide.md の命名規則に従う

-- 既存のINSERTポリシーを削除
DROP POLICY IF EXISTS "shared_lists_owner_insert" ON shared_lists;

-- 新しいINSERTポリシーを作成
-- 命名規則: {table}_{access_level}_{operation}
CREATE POLICY "shared_lists_owner_insert" ON shared_lists
FOR INSERT
TO authenticated
WITH CHECK (
  -- 所有者による共有を許可
  (owner_id = auth.uid() AND EXISTS (
    SELECT 1 FROM place_lists pl 
    WHERE pl.id = shared_lists.list_id 
    AND pl.created_by = auth.uid()
  ))
);

-- 共有リンク経由での参加を許可する新しいポリシーを追加
CREATE POLICY "shared_lists_collaborator_insert" ON shared_lists
FOR INSERT
TO authenticated
WITH CHECK (
  -- 共有リンク経由での参加を許可
  shared_with_user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM list_share_tokens lst 
    WHERE lst.list_id = shared_lists.list_id 
    AND lst.owner_id = shared_lists.owner_id
    AND lst.is_active = true
    AND (lst.expires_at IS NULL OR lst.expires_at > NOW())
    AND (lst.max_uses IS NULL OR lst.max_uses = 0 OR lst.current_uses < lst.max_uses)
  )
);

-- 既存のUPDATEポリシーを削除
DROP POLICY IF EXISTS "shared_lists_owner_update" ON shared_lists;

-- 所有者によるUPDATEポリシーを再作成
CREATE POLICY "shared_lists_owner_update" ON shared_lists
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (
  owner_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM place_lists pl 
    WHERE pl.id = shared_lists.list_id 
    AND pl.created_by = auth.uid()
  )
);

-- 共有リンク経由での権限更新を許可する新しいポリシーを追加
CREATE POLICY "shared_lists_collaborator_update" ON shared_lists
FOR UPDATE
TO authenticated
USING (
  -- 自分のレコードのみ更新可能
  shared_with_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM list_share_tokens lst 
    WHERE lst.list_id = shared_lists.list_id 
    AND lst.owner_id = shared_lists.owner_id
    AND lst.is_active = true
    AND (lst.expires_at IS NULL OR lst.expires_at > NOW())
    AND (lst.max_uses IS NULL OR lst.max_uses = 0 OR lst.current_uses < lst.max_uses)
  )
)
WITH CHECK (
  -- 自分のレコードのみ更新可能
  shared_with_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM list_share_tokens lst 
    WHERE lst.list_id = shared_lists.list_id 
    AND lst.owner_id = shared_lists.owner_id
    AND lst.is_active = true
    AND (lst.expires_at IS NULL OR lst.expires_at > NOW())
    AND (lst.max_uses IS NULL OR lst.max_uses = 0 OR lst.current_uses < lst.max_uses)
  )
);
