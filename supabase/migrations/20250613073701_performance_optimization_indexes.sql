-- ClippyMap パフォーマンス最適化インデックス
-- 作成日: 2025-06-13T07:34:37.842Z

-- Stripe関連インデックス（高頻度アクセス）
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id 
ON subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id 
ON subscriptions(stripe_subscription_id);

-- ユーザー関連インデックス（認証・プロファイル）
-- profiles.idは既にPRIMARY KEYなので追加インデックス不要
-- CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
-- ON profiles(user_id);

-- リスト関連インデックス（検索・フィルタリング）
CREATE INDEX IF NOT EXISTS idx_place_lists_created_by_created_at 
ON place_lists(created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_place_lists_is_public 
ON place_lists(is_public) WHERE is_public = true;

-- 場所関連インデックス（地理的検索・場所ID検索）
-- google_place_idは既にUNIQUE制約があるため追加インデックス不要
-- CREATE INDEX IF NOT EXISTS idx_places_google_place_id 
-- ON places(google_place_id);

-- 地理的検索用インデックス
CREATE INDEX IF NOT EXISTS idx_places_coordinates 
ON places(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ランキング関連インデックス（表示順序）
CREATE INDEX IF NOT EXISTS idx_list_place_rankings_list_id_rank 
ON list_place_rankings(list_id, rank);

-- タグ関連インデックス（検索・フィルタリング）
-- list_place_tagsテーブルは複合主キー(list_place_id, tag_id)
CREATE INDEX IF NOT EXISTS idx_list_place_tags_list_place_id 
ON list_place_tags(list_place_id);

CREATE INDEX IF NOT EXISTS idx_list_place_tags_tag_id 
ON list_place_tags(tag_id);

-- コメント関連インデックス（時系列表示）
CREATE INDEX IF NOT EXISTS idx_list_place_commnts_list_place_id_created_at 
ON list_place_commnts(list_place_id, created_at DESC);

-- 共有関連インデックス（アクセス制御）
CREATE INDEX IF NOT EXISTS idx_shared_lists_list_id 
ON shared_lists(list_id);

CREATE INDEX IF NOT EXISTS idx_shared_lists_shared_with_user_id 
ON shared_lists(shared_with_user_id);

-- 複合インデックス（よく使用される組み合わせ）
CREATE INDEX IF NOT EXISTS idx_place_lists_created_by_is_public 
ON place_lists(created_by, is_public);

CREATE INDEX IF NOT EXISTS idx_list_places_list_id_created_at 
ON list_places(list_id, created_at DESC);

-- パフォーマンス統計用
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_updated_at 
ON subscriptions(status, updated_at DESC);

COMMENT ON INDEX idx_subscriptions_stripe_customer_id IS 'Stripe顧客ID検索の高速化';
COMMENT ON INDEX idx_subscriptions_stripe_subscription_id IS 'Stripeサブスクリプション検索の高速化';
COMMENT ON INDEX idx_place_lists_created_by_created_at IS 'ユーザーのリスト一覧表示の高速化';
COMMENT ON INDEX idx_list_places_list_id_created_at IS 'リスト内の場所検索・時系列表示の高速化';
COMMENT ON INDEX idx_places_coordinates IS '地理的位置検索の高速化';
COMMENT ON INDEX idx_list_place_tags_list_place_id IS 'リスト場所のタグ検索の高速化';
