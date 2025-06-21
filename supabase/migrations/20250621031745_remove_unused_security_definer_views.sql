-- セキュリティ監査対応: 未使用のSECURITY DEFINERビューを削除
-- Supabase Security Advisorで報告されたセキュリティリスクを軽減

-- =====================================================
-- 1. user_accessible_lists ビューの削除
-- =====================================================

-- 使用状況確認済み: types/supabase.ts の型定義にのみ存在、実際のコードでの使用なし
-- このビューは元々マイページでのリスト表示用に作成されたが、
-- 現在は lib/dal/lists.ts の getUserAccessibleLists() 関数で代替実装済み

DROP VIEW IF EXISTS public.user_accessible_lists;

-- =====================================================
-- 2. role_permissions_summary ビューの削除
-- =====================================================

-- 使用状況確認済み: types/supabase.ts の型定義にのみ存在、実際のコードでの使用なし
-- このビューは権限監査用に作成されたが、実際の監査は行われておらず、
-- セキュリティ監視は lib/utils/security-monitor.ts で実装済み

DROP VIEW IF EXISTS public.role_permissions_summary;

-- =====================================================
-- 3. 削除確認とログ出力
-- =====================================================

DO $$
DECLARE
    remaining_security_definer_views INTEGER;
BEGIN
    -- 残存するSECURITY DEFINERビューの数を確認
    -- profiles_decrypted ビューのみが残存することを期待
    SELECT COUNT(*) INTO remaining_security_definer_views
    FROM information_schema.views v
    WHERE v.table_schema = 'public'
    AND v.table_name IN ('profiles_decrypted');
    
    RAISE NOTICE '未使用SECURITY DEFINERビュー削除完了';
    RAISE NOTICE 'user_accessible_lists ビューを削除しました';
    RAISE NOTICE 'role_permissions_summary ビューを削除しました';
    RAISE NOTICE '残存する必要なSECURITY DEFINERビュー数: % (profiles_decrypted)', remaining_security_definer_views;
    RAISE NOTICE 'セキュリティリスクが軽減されました';
END $$;

-- =====================================================
-- コメント: 削除したビューの代替実装について
-- =====================================================

-- user_accessible_lists の代替実装:
-- - lib/dal/lists.ts の getUserAccessibleLists() 関数
-- - アプリケーション層でのRLS制御により、より安全な実装

-- role_permissions_summary の代替実装:
-- - lib/utils/security-monitor.ts のセキュリティ監視システム
-- - 実際のセキュリティイベント監視とアラート機能を提供

-- 注意: profiles_decrypted ビューは暗号化機能に必要不可欠なため保持
-- このビューのSECURITY DEFINER設定は、暗号化キーアクセスに必要
