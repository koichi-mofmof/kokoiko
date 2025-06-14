-- Function Search Path Security Fix Migration
-- 全ての関数のsearch_pathを空文字列に設定してセキュリティ警告を修正

-- =====================================================
-- 1. 暗号化関連関数の修正
-- =====================================================

CREATE OR REPLACE FUNCTION decrypt_profile_data(encrypted_data TEXT) 
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT := current_setting('app.encryption_key', TRUE);
BEGIN
  -- Use a default key if not set (for development)
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'clippymap_default_key_change_in_production_2024';
  END IF;
  
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_decrypt(
    decode(encrypted_data, 'base64'),
    encryption_key
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails, return NULL
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION set_encryption_key(new_key TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.encryption_key', new_key, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION encrypt_profile_data() 
RETURNS TRIGGER AS $$
DECLARE
  encryption_key TEXT := current_setting('app.encryption_key', TRUE);
BEGIN
  -- Use a default key if not set (for development - in production this should be set properly)
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'clippymap_default_key_change_in_production_2024';
  END IF;
  
  -- Encrypt display_name if present
  IF NEW.display_name IS NOT NULL THEN
    NEW.display_name_encrypted = encode(
      pgp_sym_encrypt(NEW.display_name, encryption_key),
      'base64'
    );
  ELSE
    NEW.display_name_encrypted = NULL;
  END IF;
  
  -- Encrypt bio if present
  IF NEW.bio IS NOT NULL THEN
    NEW.bio_encrypted = encode(
      pgp_sym_encrypt(NEW.bio, encryption_key),
      'base64'
    );
  ELSE
    NEW.bio_encrypted = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================
-- 2. ユーザー管理関数の修正
-- =====================================================

CREATE OR REPLACE FUNCTION delete_user_data_transaction(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    deleted_counts JSON;
    list_place_ids UUID[];
    row_count INTEGER;
    storage_files TEXT[];
    user_email TEXT;
BEGIN
    -- トランザクション開始（関数内では自動的にトランザクション）
    
    -- 削除カウントを記録するための変数を初期化
    deleted_counts := '{}';
    
    -- 0. ユーザー情報を取得（ストレージファイル削除用）
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = target_user_id;
    
    IF user_email IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', '削除対象のユーザーが見つかりません'
        );
    END IF;
    
    -- ストレージファイルパスを構築（プロフィール画像）
    storage_files := ARRAY[target_user_id::TEXT];
    
    -- 1. list_share_tokens の削除
    DELETE FROM public.list_share_tokens 
    WHERE owner_id = target_user_id;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := jsonb_set(
        deleted_counts::jsonb, 
        '{list_share_tokens}', 
        to_jsonb(row_count)
    );
    
    -- 2. shared_lists の削除（オーナーとして）
    DELETE FROM public.shared_lists 
    WHERE owner_id = target_user_id;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := jsonb_set(
        deleted_counts::jsonb, 
        '{shared_lists_owner}', 
        to_jsonb(row_count)
    );
    
    -- 3. shared_lists の削除（共有されたユーザーとして）
    DELETE FROM public.shared_lists 
    WHERE shared_with_user_id = target_user_id;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := jsonb_set(
        deleted_counts::jsonb, 
        '{shared_lists_shared_with}', 
        to_jsonb(row_count)
    );
    
    -- 4. list_place_ids を取得（後続の削除で使用）
    SELECT array_agg(id) INTO list_place_ids
    FROM public.list_places 
    WHERE user_id = target_user_id;
    
    -- 5. list_place_tags の削除
    IF array_length(list_place_ids, 1) > 0 THEN
        DELETE FROM public.list_place_tags 
        WHERE list_place_id = ANY(list_place_ids);
        
        GET DIAGNOSTICS row_count = ROW_COUNT;
        deleted_counts := jsonb_set(
            deleted_counts::jsonb, 
            '{list_place_tags}', 
            to_jsonb(row_count)
        );
    END IF;
    
    -- 6. list_place_commnts の削除
    IF array_length(list_place_ids, 1) > 0 THEN
        DELETE FROM public.list_place_commnts 
        WHERE list_place_id = ANY(list_place_ids);
        
        GET DIAGNOSTICS row_count = ROW_COUNT;
        deleted_counts := jsonb_set(
            deleted_counts::jsonb, 
            '{list_place_commnts}', 
            to_jsonb(row_count)
        );
    END IF;
    
    -- 7. list_place_rankings の削除
    DELETE FROM public.list_place_rankings 
    WHERE created_by = target_user_id;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := jsonb_set(
        deleted_counts::jsonb, 
        '{list_place_rankings}', 
        to_jsonb(row_count)
    );
    
    -- 8. list_places の削除
    DELETE FROM public.list_places 
    WHERE user_id = target_user_id;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := jsonb_set(
        deleted_counts::jsonb, 
        '{list_places}', 
        to_jsonb(row_count)
    );
    
    -- 9. tags の削除（ユーザー固有）
    DELETE FROM public.tags 
    WHERE user_id = target_user_id;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := jsonb_set(
        deleted_counts::jsonb, 
        '{tags}', 
        to_jsonb(row_count)
    );
    
    -- 10. place_lists の削除
    DELETE FROM public.place_lists 
    WHERE created_by = target_user_id;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := jsonb_set(
        deleted_counts::jsonb, 
        '{place_lists}', 
        to_jsonb(row_count)
    );
    
    -- 11. profiles の削除
    DELETE FROM public.profiles 
    WHERE id = target_user_id;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := jsonb_set(
        deleted_counts::jsonb, 
        '{profiles}', 
        to_jsonb(row_count)
    );
    
    -- 削除結果を返す
    RETURN json_build_object(
        'success', true,
        'message', 'ユーザーデータの削除が完了しました',
        'deleted_counts', deleted_counts,
        'storage_files', storage_files,
        'user_email', user_email,
        'ready_for_account_deletion', true
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- エラー時は自動的にロールバックされる
        RETURN json_build_object(
            'success', false,
            'message', 'ユーザーデータの削除中にエラーが発生しました',
            'error_code', SQLSTATE,
            'error_message', SQLERRM,
            'ready_for_account_deletion', false
        );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  google_display_name TEXT;
  google_avatar_url TEXT;
BEGIN
  -- プロファイルが既に存在するかチェック
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    
    -- Googleアカウント情報を取得
    -- user_metadataからfull_name, name, avatar_url, pictureを取得
    google_display_name := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    );
    
    google_avatar_url := COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    );
    
    -- プロファイルを作成
    INSERT INTO public.profiles (id, username, display_name, bio, avatar_url)
    VALUES (
      NEW.id, 
      'user_' || substr(NEW.id::text, 1, 8),
      google_display_name,
      NULL,
      google_avatar_url
    );
    
    -- ログ出力（開発時のデバッグ用）
    RAISE LOG 'プロファイルを作成しました: user_id=%, display_name=%, avatar_url=%', 
      NEW.id, google_display_name, google_avatar_url;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生してもユーザー作成は継続
    RAISE WARNING 'プロファイル作成中にエラーが発生しました: user_id=%, error=%', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION prepare_user_storage_cleanup(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_exists BOOLEAN;
    profile_image_path TEXT;
BEGIN
    -- ユーザーの存在確認
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = target_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN json_build_object(
            'success', false,
            'message', '対象ユーザーが見つかりません'
        );
    END IF;
    
    -- プロフィール画像のパスを構築
    profile_image_path := target_user_id::TEXT;
    
    -- ストレージクリーンアップ情報を返す
    RETURN json_build_object(
        'success', true,
        'message', 'ストレージクリーンアップ準備完了',
        'storage_paths', json_build_object(
            'profile_images', profile_image_path
        ),
        'user_id', target_user_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'ストレージクリーンアップ準備中にエラーが発生しました',
            'error_code', SQLSTATE,
            'error_message', SQLERRM
        );
END;
$$;

CREATE OR REPLACE FUNCTION confirm_account_deletion_ready(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    remaining_data JSON;
    data_count INTEGER;
    active_subscriptions INTEGER;
    subscription_details JSON;
BEGIN
    -- アクティブなサブスクリプションの確認
    active_subscriptions := 0;
    subscription_details := '{}';
    
    -- 残存データの確認
    WITH data_counts AS (
        SELECT 
            (SELECT COUNT(*) FROM public.profiles WHERE id = target_user_id) as profiles,
            (SELECT COUNT(*) FROM public.place_lists WHERE created_by = target_user_id) as place_lists,
            (SELECT COUNT(*) FROM public.list_places WHERE user_id = target_user_id) as list_places,
            (SELECT COUNT(*) FROM public.tags WHERE user_id = target_user_id) as tags,
            (SELECT COUNT(*) FROM public.shared_lists WHERE owner_id = target_user_id OR shared_with_user_id = target_user_id) as shared_lists,
            (SELECT COUNT(*) FROM public.list_share_tokens WHERE owner_id = target_user_id) as list_share_tokens,
            (SELECT COUNT(*) FROM public.list_place_rankings WHERE created_by = target_user_id) as list_place_rankings
    )
    SELECT 
        json_build_object(
            'profiles', profiles,
            'place_lists', place_lists,
            'list_places', list_places,
            'tags', tags,
            'shared_lists', shared_lists,
            'list_share_tokens', list_share_tokens,
            'list_place_rankings', list_place_rankings,
            'total', profiles + place_lists + list_places + tags + shared_lists + list_share_tokens + list_place_rankings
        ),
        profiles + place_lists + list_places + tags + shared_lists + list_share_tokens + list_place_rankings
    INTO remaining_data, data_count
    FROM data_counts;
    
    -- データが残存している場合
    IF data_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'まだ削除されていないデータが存在します',
            'remaining_data', remaining_data,
            'ready_for_deletion', false
        );
    END IF;
    
    -- サブスクリプションがアクティブな場合
    IF active_subscriptions > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'アクティブなサブスクリプションが存在します',
            'remaining_data', remaining_data,
            'subscription_details', subscription_details,
            'ready_for_deletion', false
        );
    END IF;
    
    -- 全てのチェックをパス
    RETURN json_build_object(
        'success', true,
        'message', '全ての関連データが削除され、アカウント削除の準備が完了しました',
        'remaining_data', remaining_data,
        'ready_for_deletion', true
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'アカウント削除準備確認中にエラーが発生しました',
            'error_code', SQLSTATE,
            'error_message', SQLERRM,
            'ready_for_deletion', false
        );
END;
$$;

-- =====================================================
-- 3. RLS セキュリティ関数の修正
-- =====================================================

CREATE OR REPLACE FUNCTION has_list_place_access(
  list_place_uuid UUID,
  access_type TEXT DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
  list_uuid UUID;
BEGIN
  -- list_places から list_id を取得
  SELECT list_id INTO list_uuid
  FROM public.list_places 
  WHERE id = list_place_uuid;
  
  -- レコードが存在しない場合
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- リストアクセス権限をチェック
  RETURN has_list_access(list_uuid, access_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION is_own_data(
  data_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- 未ログインの場合はFALSE
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN current_user_id = data_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================
-- 4. タイムスタンプトリガー関数の修正
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- =====================================================
-- 5. リスト管理関数の修正
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_my_place_lists(user_id UUID)
RETURNS SETOF place_lists
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT * FROM public.place_lists
  WHERE created_by = user_id
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_shared_lists_for_user(p_user_id UUID)
RETURNS TABLE(
  list_id UUID,
  list_name TEXT,
  list_description TEXT,
  list_is_public BOOLEAN,
  list_created_at TIMESTAMPTZ,
  list_updated_at TIMESTAMPTZ,
  list_created_by UUID,
  permission TEXT
) LANGUAGE sql SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    pl.id as list_id,
    pl.name as list_name,
    pl.description as list_description,
    pl.is_public as list_is_public,
    pl.created_at as list_created_at,
    pl.updated_at as list_updated_at,
    pl.created_by as list_created_by,
    sl.permission::TEXT
  FROM
    public.shared_lists sl
    JOIN public.place_lists pl ON sl.list_id = pl.id
  WHERE
    sl.shared_with_user_id = p_user_id;
$$;

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
SET search_path = ''
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

    -- 3. list_place_commnts テーブルへのコメント追加（user_comment_inputがある場合）
    IF user_comment_input IS NOT NULL AND TRIM(user_comment_input) != '' THEN
        INSERT INTO public.list_place_commnts (list_place_id, user_id, comment)
        VALUES (new_list_place_id, user_id_input, TRIM(user_comment_input));
    END IF;

    -- 4. tags テーブルおよび list_place_tags テーブルの処理
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

CREATE OR REPLACE FUNCTION update_list_place_and_tags(
  p_list_place_id uuid,
  p_visited_status visited_status_enum DEFAULT NULL,
  p_tags text[] DEFAULT NULL, -- タグ名配列
  p_user_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  tag_name text;
  v_tag_id uuid;
BEGIN
  -- list_placesの更新
  UPDATE public.list_places
  SET
    visited_status = COALESCE(p_visited_status, visited_status),
    updated_at = NOW()
  WHERE id = p_list_place_id;

  -- list_place_tagsの全削除
  DELETE FROM public.list_place_tags WHERE list_place_id = p_list_place_id;

  -- 新しいタグを挿入
  IF p_tags IS NOT NULL THEN
    FOREACH tag_name IN ARRAY p_tags
    LOOP
      IF TRIM(tag_name) = '' THEN
        CONTINUE;
      END IF;

      -- 既存タグを検索（ユーザーごと）
      SELECT id INTO v_tag_id FROM public.tags WHERE name = TRIM(tag_name) AND user_id = p_user_id;

      -- なければ新規作成
      IF v_tag_id IS NULL THEN
        INSERT INTO public.tags (name, user_id)
        VALUES (TRIM(tag_name), p_user_id)
        RETURNING id INTO v_tag_id;
      END IF;

      -- list_place_tagsに紐付け
      IF v_tag_id IS NOT NULL THEN
        INSERT INTO public.list_place_tags (list_place_id, tag_id, assigned_at)
        VALUES (p_list_place_id, v_tag_id, NOW())
        ON CONFLICT (list_place_id, tag_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.delete_list_place_cascade(p_list_place_id uuid)
RETURNS void AS $$
DECLARE
  v_list_id uuid;
  v_place_id text;
BEGIN
  -- list_placesからlist_id, place_idを取得
  SELECT list_id, place_id INTO v_list_id, v_place_id FROM public.list_places WHERE id = p_list_place_id;

  -- コメント削除
  DELETE FROM public.list_place_commnts WHERE list_place_id = p_list_place_id;
  -- タグ削除
  DELETE FROM public.list_place_tags WHERE list_place_id = p_list_place_id;
  -- ランキング削除（list_id, place_idで紐付け）
  DELETE FROM public.list_place_rankings WHERE list_id = v_list_id AND place_id = v_place_id;
  -- list_places本体削除
  DELETE FROM public.list_places WHERE id = p_list_place_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.create_place_list(
  p_name text,
  p_description text,
  p_is_public boolean,
  p_created_by uuid
) RETURNS uuid AS $$
DECLARE
  v_new_id uuid;
BEGIN
  INSERT INTO public.place_lists (name, description, is_public, created_by)
  VALUES (p_name, p_description, p_is_public, p_created_by)
  RETURNING id INTO v_new_id;
  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.delete_place_list(
  p_id uuid,
  p_user_id uuid
) RETURNS boolean AS $$
BEGIN
  -- 共有トークン削除
  DELETE FROM public.list_share_tokens WHERE list_id = p_id;
  -- 共有設定削除
  DELETE FROM public.shared_lists WHERE list_id = p_id;
  -- list_place_tags削除
  DELETE FROM public.list_place_tags WHERE list_place_id IN (SELECT id FROM public.list_places WHERE list_id = p_id);
  -- list_place_rankings削除
  DELETE FROM public.list_place_rankings WHERE list_id = p_id;
  -- list_places削除（ON DELETE CASCADEでlist_place_commntsも消える想定）
  DELETE FROM public.list_places WHERE list_id = p_id;
  -- place_lists本体削除
  DELETE FROM public.place_lists WHERE id = p_id AND created_by = p_user_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.has_list_access(
  list_uuid UUID, 
  access_type TEXT DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
  list_record RECORD;
  user_id UUID;
BEGIN
  -- 現在のユーザーIDを取得
  user_id := auth.uid();
  
  -- リストの基本情報を取得
  SELECT id, created_by, is_public 
  INTO list_record
  FROM public.place_lists 
  WHERE id = list_uuid;
  
  -- リストが存在しない場合
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- 公開リストの場合（未ログインユーザーでもview可能）
  IF list_record.is_public = true AND access_type = 'view' THEN
    RETURN TRUE;
  END IF;
  
  -- 未ログインユーザーの場合、公開リスト以外はアクセス不可
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- オーナーの場合（全権限）
  IF list_record.created_by = user_id THEN
    RETURN TRUE;
  END IF;
  
  -- 共有ユーザーの場合
  IF access_type = 'view' THEN
    -- view権限: view または edit 権限があればOK
    RETURN EXISTS (
      SELECT 1 FROM public.shared_lists 
      WHERE list_id = list_uuid 
      AND shared_with_user_id = user_id
      AND permission IN ('view', 'edit')
    );
  ELSIF access_type = 'edit' THEN
    -- edit権限: edit 権限が必要
    RETURN EXISTS (
      SELECT 1 FROM public.shared_lists 
      WHERE list_id = list_uuid 
      AND shared_with_user_id = user_id
      AND permission = 'edit'
    );
  END IF;
  
  -- その他の場合はアクセス拒否
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION is_publicly_accessible(
  list_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.place_lists 
    WHERE id = list_uuid 
    AND is_public = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION is_owner(
  user_id UUID,
  list_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- user_idがNULLの場合は即座にFALSE
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.place_lists 
    WHERE id = list_uuid 
    AND created_by = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION is_collaborator(
  user_id UUID,
  list_uuid UUID,
  required_permission TEXT DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
BEGIN
  -- user_idがNULLの場合は即座にFALSE
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- オーナーの場合は常にTRUE
  IF is_owner(user_id, list_uuid) THEN
    RETURN TRUE;
  END IF;
  
  -- 共有権限をチェック
  IF required_permission = 'view' THEN
    -- view権限: view または edit があればOK
    RETURN EXISTS (
      SELECT 1 FROM public.shared_lists 
      WHERE list_id = list_uuid 
      AND shared_with_user_id = user_id
      AND permission IN ('view', 'edit')
    );
  ELSIF required_permission = 'edit' THEN
    -- edit権限: edit が必要
    RETURN EXISTS (
      SELECT 1 FROM public.shared_lists 
      WHERE list_id = list_uuid 
      AND shared_with_user_id = user_id
      AND permission = 'edit'
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION has_place_access_via_lists(
  place_id_param TEXT,
  access_type TEXT DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  user_id := auth.uid();
  
  -- 公開リストに含まれる場所の場合（未ログインでもview可能）
  IF access_type = 'view' THEN
    IF EXISTS (
      SELECT 1 FROM public.list_places lp
      JOIN public.place_lists pl ON lp.list_id = pl.id
      WHERE lp.place_id = place_id_param
      AND pl.is_public = true
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- 未ログインユーザーの場合、公開リスト以外はアクセス不可
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 認証済みユーザー: アクセス可能なリストに含まれる場所
  RETURN EXISTS (
    SELECT 1 FROM public.list_places lp
    JOIN public.place_lists pl ON lp.list_id = pl.id
    WHERE lp.place_id = place_id_param
    AND (
      pl.created_by = user_id
      OR EXISTS (
        SELECT 1 FROM public.shared_lists sl
        WHERE sl.list_id = pl.id
        AND sl.shared_with_user_id = user_id
        AND (
          access_type = 'view' AND sl.permission IN ('view', 'edit')
          OR access_type = 'edit' AND sl.permission = 'edit'
        )
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION check_shared_lists_owner_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- INSERT/UPDATE時にowner_idがplace_lists.created_byと一致することを確認
  -- SECURITY DEFINERにより、RLS制限を回避してplace_listsにアクセス可能
  IF NOT EXISTS (
    SELECT 1 FROM public.place_lists pl
    WHERE pl.id = NEW.list_id
    AND pl.created_by = NEW.owner_id
  ) THEN
    RAISE EXCEPTION 'owner_id must match the created_by of the corresponding place_list';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_place_list(
  p_id uuid,
  p_name text,
  p_description text,
  p_is_public boolean,
  p_user_id uuid
) RETURNS boolean AS $$
BEGIN
  UPDATE public.place_lists
  SET name = p_name,
      description = p_description,
      is_public = p_is_public,
      updated_at = NOW()
  WHERE id = p_id AND created_by = p_user_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================
-- コメントと確認ログ
-- =====================================================

-- Migration: Function Search Path Security Fix
-- すべての関数にSET search_path = ''を追加してセキュリティ警告を修正

-- セキュリティ修正完了ログ
DO $$
BEGIN
  RAISE NOTICE 'Function Search Path Security Fix: 24個の関数すべてにSET search_path = ''''を適用完了';
  RAISE NOTICE 'セキュリティ強化: SQLインジェクション攻撃と関数偽装攻撃を防止';
END $$;
