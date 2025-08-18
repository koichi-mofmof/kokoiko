import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UpgradePlanDialog } from "@/app/components/billing/UpgradePlanDialog";

jest.mock("@/hooks/use-i18n", () => {
  return {
    __esModule: true,
    useI18n: () => ({
      t: (k: string, p?: any) =>
        k === "upgrade.apply"
          ? `申し込む`
          : k === "upgrade.open"
          ? "アップグレード"
          : k,
      locale: "ja",
      setLocale: jest.fn(),
    }),
  };
});

// PRICE ID や通貨推定をテスト用に固定化
jest.mock("@/lib/constants/config/subscription", () => {
  const actual = jest.requireActual("@/lib/constants/config/subscription");
  return {
    __esModule: true,
    ...actual,
    inferCurrencyFromLocale: () => "JPY",
    getPriceId: (currency: string, interval: string) => {
      if (currency === "JPY" && interval === "monthly")
        return "price_test_month_jpy";
      if (currency === "JPY" && interval === "yearly")
        return "price_test_year_jpy";
      return undefined as any;
    },
    DISPLAY_PRICES: {
      JPY: { monthly: 500, yearly: 4200 },
      USD: { monthly: 4.99, yearly: 39.99 },
      EUR: { monthly: 4.99, yearly: 39.99 },
    },
  };
});

describe("UpgradePlanDialog currency display", () => {
  it("sends checkout payload with currency and mapped priceId", async () => {
    const fetchSpy = jest.spyOn(global, "fetch" as any).mockResolvedValue({
      json: async () => ({ url: "https://stripe.example" }),
    } as any);

    render(<UpgradePlanDialog />);
    fireEvent.click(screen.getByText("アップグレード"));
    const checkout = await screen.findByTestId("checkout-button");
    fireEvent.click(checkout);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const [, init] = fetchSpy.mock.calls[0] as any;
    const body = JSON.parse(init.body);
    expect(body.currency).toBe("JPY");
    expect(body.priceId).toBe("price_test_year_jpy"); // デフォルトが年額プランに変更されたため

    fetchSpy.mockRestore();
  });
});
