-- ストレージファイル削除準備用の関数
CREATE OR REPLACE FUNCTION prepare_user_storage_cleanup(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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

-- アカウント削除完了確認用の関数
CREATE OR REPLACE FUNCTION confirm_account_deletion_ready(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    remaining_data JSON;
    data_count INTEGER;
    active_subscriptions INTEGER;
    subscription_details JSON;
BEGIN
    -- 削除を阻止すべきサブスクリプション状態の確認（cancel_at_period_endがtrueの場合は除外）
    SELECT COUNT(*) INTO active_subscriptions
    FROM public.subscriptions 
    WHERE user_id = target_user_id 
    AND status IN ('active', 'trialing', 'past_due', 'incomplete', 'unpaid', 'paused')
    AND (cancel_at_period_end IS NULL OR cancel_at_period_end = false);
    
    -- サブスクリプション詳細を取得（キャンセル予定でないもののみ）
    SELECT json_agg(
        json_build_object(
            'id', id,
            'status', status,
            'price_id', price_id,
            'cancel_at_period_end', cancel_at_period_end,
            'created_at', created_at
        )
    ) INTO subscription_details
    FROM public.subscriptions 
    WHERE user_id = target_user_id 
    AND status IN ('active', 'trialing', 'past_due', 'incomplete', 'unpaid', 'paused')
    AND (cancel_at_period_end IS NULL OR cancel_at_period_end = false);
    
    -- 削除を阻止すべきサブスクリプションがある場合は削除を拒否
    IF active_subscriptions > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'アクティブまたは一時停止中のサブスクリプションがあります。先にサブスクリプションをキャンセルしてください。',
            'active_subscriptions', active_subscriptions,
            'subscription_details', subscription_details,
            'ready_for_deletion', false
        );
    END IF;
    
    -- 残存データの確認
    SELECT json_build_object(
        'list_share_tokens', (SELECT COUNT(*) FROM public.list_share_tokens WHERE owner_id = target_user_id),
        'shared_lists_owner', (SELECT COUNT(*) FROM public.shared_lists WHERE owner_id = target_user_id),
        'shared_lists_user', (SELECT COUNT(*) FROM public.shared_lists WHERE shared_with_user_id = target_user_id),
        'list_place_rankings', (SELECT COUNT(*) FROM public.list_place_rankings WHERE created_by = target_user_id),
        'list_places', (SELECT COUNT(*) FROM public.list_places WHERE user_id = target_user_id),
        'tags', (SELECT COUNT(*) FROM public.tags WHERE user_id = target_user_id),
        'place_lists', (SELECT COUNT(*) FROM public.place_lists WHERE created_by = target_user_id),
        'subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE user_id = target_user_id),
        'profiles', (SELECT COUNT(*) FROM public.profiles WHERE id = target_user_id)
    ) INTO remaining_data;
    
    -- 残存データの総数を計算
    SELECT (
        (remaining_data->>'list_share_tokens')::INTEGER +
        (remaining_data->>'shared_lists_owner')::INTEGER +
        (remaining_data->>'shared_lists_user')::INTEGER +
        (remaining_data->>'list_place_rankings')::INTEGER +
        (remaining_data->>'list_places')::INTEGER +
        (remaining_data->>'tags')::INTEGER +
        (remaining_data->>'place_lists')::INTEGER +
        (remaining_data->>'subscriptions')::INTEGER +
        (remaining_data->>'profiles')::INTEGER
    ) INTO data_count;
    
    IF data_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', '関連データが完全に削除されていません',
            'remaining_data', remaining_data,
            'ready_for_deletion', false
        );
    END IF;
    
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

-- 関数のコメント
COMMENT ON FUNCTION prepare_user_storage_cleanup(UUID) IS 'ユーザーのストレージファイル削除準備情報を取得';
COMMENT ON FUNCTION confirm_account_deletion_ready(UUID) IS 'アカウント削除前の最終確認を実行'; 