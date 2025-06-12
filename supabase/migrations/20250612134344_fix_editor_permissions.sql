-- 編集者権限の問題を修正
-- 1. RPC関数update_place_listを編集権限者も使用可能に修正
-- 2. RLS開発者ガイドに従ってlist_share_tokensポリシーを修正

-- 1. update_place_list RPC関数を修正
CREATE OR REPLACE FUNCTION update_place_list(
  p_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_is_public BOOLEAN,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = p_id
        AND sl.shared_with_user_id = p_user_id
        AND sl.permission = 'edit'  -- 編集権限者
      )
    );
  
  RETURN FOUND;
END;
$$;

-- 2. RLS開発者ガイドに従ってlist_share_tokensポリシーを修正
-- 命名規則: {table}_{access_level}_{operation}

-- 既存の不適切なポリシーを削除
DROP POLICY IF EXISTS "Allow list owners to manage their own share tokens" ON list_share_tokens;
DROP POLICY IF EXISTS "Allow authenticated users to read active tokens for validation " ON list_share_tokens;

-- SELECT: トークン検証用（最小限の情報のみ）
-- 認証済みユーザーがトークン検証時に必要な情報のみアクセス可能
CREATE POLICY "list_share_tokens_public_select" ON list_share_tokens
FOR SELECT
TO authenticated
USING (
  is_active = true
  -- トークン検証時は、特定のトークンのみアクセス
  -- アプリケーション側でWHERE token = ? で絞り込み
);

-- SELECT: 管理用（所有者・編集者のみ）
-- リスト管理画面で共有リンク一覧を表示するため
CREATE POLICY "list_share_tokens_editor_select" ON list_share_tokens
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_share_tokens.list_id
    AND (
      pl.created_by = auth.uid()  -- 所有者
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = auth.uid()
        AND sl.permission = 'edit'  -- 編集権限者
      )
    )
  )
);

-- INSERT: 所有者と編集権限者が作成可能
CREATE POLICY "list_share_tokens_editor_insert" ON list_share_tokens
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_share_tokens.list_id
    AND (
      pl.created_by = auth.uid()  -- 所有者
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = auth.uid()
        AND sl.permission = 'edit'  -- 編集権限者
      )
    )
  )
);

-- UPDATE: 所有者と編集権限者が更新可能
CREATE POLICY "list_share_tokens_editor_update" ON list_share_tokens
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_share_tokens.list_id
    AND (
      pl.created_by = auth.uid()  -- 所有者
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = auth.uid()
        AND sl.permission = 'edit'  -- 編集権限者
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_share_tokens.list_id
    AND (
      pl.created_by = auth.uid()  -- 所有者
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = auth.uid()
        AND sl.permission = 'edit'  -- 編集権限者
      )
    )
  )
);

-- DELETE: 所有者と編集権限者が削除可能
CREATE POLICY "list_share_tokens_editor_delete" ON list_share_tokens
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_share_tokens.list_id
    AND (
      pl.created_by = auth.uid()  -- 所有者
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = auth.uid()
        AND sl.permission = 'edit'  -- 編集権限者
      )
    )
  )
);
