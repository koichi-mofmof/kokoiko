-- 地域階層フィルター機能のためのデータベーススキーマ更新
-- フェーズ1: placesテーブルへの階層地域情報追加とマスターテーブル作成

-- 1. placesテーブルに階層地域情報カラムを追加
ALTER TABLE places
ADD COLUMN country_code TEXT,
ADD COLUMN country_name TEXT,
ADD COLUMN admin_area_level_1 TEXT,
ADD COLUMN region_hierarchy JSONB;

-- 2. 階層フィルタリング用インデックス作成
CREATE INDEX idx_places_country_code ON places(country_code);
CREATE INDEX idx_places_admin_area_level_1 ON places(admin_area_level_1);
CREATE INDEX idx_places_region_hierarchy ON places USING GIN(region_hierarchy);

-- 複合インデックス（階層フィルタリング最適化）
CREATE INDEX idx_places_hierarchy ON places(country_code, admin_area_level_1);

-- 3. 地域階層マスターテーブル作成
CREATE TABLE region_hierarchy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  admin_area_level_1 TEXT,
  admin_area_level_1_type TEXT, -- 'prefecture', 'state', 'province', 'region'
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(country_code, admin_area_level_1)
);

-- 4. region_hierarchyテーブル用インデックス
-- 使用頻度順ソート用インデックス
CREATE INDEX idx_region_hierarchy_usage ON region_hierarchy(usage_count DESC);
CREATE INDEX idx_region_hierarchy_country ON region_hierarchy(country_code, usage_count DESC);

-- 5. region_hierarchyテーブルのRLSポリシー設定
ALTER TABLE region_hierarchy ENABLE ROW LEVEL SECURITY;

-- Public: 公開データとして全ユーザーが読み取り可能（地域情報は公開データ）
CREATE POLICY "region_hierarchy_public_select" ON region_hierarchy
FOR SELECT TO anon, authenticated
USING (true);

-- Authenticated: 認証済みユーザーは地域情報を追加・更新可能（地点登録時）
CREATE POLICY "region_hierarchy_authenticated_insert" ON region_hierarchy
FOR INSERT TO authenticated
WITH CHECK (true);

-- Authenticated: 認証済みユーザーは使用頻度を更新可能
CREATE POLICY "region_hierarchy_authenticated_update" ON region_hierarchy
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- 6. コメント追加（ドキュメント用）
COMMENT ON TABLE region_hierarchy IS '地域階層マスターテーブル - フィルター選択肢の高速取得と使用頻度管理';
COMMENT ON COLUMN region_hierarchy.country_code IS 'ISO 3166-1 国コード';
COMMENT ON COLUMN region_hierarchy.country_name IS '国名（表示用）';
COMMENT ON COLUMN region_hierarchy.admin_area_level_1 IS '第1行政区分（都道府県・州・省）';
COMMENT ON COLUMN region_hierarchy.admin_area_level_1_type IS '地域タイプ（prefecture/state/province/region）';
COMMENT ON COLUMN region_hierarchy.usage_count IS '使用頻度（フィルター表示順序用）';

COMMENT ON COLUMN places.country_code IS 'ISO 3166-1 国コード';
COMMENT ON COLUMN places.country_name IS '国名（表示用）';
COMMENT ON COLUMN places.admin_area_level_1 IS '第1行政区分（都道府県・州・省）';
COMMENT ON COLUMN places.region_hierarchy IS '階層情報のJSON（検索・フィルタリング用）';
