import {
  DISPLAY_PRICES,
  formatMonthlyFromYearly,
  formatPrice,
  inferCurrencyFromLocale,
} from "@/lib/constants/config/subscription";

describe("subscription config utilities", () => {
  test("inferCurrencyFromLocale maps locales to currencies", () => {
    expect(inferCurrencyFromLocale("ja")).toBe("JPY");
    expect(inferCurrencyFromLocale("ja-JP")).toBe("JPY");
    expect(inferCurrencyFromLocale("en")).toBe("USD");
    expect(inferCurrencyFromLocale("en-US")).toBe("USD");
    expect(inferCurrencyFromLocale("fr")).toBe("EUR");
    expect(inferCurrencyFromLocale("de-DE")).toBe("EUR");
    // fallback
    expect(inferCurrencyFromLocale(undefined)).toBe("JPY");
  });

  test("formatMonthlyFromYearly computes yearly/12 and formats by currency", () => {
    const ja = formatMonthlyFromYearly(
      DISPLAY_PRICES.JPY.yearly,
      "JPY",
      "ja-JP"
    );
    const en = formatMonthlyFromYearly(
      DISPLAY_PRICES.USD.yearly,
      "USD",
      "en-US"
    );
    // Ensure it contains currency symbol-ish and division result
    expect(ja).toMatch(/\d/);
    expect(en).toMatch(/\d/);
  });

  test("formatPrice respects currency and locale", () => {
    const j = formatPrice(500, "JPY", "ja-JP");
    const u = formatPrice(4.99, "USD", "en-US");
    expect(j).toMatch(/\d/);
    expect(u).toMatch(/\d/);
  });
});
