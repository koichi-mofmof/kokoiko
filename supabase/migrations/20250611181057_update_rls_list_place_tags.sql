-- Drop existing policies for list_place_tags
DROP POLICY IF EXISTS "Allow read access based on list_places access" ON list_place_tags;
DROP POLICY IF EXISTS "Allow insert/delete based on list_places edit access" ON list_place_tags;

-- Create improved read access policy (same as list_place_rankings)
CREATE POLICY "Allow read access based on list access"
ON list_place_tags FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_tags.list_place_id
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

-- Create improved edit access policy with WITH CHECK
CREATE POLICY "Allow full access for list owners and editors"
ON list_place_tags FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_tags.list_place_id
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
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_tags.list_place_id
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
