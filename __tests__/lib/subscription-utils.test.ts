import {
  getPlanNameKey,
  getPlanStatusKey,
} from "../../lib/utils/subscription-utils";

describe("getPlanName (multi-currency)", () => {
  const originalEnv = { ...process.env };
  const testIds = {
    JPY: { monthly: "price_test_jpy_month", yearly: "price_test_jpy_year" },
    USD: { monthly: "price_test_usd_month", yearly: "price_test_usd_year" },
    EUR: { monthly: "price_test_eur_month", yearly: "price_test_eur_year" },
  } as const;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY_JPY = testIds.JPY.monthly;
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY_JPY = testIds.JPY.yearly;
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY_USD = testIds.USD.monthly;
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY_USD = testIds.USD.yearly;
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY_EUR = testIds.EUR.monthly;
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY_EUR = testIds.EUR.yearly;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("価格ID→プラン名キーを全通貨で正しく解決する", () => {
    jest.resetModules();
    expect(getPlanNameKey(testIds.JPY.monthly)).toBe(
      "subscription.plan.premiumMonthly"
    );
    expect(getPlanNameKey(testIds.JPY.yearly)).toBe(
      "subscription.plan.premiumYearly"
    );
    expect(getPlanNameKey(testIds.USD.monthly)).toBe(
      "subscription.plan.premiumMonthly"
    );
    expect(getPlanNameKey(testIds.USD.yearly)).toBe(
      "subscription.plan.premiumYearly"
    );
    expect(getPlanNameKey(testIds.EUR.monthly)).toBe(
      "subscription.plan.premiumMonthly"
    );
    expect(getPlanNameKey(testIds.EUR.yearly)).toBe(
      "subscription.plan.premiumYearly"
    );
  });

  it("null/undefined/unknownは適切にフォールバックする", () => {
    jest.resetModules();
    expect(getPlanNameKey(null)).toBe("subscription.plan.free");
    expect(getPlanNameKey(undefined)).toBe("subscription.plan.free");
    expect(getPlanNameKey("unknown_id")).toBe("subscription.plan.unknown");
  });
});

describe("getPlanStatus", () => {
  it("各契約ステータスで正しいキーを返すこと", () => {
    expect(getPlanStatusKey("active")).toBe("subscription.status.active");
    expect(getPlanStatusKey("trialing")).toBe("subscription.status.trialing");
    expect(getPlanStatusKey("canceled")).toBe("subscription.status.canceled");
    expect(getPlanStatusKey("past_due")).toBe("subscription.status.pastDue");
    expect(getPlanStatusKey("unpaid")).toBe("subscription.status.unpaid");
    expect(getPlanStatusKey("incomplete")).toBe(
      "subscription.status.incomplete"
    );
    expect(getPlanStatusKey("incomplete_expired")).toBe(
      "subscription.status.incompleteExpired"
    );
    expect(getPlanStatusKey(null)).toBe("subscription.status.free");
    expect(getPlanStatusKey(undefined)).toBe("subscription.status.free");
  });
});
