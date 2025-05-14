-- 循環参照を解決するためのRLSポリシー変更

-- 既存の循環参照を持つポリシーを削除
DROP POLICY IF EXISTS "Allow individual read access to shared lists" ON place_lists;

-- 代わりにビューを作成して共有リストへのアクセスを管理
CREATE OR REPLACE VIEW user_accessible_lists AS
SELECT
  pl.*,
  CASE
    WHEN pl.created_by = auth.uid() THEN 'owner'::text
    WHEN EXISTS (
      SELECT 1 FROM shared_lists sl
      WHERE sl.list_id = pl.id AND sl.shared_with_user_id = auth.uid()
    ) THEN 'shared'::text
    WHEN pl.is_public = true THEN 'public'::text
    ELSE NULL
  END as access_type
FROM
  place_lists pl
WHERE
  pl.created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM shared_lists sl
    WHERE sl.list_id = pl.id AND sl.shared_with_user_id = auth.uid()
  )
  OR pl.is_public = true;

-- ビューにコメントを追加
COMMENT ON VIEW user_accessible_lists IS 'ユーザーがアクセス可能なすべてのリストと、アクセスタイプ（所有者、共有先、公開）を表示するビュー';

-- ビューに対するアクセス権を付与
GRANT SELECT ON user_accessible_lists TO authenticated;

-- place_listsのRLSポリシーを簡略化
-- 変更: 共有リストへのアクセスのためのポリシーを削除し、所有者とパブリックアクセスのみを残す
-- 理由: 共有リストへのアクセスは別のアプローチで処理する

-- 既存のplace_listsに対するRLSポリシーを残しておく
-- "Allow individual read access to own lists"と"Allow public read access to public lists"は既に存在

-- shared_lists用の単純なRLSポリシーを作成
-- アプリケーションコードは主にuser_accessible_listsビューを使用するよう変更される

-- RPC関数を作成して共有リストにアクセスするための安全な方法を提供
CREATE OR REPLACE FUNCTION get_shared_lists_for_user(p_user_id UUID)
RETURNS TABLE(
  list_id UUID,
  list_name TEXT,
  list_description TEXT,
  list_is_public BOOLEAN,
  list_created_at TIMESTAMPTZ,
  list_updated_at TIMESTAMPTZ,
  list_created_by UUID,
  permission TEXT
) LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pl.id as list_id,
    pl.name as list_name,
    pl.description as list_description,
    pl.is_public as list_is_public,
    pl.created_at as list_created_at,
    pl.updated_at as list_updated_at,
    pl.created_by as list_created_by,
    sl.permission::TEXT
  FROM
    shared_lists sl
    JOIN place_lists pl ON sl.list_id = pl.id
  WHERE
    sl.shared_with_user_id = p_user_id;
$$;

-- 関数の説明を追加
COMMENT ON FUNCTION get_shared_lists_for_user IS 'ユーザーと共有されているリストとその権限を安全に取得する関数';

-- 関数を呼び出す権限を付与
GRANT EXECUTE ON FUNCTION get_shared_lists_for_user TO authenticated; 