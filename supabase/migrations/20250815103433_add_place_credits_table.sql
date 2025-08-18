-- 買い切り地点クレジット管理テーブルの作成
-- 既存のSupabaseスキーマ構成に合わせた設計

CREATE TABLE public.place_credits (
  id text PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,  -- profiles.idに対応、外部キー制約なし（既存パターン）
  credit_type text NOT NULL CHECK (credit_type IN ('one_time_small', 'one_time_regular')),
  places_purchased integer NOT NULL CHECK (places_purchased > 0),
  places_consumed integer DEFAULT 0 CHECK (places_consumed >= 0),
  stripe_payment_intent_id text UNIQUE,
  purchased_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- テーブル・カラムコメント
COMMENT ON TABLE public.place_credits IS '買い切り地点クレジット管理テーブル';
COMMENT ON COLUMN public.place_credits.user_id IS 'クレジットを購入したユーザーID（profiles.idに対応）';
COMMENT ON COLUMN public.place_credits.credit_type IS 'one_time_small: 10件パック、one_time_regular: 50件パック';
COMMENT ON COLUMN public.place_credits.places_purchased IS '購入した地点数';
COMMENT ON COLUMN public.place_credits.places_consumed IS '消費済み地点数';
COMMENT ON COLUMN public.place_credits.stripe_payment_intent_id IS 'Stripe Payment Intent ID（買い切り決済の場合）';
COMMENT ON COLUMN public.place_credits.purchased_at IS '購入日時';
COMMENT ON COLUMN public.place_credits.is_active IS 'クレジットが有効かどうか';
COMMENT ON COLUMN public.place_credits.metadata IS '追加情報（JSON形式）';

-- インデックス（既存パターンに合わせる）
CREATE INDEX idx_place_credits_user_id ON public.place_credits(user_id);
CREATE INDEX idx_place_credits_active_user ON public.place_credits(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_place_credits_consumption ON public.place_credits(user_id, places_consumed, places_purchased) WHERE is_active = true;
CREATE INDEX idx_place_credits_stripe_payment ON public.place_credits(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- RLS ポリシー（既存パターンに合わせる）
ALTER TABLE public.place_credits ENABLE ROW LEVEL SECURITY;

-- 自分のクレジットのみ閲覧可能
CREATE POLICY "Enable read access for own credits" ON public.place_credits
  FOR SELECT USING (auth.uid()::text = user_id);

-- 挿入は認証済みユーザーで自分のクレジットのみ
CREATE POLICY "Enable insert for own credits" ON public.place_credits
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 更新は自分のクレジットのみ（クレジット消費用）
CREATE POLICY "Enable update for own credits" ON public.place_credits
  FOR UPDATE USING (auth.uid()::text = user_id);

-- 削除は禁止（アクティブフラグで論理削除）
-- DELETE ポリシーは意図的に作成しない

-- ユーザーの利用可能地点数を計算する関数
CREATE OR REPLACE FUNCTION public.get_user_place_availability(p_user_id text)
RETURNS TABLE (
  total_limit integer,
  used_places integer,
  remaining_places integer,
  credit_sources jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base_limit integer := 30;  -- フリープランの基本制限（20→30に変更）
  v_used_count integer;
  v_premium_active boolean := false;
  v_total_purchased integer := 0;
  v_total_consumed integer := 0;
  v_credits_info jsonb := '[]'::jsonb;
  v_credit_record record;
BEGIN
  -- 1. 使用済み地点数をカウント（place_lists.created_byベース）
  SELECT count(*) INTO v_used_count
  FROM list_places lp
  JOIN place_lists pl ON lp.list_id = pl.id
  WHERE pl.created_by = p_user_id;

  -- 2. プレミアムプラン確認（既存のsubscriptionsテーブル構造に合わせる）
  SELECT exists(
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = p_user_id
      AND s.status IN ('active', 'trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end::timestamptz > now())
  ) INTO v_premium_active;

  -- プレミアムプランの場合は無制限
  IF v_premium_active THEN
    RETURN QUERY SELECT 
      999999 as total_limit,
      v_used_count as used_places,
      999999 as remaining_places,
      '{"type": "premium", "limit": "unlimited"}'::jsonb as credit_sources;
    RETURN;
  END IF;

  -- 3. 買い切りクレジット集計
  FOR v_credit_record IN 
    SELECT credit_type, places_purchased, places_consumed, purchased_at
    FROM place_credits
    WHERE user_id = p_user_id AND is_active = true
    ORDER BY purchased_at ASC
  LOOP
    v_total_purchased := v_total_purchased + v_credit_record.places_purchased;
    v_total_consumed := v_total_consumed + v_credit_record.places_consumed;
    
    v_credits_info := v_credits_info || jsonb_build_object(
      'type', v_credit_record.credit_type,
      'purchased', v_credit_record.places_purchased,
      'consumed', v_credit_record.places_consumed,
      'remaining', v_credit_record.places_purchased - v_credit_record.places_consumed,
      'purchased_at', v_credit_record.purchased_at
    );
  END LOOP;

  -- 4. 結果を返す
  RETURN QUERY SELECT 
    v_base_limit + v_total_purchased as total_limit,
    v_used_count as used_places,
    greatest(0, v_base_limit + v_total_purchased - v_used_count) as remaining_places,
    jsonb_build_object(
      'base_limit', v_base_limit,
      'purchased_total', v_total_purchased,
      'consumed_total', v_total_consumed,
      'credits', v_credits_info
    ) as credit_sources;
END;
$$;

-- クレジット消費処理用関数
CREATE OR REPLACE FUNCTION public.consume_place_credits(p_user_id text, p_places_count integer DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credit_record record;
  v_remaining_to_consume integer := p_places_count;
  v_can_consume integer;
BEGIN
  -- アクティブなクレジットから古い順に消費
  FOR v_credit_record IN 
    SELECT id, places_purchased, places_consumed
    FROM place_credits
    WHERE user_id = p_user_id
      AND is_active = true
      AND places_consumed < places_purchased
    ORDER BY purchased_at ASC
  LOOP
    -- このクレジットから消費可能な数
    v_can_consume := least(
      v_remaining_to_consume,
      v_credit_record.places_purchased - v_credit_record.places_consumed
    );
    
    -- クレジット消費を更新
    UPDATE place_credits
    SET 
      places_consumed = places_consumed + v_can_consume,
      updated_at = now()
    WHERE id = v_credit_record.id;
    
    v_remaining_to_consume := v_remaining_to_consume - v_can_consume;
    
    -- 全て消費できた場合は終了
    IF v_remaining_to_consume <= 0 THEN
      RETURN true;
    END IF;
  END LOOP;
  
  -- 消費しきれなかった場合
  RETURN v_remaining_to_consume <= 0;
END;
$$;

-- 関数のコメント
COMMENT ON FUNCTION public.get_user_place_availability(text) IS 'ユーザーの利用可能地点数を計算（フリープラン基本枠＋買い切りクレジット）';
COMMENT ON FUNCTION public.consume_place_credits(text, integer) IS '地点追加時にクレジットを消費する関数';
