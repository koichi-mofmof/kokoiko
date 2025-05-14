-- 既存の auth.users への外部キー制約を削除
ALTER TABLE public.place_lists
DROP CONSTRAINT IF EXISTS place_lists_created_by_fkey;

-- profiles テーブルへの新しい外部キー制約を追加
ALTER TABLE public.place_lists 
ADD CONSTRAINT fk_place_lists_profiles 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- コメント追加
COMMENT ON CONSTRAINT fk_place_lists_profiles ON public.place_lists IS 'place_lists.created_by が profiles.id を参照する制約'; 