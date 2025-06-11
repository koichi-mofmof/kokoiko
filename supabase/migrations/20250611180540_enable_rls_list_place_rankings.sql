-- Enable RLS for list_place_rankings table
ALTER TABLE list_place_rankings ENABLE ROW LEVEL SECURITY;

-- Allow read access for list owners, editors, and viewers (public lists)
CREATE POLICY "Allow read access based on list access"
ON list_place_rankings FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_place_rankings.list_id
    AND (
      -- List owner
      pl.created_by = auth.uid()
      -- Public list
      OR pl.is_public = true
      -- Shared list (any permission)
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id 
        AND sl.shared_with_user_id = auth.uid()
      )
    )
  )
);

-- Allow insert/update/delete for list owners and editors only
CREATE POLICY "Allow full access for list owners and editors"
ON list_place_rankings FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_place_rankings.list_id
    AND (
      -- List owner
      pl.created_by = auth.uid()
      -- Shared list with edit permission
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id 
        AND sl.shared_with_user_id = auth.uid()
        AND sl.permission = 'edit'
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_place_rankings.list_id
    AND (
      -- List owner
      pl.created_by = auth.uid()
      -- Shared list with edit permission
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id 
        AND sl.shared_with_user_id = auth.uid()
        AND sl.permission = 'edit'
      )
    )
  )
);
