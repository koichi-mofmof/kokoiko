"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "@supabase/supabase-js";
import { SUBSCRIPTION_LIMITS } from "@/lib/constants/config/subscription";
import { getActiveSubscription } from "@/lib/dal/subscriptions";
import { createClient } from "@/lib/supabase/client";
import {
  getRegisteredPlacesCountThisMonth,
  getSharedListCount,
} from "@/lib/utils/subscription-utils";

export type PlanType = "free" | "premium";

export interface SubscriptionState {
  plan: PlanType;
  isPremium: boolean;
  isTrial: boolean;
  trialEnd: string | null;
  maxPlaces: number | null; // null=無制限
  registeredPlacesThisMonth: number;
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
  maxPlaces: SUBSCRIPTION_LIMITS.free.MAX_PLACES_PER_MONTH,
  registeredPlacesThisMonth: 0,
  sharedListCount: 0,
  isSharedListLimitExceeded: false,
  loading: true,
  error: null,
};

export const SubscriptionContext = createContext<
  SubscriptionContextType | undefined
>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<SubscriptionState>(initialState);

  const fetchSubscriptionData = useCallback(async (user: User | null) => {
    if (!user) {
      setState({ ...initialState, loading: false });
      return;
    }

    setState((prevState) => ({ ...prevState, loading: true, error: null }));

    try {
      const supabase = createClient();
      const [sub, placesCount, { count: sharedCount }] = await Promise.all([
        getActiveSubscription(user.id),
        getRegisteredPlacesCountThisMonth(supabase, user.id),
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
        maxPlaces: premium
          ? SUBSCRIPTION_LIMITS.premium.MAX_PLACES_PER_MONTH
          : SUBSCRIPTION_LIMITS.free.MAX_PLACES_PER_MONTH,
        registeredPlacesThisMonth: placesCount,
        sharedListCount: sharedCount,
        isSharedListLimitExceeded:
          !premium && sharedCount >= SUBSCRIPTION_LIMITS.free.MAX_SHARED_LISTS,
        loading: false,
        error: null,
      });
    } catch (e: any) {
      setState((prevState) => ({
        ...prevState,
        error: e.message || "不明なエラーが発生しました",
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

  return (
    <SubscriptionContext.Provider value={{ ...state, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
