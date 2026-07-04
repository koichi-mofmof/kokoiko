import {
  getPlanNameKey,
  getPlanStatusKey,
  getTotalAvailablePlaces,
} from "../../lib/utils/subscription-utils";
import { getActiveSubscription } from "../../lib/dal/subscriptions";

// getActiveSubscription は dal/subscriptions からインポートされるため明示的にモックする
jest.mock("../../lib/dal/subscriptions", () => ({
  getActiveSubscription: jest.fn(),
}));

const mockGetActiveSubscription = getActiveSubscription as jest.Mock;

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

/**
 * Supabase クエリビルダーのモック。
 * チェーン（select/eq/order...）はすべて自身を返し、await 時に result を解決する
 * thenable として振る舞うため、`getRegisteredPlacesCountTotal`（list_places の count 取得）や
 * `getPlaceCredits`（place_credits の order まで連結）といった実装をそのまま通せる。
 */
function makeQueryBuilder(result: any) {
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    neq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    single: jest.fn(() => Promise.resolve(result)),
    then: (resolve: (v: any) => any) => resolve(result),
  };
  return builder;
}

/**
 * テーブルごとに異なる結果を返す Supabase クライアントのモックを生成する。
 * @param placesCount list_places の count（累計登録地点数）
 * @param credits place_credits.data として返すクレジット配列
 */
function makeSupabaseMock(placesCount: number, credits: any[] = []) {
  return {
    from: jest.fn((table: string) => {
      if (table === "list_places") {
        return makeQueryBuilder({ count: placesCount, error: null });
      }
      if (table === "place_credits") {
        return makeQueryBuilder({ data: credits, error: null });
      }
      return makeQueryBuilder({ data: null, error: null });
    }),
  };
}

describe("getTotalAvailablePlaces", () => {
  const mockUserId = "test-user-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("フリープランユーザーの基本利用可能地点数を正しく計算する", async () => {
    const mockSupabase = makeSupabaseMock(15, []);
    mockGetActiveSubscription.mockResolvedValue(null);

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
    const mockSupabase = makeSupabaseMock(100, []);
    mockGetActiveSubscription.mockResolvedValue({
      status: "active",
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

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
    // 累計40件 = フリー枠30 + 超過10件。超過分はクレジットへ古い順に按分される。
    const mockSupabase = makeSupabaseMock(40, [
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
    ]);
    mockGetActiveSubscription.mockResolvedValue(null);

    const result = await getTotalAvailablePlaces(
      mockSupabase as any,
      mockUserId
    );

    expect(result.totalLimit).toBe(65); // 30 (free) + 35 (利用可能クレジット: 10-5 + 50-20)
    expect(result.usedPlaces).toBe(40);
    expect(result.remainingPlaces).toBe(25);
    expect(result.sources).toHaveLength(3); // free + small_pack + regular_pack

    // フリープランソース（30件まで使用済み扱い）
    expect(result.sources[0].type).toBe("free");
    expect(result.sources[0].limit).toBe(30);
    expect(result.sources[0].used).toBe(30);

    // スモールパッククレジット: consumed 5 + 超過按分 5 = 10（枠を使い切る）
    expect(result.sources[1].type).toBe("one_time_small");
    expect(result.sources[1].limit).toBe(10);
    expect(result.sources[1].used).toBe(10);

    // レギュラーパッククレジット: consumed 20 + 残りの超過按分 5 = 25
    expect(result.sources[2].type).toBe("one_time_regular");
    expect(result.sources[2].limit).toBe(50);
    expect(result.sources[2].used).toBe(25);
  });
});
