import { getPlanName, getPlanStatus } from "../../lib/utils/subscription-utils";

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

  it("価格ID→プラン名を全通貨で正しく解決する", () => {
    jest.resetModules();
    const { getPlanName } = require("../../lib/utils/subscription-utils");
    expect(getPlanName(testIds.JPY.monthly)).toBe("プレミアム（月額）");
    expect(getPlanName(testIds.JPY.yearly)).toBe("プレミアム（年額）");
    expect(getPlanName(testIds.USD.monthly)).toBe("プレミアム（月額）");
    expect(getPlanName(testIds.USD.yearly)).toBe("プレミアム（年額）");
    expect(getPlanName(testIds.EUR.monthly)).toBe("プレミアム（月額）");
    expect(getPlanName(testIds.EUR.yearly)).toBe("プレミアム（年額）");
  });

  it("null/undefined/unknownは適切にフォールバックする", () => {
    jest.resetModules();
    const { getPlanName } = require("../../lib/utils/subscription-utils");
    expect(getPlanName(null)).toBe("フリープラン");
    expect(getPlanName(undefined)).toBe("フリープラン");
    expect(getPlanName("unknown_id")).toBe("不明なプラン");
  });
});

describe("getPlanStatus", () => {
  it("各契約ステータスで正しい日本語テキストとvariantを返すこと", () => {
    expect(getPlanStatus("active")).toEqual({
      text: "有効",
      variant: "default",
    });
    expect(getPlanStatus("trialing")).toEqual({
      text: "トライアル中",
      variant: "default",
    });
    expect(getPlanStatus("canceled")).toEqual({
      text: "キャンセル済み",
      variant: "destructive",
    });
    expect(getPlanStatus("past_due")).toEqual({
      text: "支払い遅延",
      variant: "destructive",
    });
    expect(getPlanStatus("unpaid")).toEqual({
      text: "未払い",
      variant: "destructive",
    });
    expect(getPlanStatus("incomplete")).toEqual({
      text: "支払い未完了",
      variant: "destructive",
    });
    expect(getPlanStatus("incomplete_expired")).toEqual({
      text: "支払い未完了",
      variant: "destructive",
    });
    expect(getPlanStatus(null)).toEqual({
      text: "フリー",
      variant: "secondary",
    });
    expect(getPlanStatus(undefined)).toEqual({
      text: "フリー",
      variant: "secondary",
    });
  });
});
