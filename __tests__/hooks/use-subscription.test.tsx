import { renderHook } from "@testing-library/react";
import React from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { SubscriptionContext } from "@/contexts/SubscriptionProvider";

describe("useSubscription", () => {
  it("Provider の外で使うとエラーを投げる", () => {
    // React がエラーをコンソールに出すため一時的に抑制
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useSubscription())).toThrow(
      "useSubscription must be used within a SubscriptionProvider"
    );
    spy.mockRestore();
  });

  it("Provider 内では context の値を返す", () => {
    const value = {
      plan: "premium",
      isLoading: false,
    } as any;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SubscriptionContext.Provider value={value}>
        {children}
      </SubscriptionContext.Provider>
    );

    const { result } = renderHook(() => useSubscription(), { wrapper });
    expect(result.current).toBe(value);
  });
});
