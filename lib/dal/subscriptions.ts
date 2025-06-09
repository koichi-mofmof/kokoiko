"use server";

import { createClient } from "@supabase/supabase-js";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "canceled"
  | "incomplete"
  | "past_due"
  | null;

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 現在有効なサブスクリプション情報を取得
 * @param userId Supabase AuthのユーザーID
 */
export async function getActiveSubscription(userId: string) {
  if (!userId) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["trialing", "active", "canceled", "past_due"])
    .single();

  if (error) {
    // single()でレコードが見つからない場合はPGRST116エラーを返すので、ここではエラーとして扱わない
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Failed to fetch active subscription:", error);
    return null;
  }

  return subscription;
}
