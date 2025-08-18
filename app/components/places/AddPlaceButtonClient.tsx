"use client";

import { UpgradePlanDialog } from "@/app/components/billing/UpgradePlanDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/hooks/use-i18n";
import { useSubscription } from "@/hooks/use-subscription";
import {
  inferCurrencyFromLocale,
  type OneTimePurchaseType,
} from "@/lib/constants/config/subscription";
import { createClient } from "@/lib/supabase/client";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import AddPlaceForm from "./AddPlaceForm";
import { PlaceLimitReachedDialog } from "./PlaceLimitReachedDialog";

interface AddPlaceButtonClientProps {
  listId: string;
}

export default function AddPlaceButtonClient({
  listId,
}: AddPlaceButtonClientProps) {
  const { t, locale } = useI18n();
  const currency = inferCurrencyFromLocale(locale);
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(Date.now());
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [placeAvailability, setPlaceAvailability] = useState<{
    totalLimit: number;
    usedPlaces: number;
    remainingPlaces: number;
    sources: Array<{
      type: "free" | "subscription" | "one_time_small" | "one_time_regular";
      limit: number;
      used: number;
    }>;
  } | null>(null);
  const { plan, remainingPlaces, loading, refreshSubscription } =
    useSubscription();

  // 購入成功検知：URLパラメータを監視してSubscription状態を更新
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const sessionId = urlParams.get("session_id");

    if (success === "true" && sessionId) {
      // 購入成功を検知したら、Subscription状態をリフレッシュ
      console.log(
        "Purchase success detected, refreshing subscription state..."
      );
      refreshSubscription();

      // URLパラメータをクリア（履歴汚染防止）
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [refreshSubscription]);

  const handlePlaceRegistered = () => {
    setOpen(false);
    setFormKey(Date.now());
    refreshSubscription();
  };

  const handleRequestFormReset = () => {
    setFormKey(Date.now());
  };

  const handleAddPlaceClick = async () => {
    if (!loading && plan === "free" && remainingPlaces <= 0) {
      // 詳細な地点利用可能性情報を取得
      try {
        const response = await fetch("/api/user/place-limits");
        if (response.ok) {
          const data = (await response.json()) as {
            data: {
              totalLimit: number;
              usedPlaces: number;
              remainingPlaces: number;
              sources: Array<{
                type:
                  | "free"
                  | "subscription"
                  | "one_time_small"
                  | "one_time_regular";
                limit: number;
                used: number;
              }>;
            };
          };
          setPlaceAvailability(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch place limits:", error);
      }
      setShowLimitDialog(true);
      return;
    }
    setOpen(true);
  };

  const handleUpgradeClick = () => {
    setShowLimitDialog(false);
    setShowUpgradeDialog(true);
  };

  const handleOneTimePurchase = async (planType: OneTimePurchaseType) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const response = await fetch("/api/stripe/one-time-purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          planType,
          currency,
          language: locale,
          returnUrl: window.location.href,
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Purchase failed");
      }

      // Stripe Checkoutにリダイレクト
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("One-time purchase error:", error);
      // エラートーストなどで通知
    }
  };

  return (
    <>
      {/* スマートフォン表示用のフローティングボタン */}
      <Button
        className="h-10 w-10 rounded-full shadow-lg md:hidden"
        aria-label={t("place.add.mobileAria")}
        onClick={handleAddPlaceClick}
        data-testid="add-place-button-mobile"
      >
        <Plus />
      </Button>
      {/* PC表示用のボタン */}
      <Button
        className="hidden md:inline-flex items-center shadow-md"
        aria-label={t("place.add.pcAria")}
        onClick={handleAddPlaceClick}
        data-testid="add-place-button-pc"
      >
        <Plus className="h-5 w-5 mr-2" />
        {t("place.add.open")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="sm:max-w-[425px] md:max-w-[600px] max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader className="mb-4">
            <DialogTitle>{t("place.add.dialogTitle")}</DialogTitle>
          </DialogHeader>
          <AddPlaceForm
            key={formKey}
            listId={listId}
            onPlaceRegistered={handlePlaceRegistered}
            onResetRequest={handleRequestFormReset}
          />
        </DialogContent>
      </Dialog>
      {/* 地点制限到達ダイアログ */}
      {placeAvailability && (
        <PlaceLimitReachedDialog
          isOpen={showLimitDialog}
          onClose={() => setShowLimitDialog(false)}
          placeAvailability={placeAvailability}
          onUpgrade={handleUpgradeClick}
          onOneTimePurchase={handleOneTimePurchase}
        />
      )}

      {/* アップグレードダイアログ */}
      {showUpgradeDialog && (
        <UpgradePlanDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
        />
      )}
    </>
  );
}
