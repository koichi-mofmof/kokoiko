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
import { trackOnboardingEvents } from "@/lib/analytics/events";
import { MapPin, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import AddPlaceForm from "./AddPlaceForm";
import { PlaceLimitReachedDialog } from "./PlaceLimitReachedDialog";

interface AddPlaceButtonClientProps {
  listId: string;
  // "toolbar"（既定）はヘッダーのコンパクトなボタン、"empty" は空リスト用の発射台カード
  variant?: "toolbar" | "empty";
  // リストが地点0件か（初回追加＝アクティベーションの計測に使用）
  isFirstPlace?: boolean;
}

export default function AddPlaceButtonClient({
  listId,
  variant = "toolbar",
  isFirstPlace = false,
}: AddPlaceButtonClientProps) {
  const { t } = useI18n();
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

  // リスト作成直後（?firstPlace=1）に「場所を追加」ダイアログを自動起動し、
  // 作成→1軒目を1フローに繋ぐ。空リスト用の empty variant だけが担当し二重起動を防ぐ。
  useEffect(() => {
    if (variant !== "empty") return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("firstPlace") === "1") {
      setOpen(true);
      trackOnboardingEvents.firstPlacePrompted(listId);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [variant, listId]);

  const handlePlaceRegistered = () => {
    setOpen(false);
    setFormKey(Date.now());
    refreshSubscription();
    // 空リストへの初回追加＝アクティベーション成立を計測
    if (isFirstPlace) {
      trackOnboardingEvents.firstPlaceAdded(listId);
    }
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

  return (
    <>
      {variant === "empty" ? (
        /* 空リスト用の発射台カード：作成直後の空白を「最初の1軒を追加」CTAに変える */
        <div
          className="bg-white rounded-soft border border-neutral-200 shadow-soft p-8 text-center flex flex-col items-center"
          data-testid="add-place-empty-state"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 mb-4">
            <MapPin className="h-6 w-6 text-primary-500" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">
            {t("place.list.emptyOwner.title")}
          </h3>
          <p className="text-sm text-neutral-600 mb-4 max-w-xs">
            {t("place.list.emptyOwner.desc")}
          </p>
          <Button
            className="inline-flex items-center shadow-md"
            aria-label={t("place.add.pcAria")}
            onClick={handleAddPlaceClick}
            data-testid="add-place-button-empty"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t("place.add.open")}
          </Button>
        </div>
      ) : (
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
        </>
      )}

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
