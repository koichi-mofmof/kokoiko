-- Fix list_place_tags RLS policy
-- The current policy has issues with complex joins, so we'll create a more robust version

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Allow read access based on list access" ON list_place_tags;

-- Create a new, more robust read access policy
CREATE POLICY "Allow read access based on list access" ON list_place_tags
FOR SELECT TO public
USING (
  -- Check if user has access to the list through list_places
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_tags.list_place_id
    AND (
      -- List owner has access
      pl.created_by = auth.uid()
      OR
      -- Public list - anyone can read
      pl.is_public = true
      OR
      -- Shared list - check shared_lists table
      EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id 
        AND sl.shared_with_user_id = auth.uid()
        AND sl.permission IN ('view', 'edit')
      )
    )
  )
);

-- Ensure the policy is applied
GRANT SELECT ON list_place_tags TO authenticated;
GRANT SELECT ON list_place_tags TO anon; 