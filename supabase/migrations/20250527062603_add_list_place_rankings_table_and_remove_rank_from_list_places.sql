-- 1. list_place_rankings テーブル新設
CREATE TABLE IF NOT EXISTS public.list_place_rankings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id uuid NOT NULL REFERENCES public.place_lists(id) ON DELETE CASCADE,
    place_id text NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
    rank integer NOT NULL,
    comment text,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_list_place_rankings_list_id ON public.list_place_rankings(list_id);
CREATE INDEX IF NOT EXISTS idx_list_place_rankings_place_id ON public.list_place_rankings(place_id);
CREATE INDEX IF NOT EXISTS idx_list_place_rankings_rank ON public.list_place_rankings(rank);

-- 2. list_places テーブルから rank カラムを削除
ALTER TABLE public.list_places DROP COLUMN IF EXISTS rank;

-- 3. delete_list_place_cascade関数の修正（list_place_rankingsも削除対象に追加）
DROP FUNCTION IF EXISTS public.delete_list_place_cascade(p_list_place_id uuid);
CREATE FUNCTION public.delete_list_place_cascade(p_list_place_id uuid)
RETURNS void AS $$
DECLARE
  v_list_id uuid;
  v_place_id text;
BEGIN
  -- list_placesからlist_id, place_idを取得
  SELECT list_id, place_id INTO v_list_id, v_place_id FROM list_places WHERE id = p_list_place_id;

  -- コメント削除
  DELETE FROM list_place_commnts WHERE list_place_id = p_list_place_id;
  -- タグ削除
  DELETE FROM list_place_tags WHERE list_place_id = p_list_place_id;
  -- ランキング削除（list_id, place_idで紐付け）
  DELETE FROM list_place_rankings WHERE list_id = v_list_id AND place_id = v_place_id;
  -- list_places本体削除
  DELETE FROM list_places WHERE id = p_list_place_id;
END;
$$ LANGUAGE plpgsql;

-- 4. リスト作成用RPC
DROP FUNCTION IF EXISTS public.create_place_list(p_name text, p_description text, p_is_public boolean, p_created_by uuid);
CREATE FUNCTION public.create_place_list(
  p_name text,
  p_description text,
  p_is_public boolean,
  p_created_by uuid
) RETURNS uuid AS $$
DECLARE
  v_new_id uuid;
BEGIN
  INSERT INTO public.place_lists (name, description, is_public, created_by)
  VALUES (p_name, p_description, p_is_public, p_created_by)
  RETURNING id INTO v_new_id;
  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;

-- 5. リスト更新用RPC
DROP FUNCTION IF EXISTS public.update_place_list(p_id uuid, p_name text, p_description text, p_is_public boolean, p_user_id uuid);
CREATE FUNCTION public.update_place_list(
  p_id uuid,
  p_name text,
  p_description text,
  p_is_public boolean,
  p_user_id uuid
) RETURNS boolean AS $$
BEGIN
  UPDATE public.place_lists
  SET name = p_name,
      description = p_description,
      is_public = p_is_public,
      updated_at = NOW()
  WHERE id = p_id AND created_by = p_user_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. リスト削除用RPC
DROP FUNCTION IF EXISTS public.delete_place_list(p_id uuid, p_user_id uuid);
CREATE FUNCTION public.delete_place_list(
  p_id uuid,
  p_user_id uuid
) RETURNS boolean AS $$
BEGIN
  -- 共有トークン削除
  DELETE FROM public.list_share_tokens WHERE list_id = p_id;
  -- 共有設定削除
  DELETE FROM public.shared_lists WHERE list_id = p_id;
  -- list_place_tags削除
  DELETE FROM public.list_place_tags WHERE list_place_id IN (SELECT id FROM public.list_places WHERE list_id = p_id);
  -- list_place_rankings削除
  DELETE FROM public.list_place_rankings WHERE list_id = p_id;
  -- list_places削除（ON DELETE CASCADEでlist_place_commntsも消える想定）
  DELETE FROM public.list_places WHERE list_id = p_id;
  -- place_lists本体削除
  DELETE FROM public.place_lists WHERE id = p_id AND created_by = p_user_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 必要に応じて他Functionの修正をここに記載
