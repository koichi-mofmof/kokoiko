-- RLS用セキュリティ関数群の作成
-- Phase 1: 基盤整備

-- =====================================================
-- 1. リストアクセス権限チェック関数
-- =====================================================

CREATE OR REPLACE FUNCTION has_list_access(
  list_uuid UUID, 
  access_type TEXT DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
  list_record RECORD;
  user_id UUID;
BEGIN
  -- 現在のユーザーIDを取得
  user_id := auth.uid();
  
  -- リストの基本情報を取得
  SELECT id, created_by, is_public 
  INTO list_record
  FROM place_lists 
  WHERE id = list_uuid;
  
  -- リストが存在しない場合
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- 公開リストの場合（未ログインユーザーでもview可能）
  IF list_record.is_public = true AND access_type = 'view' THEN
    RETURN TRUE;
  END IF;
  
  -- 未ログインユーザーの場合、公開リスト以外はアクセス不可
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- オーナーの場合（全権限）
  IF list_record.created_by = user_id THEN
    RETURN TRUE;
  END IF;
  
  -- 共有ユーザーの場合
  IF access_type = 'view' THEN
    -- view権限: view または edit 権限があればOK
    RETURN EXISTS (
      SELECT 1 FROM shared_lists 
      WHERE list_id = list_uuid 
      AND shared_with_user_id = user_id
      AND permission IN ('view', 'edit')
    );
  ELSIF access_type = 'edit' THEN
    -- edit権限: edit 権限が必要
    RETURN EXISTS (
      SELECT 1 FROM shared_lists 
      WHERE list_id = list_uuid 
      AND shared_with_user_id = user_id
      AND permission = 'edit'
    );
  END IF;
  
  -- その他の場合はアクセス拒否
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. 公開アクセス可能性チェック関数
-- =====================================================

CREATE OR REPLACE FUNCTION is_publicly_accessible(
  list_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM place_lists 
    WHERE id = list_uuid 
    AND is_public = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. オーナー権限チェック関数
-- =====================================================

CREATE OR REPLACE FUNCTION is_owner(
  user_id UUID,
  list_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- user_idがNULLの場合は即座にFALSE
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM place_lists 
    WHERE id = list_uuid 
    AND created_by = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. コラボレーター権限チェック関数
-- =====================================================

CREATE OR REPLACE FUNCTION is_collaborator(
  user_id UUID,
  list_uuid UUID,
  required_permission TEXT DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
BEGIN
  -- user_idがNULLの場合は即座にFALSE
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- オーナーの場合は常にTRUE
  IF is_owner(user_id, list_uuid) THEN
    RETURN TRUE;
  END IF;
  
  -- 共有権限をチェック
  IF required_permission = 'view' THEN
    -- view権限: view または edit があればOK
    RETURN EXISTS (
      SELECT 1 FROM shared_lists 
      WHERE list_id = list_uuid 
      AND shared_with_user_id = user_id
      AND permission IN ('view', 'edit')
    );
  ELSIF required_permission = 'edit' THEN
    -- edit権限: edit が必要
    RETURN EXISTS (
      SELECT 1 FROM shared_lists 
      WHERE list_id = list_uuid 
      AND shared_with_user_id = user_id
      AND permission = 'edit'
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. 場所アクセス権限チェック関数（list_places経由）
-- =====================================================

CREATE OR REPLACE FUNCTION has_place_access_via_lists(
  place_id_param TEXT,
  access_type TEXT DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  user_id := auth.uid();
  
  -- 公開リストに含まれる場所の場合（未ログインでもview可能）
  IF access_type = 'view' THEN
    IF EXISTS (
      SELECT 1 FROM list_places lp
      JOIN place_lists pl ON lp.list_id = pl.id
      WHERE lp.place_id = place_id_param
      AND pl.is_public = true
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- 未ログインユーザーの場合、公開リスト以外はアクセス不可
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 認証済みユーザー: アクセス可能なリストに含まれる場所
  RETURN EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.place_id = place_id_param
    AND (
      pl.created_by = user_id
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = user_id
        AND (
          access_type = 'view' AND sl.permission IN ('view', 'edit')
          OR access_type = 'edit' AND sl.permission = 'edit'
        )
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. list_places アクセス権限チェック関数
-- =====================================================

CREATE OR REPLACE FUNCTION has_list_place_access(
  list_place_uuid UUID,
  access_type TEXT DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
  list_uuid UUID;
BEGIN
  -- list_places から list_id を取得
  SELECT list_id INTO list_uuid
  FROM list_places 
  WHERE id = list_place_uuid;
  
  -- レコードが存在しない場合
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- リストアクセス権限をチェック
  RETURN has_list_access(list_uuid, access_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. ユーザー自身のデータアクセスチェック関数
-- =====================================================

CREATE OR REPLACE FUNCTION is_own_data(
  data_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- 未ログインの場合はFALSE
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN current_user_id = data_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- インデックスの作成（パフォーマンス最適化）
-- =====================================================

-- shared_lists テーブルのインデックス最適化
CREATE INDEX IF NOT EXISTS idx_shared_lists_user_permission 
ON shared_lists(shared_with_user_id, permission);

CREATE INDEX IF NOT EXISTS idx_shared_lists_list_user 
ON shared_lists(list_id, shared_with_user_id);

-- list_places テーブルのインデックス最適化
CREATE INDEX IF NOT EXISTS idx_list_places_place_id 
ON list_places(place_id);

CREATE INDEX IF NOT EXISTS idx_list_places_list_id 
ON list_places(list_id);

-- place_lists テーブルのインデックス最適化
CREATE INDEX IF NOT EXISTS idx_place_lists_public 
ON place_lists(is_public) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_place_lists_created_by 
ON place_lists(created_by);

-- =====================================================
-- 関数の使用権限設定
-- =====================================================

-- anon と authenticated ロールに関数の実行権限を付与
GRANT EXECUTE ON FUNCTION has_list_access(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_publicly_accessible(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_owner(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_collaborator(UUID, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION has_place_access_via_lists(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION has_list_place_access(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_own_data(UUID) TO anon, authenticated;

-- =====================================================
-- 関数のテスト用コメント
-- =====================================================

COMMENT ON FUNCTION has_list_access(UUID, TEXT) IS 
'リストへのアクセス権限をチェック。公開リスト、オーナー、共有ユーザーの権限を統合的に判定';

COMMENT ON FUNCTION is_publicly_accessible(UUID) IS 
'リストが公開設定かどうかをチェック';

COMMENT ON FUNCTION is_owner(UUID, UUID) IS 
'指定ユーザーがリストのオーナーかどうかをチェック';

COMMENT ON FUNCTION is_collaborator(UUID, UUID, TEXT) IS 
'指定ユーザーがリストのコラボレーター（共有ユーザー）かどうかをチェック';

COMMENT ON FUNCTION has_place_access_via_lists(TEXT, TEXT) IS 
'場所への間接的なアクセス権限をリスト経由でチェック';

COMMENT ON FUNCTION has_list_place_access(UUID, TEXT) IS 
'list_placesレコードへのアクセス権限をチェック';

COMMENT ON FUNCTION is_own_data(UUID) IS 
'指定されたuser_idが現在のユーザー自身のものかチェック'; 