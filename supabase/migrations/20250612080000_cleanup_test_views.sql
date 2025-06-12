-- テスト用ビューのクリーンアップ
-- Phase 5: ドキュメント更新 - 本番運用に不要なテスト用ビューの削除

-- =====================================================
-- 1. テスト用ビューの削除
-- =====================================================

-- Phase 1で作成されたテスト用ビューを削除
DROP VIEW IF EXISTS rls_test_scenarios;

-- Phase 2で作成されたテスト用ビューを削除
DROP VIEW IF EXISTS place_lists_policy_test;
DROP VIEW IF EXISTS places_policy_test;

-- Phase 3で作成されたテスト用ビューを削除
DROP VIEW IF EXISTS list_places_policy_test;
DROP VIEW IF EXISTS shared_lists_policy_test;

-- Phase 4で作成されたテスト用ビューを削除
DROP VIEW IF EXISTS list_place_rankings_policy_test;
DROP VIEW IF EXISTS list_place_tags_policy_test;
DROP VIEW IF EXISTS list_place_commnts_policy_test;
DROP VIEW IF EXISTS tags_policy_test;

-- =====================================================
-- 2. 削除理由とセキュリティ考慮事項
-- =====================================================

-- 削除理由:
-- 1. 本番運用では不要（開発・デバッグ用途のみ）
-- 2. セキュリティリスクの軽減（内部ロジックの露出防止）
-- 3. データベースオブジェクトの整理
-- 4. パフォーマンスへの影響軽減

-- セキュリティ考慮事項:
-- - テスト用ビューは内部的なアクセス制御ロジックを露出していた
-- - 本番環境では必要最小限のオブジェクトのみを保持
-- - 攻撃者による情報収集の機会を削減

-- =====================================================
-- 3. 代替手段（開発環境での利用）
-- =====================================================

-- 開発環境でのテスト用ビューが必要な場合は、
-- 以下のコマンドで個別に再作成可能:
-- 
-- CREATE OR REPLACE VIEW place_lists_policy_test AS
-- SELECT ... (各マイグレーションファイルから参照)

-- =====================================================
-- 4. 削除確認ログ
-- =====================================================

DO $$
DECLARE
  view_count INTEGER;
BEGIN
  -- 削除されたビューの数を確認
  SELECT COUNT(*) INTO view_count
  FROM pg_views 
  WHERE schemaname = 'public' 
  AND viewname LIKE '%_policy_test'
  OR viewname = 'rls_test_scenarios';
  
  IF view_count = 0 THEN
    RAISE NOTICE 'Phase 5: テスト用ビューのクリーンアップ完了 - 全%個のテスト用ビューを削除', 8;
  ELSE
    RAISE WARNING 'Phase 5: 一部のテスト用ビューが残存しています - 残存数: %', view_count;
  END IF;
END $$;

-- =====================================================
-- コメント
-- =====================================================

COMMENT ON SCHEMA public IS 
'ClippyMap データベーススキーマ - RLS設計完了、テスト用ビュー削除済み（本番運用最適化）';

-- 移行完了のログ
DO $$
BEGIN
  RAISE NOTICE 'Phase 5: 本番運用最適化 - テスト用ビューのクリーンアップ完了、セキュリティ向上';
END $$; 