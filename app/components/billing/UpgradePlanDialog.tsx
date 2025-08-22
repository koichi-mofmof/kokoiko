"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/hooks/use-i18n";
import {
  DISPLAY_PRICES,
  formatPrice,
  formatMonthlyFromYearly,
  getPriceId,
  inferCurrencyFromLocale,
  type BillingInterval,
  type SupportedCurrency,
} from "@/lib/constants/config/subscription";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";
import { ReactNode, useState } from "react";

type UpgradePlanDialogProps = {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function UpgradePlanDialog({
  trigger,
  open,
  onOpenChange,
}: UpgradePlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<BillingInterval>("yearly");
  const { t, locale } = useI18n();
  const currency: SupportedCurrency = inferCurrencyFromLocale(locale);

  // 通貨×プランに応じた Price ID
  const priceId = getPriceId(currency, plan);

  // プランごとの表示内容
  const planInfo = {
    monthly: {
      label: t("upgrade.monthly"),
      price: formatPrice(DISPLAY_PRICES[currency].monthly, currency, locale),
      sub: t("upgrade.freeTrial"),
      note: t("upgrade.note"),
    },
    yearly: {
      label: t("upgrade.yearly"),
      price: formatPrice(DISPLAY_PRICES[currency].yearly, currency, locale),
      sub: t("upgrade.freeTrial"),
      note: t("upgrade.note"),
    },
  } as const;

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(t("common.loginRequired"));
        setLoading(false);
        return;
      }
      if (!priceId) {
        setError(t("errors.stripe.checkoutSessionFailed"));
        setLoading(false);
        return;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          priceId,
          returnUrl: window.location.href,
          locale,
          currency,
        }),
      });

      // レートリミット制限の場合は特別なハンドリング
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") || "60";
        setError(t("errors.stripe.rateLimitExceeded", { seconds: retryAfter }));
        setLoading(false);
        return;
      }

      // レスポンスがJSONでない可能性を考慮
      let data: { url?: string; error?: string; errorKey?: string };
      try {
        data = await res.json();
      } catch {
        // JSONパースに失敗した場合（レートリミット等）
        const text = await res.text();
        console.error("JSON parse failed, raw response:", text);
        setError(
          t("errors.stripe.invalidResponse") || "サーバーエラーが発生しました"
        );
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || t("errors.stripe.checkoutSessionFailed"));
        setLoading(false);
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message || t("common.unexpectedError"));
      } else {
        setError(t("common.unexpectedError"));
      }
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <div onClick={() => onOpenChange?.(true)}>{trigger}</div>
      ) : (
        <DialogTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            data-testid="upgrade-dialog-trigger"
          >
            {t("upgrade.open")}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("upgrade.title")}</DialogTitle>
          <DialogDescription>{t("upgrade.desc")}</DialogDescription>
        </DialogHeader>
        <Tabs
          value={plan}
          onValueChange={(v) => setPlan(v as "monthly" | "yearly")}
        >
          <TabsList className="flex mb-4 border-b bg-transparent p-0">
            <TabsTrigger
              value="yearly"
              data-testid="plan-tab-yearly"
              className={`flex-1 py-2 text-center text-sm font-medium border-b-2 transition-colors ${
                plan === "yearly"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("upgrade.year")}
              <span className="ml-2 align-middle">
                <Badge className="font-bold px-2 py-0.5 text-xs">
                  {t("upgrade.save")}
                </Badge>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              data-testid="plan-tab-monthly"
              className={`flex-1 py-2 text-center text-sm font-medium border-b-2 transition-colors ${
                plan === "monthly"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("upgrade.month")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            {/* 月額プラン内容 */}
            <Card className="my-4 p-0 border rounded-xl bg-neutral-50 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <div className="text-base font-bold text-primary-700 mb-1 text-center">
                  {planInfo.monthly.label}
                </div>
                <div className="text-2xl font-extrabold text-neutral-900 mb-1 text-center">
                  {planInfo.monthly.price}
                </div>
                <div className="text-xs text-neutral-500 text-center mb-1">
                  {planInfo.monthly.sub}
                </div>
              </CardHeader>
              <CardContent className="pt-2 pb-4 border-t border-neutral-200">
                <ul className="mb-0 mt-2 text-sm text-neutral-700 space-y-2 px-2">
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    {t("upgrade.features.unlimitedPlaces")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    {t("upgrade.features.unlimitedSharedLinks")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    {t("upgrade.features.noAds")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    {t("upgrade.features.freeTrial14Days")}
                  </li>
                </ul>
                <div className="text-xs text-neutral-500 text-center mt-2">
                  {planInfo.monthly.note}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="yearly">
            {/* 年額プラン内容 */}
            <Card className="my-4 p-0 border rounded-xl bg-neutral-50 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-center mb-2">
                  <Badge className="font-bold px-2 py-0.5 text-xs">
                    {t("upgrade.save")}
                  </Badge>
                </div>
                <div className="text-base font-bold text-primary-700 mb-1 text-center">
                  {planInfo.yearly.label}
                </div>
                <div className="text-2xl font-extrabold text-neutral-900 mb-1 text-center">
                  {planInfo.yearly.price}
                </div>
                <div className="text-lg text-primary-600 text-center mb-1 font-extrabold bg-primary-50 py-2 px-4 rounded-md border border-primary-200">
                  {t("upgrade.perMonthNoteDynamic", {
                    price: formatMonthlyFromYearly(
                      DISPLAY_PRICES[currency].yearly,
                      currency,
                      locale
                    ),
                  })}
                </div>
                <div className="text-xs text-neutral-500 text-center mb-1">
                  {planInfo.yearly.sub}
                </div>
              </CardHeader>
              <CardContent className="pt-2 pb-4 border-t border-neutral-200">
                <ul className="mb-0 mt-2 text-sm text-neutral-700 space-y-2 px-2">
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    {t("upgrade.features.unlimitedPlaces")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    {t("upgrade.features.unlimitedSharedLinks")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    {t("upgrade.features.noAds")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    {t("upgrade.features.freeTrial14Days")}
                  </li>
                </ul>
                <div className="text-xs text-neutral-500 text-center mt-2">
                  {planInfo.yearly.note}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button
            variant="default"
            className="w-full"
            onClick={handleCheckout}
            disabled={loading}
            data-testid="checkout-button"
          >
            {loading
              ? t("upgrade.redirecting")
              : t("upgrade.apply", { plan: planInfo[plan].label })}
          </Button>
        </DialogFooter>
        {error && (
          <div className="text-red-500 text-xs text-center mt-2">{error}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
