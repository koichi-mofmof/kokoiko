-- ENUM Types
CREATE TYPE visited_status_enum AS ENUM ('visited', 'not_visited');
CREATE TYPE shared_list_permission_enum AS ENUM ('view', 'edit');

-- Tables
CREATE TABLE place_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- auth.usersを参照
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE place_lists IS 'ユーザーが作成する場所のリスト';

CREATE TABLE places (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    google_place_id TEXT UNIQUE, -- Google Place IDを重複して格納しないように
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE places IS 'Google Maps API等から取得する場所の基本情報 - 共通データ';

CREATE TABLE list_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES place_lists(id) ON DELETE CASCADE,
    place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- この場所情報をリストに追加したユーザー
    added_at TIMESTAMPTZ DEFAULT now(),
    user_comment TEXT,
    image_url TEXT,
    visited_status visited_status_enum,
    rank INTEGER, -- リスト内での順位。NULL許容。
    created_at TIMESTAMPTZ DEFAULT now(), -- list_placesレコード自体の作成日時
    updated_at TIMESTAMPTZ DEFAULT now()  -- list_placesレコード自体の更新日時
);
COMMENT ON TABLE list_places IS 'リストと場所の中間テーブル - ユーザー固有の場所情報やリストへの所属を管理';
CREATE INDEX idx_list_places_list_id ON list_places(list_id);
CREATE INDEX idx_list_places_place_id ON list_places(place_id);
CREATE INDEX idx_list_places_user_id ON list_places(user_id);
-- 同じlist_id内でrankが重複しないようにするためのユニーク制約 (NULLは重複を許す)
CREATE UNIQUE INDEX idx_list_places_list_id_rank_unique ON list_places (list_id, rank) WHERE rank IS NOT NULL;


CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (name, user_id)
);
COMMENT ON TABLE tags IS 'ユーザーが作成できるタグ';
CREATE INDEX idx_tags_user_id ON tags(user_id);

CREATE TABLE list_place_tags (
    list_place_id UUID NOT NULL REFERENCES list_places(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (list_place_id, tag_id)
);
COMMENT ON TABLE list_place_tags IS 'リスト内の場所とタグの中間テーブル';

CREATE TABLE shared_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES place_lists(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission shared_list_permission_enum NOT NULL DEFAULT 'view',
    shared_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (list_id, shared_with_user_id)
);
COMMENT ON TABLE shared_lists IS 'リストの共有設定';
CREATE INDEX idx_shared_lists_list_id ON shared_lists(list_id);
CREATE INDEX idx_shared_lists_shared_with_user_id ON shared_lists(shared_with_user_id);

-- RLS Policies (基本的なSELECTポリシーの例 - 各自の要件に合わせて調整が必要)
-- place_lists
ALTER TABLE place_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual read access to own lists" ON place_lists FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Allow individual read access to shared lists" ON place_lists FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM shared_lists
        WHERE shared_lists.list_id = place_lists.id AND shared_lists.shared_with_user_id = auth.uid()
    )
);
CREATE POLICY "Allow public read access to public lists" ON place_lists FOR SELECT USING (is_public = TRUE);
CREATE POLICY "Allow individual insert access" ON place_lists FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Allow individual update access" ON place_lists FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Allow individual delete access" ON place_lists FOR DELETE USING (auth.uid() = created_by);


-- places (共通データのため、認証されたユーザーであれば誰でも読み取り可能とする例。アプリの要件によって異なる)
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users" ON places FOR SELECT USING (auth.role() = 'authenticated');
-- places テーブルへの書き込みは、サーバーサイドの信頼できるプロセスからのみ実行されることを想定（例：新しい場所を検索して最初に登録する場合など）
-- CREATE POLICY "Allow insert by service_role only" ON places FOR INSERT WITH CHECK (auth.role() = 'service_role');


-- list_places
ALTER TABLE list_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual read access to list_places via list ownership" ON list_places FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM place_lists pl
        WHERE pl.id = list_places.list_id AND pl.created_by = auth.uid()
    )
);
CREATE POLICY "Allow individual read access to list_places via shared list" ON list_places FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM place_lists pl
        JOIN shared_lists sl ON sl.list_id = pl.id
        WHERE pl.id = list_places.list_id AND sl.shared_with_user_id = auth.uid()
    )
);
CREATE POLICY "Allow public read access to list_places via public list" ON list_places FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM place_lists pl
        WHERE pl.id = list_places.list_id AND pl.is_public = TRUE
    )
);
-- list_places の INSERT/UPDATE/DELETE は、該当リストの所有者または編集権限を持つ共有ユーザーに許可
CREATE POLICY "Allow insert access for list owners or editors" ON list_places FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM place_lists pl WHERE pl.id = list_places.list_id AND pl.created_by = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM shared_lists sl WHERE sl.list_id = list_places.list_id AND sl.shared_with_user_id = auth.uid() AND sl.permission = 'edit'
    )
);
CREATE POLICY "Allow update access for list owners or editors" ON list_places FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM place_lists pl WHERE pl.id = list_places.list_id AND pl.created_by = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM shared_lists sl WHERE sl.list_id = list_places.list_id AND sl.shared_with_user_id = auth.uid() AND sl.permission = 'edit'
    )
);
CREATE POLICY "Allow delete access for list owners or editors" ON list_places FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM place_lists pl WHERE pl.id = list_places.list_id AND pl.created_by = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM shared_lists sl WHERE sl.list_id = list_places.list_id AND sl.shared_with_user_id = auth.uid() AND sl.permission = 'edit'
    )
);


-- tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual read access to own tags" ON tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow individual insert access" ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);
-- タグの更新・削除はアプリの仕様による（例：作成者のみ、または未使用であれば誰でも削除可能など）
CREATE POLICY "Allow individual update access" ON tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow individual delete access" ON tags FOR DELETE USING (auth.uid() = user_id);


-- list_place_tags (RLSは list_places や tags の権限に依存させることが多い)
ALTER TABLE list_place_tags ENABLE ROW LEVEL SECURITY;
-- 例: list_places のレコードにアクセスできるユーザーは、関連するタグマッピングも閲覧可能
CREATE POLICY "Allow read access based on list_places access" ON list_place_tags FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM list_places lp
        WHERE lp.id = list_place_tags.list_place_id
        -- ここで lp に対する SELECT 権限の有無をサブクエリで確認することもできるが複雑になる
        -- 基本的には list_places の RLS でフィルタリングされた結果に対して JOIN されることを期待
    )
);
-- list_place_tags の INSERT/DELETE は list_places の編集権限を持つユーザーに許可
CREATE POLICY "Allow insert/delete based on list_places edit access" ON list_place_tags FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM list_places lp
        WHERE lp.id = list_place_tags.list_place_id AND (
            EXISTS (SELECT 1 FROM place_lists pl WHERE pl.id = lp.list_id AND pl.created_by = auth.uid()) OR
            EXISTS (SELECT 1 FROM shared_lists sl WHERE sl.list_id = lp.list_id AND sl.shared_with_user_id = auth.uid() AND sl.permission = 'edit')
        )
    )
);

-- shared_lists
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;
-- リストの所有者は共有設定を閲覧・作成・編集・削除可能
CREATE POLICY "Allow list owners to manage shares" ON shared_lists FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM place_lists pl
        WHERE pl.id = shared_lists.list_id AND pl.created_by = auth.uid()
    )
);
-- 共有されているユーザーは自身の共有設定を閲覧可能（削除はオーナーのみ可能とする例）
CREATE POLICY "Allow shared users to view their share" ON shared_lists FOR SELECT USING (
    shared_lists.shared_with_user_id = auth.uid()
);

-- Functions to automatically update updated_at columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_place_lists_updated_at
BEFORE UPDATE ON place_lists
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_places_updated_at
BEFORE UPDATE ON places
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_list_places_updated_at
BEFORE UPDATE ON list_places
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- New table for managing shareable links
CREATE TABLE list_share_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES place_lists(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    default_permission shared_list_permission_enum NOT NULL DEFAULT 'view',
    expires_at TIMESTAMPTZ,
    max_uses INTEGER,
    current_uses INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- TRUE for active, FALSE for inactive/disabled by owner
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE list_share_tokens IS 'Manages shareable links for lists, including expiration, use limits, and status.';
CREATE INDEX idx_list_share_tokens_list_id ON list_share_tokens(list_id);
CREATE INDEX idx_list_share_tokens_created_by ON list_share_tokens(created_by);
CREATE INDEX idx_list_share_tokens_token ON list_share_tokens(token); -- For quick token lookup

-- Trigger for updated_at on list_share_tokens
CREATE TRIGGER set_list_share_tokens_updated_at
BEFORE UPDATE ON list_share_tokens
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policies for list_share_tokens
ALTER TABLE list_share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow list owners to manage their own share tokens" ON list_share_tokens
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM place_lists pl
        WHERE pl.id = list_share_tokens.list_id AND pl.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM place_lists pl
        WHERE pl.id = list_share_tokens.list_id AND pl.created_by = auth.uid()
    )
);

-- Allow authenticated users to read active tokens (e.g., when a user accesses a share link)
-- This policy might need to be more restrictive depending on how tokens are validated and used by the application.
-- For now, we assume the application logic handles token validation before exposing list details.
-- A more secure approach might involve a server-side function to validate the token and grant temporary access or add to shared_lists.
CREATE POLICY "Allow authenticated users to read active tokens for validation (use with caution)" ON list_share_tokens
FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = TRUE); 