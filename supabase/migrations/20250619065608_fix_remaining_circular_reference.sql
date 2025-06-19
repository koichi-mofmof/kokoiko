-- 緊急修正: 残存する循環参照の完全解消
-- 問題: shared_lists_owner_insert ↔ place_lists_authenticated_select の循環参照

-- 1. shared_listsの循環参照ポリシーを削除
DROP POLICY IF EXISTS "shared_lists_owner_insert" ON shared_lists;
DROP POLICY IF EXISTS "shared_lists_owner_update" ON shared_lists;
DROP POLICY IF EXISTS "shared_lists_owner_delete" ON shared_lists;
DROP POLICY IF EXISTS "shared_lists_owner_select" ON shared_lists;

-- 2. place_listsの循環参照ポリシーを削除  
DROP POLICY IF EXISTS "place_lists_authenticated_select" ON place_lists;
DROP POLICY IF EXISTS "place_lists_editor_update" ON place_lists;

-- 3. shared_listsの安全な代替ポリシー（所有者向け）
CREATE POLICY "shared_lists_owner_safe_select" ON shared_lists
FOR SELECT TO authenticated
USING (
  shared_with_user_id = auth.uid()
  -- 循環参照を避けるため、place_lists参照は削除
);

-- 4. place_listsの安全な代替ポリシー
CREATE POLICY "place_lists_safe_select" ON place_lists
FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  -- 循環参照を避けるため、shared_lists参照は削除
  -- アプリケーション層で共有権限チェックを実装
);

CREATE POLICY "place_lists_safe_update" ON place_lists
FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
  -- 循環参照を避けるため、shared_lists参照は削除
  -- アプリケーション層で編集権限チェックを実装
)
WITH CHECK (
  created_by = auth.uid()
);


