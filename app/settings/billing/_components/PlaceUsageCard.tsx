"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/hooks/use-i18n";
import { useSubscription } from "@/hooks/use-subscription";
import {
  formatPrice,
  inferCurrencyFromLocale,
  ONE_TIME_PURCHASE_PLANS,
} from "@/lib/constants/config/subscription";
import { Loader2, MapPin, CreditCard } from "lucide-react";

export function PlaceUsageCard() {
  const { t, locale } = useI18n();
  const currency = inferCurrencyFromLocale(locale);
  const { plan, totalLimit, usedPlaces, remainingPlaces, loading } =
    useSubscription();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t("settings.billing.placeUsage.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isUnlimited = plan === "premium" || totalLimit >= 999999;
  const usagePercentage = isUnlimited ? 0 : (usedPlaces / totalLimit) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {t("settings.billing.placeUsage.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 現在の利用状況 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {t("settings.billing.placeUsage.currentUsage")}
            </span>
            <span className="text-sm text-muted-foreground">
              {usedPlaces} / {isUnlimited ? "∞" : totalLimit.toLocaleString()}{" "}
              {t("settings.billing.placeUsage.places")}
            </span>
          </div>
          {!isUnlimited && <Progress value={usagePercentage} className="h-2" />}
        </div>

        {/* プラン情報 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {t("settings.billing.placeUsage.currentPlan")}
            </span>
            <Badge variant={plan === "premium" ? "default" : "secondary"}>
              {plan === "premium" ? "Premium" : "Free"}
            </Badge>
          </div>

          {plan === "free" && (
            <div className="text-sm text-muted-foreground">
              <p>{t("settings.billing.placeUsage.basicPlan")}</p>
              {remainingPlaces > 0 && (
                <p className="text-green-600">
                  {t("settings.billing.placeUsage.remainingPlaces", {
                    n: remainingPlaces.toLocaleString(),
                  })}
                </p>
              )}
              {remainingPlaces <= 0 && (
                <p className="text-amber-600">
                  {t("settings.billing.placeUsage.limitReached")}
                </p>
              )}
            </div>
          )}

          {plan === "premium" && (
            <div className="text-sm text-muted-foreground">
              <p>{t("settings.billing.placeUsage.unlimitedPlaces")}</p>
            </div>
          )}
        </div>

        {/* 買い切りクレジット情報（Free プランのみ） */}
        {plan === "free" && totalLimit > 30 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                {t("settings.billing.placeUsage.oneTimeCredits")}
              </span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                {t("settings.billing.placeUsage.additionalPurchased", {
                  n: (totalLimit - 30).toLocaleString(),
                })}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-green-50 p-2 rounded">
                  <p className="font-medium text-green-800">
                    {t("home.pricing.oneTime.small.title")}
                  </p>
                  <p className="text-green-600">
                    {formatPrice(
                      ONE_TIME_PURCHASE_PLANS.small_pack.prices[currency],
                      currency,
                      locale
                    )}
                  </p>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <p className="font-medium text-blue-800">
                    {t("home.pricing.oneTime.regular.title")}
                  </p>
                  <p className="text-blue-600">
                    {formatPrice(
                      ONE_TIME_PURCHASE_PLANS.regular_pack.prices[currency],
                      currency,
                      locale
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
