-- 1. list_place_display_order テーブル作成
CREATE TABLE IF NOT EXISTS public.list_place_display_order (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id uuid NOT NULL REFERENCES public.place_lists(id) ON DELETE CASCADE,
    place_id text NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
    display_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- 同一リスト内での場所の重複を防ぐ
    UNIQUE(list_id, place_id),
    -- 同一リスト内での表示順序の重複を防ぐ
    UNIQUE(list_id, display_order)
);

-- 2. インデックス作成
CREATE INDEX IF NOT EXISTS idx_list_place_display_order_list_id 
    ON public.list_place_display_order(list_id);
CREATE INDEX IF NOT EXISTS idx_list_place_display_order_place_id 
    ON public.list_place_display_order(place_id);
CREATE INDEX IF NOT EXISTS idx_list_place_display_order_order 
    ON public.list_place_display_order(display_order);

-- 3. 場所追加時の表示順序自動生成関数
CREATE OR REPLACE FUNCTION public.auto_generate_display_order()
RETURNS TRIGGER AS $$
DECLARE
    max_order INTEGER;
BEGIN
    -- 現在のリストの最大表示順序を取得
    SELECT COALESCE(MAX(display_order), 0) INTO max_order
    FROM public.list_place_display_order
    WHERE list_id = NEW.list_id;
    
    -- 新しい場所を最後の順序で追加
    INSERT INTO public.list_place_display_order (
        list_id, place_id, display_order
    ) VALUES (
        NEW.list_id, NEW.place_id, max_order + 1
    );
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- 重複の場合はスキップ（既に存在する場合）
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. トリガーの設定
DROP TRIGGER IF EXISTS trigger_auto_generate_display_order ON public.list_places;
CREATE TRIGGER trigger_auto_generate_display_order
    AFTER INSERT ON public.list_places
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_display_order();

-- 5. 場所削除時のクリーンアップ関数
CREATE OR REPLACE FUNCTION public.cleanup_display_order_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- 削除された場所の表示順序エントリを削除
    DELETE FROM public.list_place_display_order
    WHERE list_id = OLD.list_id AND place_id = OLD.place_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 6. 場所削除時のクリーンアップトリガー
DROP TRIGGER IF EXISTS trigger_cleanup_display_order_on_delete ON public.list_places;
CREATE TRIGGER trigger_cleanup_display_order_on_delete
    AFTER DELETE ON public.list_places
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_display_order_on_delete();

-- 7. 既存リストの初期表示順序データ生成
DO $$
DECLARE
    list_place_record RECORD;
    current_list_id uuid := NULL;
    current_order integer := 0;
BEGIN
    -- 既存のlist_placesデータを取得し、リストごとにcreated_at順で順序付け
    FOR list_place_record IN 
        SELECT lp.list_id, lp.place_id, lp.created_at
        FROM public.list_places lp
        ORDER BY lp.list_id, lp.created_at ASC
    LOOP
        -- 新しいリストの場合、順序をリセット
        IF current_list_id IS NULL OR current_list_id != list_place_record.list_id THEN
            current_list_id := list_place_record.list_id;
            current_order := 1;
        ELSE
            current_order := current_order + 1;
        END IF;
        
        -- 表示順序データを挿入（重複チェック付き）
        INSERT INTO public.list_place_display_order (
            list_id, place_id, display_order
        ) VALUES (
            list_place_record.list_id, 
            list_place_record.place_id, 
            current_order
        )
        ON CONFLICT (list_id, place_id) DO NOTHING;
    END LOOP;
END $$;

-- 8. RLS (Row Level Security) ポリシーの設定
ALTER TABLE public.list_place_display_order ENABLE ROW LEVEL SECURITY;

-- 表示順序の参照ポリシー（リストへのアクセス権がある場合）
CREATE POLICY "list_place_display_order_select_policy" ON public.list_place_display_order
    FOR SELECT USING (
        -- リストが公開されている場合
        EXISTS (
            SELECT 1 FROM public.place_lists pl
            WHERE pl.id = list_place_display_order.list_id
            AND pl.is_public = true
        )
        OR
        -- ユーザーがリストの所有者またはコラボレーターの場合
        EXISTS (
            SELECT 1 FROM public.place_lists pl
            WHERE pl.id = list_place_display_order.list_id
            AND (
                pl.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.shared_lists sl
                    WHERE sl.list_id = pl.id
                    AND sl.shared_with_user_id = auth.uid()
                )
            )
        )
    );

-- 表示順序の更新ポリシー（編集権限がある場合）
CREATE POLICY "list_place_display_order_update_policy" ON public.list_place_display_order
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.place_lists pl
            WHERE pl.id = list_place_display_order.list_id
            AND (
                pl.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.shared_lists sl
                    WHERE sl.list_id = pl.id
                    AND sl.shared_with_user_id = auth.uid()
                    AND sl.permission = 'edit'
                )
            )
        )
    );

-- 表示順序の挿入ポリシー（編集権限がある場合）
CREATE POLICY "list_place_display_order_insert_policy" ON public.list_place_display_order
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.place_lists pl
            WHERE pl.id = list_place_display_order.list_id
            AND (
                pl.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.shared_lists sl
                    WHERE sl.list_id = pl.id
                    AND sl.shared_with_user_id = auth.uid()
                    AND sl.permission = 'edit'
                )
            )
        )
    );

-- 表示順序の削除ポリシー（編集権限がある場合）
CREATE POLICY "list_place_display_order_delete_policy" ON public.list_place_display_order
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.place_lists pl
            WHERE pl.id = list_place_display_order.list_id
            AND (
                pl.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.shared_lists sl
                    WHERE sl.list_id = pl.id
                    AND sl.shared_with_user_id = auth.uid()
                    AND sl.permission = 'edit'
                )
            )
        )
    );
