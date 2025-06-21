-- 未使用暗号化システムの完全削除
-- 調査結果: 暗号化機能は実装されているが実際には使用されていない
-- - 暗号化キーが設定されていない
-- - 全ての暗号化カラム(display_name_encrypted, bio_encrypted)がnull
-- - profiles_decryptedビューは実質的に平文データの参照のみ

-- セキュリティ向上目的: SECURITY DEFINERビューと関連機能を削除

-- =====================================================
-- 1. profiles_decrypted ビューの削除（SECURITY DEFINER除去）
-- =====================================================

-- アプリケーションで使用されているSECURITY DEFINERビューを削除
DROP VIEW IF EXISTS public.profiles_decrypted;

-- =====================================================
-- 2. 暗号化トリガーの削除
-- =====================================================

-- INSERT/UPDATE時の暗号化トリガーを削除
DROP TRIGGER IF EXISTS encrypt_profile_trigger ON public.profiles;

-- =====================================================  
-- 3. 暗号化関数の削除
-- =====================================================

-- 暗号化関数（SECURITY DEFINER）を削除
DROP FUNCTION IF EXISTS public.encrypt_profile_data();

-- 復号化関数（SECURITY DEFINER）を削除  
DROP FUNCTION IF EXISTS public.decrypt_profile_data(TEXT);

-- 暗号化キー設定関数（SECURITY DEFINER）を削除
DROP FUNCTION IF EXISTS public.set_encryption_key(TEXT);

-- 暗号化キー確保関数（SECURITY DEFINER）を削除
DROP FUNCTION IF EXISTS public.ensure_encryption_key();

-- =====================================================
-- 4. 未使用暗号化カラムの削除
-- =====================================================

-- 使用されていない暗号化カラムを削除
ALTER TABLE public.profiles DROP COLUMN IF EXISTS display_name_encrypted;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bio_encrypted;

-- =====================================================
-- 5. 残存する暗号化設定のクリーンアップ
-- =====================================================

-- セッション設定をクリア（可能な場合）
DO $$
BEGIN
    -- 暗号化キー設定を削除
    PERFORM set_config('app.encryption_key', NULL, FALSE);
EXCEPTION
    WHEN OTHERS THEN
        -- エラーが発生しても処理を続行
        NULL;
END $$;

-- =====================================================
-- 6. 削除確認とログ出力
-- =====================================================

DO $$
DECLARE
    remaining_profiles_columns INTEGER;
    remaining_security_definer_functions INTEGER;
    remaining_security_definer_views INTEGER;
BEGIN
    -- profilesテーブルの残存カラム数を確認
    SELECT COUNT(*) INTO remaining_profiles_columns
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name IN ('display_name_encrypted', 'bio_encrypted');
    
    -- SECURITY DEFINER関数の残存数を確認
    SELECT COUNT(*) INTO remaining_security_definer_functions
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND security_type = 'DEFINER'
    AND routine_name IN ('encrypt_profile_data', 'decrypt_profile_data', 'set_encryption_key', 'ensure_encryption_key');
    
    -- SECURITY DEFINERビューの残存数を確認
    SELECT COUNT(*) INTO remaining_security_definer_views
    FROM information_schema.views 
    WHERE table_schema = 'public'
    AND table_name = 'profiles_decrypted';
    
    RAISE NOTICE '暗号化システム削除完了';
    RAISE NOTICE 'profiles_decrypted ビューを削除しました（SECURITY DEFINERリスク除去）';
    RAISE NOTICE '暗号化トリガーを削除しました';
    RAISE NOTICE '暗号化関数を削除しました（4個のSECURITY DEFINER関数）';
    RAISE NOTICE '未使用暗号化カラムを削除しました（2個）';
    RAISE NOTICE '残存する暗号化カラム数: %', remaining_profiles_columns;
    RAISE NOTICE '残存するSECURITY DEFINER暗号化関数数: %', remaining_security_definer_functions;
    RAISE NOTICE '残存するSECURITY DEFINERビュー数: %', remaining_security_definer_views;
    RAISE NOTICE 'セキュリティリスクが大幅に軽減されました';
END $$;

-- =====================================================
-- コメント: 削除した機能について
-- =====================================================

-- 削除された機能:
-- 1. profiles_decrypted ビュー (SECURITY DEFINER)
--    - 実際には暗号化データがなく、平文データの参照のみだった
--    - アプリケーションコードはprofilesテーブル直接参照に変更が必要

-- 2. 暗号化システム (4つのSECURITY DEFINER関数)
--    - encrypt_profile_data(): 暗号化トリガー関数
--    - decrypt_profile_data(): 復号化関数  
--    - set_encryption_key(): キー設定関数
--    - ensure_encryption_key(): キー確保関数

-- 3. 未使用暗号化カラム (2つ)
--    - display_name_encrypted: 全てnull
--    - bio_encrypted: 全てnull

-- セキュリティ向上効果:
-- - SECURITY DEFINERオブジェクトの大幅削減
-- - 攻撃対象面の縮小
-- - コードの複雑性軽減
-- - 保守性の向上
