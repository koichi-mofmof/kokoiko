-- アカウント削除用のトランザクション処理関数
CREATE OR REPLACE FUNCTION delete_user_data_transaction(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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
        '{shared_lists_user}', 
        to_jsonb(row_count)
    );
    
    -- 4. list_place_rankings の削除
    DELETE FROM public.list_place_rankings 
    WHERE created_by = target_user_id;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := jsonb_set(
        deleted_counts::jsonb, 
        '{list_place_rankings}', 
        to_jsonb(row_count)
    );
    
    -- 5. ユーザーのlist_placesのIDを取得
    SELECT array_agg(id) INTO list_place_ids
    FROM public.list_places 
    WHERE user_id = target_user_id;
    
    -- 6. list_place_tags の削除（list_place_ids経由）
    IF list_place_ids IS NOT NULL AND array_length(list_place_ids, 1) > 0 THEN
        DELETE FROM public.list_place_tags 
        WHERE list_place_id = ANY(list_place_ids);
        
        GET DIAGNOSTICS row_count = ROW_COUNT;
        deleted_counts := jsonb_set(
            deleted_counts::jsonb, 
            '{list_place_tags}', 
            to_jsonb(row_count)
        );
        
        -- 7. list_place_commnts の削除（list_place_ids経由）
        DELETE FROM public.list_place_commnts 
        WHERE list_place_id = ANY(list_place_ids);
        
        GET DIAGNOSTICS row_count = ROW_COUNT;
        deleted_counts := jsonb_set(
            deleted_counts::jsonb, 
            '{list_place_commnts_by_list}', 
            to_jsonb(row_count)
        );
    ELSE
        deleted_counts := jsonb_set(deleted_counts::jsonb, '{list_place_tags}', '0');
        deleted_counts := jsonb_set(deleted_counts::jsonb, '{list_place_commnts_by_list}', '0');
    END IF;
    
    -- 8. ユーザーが作成したコメントの削除（他のユーザーのlist_placesに対するコメント）
    DELETE FROM public.list_place_commnts 
    WHERE user_id = target_user_id;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := jsonb_set(
        deleted_counts::jsonb, 
        '{list_place_commnts_by_user}', 
        to_jsonb(row_count)
    );
    
    -- 9. list_places の削除
    DELETE FROM public.list_places 
    WHERE user_id = target_user_id;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := jsonb_set(
        deleted_counts::jsonb, 
        '{list_places}', 
        to_jsonb(row_count)
    );
    
    -- 10. tags の削除
    DELETE FROM public.tags 
    WHERE user_id = target_user_id;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := jsonb_set(
        deleted_counts::jsonb, 
        '{tags}', 
        to_jsonb(row_count)
    );
    
    -- 11. place_lists の削除（CASCADE で関連データも削除される）
    DELETE FROM public.place_lists 
    WHERE created_by = target_user_id;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := jsonb_set(
        deleted_counts::jsonb, 
        '{place_lists}', 
        to_jsonb(row_count)
    );
    
    -- 12. subscriptions の削除
    DELETE FROM public.subscriptions 
    WHERE user_id = target_user_id;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := jsonb_set(
        deleted_counts::jsonb, 
        '{subscriptions}', 
        to_jsonb(row_count)
    );
    
    -- 13. profiles の削除
    DELETE FROM public.profiles 
    WHERE id = target_user_id;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := jsonb_set(
        deleted_counts::jsonb, 
        '{profiles}', 
        to_jsonb(row_count)
    );
    
    -- 成功時のレスポンス（ストレージファイル情報も含む）
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

-- この関数はservice_role権限でのみ実行可能
COMMENT ON FUNCTION delete_user_data_transaction(UUID) IS 'ユーザーアカウント削除時の関連データを一括削除するトランザクション処理';
