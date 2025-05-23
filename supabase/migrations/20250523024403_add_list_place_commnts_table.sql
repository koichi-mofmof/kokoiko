-- コメント用テーブル: list_place_commnts
CREATE TABLE list_place_commnts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_place_id UUID NOT NULL REFERENCES list_places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE list_place_commnts IS 'リスト内の場所に対するユーザーコメント（複数可）';
CREATE INDEX idx_list_place_commnts_list_place_id ON list_place_commnts(list_place_id);
CREATE INDEX idx_list_place_commnts_user_id ON list_place_commnts(user_id);

-- updated_at自動更新トリガー
CREATE TRIGGER set_list_place_commnts_updated_at
BEFORE UPDATE ON list_place_commnts
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- RLS有効化
ALTER TABLE list_place_commnts ENABLE ROW LEVEL SECURITY;

-- 閲覧: 該当リストの閲覧権限があるユーザーのみ
CREATE POLICY "Allow read for list viewers" ON list_place_commnts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_commnts.list_place_id
      AND (
        pl.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM shared_lists sl
          WHERE sl.list_id = pl.id AND sl.shared_with_user_id = auth.uid()
        )
        OR pl.is_public = TRUE
      )
  )
);

-- 投稿: 該当リストの編集権限があるユーザーのみ
CREATE POLICY "Allow insert for list editors" ON list_place_commnts FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM list_places lp
    JOIN place_lists pl ON lp.list_id = pl.id
    WHERE lp.id = list_place_commnts.list_place_id
      AND (
        pl.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM shared_lists sl
          WHERE sl.list_id = pl.id AND sl.shared_with_user_id = auth.uid() AND sl.permission = 'edit'
        )
      )
  )
);

-- 編集: 自分のコメントのみ
CREATE POLICY "Allow update own comment" ON list_place_commnts FOR UPDATE USING (
  user_id = auth.uid()
);

-- 削除: 自分のコメントのみ
CREATE POLICY "Allow delete own comment" ON list_place_commnts FOR DELETE USING (
  user_id = auth.uid()
);

-- 既存のuser_commentをlist_place_commntsに移行
INSERT INTO list_place_commnts (id, list_place_id, user_id, comment, created_at, updated_at)
SELECT
  uuid_generate_v4(),         -- 新規UUID
  lp.id,                      -- list_place_id
  lp.user_id,                 -- user_id
  lp.user_comment,            -- comment
  lp.created_at,              -- created_at
  lp.updated_at               -- updated_at
FROM list_places lp
WHERE lp.user_comment IS NOT NULL AND TRIM(lp.user_comment) <> '';

-- list_placesテーブルからuser_commentカラムを削除
ALTER TABLE list_places DROP COLUMN IF EXISTS user_comment;

-- 旧register_place_to_list関数を削除
DROP FUNCTION IF EXISTS register_place_to_list;

-- user_commentカラムを使わない新仕様でregister_place_to_list関数を再定義
CREATE OR REPLACE FUNCTION register_place_to_list(
    google_place_id_input TEXT,
    place_name_input TEXT,
    list_id_input UUID,
    user_id_input UUID,
    place_address_input TEXT DEFAULT NULL,
    place_latitude_input NUMERIC DEFAULT NULL,
    place_longitude_input NUMERIC DEFAULT NULL,
    tag_names_input TEXT[] DEFAULT ARRAY[]::TEXT[],
    user_comment_input TEXT DEFAULT NULL,
    visited_status_input visited_status_enum DEFAULT 'not_visited'
)
RETURNS UUID -- 作成された list_places の id を返す
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    internal_place_id TEXT;
    new_list_place_id UUID;
    tag_name TEXT;
    current_tag_id UUID;
BEGIN
    -- 1. places テーブルへの UPSERT
    INSERT INTO public.places (id, google_place_id, name, address, latitude, longitude)
    VALUES (google_place_id_input, google_place_id_input, place_name_input, place_address_input, place_latitude_input, place_longitude_input)
    ON CONFLICT (google_place_id) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO internal_place_id;

    IF internal_place_id IS NULL THEN
        RAISE EXCEPTION 'Failed to upsert place with google_place_id: %', google_place_id_input;
    END IF;

    -- 2. list_places テーブルへの INSERT（user_commentは廃止）
    INSERT INTO public.list_places (list_id, place_id, user_id, visited_status)
    VALUES (list_id_input, internal_place_id, user_id_input, visited_status_input)
    RETURNING id INTO new_list_place_id;

    IF new_list_place_id IS NULL THEN
        RAISE EXCEPTION 'Failed to insert into list_places for list_id: % and place_id: %', list_id_input, internal_place_id;
    END IF;

    -- コメントがあればlist_place_commntsにINSERT
    IF user_comment_input IS NOT NULL AND TRIM(user_comment_input) <> '' THEN
        INSERT INTO public.list_place_commnts (list_place_id, user_id, comment)
        VALUES (new_list_place_id, user_id_input, user_comment_input);
    END IF;

    -- 3. tags テーブルおよび list_place_tags テーブルの処理
    IF array_length(tag_names_input, 1) > 0 THEN
        FOREACH tag_name IN ARRAY tag_names_input
        LOOP
            IF TRIM(tag_name) = '' THEN
                CONTINUE;
            END IF;

            SELECT id INTO current_tag_id
            FROM public.tags
            WHERE name = TRIM(tag_name) AND user_id = user_id_input;

            IF current_tag_id IS NULL THEN
                INSERT INTO public.tags (name, user_id)
                VALUES (TRIM(tag_name), user_id_input)
                RETURNING id INTO current_tag_id;
            END IF;
            
            IF current_tag_id IS NULL THEN
                RAISE WARNING 'Failed to upsert tag: % for user_id: %', TRIM(tag_name), user_id_input;
                CONTINUE; 
            END IF;

            INSERT INTO public.list_place_tags (list_place_id, tag_id)
            VALUES (new_list_place_id, current_tag_id)
            ON CONFLICT (list_place_id, tag_id) DO NOTHING;
        END LOOP;
    END IF;

    RETURN new_list_place_id;
END;
$$;
