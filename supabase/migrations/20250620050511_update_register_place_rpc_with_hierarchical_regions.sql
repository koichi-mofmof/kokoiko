-- 階層地域情報対応のためのregister_place_to_list RPC関数更新

-- 既存のregister_place_to_list関数を削除
DROP FUNCTION IF EXISTS register_place_to_list(
    TEXT, TEXT, UUID, UUID, TEXT, NUMERIC, NUMERIC, TEXT[], TEXT, visited_status_enum
);

-- 階層地域情報対応の新しいregister_place_to_list関数
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
    visited_status_input visited_status_enum DEFAULT 'not_visited',
    -- 階層地域情報の新しいパラメータ
    country_code_input TEXT DEFAULT NULL,
    country_name_input TEXT DEFAULT NULL,
    admin_area_level_1_input TEXT DEFAULT NULL,
    region_hierarchy_input JSONB DEFAULT NULL
)
RETURNS UUID -- 作成された list_places の id を返す
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_place_id TEXT;
    new_list_place_id UUID;
    tag_name TEXT;
    current_tag_id UUID;
BEGIN
    -- 1. places テーブルへの UPSERT（階層地域情報を含む）
    INSERT INTO public.places (
        id, 
        google_place_id, 
        name, 
        address, 
        latitude, 
        longitude,
        country_code,
        country_name,
        admin_area_level_1,
        region_hierarchy
    )
    VALUES (
        google_place_id_input, 
        google_place_id_input, 
        place_name_input, 
        place_address_input, 
        place_latitude_input, 
        place_longitude_input,
        country_code_input,
        country_name_input,
        admin_area_level_1_input,
        region_hierarchy_input
    )
    ON CONFLICT (google_place_id) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        country_code = EXCLUDED.country_code,
        country_name = EXCLUDED.country_name,
        admin_area_level_1 = EXCLUDED.admin_area_level_1,
        region_hierarchy = EXCLUDED.region_hierarchy,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO internal_place_id;

    IF internal_place_id IS NULL THEN
        RAISE EXCEPTION 'Failed to upsert place with google_place_id: %', google_place_id_input;
    END IF;

    -- 2. region_hierarchy マスターテーブルの更新（階層地域情報がある場合）
    IF country_code_input IS NOT NULL AND country_name_input IS NOT NULL THEN
        INSERT INTO public.region_hierarchy (
            country_code,
            country_name,
            admin_area_level_1,
            usage_count
        )
        VALUES (
            country_code_input,
            country_name_input,
            admin_area_level_1_input,
            1
        )
        ON CONFLICT (country_code, admin_area_level_1) DO UPDATE SET
            usage_count = region_hierarchy.usage_count + 1,
            updated_at = timezone('utc'::text, now());
    END IF;

    -- 3. list_places テーブルへの INSERT
    INSERT INTO public.list_places (list_id, place_id, user_id, visited_status)
    VALUES (list_id_input, internal_place_id, user_id_input, visited_status_input)
    RETURNING id INTO new_list_place_id;

    IF new_list_place_id IS NULL THEN
        RAISE EXCEPTION 'Failed to insert into list_places for list_id: % and place_id: %', list_id_input, internal_place_id;
    END IF;

    -- 4. list_place_commnts テーブルへのコメント追加（user_comment_inputがある場合）
    IF user_comment_input IS NOT NULL AND TRIM(user_comment_input) != '' THEN
        INSERT INTO public.list_place_commnts (list_place_id, user_id, comment)
        VALUES (new_list_place_id, user_id_input, TRIM(user_comment_input));
    END IF;

    -- 5. tags テーブルおよび list_place_tags テーブルの処理
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
