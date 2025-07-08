-- ユーザーがリストをブックマークするためのテーブルを作成します。
CREATE TABLE public.list_bookmarks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    list_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT list_bookmarks_pkey PRIMARY KEY (id),
    CONSTRAINT list_bookmarks_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.place_lists(id) ON DELETE CASCADE,
    CONSTRAINT list_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT list_bookmarks_user_id_list_id_key UNIQUE (user_id, list_id)
);

-- テーブルコメント
COMMENT ON TABLE public.list_bookmarks IS 'ユーザーがリストをブックマークするためのテーブル';

-- カラムコメント
COMMENT ON COLUMN public.list_bookmarks.id IS 'ブックマークの一意なID';
COMMENT ON COLUMN public.list_bookmarks.user_id IS 'ブックマークしたユーザーのID';
COMMENT ON COLUMN public.list_bookmarks.list_id IS 'ブックマークされたリストのID';
COMMENT ON COLUMN public.list_bookmarks.created_at IS 'ブックマーク作成日時';


-- RLSポリシーを有効化
ALTER TABLE public.list_bookmarks ENABLE ROW LEVEL SECURITY;

-- 自分のブックマークのみを閲覧できるポリシー
CREATE POLICY "Enable read access for own bookmarks"
ON public.list_bookmarks
FOR SELECT
USING (auth.uid() = user_id);

-- 自分のブックマークのみを作成できるポリシー
CREATE POLICY "Enable insert for own bookmarks"
ON public.list_bookmarks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 自分のブックマークのみを削除できるポリシー
CREATE POLICY "Enable delete for own bookmarks"
ON public.list_bookmarks
FOR DELETE
USING (auth.uid() = user_id);
