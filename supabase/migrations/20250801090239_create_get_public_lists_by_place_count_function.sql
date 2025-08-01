-- 登録地点数でソートした公開リストを取得するRPC関数
CREATE OR REPLACE FUNCTION get_public_lists_by_place_count(limit_count integer DEFAULT 8)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  place_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.id,
    pl.name,
    pl.description,
    pl.created_by,
    pl.created_at,
    pl.updated_at,
    COALESCE(lp_count.count, 0) as place_count
  FROM place_lists pl
  LEFT JOIN (
    SELECT 
      list_id,
      COUNT(*) as count
    FROM list_places
    GROUP BY list_id
  ) lp_count ON pl.id = lp_count.list_id
  WHERE pl.is_public = true
  ORDER BY place_count DESC, pl.updated_at DESC
  LIMIT limit_count;
END;
$$;

-- RLSポリシーを設定（匿名ユーザーでもアクセス可能）
GRANT EXECUTE ON FUNCTION get_public_lists_by_place_count(integer) TO anon;
GRANT EXECUTE ON FUNCTION get_public_lists_by_place_count(integer) TO authenticated;
