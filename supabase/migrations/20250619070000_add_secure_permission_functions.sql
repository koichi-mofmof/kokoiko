-- セキュリティ関数ベースの権限システム実装
-- 循環参照を回避しながら共同編集者のアクセスを可能にする

-- 1. リストアクセス権限を確認するセキュリティ関数
CREATE OR REPLACE FUNCTION check_list_access(
  target_list_id UUID,
  user_id UUID DEFAULT auth.uid(),
  required_permission TEXT DEFAULT 'view'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  list_owner UUID;
  shared_permission TEXT;
BEGIN
  -- NULL チェック
  IF target_list_id IS NULL OR user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. 所有者チェック（place_lists から直接取得、循環参照なし）
  SELECT created_by INTO list_owner
  FROM place_lists
  WHERE id = target_list_id;

  IF list_owner = user_id THEN
    RETURN TRUE;
  END IF;

  -- 2. 共有権限チェック（shared_lists から直接取得、循環参照なし）
  SELECT permission INTO shared_permission
  FROM shared_lists
  WHERE list_id = target_list_id 
    AND shared_with_user_id = user_id;

  -- 3. 権限レベル評価
  RETURN CASE required_permission
    WHEN 'view' THEN shared_permission IN ('view', 'edit')
    WHEN 'edit' THEN shared_permission = 'edit'
    ELSE FALSE
  END;
END;
$$;

-- 2. 共有リンクトークン検証関数
CREATE OR REPLACE FUNCTION verify_share_token_access(
  token_value TEXT
) RETURNS TABLE(
  list_id UUID,
  permission TEXT,
  owner_id UUID,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lst.list_id,
    lst.default_permission::TEXT,
    lst.owner_id,
    (
      lst.is_active = TRUE
      AND (lst.expires_at IS NULL OR lst.expires_at > NOW())
      AND (lst.max_uses IS NULL OR lst.max_uses = 0 OR lst.current_uses < lst.max_uses)
    ) as is_valid
  FROM list_share_tokens lst
  WHERE lst.token = token_value;
END;
$$;

-- 3. 権限付与
GRANT EXECUTE ON FUNCTION check_list_access TO authenticated;
GRANT EXECUTE ON FUNCTION verify_share_token_access TO authenticated;

 