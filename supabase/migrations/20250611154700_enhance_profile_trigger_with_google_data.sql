-- プロファイル自動作成トリガーをGoogleアカウント情報対応に修正
-- 既存のトリガーを削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Googleアカウント情報を活用するプロファイル作成関数
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを再作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 既存のOAuthユーザーでプロファイルが存在しないユーザーを確認・修正
-- また、プロファイルは存在するがdisplay_nameやavatar_urlが空のユーザーも更新
DO $$
DECLARE
  user_record RECORD;
  google_display_name TEXT;
  google_avatar_url TEXT;
BEGIN
  -- プロファイルが存在しないユーザーの処理
  FOR user_record IN 
    SELECT id, raw_user_meta_data
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    -- Googleアカウント情報を取得
    google_display_name := COALESCE(
      user_record.raw_user_meta_data->>'full_name',
      user_record.raw_user_meta_data->>'name'
    );
    
    google_avatar_url := COALESCE(
      user_record.raw_user_meta_data->>'avatar_url',
      user_record.raw_user_meta_data->>'picture'
    );
    
    INSERT INTO public.profiles (id, username, display_name, bio, avatar_url)
    VALUES (
      user_record.id,
      'user_' || substr(user_record.id::text, 1, 8),
      google_display_name,
      NULL,
      google_avatar_url
    );
    
    RAISE LOG '既存ユーザーのプロファイルを作成しました: user_id=%, display_name=%, avatar_url=%',
      user_record.id, google_display_name, google_avatar_url;
  END LOOP;
  
  -- プロファイルは存在するがGoogle情報が未設定のユーザーを更新
  FOR user_record IN 
    SELECT u.id, u.raw_user_meta_data
    FROM auth.users u
    INNER JOIN public.profiles p ON u.id = p.id
    WHERE (p.display_name IS NULL OR p.avatar_url IS NULL)
      AND u.raw_user_meta_data IS NOT NULL
  LOOP
    -- Googleアカウント情報を取得
    google_display_name := COALESCE(
      user_record.raw_user_meta_data->>'full_name',
      user_record.raw_user_meta_data->>'name'
    );
    
    google_avatar_url := COALESCE(
      user_record.raw_user_meta_data->>'avatar_url',
      user_record.raw_user_meta_data->>'picture'
    );
    
    -- 空の場合のみ更新（既存の設定を上書きしない）
    UPDATE public.profiles 
    SET 
      display_name = CASE 
        WHEN display_name IS NULL AND google_display_name IS NOT NULL 
        THEN google_display_name 
        ELSE display_name 
      END,
      avatar_url = CASE 
        WHEN avatar_url IS NULL AND google_avatar_url IS NOT NULL 
        THEN google_avatar_url 
        ELSE avatar_url 
      END,
      updated_at = NOW()
    WHERE id = user_record.id;
    
    RAISE LOG '既存プロファイルにGoogle情報を追加しました: user_id=%, display_name=%, avatar_url=%',
      user_record.id, google_display_name, google_avatar_url;
  END LOOP;
END $$; 