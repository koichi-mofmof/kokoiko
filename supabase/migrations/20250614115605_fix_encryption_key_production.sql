-- 本番環境での暗号化設定修正

-- 現在のセッションで暗号化キーを設定
SELECT set_config('app.encryption_key', 'clippymap_default_key_change_in_production_2024', false);

-- 暗号化関数を修正（エラーハンドリング強化）
CREATE OR REPLACE FUNCTION encrypt_profile_data() 
RETURNS TRIGGER AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- 暗号化キーを取得
  encryption_key := current_setting('app.encryption_key', TRUE);
  
  -- デフォルトキーを使用（本番環境では別途設定が必要）
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'clippymap_default_key_change_in_production_2024';
  END IF;
  
  -- display_nameの暗号化
  IF NEW.display_name IS NOT NULL THEN
    BEGIN
      NEW.display_name_encrypted = encode(
        pgp_sym_encrypt(NEW.display_name, encryption_key),
        'base64'
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- 暗号化に失敗した場合はログに記録し、NULLを設定
        RAISE WARNING '表示名の暗号化に失敗しました: %', SQLERRM;
        NEW.display_name_encrypted = NULL;
    END;
  ELSE
    NEW.display_name_encrypted = NULL;
  END IF;
  
  -- bioの暗号化
  IF NEW.bio IS NOT NULL THEN
    BEGIN
      NEW.bio_encrypted = encode(
        pgp_sym_encrypt(NEW.bio, encryption_key),
        'base64'
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- 暗号化に失敗した場合はログに記録し、NULLを設定
        RAISE WARNING 'プロフィールの暗号化に失敗しました: %', SQLERRM;
        NEW.bio_encrypted = NULL;
    END;
  ELSE
    NEW.bio_encrypted = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 復号化関数も修正
CREATE OR REPLACE FUNCTION decrypt_profile_data(encrypted_data TEXT) 
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN NULL;
  END IF;
  
  -- 暗号化キーを取得
  encryption_key := current_setting('app.encryption_key', TRUE);
  
  -- デフォルトキーを使用
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'clippymap_default_key_change_in_production_2024';
  END IF;
  
  BEGIN
    RETURN pgp_sym_decrypt(
      decode(encrypted_data, 'base64'),
      encryption_key
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- 復号化に失敗した場合はログに記録し、NULLを返す
      RAISE WARNING 'データの復号化に失敗しました: %', SQLERRM;
      RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 既存のトリガーを削除して再作成
DROP TRIGGER IF EXISTS encrypt_profile_trigger ON public.profiles;
CREATE TRIGGER encrypt_profile_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_profile_data();

-- 接続時に暗号化キーを自動設定する関数
CREATE OR REPLACE FUNCTION ensure_encryption_key()
RETURNS void AS $$
BEGIN
  -- 暗号化キーが設定されていない場合に設定
  IF current_setting('app.encryption_key', TRUE) IS NULL THEN
    PERFORM set_config('app.encryption_key', 'clippymap_default_key_change_in_production_2024', FALSE);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- セッション開始時に暗号化キーを確保
SELECT ensure_encryption_key();

-- Fix CloudFlare Workers connection issues with Supabase
-- This migration creates a test table for diagnosing connection issues

-- Test connection table for debugging CloudFlare Workers issues
CREATE TABLE IF NOT EXISTS connection_test (
  id SERIAL PRIMARY KEY,
  test_message TEXT NOT NULL DEFAULT 'CloudFlare Workers connection test',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  environment TEXT DEFAULT 'unknown'
);

-- Insert test record
INSERT INTO connection_test (test_message, environment) 
VALUES ('Production connection test', 'production')
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE connection_test IS 'Test table for debugging CloudFlare Workers connection issues with Supabase';

-- Grant necessary permissions
GRANT SELECT ON connection_test TO anon;
GRANT SELECT ON connection_test TO authenticated;
