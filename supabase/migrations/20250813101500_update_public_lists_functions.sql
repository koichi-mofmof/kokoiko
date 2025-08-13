-- Update: Ensure one list per creator for home section and add paginated RPC for sorting by place_count

-- 1) Update existing RPC: get_public_lists_by_place_count
--    Change to return at most one list per creator (highest place_count, tie-breaker updated_at)
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
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH ranked AS (
    SELECT
      pl.id,
      pl.name,
      pl.description,
      pl.created_by,
      pl.created_at,
      pl.updated_at,
      COUNT(lp.id)::bigint AS place_count,
      ROW_NUMBER() OVER (
        PARTITION BY pl.created_by 
        ORDER BY COUNT(lp.id) DESC, pl.updated_at DESC, pl.id
      ) AS rn
    FROM place_lists pl
    LEFT JOIN list_places lp ON lp.list_id = pl.id
    WHERE pl.is_public = true
    GROUP BY pl.id, pl.name, pl.description, pl.created_by, pl.created_at, pl.updated_at
  )
  SELECT id, name, description, created_by, created_at, updated_at, place_count
  FROM ranked
  WHERE rn = 1
  ORDER BY place_count DESC, updated_at DESC
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION get_public_lists_by_place_count(integer) TO anon;
GRANT EXECUTE ON FUNCTION get_public_lists_by_place_count(integer) TO authenticated;


-- 2) New RPC: get_public_lists_paginated_by_place_count
--    Returns public lists sorted by place_count with pagination and order control
CREATE OR REPLACE FUNCTION get_public_lists_paginated_by_place_count(
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0,
  sort_order text DEFAULT 'desc'
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

GRANT EXECUTE ON FUNCTION get_public_lists_paginated_by_place_count(integer, integer, text) TO anon;
GRANT EXECUTE ON FUNCTION get_public_lists_paginated_by_place_count(integer, integer, text) TO authenticated;


