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
import { Check, Crown, ShieldCheck } from "lucide-react";
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

  // 年額のお得感アンカー：月額プランで1年使った場合の金額（= 月額×12）
  const yearlyOriginalPrice = formatPrice(
    DISPLAY_PRICES[currency].monthly * 12,
    currency,
    locale
  );

  // プランごとの表示内容
  const planInfo = {
    monthly: {
      label: t("upgrade.monthly"),
      price: formatPrice(DISPLAY_PRICES[currency].monthly, currency, locale),
    },
    yearly: {
      label: t("upgrade.yearly"),
      price: formatPrice(DISPLAY_PRICES[currency].yearly, currency, locale),
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
      ) : open === undefined ? (
        // 外部から open を制御していない場合のみ、既定のトリガーを表示する
        <DialogTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            data-testid="upgrade-dialog-trigger"
          >
            {t("upgrade.open")}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-md">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center text-lg">
            {t("upgrade.title")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("upgrade.desc")}
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={plan}
          onValueChange={(v) => setPlan(v as "monthly" | "yearly")}
        >
          <TabsList className="mb-5 grid h-auto w-full grid-cols-2 gap-1 rounded-full bg-neutral-100 p-1">
            <TabsTrigger
              value="yearly"
              data-testid="plan-tab-yearly"
              className="flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold text-neutral-500 transition-all data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm"
            >
              {t("upgrade.year")}
              <Badge className="px-1.5 py-0 text-[10px] font-bold leading-tight">
                {t("upgrade.save")}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              data-testid="plan-tab-monthly"
              className="rounded-full py-2 text-sm font-semibold text-neutral-500 transition-all data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm"
            >
              {t("upgrade.month")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            {/* 月額プラン内容 */}
            <Card className="mt-1 mb-5 overflow-hidden rounded-2xl border border-primary-100 bg-white p-0 shadow-md">
              <CardHeader className="p-5 pb-3">
                <div className="mb-1 text-center text-sm font-semibold text-neutral-500">
                  {planInfo.monthly.label}
                </div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-neutral-900">
                    {planInfo.monthly.price}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {t("upgrade.perMonthSuffix")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="border-t border-neutral-100 pt-3 pb-5">
                <ul className="mb-0 mt-2 text-sm text-neutral-700 space-y-2 px-2">
                  <li className="flex items-center gap-2">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    {t("upgrade.features.unlimitedPlaces")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    {t("upgrade.features.unlimitedSharedLinks")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    {t("upgrade.features.noAds")}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="yearly">
            {/* 年額プラン内容 */}
            <Card className="mt-1 mb-5 overflow-hidden rounded-2xl border border-primary-100 bg-white p-0 shadow-md">
              <CardHeader className="p-5 pb-3">
                <div className="mb-1 text-center text-sm font-semibold text-neutral-500">
                  {planInfo.yearly.label}
                </div>
                {/* 主役の価格（取り消し線アンカー → 実価格） */}
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-base font-medium text-neutral-400 line-through">
                    {yearlyOriginalPrice}
                  </span>
                  <span className="text-3xl font-extrabold tracking-tight text-neutral-900">
                    {planInfo.yearly.price}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {t("upgrade.perYearSuffix")}
                  </span>
                </div>
                {/* 1か月あたりの手頃感（箱なしのクリーンなサブ） */}
                <div className="mt-1.5 text-center text-sm font-semibold text-primary-600">
                  {t("upgrade.perMonthNoteDynamic", {
                    price: formatMonthlyFromYearly(
                      DISPLAY_PRICES[currency].yearly,
                      currency,
                      locale
                    ),
                  })}
                </div>
              </CardHeader>
              <CardContent className="border-t border-neutral-100 pt-3 pb-5">
                <ul className="mb-0 mt-2 text-sm text-neutral-700 space-y-2 px-2">
                  <li className="flex items-center gap-2">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    {t("upgrade.features.unlimitedPlaces")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    {t("upgrade.features.unlimitedSharedLinks")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    {t("upgrade.features.noAds")}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <DialogFooter className="flex-col sm:flex-col">
          <Button
            variant="default"
            className="w-full h-12 text-base font-bold"
            onClick={handleCheckout}
            disabled={loading}
            data-testid="checkout-button"
          >
            {loading ? t("upgrade.redirecting") : t("upgrade.subscribeCta")}
          </Button>
          {/* リスクリバーサル：今は課金されない・いつでも解約OK */}
          <p className="mt-2 flex items-center justify-center gap-1 text-xs text-neutral-500">
            <ShieldCheck className="h-3.5 w-3.5 text-primary-500" />
            {t("upgrade.riskReversal")}
          </p>
        </DialogFooter>
        {error && (
          <div className="text-red-500 text-xs text-center mt-2">{error}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
