-- プロファイル自動作成トリガーの修正
-- 既存のトリガーを削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- より堅牢なプロファイル作成関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- プロファイルが既に存在するかチェック
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, username, display_name, bio, avatar_url)
    VALUES (
      NEW.id, 
      'user_' || substr(NEW.id::text, 1, 8),
      NULL,
      NULL,
      NULL
    );
    
    -- ログ出力（開発時のデバッグ用）
    RAISE LOG 'プロファイルを作成しました: user_id=%', NEW.id;
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

-- 既存のOAuthユーザーでプロファイルが存在しないユーザーを確認・作成
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id 
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    INSERT INTO public.profiles (id, username, display_name, bio, avatar_url)
    VALUES (
      user_record.id,
      'user_' || substr(user_record.id::text, 1, 8),
      NULL,
      NULL,
      NULL
    );
    
    RAISE LOG '既存ユーザーのプロファイルを作成しました: user_id=%', user_record.id;
  END LOOP;
END $$; 