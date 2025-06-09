import {
  getPlanName,
  getPlanStatus,
  SubscriptionStatus,
} from "../../lib/utils/subscription-utils";

describe("getPlanName", () => {
  const monthlyId = "test_monthly_id";
  const yearlyId = "test_yearly_id";
  let originalMonthly: string | undefined;
  let originalYearly: string | undefined;

  beforeAll(() => {
    originalMonthly = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY;
    originalYearly = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY;
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY = monthlyId;
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY = yearlyId;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY = originalMonthly;
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY = originalYearly;
  });

  it("各プランの価格IDで正しいプラン名を返すこと", () => {
    jest.resetModules();
    const { getPlanName } = require("../../lib/utils/subscription-utils");
    expect(getPlanName(monthlyId)).toBe("プレミアム（月額）");
    expect(getPlanName(yearlyId)).toBe("プレミアム（年額）");
  });

  it("nullや未定義のIDでフリープラン/不明なプランを返すこと", () => {
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
