"use client";

import { useEffect } from "react";
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
}

export function PlaceLimitReachedDialog({
  isOpen,
  onClose,
  placeAvailability,
  onUpgrade,
}: PlaceLimitReachedDialogProps) {
  const { t } = useI18n();
  const { refreshSubscription } = useSubscription();

  // 購入成功検知：URLパラメータを監視してSubscription状態を更新
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const sessionId = urlParams.get("session_id");

    if (success === "true" && sessionId) {
      // 購入成功を検知したら、Subscription状態をリフレッシュしてダイアログを閉じる
      refreshSubscription();
      onClose(); // ダイアログを自動で閉じる

      // URLパラメータをクリア（履歴汚染防止）
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [refreshSubscription, onClose]);

  const handleUpgrade = () => {
    onUpgrade();
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

          {/* プレミアムプランへのアップグレード */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">
              {t("places.limitReached.upgradeOptions")}
            </h4>

            <Button
              onClick={handleUpgrade}
              variant="outline"
              className="w-full justify-between p-4 h-auto border-primary-300 bg-primary-50 hover:bg-primary-100"
            >
              <div className="text-left">
                <div className="font-semibold text-primary-700">
                  {t("home.pricing.premium.title")}
                </div>
                <div className="text-xs text-gray-500">
                  {t("common.unlimited")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-primary-600">
                  {t("upgrade.viewDetails")}
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
