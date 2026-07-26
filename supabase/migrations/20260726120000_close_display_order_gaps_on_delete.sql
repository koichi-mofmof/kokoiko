-- 地点削除時に display_order の穴を詰める
--
-- これまでの cleanup_display_order_on_delete は該当行を DELETE するだけで、
-- 後続の display_order を詰めていなかった。そのため中間の地点を削除すると
-- 1,2,4,5... のような飛び番になり、リスト画面の順序バッジに穴が空いていた。

-- 1. UNIQUE(list_id, display_order) を DEFERRABLE にする
--    後続行をまとめて -1 する UPDATE は、行の処理順によっては
--    「まだ更新していない行」と一時的に値が衝突しうる。
--    検査をトランザクション終端まで遅延させることで安全に詰められる。
--    ※ もう一方の UNIQUE(list_id, place_id) は ON CONFLICT の
--      競合ターゲットに使われているため、非 DEFERRABLE のまま残す。
ALTER TABLE public.list_place_display_order
  DROP CONSTRAINT IF EXISTS list_place_display_order_list_id_display_order_key;

ALTER TABLE public.list_place_display_order
  ADD CONSTRAINT list_place_display_order_list_id_display_order_key
  UNIQUE (list_id, display_order) DEFERRABLE INITIALLY DEFERRED;

-- 2. 削除トリガーで後続の順序を詰める
--    呼び出し元の delete_list_place_cascade が search_path='' の
--    SECURITY DEFINER のため、オブジェクトはすべて完全修飾する。
CREATE OR REPLACE FUNCTION public.cleanup_display_order_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    deleted_order INTEGER;
BEGIN
    -- 削除された場所の表示順序エントリを削除し、その順序を取得
    DELETE FROM public.list_place_display_order
    WHERE list_id = OLD.list_id AND place_id = OLD.place_id
    RETURNING display_order INTO deleted_order;

    -- 空いた分だけ後続を前へ詰める
    IF deleted_order IS NOT NULL THEN
        UPDATE public.list_place_display_order
        SET display_order = display_order - 1,
            updated_at = now()
        WHERE list_id = OLD.list_id
          AND display_order > deleted_order;
    END IF;

    RETURN OLD;
END;
$$;
