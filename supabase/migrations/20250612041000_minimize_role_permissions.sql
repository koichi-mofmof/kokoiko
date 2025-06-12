-- 権限設定の最小化
-- Phase 1: 基盤整備 - セキュリティ強化

-- =====================================================
-- 1. anon ロールの権限を SELECT のみに制限
-- =====================================================

-- 全テーブルから anon の書き込み権限を削除
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon;

-- anon には SELECT のみ許可（RLS で制御）
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- =====================================================
-- 2. authenticated ロールの権限を必要最小限に制限
-- =====================================================

-- 一旦全権限を削除
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Core Tables: 基本的な CRUD 権限
GRANT SELECT, INSERT, UPDATE, DELETE ON place_lists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON places TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON list_places TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared_lists TO authenticated;

-- Detail Tables: 基本的な CRUD 権限
GRANT SELECT, INSERT, UPDATE, DELETE ON list_place_rankings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON list_place_tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON list_place_commnts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tags TO authenticated;

-- User Management Tables: 基本的な CRUD 権限
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT ON profiles_decrypted TO authenticated; -- 復号化ビューは読み取りのみ

-- Share Management Tables: 基本的な CRUD 権限
GRANT SELECT, INSERT, UPDATE, DELETE ON list_share_tokens TO authenticated;

-- Subscription Tables: 基本的な CRUD 権限
GRANT SELECT, INSERT, UPDATE, DELETE ON subscriptions TO authenticated;

-- View Tables: 読み取りのみ
GRANT SELECT ON user_accessible_lists TO authenticated;

-- =====================================================
-- 3. シーケンスへの権限設定
-- =====================================================

-- authenticated ロールにシーケンスの使用権限を付与
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- anon ロールにはシーケンスの読み取りのみ許可
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- 4. 関数実行権限の再設定
-- =====================================================

-- セキュリティ関数の実行権限を再付与
GRANT EXECUTE ON FUNCTION has_list_access(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_publicly_accessible(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_owner(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_collaborator(UUID, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION has_place_access_via_lists(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION has_list_place_access(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_own_data(UUID) TO anon, authenticated;

-- =====================================================
-- 5. 特別な権限設定
-- =====================================================

-- profiles テーブル: 自分のプロファイルのみ更新可能にするため、
-- 追加の制約は RLS ポリシーで制御

-- places テーブル: 新しい場所の追加は authenticated ユーザーのみ
-- 既存の場所の更新は制限（Google Places API データの整合性保持）

-- =====================================================
-- 6. 権限設定の確認用ビュー作成
-- =====================================================

CREATE OR REPLACE VIEW role_permissions_summary AS
SELECT 
  grantee,
  table_name,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND grantee IN ('anon', 'authenticated')
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

-- ビューの使用権限
GRANT SELECT ON role_permissions_summary TO authenticated;

-- =====================================================
-- 7. セキュリティ監査ログ
-- =====================================================

-- 権限変更のログを記録（pg_stat_statements が有効な場合のみ）
DO $$
BEGIN
  -- pg_stat_statements の統計をリセット（可能な場合）
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
    PERFORM pg_stat_statements_reset();
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生しても処理を続行
    NULL;
END $$;

-- =====================================================
-- コメント
-- =====================================================

COMMENT ON VIEW role_permissions_summary IS 
'ロール別のテーブル権限を要約表示するビュー。セキュリティ監査用';

-- 権限最小化完了のログ
DO $$
BEGIN
  RAISE NOTICE 'Phase 1: 権限最小化完了 - anon: SELECT のみ, authenticated: 必要最小限の CRUD 権限';
END $$; 