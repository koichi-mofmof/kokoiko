-- パブリックリストをマイページ等から除外するためのビュー修正
DROP VIEW IF EXISTS user_accessible_lists;

CREATE VIEW user_accessible_lists AS
SELECT
  pl.*,
  CASE
    WHEN pl.created_by = auth.uid() THEN 'owner'::text
    WHEN EXISTS (
      SELECT 1 FROM shared_lists sl
      WHERE sl.list_id = pl.id AND sl.shared_with_user_id = auth.uid()
    ) THEN 'shared'::text
    ELSE NULL
  END as access_type
FROM
  place_lists pl
WHERE
  pl.created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM shared_lists sl
    WHERE sl.list_id = pl.id AND sl.shared_with_user_id = auth.uid()
  );

COMMENT ON VIEW user_accessible_lists IS 'ユーザーがアクセス可能なすべてのリスト（パブリックリストは除外）と、アクセスタイプ（所有者、共有先）を表示するビュー';

GRANT SELECT ON user_accessible_lists TO authenticated;
