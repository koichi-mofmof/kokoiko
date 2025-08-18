import { BadgeProps } from "@/components/ui/badge";
import {
  getPriceIdsByCurrency,
  SUBSCRIPTION_LIMITS,
  type SupportedCurrency,
} from "@/lib/constants/config/subscription";
import { getActiveSubscription as importedGetActiveSubscription } from "@/lib/dal/subscriptions";
import { Database } from "@/types/supabase";
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

/**
 * 買い切りクレジット関連の管理関数
 */

// 買い切りクレジット情報を取得
export async function getPlaceCredits(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Database["public"]["Tables"]["place_credits"]["Row"][]> {
  const { data, error } = await supabase
    .from("place_credits")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("purchased_at", { ascending: true });

  if (error) {
    console.error("Error fetching place credits:", error);
    return [];
  }

  return data || [];
}

// アクティブなサブスクリプション情報を取得（既存関数のラッパー）
export async function getActiveSubscription(userId: string) {
  return await importedGetActiveSubscription(userId);
}

/**
 * ユーザーの総利用可能地点数を計算（フリープラン基本枠＋買い切りクレジット）
 * @param supabase Supabaseクライアント
 * @param userId 対象ユーザーID
 * @returns 地点利用可能性の詳細情報
 */
export async function getTotalAvailablePlaces(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{
  totalLimit: number;
  usedPlaces: number;
  remainingPlaces: number;
  sources: Array<{
    type: "free" | "subscription" | "one_time_small" | "one_time_regular";
    limit: number;
    used: number;
  }>;
}> {
  // 1. フリープラン基本枠: 30件
  let totalLimit = SUBSCRIPTION_LIMITS.free.MAX_PLACES_TOTAL!;

  // 4. 使用済み地点数取得（早めに取得して各sourceで使用）
  const usedPlaces = await getRegisteredPlacesCountTotal(supabase, userId);

  const sources: Array<{
    type: "free" | "subscription" | "one_time_small" | "one_time_regular";
    limit: number;
    used: number;
  }> = [
    {
      type: "free" as const,
      limit: SUBSCRIPTION_LIMITS.free.MAX_PLACES_TOTAL!,
      used: Math.min(usedPlaces, SUBSCRIPTION_LIMITS.free.MAX_PLACES_TOTAL!), // フリープラン枠内での使用数
    },
  ];

  // 2. サブスクリプション確認
  const subscription = await getActiveSubscription(userId);
  if (
    subscription?.status === "active" ||
    subscription?.status === "trialing"
  ) {
    return {
      totalLimit: Infinity,
      usedPlaces,
      remainingPlaces: Infinity,
      sources: [{ type: "subscription", limit: Infinity, used: usedPlaces }],
    };
  }

  // 3. 買い切りクレジット確認
  const credits = await getPlaceCredits(supabase, userId);
  let remainingUsedPlaces = Math.max(
    0,
    usedPlaces - SUBSCRIPTION_LIMITS.free.MAX_PLACES_TOTAL!
  );

  if (credits) {
    for (const credit of credits) {
      totalLimit += credit.places_purchased - credit.places_consumed;

      // 各クレジットの使用状況を正しく計算
      let creditUsed = credit.places_consumed;
      if (remainingUsedPlaces > 0) {
        // フリープラン枠を超えた分をこのクレジットから消費
        const additionalUsed = Math.min(
          remainingUsedPlaces,
          credit.places_purchased - credit.places_consumed
        );
        creditUsed += additionalUsed;
        remainingUsedPlaces -= additionalUsed;
      }

      sources.push({
        type: credit.credit_type as "one_time_small" | "one_time_regular",
        limit: credit.places_purchased,
        used: creditUsed,
      });
    }
  }

  return {
    totalLimit,
    usedPlaces,
    remainingPlaces: Math.max(0, totalLimit - usedPlaces),
    sources,
  };
}

/**
 * 地点登録時にクレジットを消費する（TypeScript版）
 * 実際の消費はPostgreSQL関数で行うため、これは呼び出しラッパー
 */
export async function consumePlaceCredits(
  supabase: SupabaseClient<Database>,
  userId: string,
  placesCount: number = 1
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("consume_place_credits", {
      p_user_id: userId,
      p_places_count: placesCount,
    });

    if (error) {
      console.error(
        "Error consuming place credits:",
        error instanceof Error ? error.message : error
      );
      return false;
    }

    return data || false;
  } catch (error) {
    console.error("Error calling consume_place_credits:", error);
    return false;
  }
}
