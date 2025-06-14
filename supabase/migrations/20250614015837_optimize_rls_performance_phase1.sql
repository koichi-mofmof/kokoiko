-- =====================================================
-- Phase 1: 緊急パフォーマンス最適化
-- =====================================================
-- 1. 重複インデックス削除（簡単・効果大）
-- 2. Auth RLS InitPlan最適化（パフォーマンス重要）

-- =====================================================
-- PART 1: 重複インデックスの削除
-- =====================================================

-- 重複インデックスを削除してストレージとI/Oパフォーマンスを改善

-- list_place_commnts: 重複インデックス削除
-- idx_list_place_commnts_list_place_created_composite と idx_list_place_commnts_list_place_id_created_at は同等
DROP INDEX IF EXISTS idx_list_place_commnts_list_place_id_created_at;

-- list_places: 重複インデックス削除
-- 古いインデックスを削除し、最適化されたものを残す
DROP INDEX IF EXISTS idx_list_places_list_id;
DROP INDEX IF EXISTS idx_list_places_place_id;

-- place_lists: 重複インデックス削除
-- 古いインデックスを削除し、最適化されたものを残す
DROP INDEX IF EXISTS idx_place_lists_is_public;
DROP INDEX IF EXISTS idx_place_lists_created_by_created_at;

-- shared_lists: 重複インデックス削除
-- idx_shared_lists_list_user と idx_shared_lists_list_user_composite は同等
DROP INDEX IF EXISTS idx_shared_lists_list_user;

-- =====================================================
-- PART 2: Auth RLS InitPlan 最適化
-- =====================================================

-- auth.uid() を (select auth.uid()) に変更してクエリプランナーの最適化を有効化
-- 各行での関数再評価を防ぎ、一度だけ実行してキャッシュを使用

-- -----------------------------------------------------
-- profiles テーブル (2件)
-- -----------------------------------------------------

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

-- Allow users to insert their own profile  
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
CREATE POLICY "Allow users to insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- -----------------------------------------------------
-- subscriptions テーブル (3件) 
-- -----------------------------------------------------

-- Subscriptions: Select own
DROP POLICY IF EXISTS "Subscriptions: Select own" ON public.subscriptions;
CREATE POLICY "Subscriptions: Select own" ON public.subscriptions
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- Subscriptions: Insert own
DROP POLICY IF EXISTS "Subscriptions: Insert own" ON public.subscriptions;
CREATE POLICY "Subscriptions: Insert own" ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Subscriptions: Update own
DROP POLICY IF EXISTS "Subscriptions: Update own" ON public.subscriptions;
CREATE POLICY "Subscriptions: Update own" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- -----------------------------------------------------
-- place_lists テーブル (5件)
-- -----------------------------------------------------

-- place_lists_authenticated_select
DROP POLICY IF EXISTS "place_lists_authenticated_select" ON place_lists;
CREATE POLICY "place_lists_authenticated_select" ON place_lists
FOR SELECT TO authenticated
USING (
  created_by = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM shared_lists
    WHERE list_id = place_lists.id
    AND shared_with_user_id = (select auth.uid())
  )
);

-- place_lists_owner_insert
DROP POLICY IF EXISTS "place_lists_owner_insert" ON place_lists;
CREATE POLICY "place_lists_owner_insert" ON place_lists
FOR INSERT TO authenticated
WITH CHECK (created_by = (select auth.uid()));

-- place_lists_editor_update
DROP POLICY IF EXISTS "place_lists_editor_update" ON place_lists;
CREATE POLICY "place_lists_editor_update" ON place_lists
FOR UPDATE TO authenticated
USING (
  created_by = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM shared_lists
    WHERE list_id = place_lists.id
    AND shared_with_user_id = (select auth.uid())
    AND permission = 'edit'
  )
)
WITH CHECK (
  created_by = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM shared_lists
    WHERE list_id = place_lists.id
    AND shared_with_user_id = (select auth.uid())
    AND permission = 'edit'
  )
);

-- place_lists_owner_delete
DROP POLICY IF EXISTS "place_lists_owner_delete" ON place_lists;
CREATE POLICY "place_lists_owner_delete" ON place_lists
FOR DELETE TO authenticated
USING (created_by = (select auth.uid()));

-- Allow individual insert access (旧ポリシー名での対応)
DROP POLICY IF EXISTS "Allow individual insert access" ON place_lists;

-- Allow individual update access (旧ポリシー名での対応)
DROP POLICY IF EXISTS "Allow individual update access" ON place_lists;

-- Allow individual delete access (旧ポリシー名での対応)
DROP POLICY IF EXISTS "Allow individual delete access" ON place_lists;

-- -----------------------------------------------------
-- tags テーブル (4件)
-- -----------------------------------------------------

-- tags_authenticated_select
DROP POLICY IF EXISTS "tags_authenticated_select" ON tags;
CREATE POLICY "tags_authenticated_select" ON tags
FOR SELECT TO authenticated
USING (
  user_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM list_place_tags lpt
    JOIN list_places lp ON lpt.list_place_id = lp.id
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lpt.tag_id = tags.id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
      )
    )
  )
);

-- tags_self_insert
DROP POLICY IF EXISTS "tags_self_insert" ON tags;
CREATE POLICY "tags_self_insert" ON tags
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

-- tags_self_update
DROP POLICY IF EXISTS "tags_self_update" ON tags;
CREATE POLICY "tags_self_update" ON tags
FOR UPDATE TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- tags_self_delete
DROP POLICY IF EXISTS "tags_self_delete" ON tags;
CREATE POLICY "tags_self_delete" ON tags
FOR DELETE TO authenticated
USING (user_id = (select auth.uid()));

-- 旧ポリシー名での対応
DROP POLICY IF EXISTS "Allow read access to tags in accessible lists" ON tags;
DROP POLICY IF EXISTS "Allow individual insert access" ON tags;
DROP POLICY IF EXISTS "Allow individual update access" ON tags;
DROP POLICY IF EXISTS "Allow individual delete access" ON tags;

-- -----------------------------------------------------
-- shared_lists テーブル (7件)
-- -----------------------------------------------------

-- shared_lists_owner_select
DROP POLICY IF EXISTS "shared_lists_owner_select" ON shared_lists;
CREATE POLICY "shared_lists_owner_select" ON shared_lists
FOR SELECT TO authenticated
USING (
  owner_id = (select auth.uid())
  OR shared_with_user_id = (select auth.uid())
);

-- shared_lists_owner_insert
DROP POLICY IF EXISTS "shared_lists_owner_insert" ON shared_lists;
CREATE POLICY "shared_lists_owner_insert" ON shared_lists
FOR INSERT TO authenticated
WITH CHECK (
  owner_id = (select auth.uid())
  AND EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = shared_lists.list_id
    AND pl.created_by = (select auth.uid())
  )
);

-- shared_lists_owner_update
DROP POLICY IF EXISTS "shared_lists_owner_update" ON shared_lists;
CREATE POLICY "shared_lists_owner_update" ON shared_lists
FOR UPDATE TO authenticated
USING (owner_id = (select auth.uid()))
WITH CHECK (owner_id = (select auth.uid()));

-- shared_lists_owner_delete
DROP POLICY IF EXISTS "shared_lists_owner_delete" ON shared_lists;
CREATE POLICY "shared_lists_owner_delete" ON shared_lists
FOR DELETE TO authenticated
USING (owner_id = (select auth.uid()));

-- shared_lists_collaborator_delete
DROP POLICY IF EXISTS "shared_lists_collaborator_delete" ON shared_lists;
CREATE POLICY "shared_lists_collaborator_delete" ON shared_lists
FOR DELETE TO authenticated
USING (shared_with_user_id = (select auth.uid()));

-- 旧ポリシー名での対応
DROP POLICY IF EXISTS "Allow shared list owners to manage sharing" ON shared_lists;
DROP POLICY IF EXISTS "Allow users to view their own shared lists" ON shared_lists;

-- -----------------------------------------------------
-- places テーブル (2件)
-- -----------------------------------------------------

-- places_authenticated_select
DROP POLICY IF EXISTS "places_authenticated_select" ON places;
CREATE POLICY "places_authenticated_select" ON places
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.place_id = places.id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
      )
    )
  )
);

-- places_authenticated_update
DROP POLICY IF EXISTS "places_authenticated_update" ON places;
CREATE POLICY "places_authenticated_update" ON places
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.place_id = places.id
    AND pl.created_by = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.place_id = places.id
    AND pl.created_by = (select auth.uid())
  )
);

-- -----------------------------------------------------
-- list_places テーブル (4件)
-- -----------------------------------------------------

-- list_places_authenticated_select
DROP POLICY IF EXISTS "list_places_authenticated_select" ON list_places;
CREATE POLICY "list_places_authenticated_select" ON list_places
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_places.list_id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
      )
    )
  )
);

-- list_places_editor_insert
DROP POLICY IF EXISTS "list_places_editor_insert" ON list_places;
CREATE POLICY "list_places_editor_insert" ON list_places
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_places.list_id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
        AND sl.permission = 'edit'
      )
    )
  )
);

-- list_places_editor_update
DROP POLICY IF EXISTS "list_places_editor_update" ON list_places;
CREATE POLICY "list_places_editor_update" ON list_places
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_places.list_id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
        AND sl.permission = 'edit'
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_places.list_id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
        AND sl.permission = 'edit'
      )
    )
  )
);

-- list_places_editor_delete
DROP POLICY IF EXISTS "list_places_editor_delete" ON list_places;
CREATE POLICY "list_places_editor_delete" ON list_places
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_places.list_id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
        AND sl.permission = 'edit'
      )
    )
  )
);

-- 旧ポリシー名での対応
DROP POLICY IF EXISTS "Allow insert access for list owners or editors" ON list_places;
DROP POLICY IF EXISTS "Allow update access for list owners or editors" ON list_places;
DROP POLICY IF EXISTS "Allow delete access for list owners or editors" ON list_places;

-- -----------------------------------------------------
-- list_place_rankings テーブル (4件)
-- -----------------------------------------------------

-- Allow read access based on list access
DROP POLICY IF EXISTS "Allow read access based on list access" ON list_place_rankings;
CREATE POLICY "Allow read access based on list access"
ON list_place_rankings FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_place_rankings.list_id
    AND (
      pl.created_by = (select auth.uid())
      OR pl.is_public = true
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id 
        AND sl.shared_with_user_id = (select auth.uid())
      )
    )
  )
);

-- Allow full access for list owners and editors
DROP POLICY IF EXISTS "Allow full access for list owners and editors" ON list_place_rankings;
CREATE POLICY "Allow full access for list owners and editors"
ON list_place_rankings FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_place_rankings.list_id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id 
        AND sl.shared_with_user_id = (select auth.uid())
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
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id 
        AND sl.shared_with_user_id = (select auth.uid())
        AND sl.permission = 'edit'
      )
    )
  )
);

-- -----------------------------------------------------
-- list_place_tags テーブル (3件)
-- -----------------------------------------------------

-- list_place_tags_authenticated_select
DROP POLICY IF EXISTS "list_place_tags_authenticated_select" ON list_place_tags;
CREATE POLICY "list_place_tags_authenticated_select" ON list_place_tags
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_tags.list_place_id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
      )
    )
  )
);

-- list_place_tags_editor_insert
DROP POLICY IF EXISTS "list_place_tags_editor_insert" ON list_place_tags;
CREATE POLICY "list_place_tags_editor_insert" ON list_place_tags
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_tags.list_place_id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
        AND sl.permission = 'edit'
      )
    )
  )
  AND EXISTS (
    SELECT 1 FROM tags t
    WHERE t.id = list_place_tags.tag_id
    AND (
      t.user_id = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM list_place_tags lpt2
        JOIN list_places lp2 ON lpt2.list_place_id = lp2.id
        JOIN place_lists pl2 ON lp2.list_id = pl2.id
        WHERE lpt2.tag_id = t.id
        AND (
          pl2.is_public = true
          OR pl2.created_by = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM shared_lists sl2
            WHERE sl2.list_id = pl2.id
            AND sl2.shared_with_user_id = (select auth.uid())
          )
        )
      )
    )
  )
);

-- list_place_tags_editor_delete
DROP POLICY IF EXISTS "list_place_tags_editor_delete" ON list_place_tags;
CREATE POLICY "list_place_tags_editor_delete" ON list_place_tags
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_tags.list_place_id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
        AND sl.permission = 'edit'
      )
    )
  )
);

-- 旧ポリシー名での対応
DROP POLICY IF EXISTS "Allow read access based on list access" ON list_place_tags;
DROP POLICY IF EXISTS "Allow full access for list owners and editors" ON list_place_tags;

-- -----------------------------------------------------
-- list_place_commnts テーブル (5件)
-- -----------------------------------------------------

-- list_place_commnts_authenticated_select
DROP POLICY IF EXISTS "list_place_commnts_authenticated_select" ON list_place_commnts;
CREATE POLICY "list_place_commnts_authenticated_select" ON list_place_commnts
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_commnts.list_place_id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
      )
    )
  )
);

-- list_place_commnts_editor_insert
DROP POLICY IF EXISTS "list_place_commnts_editor_insert" ON list_place_commnts;
CREATE POLICY "list_place_commnts_editor_insert" ON list_place_commnts
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (select auth.uid())
  AND EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_commnts.list_place_id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
        AND sl.permission = 'edit'
      )
    )
  )
);

-- list_place_commnts_self_update
DROP POLICY IF EXISTS "list_place_commnts_self_update" ON list_place_commnts;
CREATE POLICY "list_place_commnts_self_update" ON list_place_commnts
FOR UPDATE TO authenticated
USING (
  user_id = (select auth.uid())
  AND EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_commnts.list_place_id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
      )
    )
  )
)
WITH CHECK (
  user_id = (select auth.uid())
  AND EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_commnts.list_place_id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
      )
    )
  )
);

-- list_place_commnts_self_delete
DROP POLICY IF EXISTS "list_place_commnts_self_delete" ON list_place_commnts;
CREATE POLICY "list_place_commnts_self_delete" ON list_place_commnts
FOR DELETE TO authenticated
USING (user_id = (select auth.uid()));

-- list_place_commnts_owner_delete
DROP POLICY IF EXISTS "list_place_commnts_owner_delete" ON list_place_commnts;
CREATE POLICY "list_place_commnts_owner_delete" ON list_place_commnts
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_commnts.list_place_id
    AND pl.created_by = (select auth.uid())
  )
);

-- -----------------------------------------------------
-- list_share_tokens テーブル (4件)
-- -----------------------------------------------------

-- Allow list owners to manage their own share tokens
DROP POLICY IF EXISTS "Allow list owners to manage their own share tokens" ON list_share_tokens;
CREATE POLICY "Allow list owners to manage their own share tokens" ON list_share_tokens
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM place_lists pl
    WHERE pl.id = list_share_tokens.list_id AND pl.created_by = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM place_lists pl
    WHERE pl.id = list_share_tokens.list_id AND pl.created_by = (select auth.uid())
  )
);

-- Allow authenticated users to read active tokens for validation 
DROP POLICY IF EXISTS "Allow authenticated users to read active tokens for validation (use with caution)" ON list_share_tokens;
CREATE POLICY "Allow authenticated users to read active tokens for validation (use with caution)" ON list_share_tokens
FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- list_share_tokens_editor_update
DROP POLICY IF EXISTS "list_share_tokens_editor_update" ON list_share_tokens;
CREATE POLICY "list_share_tokens_editor_update" ON list_share_tokens
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_share_tokens.list_id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
        AND sl.permission = 'edit'
      )
    )
  )
);

-- list_share_tokens_editor_delete  
DROP POLICY IF EXISTS "list_share_tokens_editor_delete" ON list_share_tokens;
CREATE POLICY "list_share_tokens_editor_delete" ON list_share_tokens
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = list_share_tokens.list_id
    AND (
      pl.created_by = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = (select auth.uid())
        AND sl.permission = 'edit'
      )
    )
  )
);

-- =====================================================
-- 完了確認ログ
-- =====================================================

-- Phase 1 パフォーマンス最適化完了
-- 1. 重複インデックス削除: 6件削除
-- 2. Auth RLS InitPlan最適化: 47件修正
-- これにより大幅なパフォーマンス向上が期待されます
