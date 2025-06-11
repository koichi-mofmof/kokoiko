-- Fix tags table RLS policy to allow access to tags used in shared lists
-- Currently, users can only see their own tags, but they should be able to see tags used in lists they have access to

-- Drop the existing restrictive read policy
DROP POLICY IF EXISTS "Allow individual read access to own tags" ON tags;

-- Create a new, more flexible read access policy
CREATE POLICY "Allow read access to tags in accessible lists" ON tags
FOR SELECT TO public
USING (
  -- Allow users to see their own tags
  auth.uid() = user_id
  OR
  -- Allow users to see tags used in lists they have access to
  EXISTS (
    SELECT 1 FROM list_place_tags lpt
    JOIN list_places lp ON lpt.list_place_id = lp.id
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lpt.tag_id = tags.id
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

-- Ensure proper grants
GRANT SELECT ON tags TO authenticated;
GRANT SELECT ON tags TO anon; 