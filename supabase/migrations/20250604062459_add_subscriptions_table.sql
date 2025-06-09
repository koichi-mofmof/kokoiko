-- サブスクリプション（料金プラン）管理用テーブル
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_price_id text,
    status text,
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean DEFAULT false,
    canceled_at timestamptz,
    trial_start timestamptz,
    trial_end timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ユーザーごとに1つのみ（ユニーク制約）
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_key ON public.subscriptions(user_id);

-- RLS有効化
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 本人のみSELECT/UPDATE/INSERT許可（DELETEは一般ユーザー不可）
CREATE POLICY "Subscriptions: Select own" ON public.subscriptions
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Subscriptions: Update own" ON public.subscriptions
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Subscriptions: Insert own" ON public.subscriptions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- service_role_key等（管理者/サーバー用）はRLSをバイパスするため特別な設定は不要
