"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { User } from "@supabase/supabase-js";
import { SUBSCRIPTION_LIMITS } from "@/lib/constants/config/subscription";
import { getActiveSubscription } from "@/lib/dal/subscriptions";
import { createClient } from "@/lib/supabase/client";
import {
  getTotalAvailablePlaces,
  getSharedListCount,
} from "@/lib/utils/subscription-utils";

export type PlanType = "free" | "premium";

export interface SubscriptionState {
  plan: PlanType;
  isPremium: boolean;
  isTrial: boolean;
  trialEnd: string | null;
  totalLimit: number; // 総利用可能地点数（買い切りクレジット含む）
  usedPlaces: number; // 使用済み地点数
  remainingPlaces: number; // 残り地点数
  registeredPlacesTotal: number; // 名前変更：registeredPlacesThisMonth → registeredPlacesTotal（後方互換性）
  sharedListCount: number;
  isSharedListLimitExceeded: boolean;
  loading: boolean;
  error: string | null;
}

export interface SubscriptionContextType extends SubscriptionState {
  refreshSubscription: () => Promise<void>;
}

const initialState: SubscriptionState = {
  plan: "free",
  isPremium: false,
  isTrial: false,
  trialEnd: null,
  totalLimit: SUBSCRIPTION_LIMITS.free.MAX_PLACES_TOTAL!, // 総利用可能地点数
  usedPlaces: 0, // 使用済み地点数
  remainingPlaces: SUBSCRIPTION_LIMITS.free.MAX_PLACES_TOTAL!, // 残り地点数
  registeredPlacesTotal: 0, // 後方互換性のため保持
  sharedListCount: 0,
  isSharedListLimitExceeded: false,
  loading: true,
  error: null,
};

export const SubscriptionContext = createContext<
  SubscriptionContextType | undefined
>(undefined);

export const SubscriptionProvider = ({
  children,
  serverUserId = null,
}: {
  children: ReactNode;
  /**
   * サーバー側で把握しているログインユーザーID。
   * サーバーアクションによるログイン/ログアウト後はクライアントの
   * onAuthStateChange が発火しないため、この値の変化を再取得トリガーにする。
   */
  serverUserId?: string | null;
}) => {
  const [state, setState] = useState<SubscriptionState>(initialState);

  const fetchSubscriptionData = useCallback(async (user: User | null) => {
    if (!user) {
      setState({ ...initialState, loading: false });
      return;
    }

    setState((prevState) => ({ ...prevState, loading: true, error: null }));

    try {
      const supabase = createClient();
      const [sub, placeAvailability, { count: sharedCount }] =
        await Promise.all([
          getActiveSubscription(user.id),
          getTotalAvailablePlaces(supabase, user.id), // 買い切りクレジット対応
          getSharedListCount(supabase, user.id),
        ]);

      const premium =
        sub && (sub.status === "active" || sub.status === "trialing");
      const trial = sub && sub.status === "trialing";
      const plan: PlanType = premium ? "premium" : "free";

      setState({
        plan,
        isPremium: !!premium,
        isTrial: !!trial,
        trialEnd: sub?.trial_end || null,
        totalLimit: placeAvailability.totalLimit, // 買い切りクレジット含む総制限
        usedPlaces: placeAvailability.usedPlaces, // 使用済み地点数
        remainingPlaces: placeAvailability.remainingPlaces, // 残り地点数
        registeredPlacesTotal: placeAvailability.usedPlaces, // 後方互換性
        sharedListCount: sharedCount,
        isSharedListLimitExceeded:
          !premium &&
          SUBSCRIPTION_LIMITS.free.MAX_SHARED_LISTS !== null &&
          sharedCount >= SUBSCRIPTION_LIMITS.free.MAX_SHARED_LISTS,
        loading: false,
        error: null,
      });
    } catch (e: unknown) {
      setState((prevState) => ({
        ...prevState,
        error: e instanceof Error ? e.message : "不明なエラーが発生しました",
        loading: false,
      }));
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    await fetchSubscriptionData(data.user);
  }, [fetchSubscriptionData]);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      fetchSubscriptionData(currentUser);
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, [fetchSubscriptionData]);

  // サーバーアクションによるログイン/ログアウトでは onAuthStateChange が
  // 発火しないため、サーバー既知のユーザーID変化を再取得トリガーにする。
  // 初回マウントは上の onAuthStateChange(INITIAL_SESSION) に任せ、二重取得を避ける。
  const lastUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const normalized = serverUserId ?? null;
    if (lastUserIdRef.current === undefined) {
      lastUserIdRef.current = normalized;
      return;
    }
    if (lastUserIdRef.current !== normalized) {
      lastUserIdRef.current = normalized;
      refreshSubscription();
    }
  }, [serverUserId, refreshSubscription]);

  return (
    <SubscriptionContext.Provider value={{ ...state, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
