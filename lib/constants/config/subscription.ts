// サブスクリプションプランごとの機能制限定数
export const SUBSCRIPTION_LIMITS = {
  free: {
    MAX_PLACES_TOTAL: 30, // 累計地点登録制限（20→30に緩和）
    MAX_SHARED_LISTS: 1,
  },
  premium: {
    MAX_PLACES_TOTAL: null, // 無制限
    MAX_SHARED_LISTS: null, // 無制限
  },
};

// --- 多通貨対応 価格定義・ユーティリティ ---

export type SupportedCurrency = "JPY" | "USD" | "EUR";
export type BillingInterval = "monthly" | "yearly";

type PriceIdsPerCurrency = Record<
  SupportedCurrency,
  { monthly: string | undefined; yearly: string | undefined }
>;

type DisplayPricesPerCurrency = Record<
  SupportedCurrency,
  { monthly: number; yearly: number }
>;

// 表示用の税込価格（数値）。通貨ごとに設定。
export const DISPLAY_PRICES: DisplayPricesPerCurrency = {
  JPY: { monthly: 500, yearly: 4200 },
  USD: { monthly: 4.99, yearly: 39.99 },
  EUR: { monthly: 4.99, yearly: 39.99 },
};

// 環境変数から Price ID を集約（フォールバックとして旧2変数を利用）
export const PRICE_IDS_BY_CURRENCY: PriceIdsPerCurrency = {
  JPY: {
    monthly:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY_JPY ||
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY,
    yearly:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY_JPY ||
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY,
  },
  USD: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY_USD,
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY_USD,
  },
  EUR: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY_EUR,
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY_EUR,
  },
};

// 実行時に常に環境変数から解決する関数（テストでの env 差し替えに追随させるため）
export function getPriceIdsByCurrency(): PriceIdsPerCurrency {
  return {
    JPY: {
      monthly:
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY_JPY ||
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY,
      yearly:
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY_JPY ||
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY,
    },
    USD: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY_USD,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY_USD,
    },
    EUR: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY_EUR,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY_EUR,
    },
  };
}

// ロケールから通貨を推定（初期案）。必要に応じてユーザー選択で上書き可能。
export function inferCurrencyFromLocale(
  locale: string | undefined
): SupportedCurrency {
  if (!locale) return "JPY";
  const normalized = locale.toLowerCase();
  if (normalized.startsWith("ja")) return "JPY";
  if (
    normalized.startsWith("de") ||
    normalized.startsWith("fr") ||
    normalized.startsWith("es") ||
    normalized.startsWith("it") ||
    normalized.startsWith("nl") ||
    normalized.startsWith("pt")
  ) {
    return "EUR";
  }
  return "USD";
}

export function getPriceId(
  currency: SupportedCurrency,
  interval: BillingInterval
): string | undefined {
  const ids = PRICE_IDS_BY_CURRENCY[currency];
  return interval === "monthly" ? ids.monthly : ids.yearly;
}

export function formatPrice(
  amount: number,
  currency: SupportedCurrency,
  locale: string | undefined
): string {
  const formatter = new Intl.NumberFormat(locale || "ja-JP", {
    style: "currency",
    currency,
  });
  return formatter.format(amount);
}

// 年額から月あたりの概算額を算出
export function monthlyFromYearly(yearlyAmount: number): number {
  return yearlyAmount / 12;
}

// 年額から算出した月あたり額をIntl整形
export function formatMonthlyFromYearly(
  yearlyAmount: number,
  currency: SupportedCurrency,
  locale: string | undefined
): string {
  return formatPrice(monthlyFromYearly(yearlyAmount), currency, locale);
}

// --- 買い切りプラン定義 ---

export type OneTimePurchaseType = "small_pack" | "regular_pack";

export const ONE_TIME_PURCHASE_PLANS = {
  small_pack: {
    places: 10,
    prices: { JPY: 110, USD: 1, EUR: 1 },
  },
  regular_pack: {
    places: 50,
    prices: { JPY: 440, USD: 4, EUR: 4 },
  },
};

// Stripe Price ID 定義（プランごと - 通貨はパラメータで指定）
export const ONE_TIME_PRICE_IDS = {
  small_pack: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SMALL_PACK,
  regular_pack: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_REGULAR_PACK,
};

// 買い切りプランのPrice IDを取得する関数
export function getOneTimePriceId(
  planType: OneTimePurchaseType
): string | undefined {
  return ONE_TIME_PRICE_IDS[planType];
}
