"use client";

import {
  SubscriptionContext,
  SubscriptionContextType,
} from "@/contexts/SubscriptionProvider";
import { useContext } from "react";

export type {
  PlanType,
  SubscriptionState as UseSubscriptionResult,
} from "@/contexts/SubscriptionProvider";

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}
