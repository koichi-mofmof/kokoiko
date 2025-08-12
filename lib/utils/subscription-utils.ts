import { BadgeProps } from "@/components/ui/badge";
import {
  getPriceIdsByCurrency,
  type SupportedCurrency,
} from "@/lib/constants/config/subscription";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * フリープランの「共有リスト数」判定ロジック（サーバー・クライアント共通）
 *
 * @param supabase Supabaseクライアント（server/client両対応）
 * @param userId 対象ユーザーID
 * @param excludeListId 除外したいリストID（今まさに共有リンクを発行しようとしているリストIDなど）
 * @returns { count: number, sharedListNames: string[] }
 */
export async function getSharedListCount(
  supabase: SupabaseClient,
  userId: string,
  excludeListId?: string
): Promise<{ count: number; sharedListNames: string[] }> {
  // 自分がオーナーのリスト一覧を取得
  const { data: myLists } = await supabase
    .from("place_lists")
    .select("id, name")
    .eq("created_by", userId);
  let sharedCount = 0;
  let sharedListNames: string[] = [];
  if (myLists && Array.isArray(myLists) && myLists.length > 0) {
    const myListIds = myLists.map((l) => l.id);
    // 1. 有効な共有リンクが存在するリストID
    const { data: activeLinks } = await supabase
      .from("list_share_tokens")
      .select("list_id")
      .in("list_id", myListIds)
      .eq("is_active", true);
    const activeLinkListIds = (activeLinks || []).map((row) => row.list_id);
    // 2. 他ユーザーが参加済みのリストID
    const { data: sharedListRows } = await supabase
      .from("shared_lists")
      .select("list_id, shared_with_user_id")
      .in("list_id", myListIds)
      .neq("shared_with_user_id", userId);
    const sharedListIds = (sharedListRows || []).map((row) => row.list_id);
    // 3. 合算し重複除外、除外リストIDは除外
    const allSharedListIds = Array.from(
      new Set([...activeLinkListIds, ...sharedListIds])
    ).filter((id) => id !== excludeListId);
    sharedCount = allSharedListIds.length;
    sharedListNames = myLists
      .filter((l) => allSharedListIds.includes(l.id))
      .map((l) => l.name);
  }
  return { count: sharedCount, sharedListNames };
}

/**
 * 累計登録済み地点数をカウント（サーバー・クライアント共通）
 * @param supabase Supabaseクライアント
 * @param userId 対象ユーザーID
 * @returns count: 累計登録済み地点数
 */
export async function getRegisteredPlacesCountTotal(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  // COUNTのみ取得（データ本体は返さない）
  const { count, error } = await supabase
    .from("list_places")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) return 0;
  return count || 0;
}

// StripeのSubscription.statusの型
// 参考: https://stripe.com/docs/api/subscriptions/object#subscription_object-status
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "unpaid"
  | null
  | undefined;

type PlanStatus = {
  text: string;
  variant: BadgeProps["variant"];
};

export const getPlanNameKey = (priceId: string | null | undefined): string => {
  if (!priceId) return "subscription.plan.free";
  // 実行時に環境変数を解決する（テストでの env 差し替えに追随）
  const dynamicPriceIds = getPriceIdsByCurrency();
  const entries = Object.entries(dynamicPriceIds) as Array<
    [
      SupportedCurrency,
      { monthly: string | undefined; yearly: string | undefined }
    ]
  >;
  for (const [, ids] of entries) {
    if (ids.monthly && priceId === ids.monthly)
      return "subscription.plan.premiumMonthly";
    if (ids.yearly && priceId === ids.yearly)
      return "subscription.plan.premiumYearly";
  }
  return "subscription.plan.unknown";
};

export const getPlanNameLocalized = (
  priceId: string | null | undefined,
  t: (key: string, params?: Record<string, string | number>) => string
): string => {
  return t(getPlanNameKey(priceId));
};

export const getPlanStatusKey = (status: SubscriptionStatus): string => {
  switch (status) {
    case "active":
      return "subscription.status.active";
    case "trialing":
      return "subscription.status.trialing";
    case "canceled":
      return "subscription.status.canceled";
    case "past_due":
      return "subscription.status.pastDue";
    case "unpaid":
      return "subscription.status.unpaid";
    case "incomplete":
      return "subscription.status.incomplete";
    case "incomplete_expired":
      return "subscription.status.incompleteExpired";
    default:
      return "subscription.status.free";
  }
};

export const getPlanStatusLocalized = (
  status: SubscriptionStatus,
  t: (key: string, params?: Record<string, string | number>) => string
): PlanStatus => {
  const key = getPlanStatusKey(status);
  // variant は従来ロジックをここで内包
  const variant: PlanStatus["variant"] =
    status === "active" || status === "trialing"
      ? "default"
      : status === null || status === undefined
      ? "secondary"
      : status === "incomplete" ||
        status === "incomplete_expired" ||
        status === "past_due" ||
        status === "unpaid" ||
        status === "canceled"
      ? "destructive"
      : "secondary";
  return { text: t(key), variant };
};
