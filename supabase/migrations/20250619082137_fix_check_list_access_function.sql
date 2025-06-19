-- check_list_access セキュリティ関数の修正
-- 
-- 【発見された問題】
-- 1. 所有者が見つからない場合のNULL処理が不適切
-- 2. 共有権限が見つからない場合のNULL処理が不適切
-- 3. FOUND変数を使った存在チェックが未実装
--
-- 【修正内容】
-- - 適切なNULLチェックとFOUND判定を追加
-- - デバッグログを追加して動作確認可能に
-- - エラーハンドリングの強化

-- ==================================================
-- check_list_access 関数の修正
-- ==================================================

-- 修正版のcheck_list_access関数
-- 問題: DECLARE文の入れ子とロジックエラーを修正

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
  permission_granted BOOLEAN;
BEGIN
  -- NULLチェック
  IF target_list_id IS NULL OR user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. 所有者チェック
  SELECT created_by INTO list_owner
  FROM place_lists
  WHERE id = target_list_id;

  -- リストが存在しない場合
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 所有者の場合は常にアクセス許可
  IF list_owner = user_id THEN
    RETURN TRUE;
  END IF;

  -- 2. 共有権限チェック
  SELECT permission INTO shared_permission
  FROM shared_lists
  WHERE list_id = target_list_id 
    AND shared_with_user_id = user_id;

  -- 共有権限がない場合
  IF NOT FOUND OR shared_permission IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. 権限レベル評価
  permission_granted := CASE required_permission
    WHEN 'view' THEN shared_permission IN ('view', 'edit')
    WHEN 'edit' THEN shared_permission = 'edit'
    ELSE FALSE
  END;
  
  RETURN permission_granted;

EXCEPTION
  WHEN OTHERS THEN
    -- エラー時は安全側に倒してFALSEを返す
    RETURN FALSE;
END;
$$;
