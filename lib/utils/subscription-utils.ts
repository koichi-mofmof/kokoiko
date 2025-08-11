import { BadgeProps } from "@/components/ui/badge";
import {
  PRICE_IDS_BY_CURRENCY,
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
  // 全期間の登録済み地点数を取得
  const { data, error } = await supabase
    .from("list_places")
    .select("created_at, user_id")
    .eq("user_id", userId);

  if (error || !data) return 0;
  return data.length;
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

export const getPlanStatus = (status: SubscriptionStatus): PlanStatus => {
  switch (status) {
    case "active":
      return { text: "有効", variant: "default" };
    case "trialing":
      return { text: "トライアル中", variant: "default" };
    case "canceled":
      return { text: "キャンセル済み", variant: "destructive" };
    case "past_due":
      return { text: "支払い遅延", variant: "destructive" };
    case "unpaid":
      return { text: "未払い", variant: "destructive" };
    case "incomplete":
    case "incomplete_expired":
      return { text: "支払い未完了", variant: "destructive" };
    default:
      return { text: "フリー", variant: "secondary" };
  }
};

// 価格ID → プラン名（日本語固定表示）
export const getPlanName = (priceId: string | null | undefined): string => {
  if (!priceId) return "フリープラン";
  const entries = Object.entries(PRICE_IDS_BY_CURRENCY) as Array<
    [
      SupportedCurrency,
      { monthly: string | undefined; yearly: string | undefined }
    ]
  >;
  for (const [, ids] of entries) {
    if (ids.monthly && priceId === ids.monthly) return "プレミアム（月額）";
    if (ids.yearly && priceId === ids.yearly) return "プレミアム（年額）";
  }
  return "不明なプラン";
};
