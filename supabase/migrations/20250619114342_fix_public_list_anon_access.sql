-- place_lists テーブルの未ログインユーザー向け公開リストアクセス修正
-- 
-- 【問題】
-- 未ログインユーザーが公開リスト（is_public = true）にアクセスできない
-- 現在のplace_lists_function_selectポリシーは authenticated ロールのみが対象
-- 
-- 【修正内容】
-- 未ログインユーザー（anon ロール）が公開リストを閲覧できるポリシーを追加

-- =====================================================
-- 1. 未ログインユーザー向け公開リストアクセスポリシーを追加
-- =====================================================

-- 公開リストは未ログインユーザーでも閲覧可能
CREATE POLICY "place_lists_public_anon_select" ON place_lists
FOR SELECT TO anon
USING (is_public = true);

-- =====================================================
-- 2. 検証とコメント
-- =====================================================

-- 動作確認:
-- ✅ 未ログインユーザー: is_public = true のリストのみ閲覧可能
-- ✅ 認証済みユーザー: 既存のplace_lists_function_selectポリシーで全権限維持
-- ✅ セキュリティ: プライベートリスト（is_public = false/null）は未ログインでアクセス不可

COMMENT ON POLICY "place_lists_public_anon_select" ON place_lists IS 
'未ログインユーザーが公開リスト（is_public = true）を閲覧可能にする';
