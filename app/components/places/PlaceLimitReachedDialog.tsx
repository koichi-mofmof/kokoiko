"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import {
  formatPrice,
  inferCurrencyFromLocale,
  ONE_TIME_PURCHASE_PLANS,
  type OneTimePurchaseType,
} from "@/lib/constants/config/subscription";
import { useSubscription } from "@/hooks/use-subscription";
import { Info } from "lucide-react";

interface PlaceLimitReachedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  placeAvailability: {
    totalLimit: number;
    usedPlaces: number;
    remainingPlaces: number;
    sources: Array<{
      type: "free" | "subscription" | "one_time_small" | "one_time_regular";
      limit: number;
      used: number;
    }>;
  };
  onUpgrade: () => void;
  onOneTimePurchase: (planType: OneTimePurchaseType) => void;
}

export function PlaceLimitReachedDialog({
  isOpen,
  onClose,
  placeAvailability,
  onUpgrade,
  onOneTimePurchase,
}: PlaceLimitReachedDialogProps) {
  const { t, locale } = useI18n();
  const { refreshSubscription } = useSubscription();
  const currency = inferCurrencyFromLocale(locale);
  const [loading, setLoading] = useState<string | null>(null);

  // 購入成功検知：URLパラメータを監視してSubscription状態を更新
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const sessionId = urlParams.get("session_id");

    if (success === "true" && sessionId) {
      // 購入成功を検知したら、Subscription状態をリフレッシュしてダイアログを閉じる
      console.log(
        "Purchase success detected, refreshing subscription and closing dialog..."
      );
      refreshSubscription();
      onClose(); // ダイアログを自動で閉じる

      // URLパラメータをクリア（履歴汚染防止）
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [refreshSubscription, onClose]);

  const handleOneTimePurchase = async (planType: OneTimePurchaseType) => {
    setLoading(planType);
    try {
      await onOneTimePurchase(planType);
    } finally {
      setLoading(null);
    }
  };

  const handleUpgrade = async () => {
    setLoading("premium");
    try {
      await onUpgrade();
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Info className="w-6 h-6 text-amber-500 mr-2" />
            {t("places.limitReached.title")}
          </DialogTitle>
          <DialogDescription>
            {t("places.limitReached.description", {
              used: placeAvailability.usedPlaces,
              total: placeAvailability.totalLimit,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 現在の利用状況表示 */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">
              {t("places.currentUsage")}
            </h4>
            {placeAvailability.sources.map((source, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{t(`places.source.${source.type}`)}</span>
                <span>
                  {source.used}/{source.limit === Infinity ? "∞" : source.limit}
                </span>
              </div>
            ))}
          </div>

          {/* 追加オプション */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">
              {t("places.limitReached.upgradeOptions")}
            </h4>

            {/* プレミアムプラン（おすすめ） */}
            <Button
              onClick={handleUpgrade}
              disabled={loading !== null}
              variant="outline"
              className="w-full justify-between p-4 h-auto border-primary-300 bg-primary-50 hover:bg-primary-100 relative"
            >
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                  {t("home.pricing.oneTime.recommended")}
                </span>
              </div>
              <div className="text-left">
                <div className="font-semibold text-primary-700">
                  {t("home.pricing.premium.title")}
                </div>
                <div className="text-xs text-gray-500">
                  {t("common.unlimited")} • {t("upgrade.freeTrial")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-primary-600">
                  {t("upgrade.viewDetails")}
                </div>
              </div>
            </Button>

            {/* 50件パック */}
            <Button
              onClick={() => handleOneTimePurchase("regular_pack")}
              disabled={loading !== null}
              variant="outline"
              className="w-full justify-between p-4 h-auto"
            >
              <div className="text-left">
                <div className="font-semibold">
                  {t("home.pricing.oneTime.regular.title")}
                </div>
                <div className="text-xs text-gray-500">
                  {t("home.pricing.oneTime.addPlaces", {
                    n: ONE_TIME_PURCHASE_PLANS.regular_pack.places,
                  })}{" "}
                  • {t("home.pricing.oneTime.savePlaces", { n: 10 })}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">
                  {formatPrice(
                    ONE_TIME_PURCHASE_PLANS.regular_pack.prices[currency],
                    currency,
                    locale
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {t("home.pricing.oneTime.oneTimePayment")}
                </div>
              </div>
            </Button>

            {/* 10件パック */}
            <Button
              onClick={() => handleOneTimePurchase("small_pack")}
              disabled={loading !== null}
              variant="outline"
              className="w-full justify-between p-4 h-auto"
            >
              <div className="text-left">
                <div className="font-semibold">
                  {t("home.pricing.oneTime.small.title")}
                </div>
                <div className="text-xs text-gray-500">
                  {t("home.pricing.oneTime.addPlaces", {
                    n: ONE_TIME_PURCHASE_PLANS.small_pack.places,
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">
                  {formatPrice(
                    ONE_TIME_PURCHASE_PLANS.small_pack.prices[currency],
                    currency,
                    locale
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {t("home.pricing.oneTime.oneTimePayment")}
                </div>
              </div>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
