import React, { ReactNode } from "react";
import {
  SubscriptionContext,
  SubscriptionContextType,
  PlanType,
} from "@/contexts/SubscriptionProvider";
import { SUBSCRIPTION_LIMITS } from "@/lib/constants/config/subscription";

// Subscription情報のモック
const mockSubscriptionData: SubscriptionContextType = {
  plan: "free" as PlanType,
  isPremium: false,
  isTrial: false,
  trialEnd: null,
  maxPlaces: SUBSCRIPTION_LIMITS.free.MAX_PLACES_TOTAL, // 定数名変更
  registeredPlacesTotal: 0, // プロパティ名変更
  sharedListCount: 0,
  isSharedListLimitExceeded: false,
  loading: false,
  error: null,
  refreshSubscription: async () => {
    /* do nothing */
  },
};

// テスト用のプロバイダーコンポーネント
export function MockSubscriptionProvider({
  children,
  customData = {},
}: {
  children: ReactNode;
  customData?: Partial<SubscriptionContextType>;
}) {
  const contextValue = {
    ...mockSubscriptionData,
    ...customData,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// カスタムレンダーラッパー
export function renderWithSubscription(
  ui: React.ReactElement,
  customData = {}
) {
  return {
    ui: (
      <MockSubscriptionProvider customData={customData}>
        {ui}
      </MockSubscriptionProvider>
    ),
    customData,
  };
}

// サンプルテスト（プロバイダーが正しく動作することを確認）
describe("MockSubscriptionProvider", () => {
  it("renders without crashing", () => {
    expect(() => {
      MockSubscriptionProvider({ children: <div>Test</div> });
    }).not.toThrow();
  });
});
