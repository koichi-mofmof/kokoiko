import {
  getPlanNameKey,
  getPlanStatusKey,
  getTotalAvailablePlaces,
} from "../../lib/utils/subscription-utils";
import { createClient } from "../../lib/supabase/server";

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

// Mock Supabase client
jest.mock("../../lib/supabase/server");
jest.mock("../../lib/dal/subscriptions");

describe("getTotalAvailablePlaces", () => {
  const mockUserId = "test-user-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("フリープランユーザーの基本利用可能地点数を正しく計算する", async () => {
    const mockSupabase = {
      from: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock getActiveSubscription to return null (free plan)
    const { getActiveSubscription } = await import(
      "../../lib/dal/subscriptions"
    );
    (getActiveSubscription as jest.Mock).mockResolvedValue(null);

    // Mock getRegisteredPlacesCountTotal
    jest.doMock("../../lib/utils/subscription-utils", () => ({
      ...jest.requireActual("../../lib/utils/subscription-utils"),
      getRegisteredPlacesCountTotal: jest.fn().mockResolvedValue(15),
    }));

    const result = await getTotalAvailablePlaces(
      mockSupabase as any,
      mockUserId
    );

    expect(result.totalLimit).toBe(30); // フリープランの制限
    expect(result.usedPlaces).toBe(15);
    expect(result.remainingPlaces).toBe(15);
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].type).toBe("free");
    expect(result.sources[0].limit).toBe(30);
    expect(result.sources[0].used).toBe(15);
  });

  it("プレミアムプランユーザーは無制限の地点数を取得する", async () => {
    const mockSupabase = {
      from: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock getActiveSubscription to return active subscription
    const { getActiveSubscription } = await import(
      "../../lib/dal/subscriptions"
    );
    (getActiveSubscription as jest.Mock).mockResolvedValue({
      status: "active",
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    // Mock getRegisteredPlacesCountTotal
    jest.doMock("../../lib/utils/subscription-utils", () => ({
      ...jest.requireActual("../../lib/utils/subscription-utils"),
      getRegisteredPlacesCountTotal: jest.fn().mockResolvedValue(100),
    }));

    const result = await getTotalAvailablePlaces(
      mockSupabase as any,
      mockUserId
    );

    expect(result.totalLimit).toBe(Infinity);
    expect(result.usedPlaces).toBe(100);
    expect(result.remainingPlaces).toBe(Infinity);
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].type).toBe("subscription");
    expect(result.sources[0].limit).toBe(Infinity);
    expect(result.sources[0].used).toBe(100);
  });

  it("フリープラン + 買い切りクレジットの地点数を正しく計算する", async () => {
    const mockSupabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === "place_credits") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn((field, value) => {
              // 1つ目のeq呼び出し（user_id）
              return {
                eq: jest.fn((field2, value2) => {
                  // 2つ目のeq呼び出し（is_active）
                  return {
                    order: jest.fn().mockResolvedValue({
                      data: [
                        {
                          credit_type: "one_time_small",
                          places_purchased: 10,
                          places_consumed: 5,
                        },
                        {
                          credit_type: "one_time_regular",
                          places_purchased: 50,
                          places_consumed: 20,
                        },
                      ],
                      error: null,
                    }),
                  };
                }),
              };
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock getActiveSubscription to return null (free plan)
    const { getActiveSubscription } = await import(
      "../../lib/dal/subscriptions"
    );
    (getActiveSubscription as jest.Mock).mockResolvedValue(null);

    // Mock getRegisteredPlacesCountTotal
    jest.doMock("../../lib/utils/subscription-utils", () => ({
      ...jest.requireActual("../../lib/utils/subscription-utils"),
      getRegisteredPlacesCountTotal: jest.fn().mockResolvedValue(40), // 30 + 10 (超過分)
    }));

    const result = await getTotalAvailablePlaces(
      mockSupabase as any,
      mockUserId
    );

    expect(result.totalLimit).toBe(65); // 30 (free) + 35 (available from credits: 10-5 + 50-20)
    expect(result.usedPlaces).toBe(40);
    expect(result.remainingPlaces).toBe(25);
    expect(result.sources).toHaveLength(3); // free + small_pack + regular_pack

    // フリープランソース
    expect(result.sources[0].type).toBe("free");
    expect(result.sources[0].limit).toBe(30);
    expect(result.sources[0].used).toBe(30);

    // スモールパッククレジット
    expect(result.sources[1].type).toBe("one_time_small");
    expect(result.sources[1].limit).toBe(10);
    expect(result.sources[1].used).toBe(10); // 5 (consumed) + 5 (additional used)

    // レギュラーパッククレジット
    expect(result.sources[2].type).toBe("one_time_regular");
    expect(result.sources[2].limit).toBe(50);
    expect(result.sources[2].used).toBe(20);
  });
});
