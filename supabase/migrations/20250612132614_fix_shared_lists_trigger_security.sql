-- shared_lists整合性チェック関数をSECURITY DEFINERに変更
-- 共有リンク経由での参加時にRLS制限を回避するため

-- トリガーを削除
DROP TRIGGER IF EXISTS shared_lists_owner_consistency_trigger ON shared_lists;

-- 既存の関数を削除
DROP FUNCTION IF EXISTS check_shared_lists_owner_consistency();

-- SECURITY DEFINERで関数を再作成
CREATE OR REPLACE FUNCTION check_shared_lists_owner_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- 関数の所有者（postgres）の権限で実行
AS $$
BEGIN
  -- INSERT/UPDATE時にowner_idがplace_lists.created_byと一致することを確認
  -- SECURITY DEFINERにより、RLS制限を回避してplace_listsにアクセス可能
  IF NOT EXISTS (
    SELECT 1 FROM place_lists pl
    WHERE pl.id = NEW.list_id
    AND pl.created_by = NEW.owner_id
  ) THEN
    RAISE EXCEPTION 'owner_id must match the created_by of the corresponding place_list';
  END IF;
  
  RETURN NEW;
END;
$$;
