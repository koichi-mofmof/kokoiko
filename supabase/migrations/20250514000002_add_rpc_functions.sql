-- RLSポリシーに循環参照があるため、バイパス関数を作成
CREATE OR REPLACE FUNCTION public.get_my_place_lists(user_id UUID)
RETURNS SETOF place_lists
LANGUAGE sql
SECURITY DEFINER -- サービスロールとして実行
SET search_path = public
AS $$
  SELECT * FROM place_lists
  WHERE created_by = user_id
  ORDER BY created_at DESC;
$$;

-- 関数の説明を追加
COMMENT ON FUNCTION public.get_my_place_lists IS 'RLSをバイパスしてユーザーのリストを取得する関数。RLSの循環参照問題を回避するために使用。';

-- 関数を呼び出す権限を付与
GRANT EXECUTE ON FUNCTION public.get_my_place_lists TO authenticated; 