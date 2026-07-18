-- Add optional name/description search to the paginated place_count RPC.
-- Adds a trailing `search_query` argument (default NULL) so existing calls
-- without search continue to work unchanged.
CREATE OR REPLACE FUNCTION get_public_lists_paginated_by_place_count(
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0,
  sort_order text DEFAULT 'desc',
  search_query text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  place_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH counts AS (
    SELECT
      pl.id,
      pl.name,
      pl.description,
      pl.created_by,
      pl.created_at,
      pl.updated_at,
      COUNT(lp.id)::bigint AS place_count
    FROM place_lists pl
    LEFT JOIN list_places lp ON lp.list_id = pl.id
    WHERE pl.is_public = true
      AND (
        search_query IS NULL
        OR search_query = ''
        OR pl.name ILIKE '%' || search_query || '%'
        OR pl.description ILIKE '%' || search_query || '%'
      )
    GROUP BY pl.id, pl.name, pl.description, pl.created_by, pl.created_at, pl.updated_at
  )
  SELECT id, name, description, created_by, created_at, updated_at, place_count
  FROM counts
  ORDER BY
    CASE WHEN lower(sort_order) = 'asc' THEN place_count END ASC NULLS LAST,
    CASE WHEN lower(sort_order) = 'desc' THEN place_count END DESC NULLS LAST,
    updated_at DESC
  LIMIT limit_count OFFSET offset_count;
$$;

GRANT EXECUTE ON FUNCTION get_public_lists_paginated_by_place_count(integer, integer, text, text) TO anon;
GRANT EXECUTE ON FUNCTION get_public_lists_paginated_by_place_count(integer, integer, text, text) TO authenticated;
