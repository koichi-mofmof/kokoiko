"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { trackConversionEvents } from "@/lib/analytics/events";
import { Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SignupPromptBannerProps {
  listId: string;
  onDismiss?: () => void;
}

export function SignupPromptBanner({
  listId,
  onDismiss,
}: SignupPromptBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { t } = useI18n();

  // バナー表示をトラッキング
  useEffect(() => {
    trackConversionEvents.bannerShown(listId);
  }, [listId]);

  const handleDismiss = () => {
    setIsVisible(false);
    trackConversionEvents.bannerDismissed(listId);
    onDismiss?.();
  };

  const handleCtaClick = () => {
    trackConversionEvents.bannerCtaClicked(listId);
  };

  const handleDetailClick = () => {
    trackConversionEvents.bannerDetailClicked(listId);
  };

  if (!isVisible) return null;

  return (
    <div className="relative mb-4 bg-white border border-neutral-200 rounded-lg p-3 shadow-soft animate-in slide-in-from-top-2 duration-300">
      {/* 閉じるボタン */}
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 p-1 rounded-full hover:bg-neutral-100 transition-colors"
        aria-label={t("conversion.banner.closeAria")}
      >
        <X className="h-4 w-4 text-neutral-500" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        {/* アイコン */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-600" />
          </div>
        </div>

        {/* メッセージとCTA */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 leading-tight">
                {t("conversion.banner.title")}
              </p>
              <p className="text-xs text-neutral-600 mt-0.5 leading-tight">
                {t("conversion.banner.subtitle")}
              </p>
            </div>

            {/* ボタンエリア - 常に横並び */}
            <div className="flex gap-2 flex-shrink-0">
              <Link href="/signup" onClick={handleCtaClick}>
                <Button
                  size="sm"
                  className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm text-xs px-3 py-1.5 h-auto whitespace-nowrap"
                >
                  {t("conversion.banner.cta")}
                </Button>
              </Link>

              <Link href="/" onClick={handleDetailClick}>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs px-3 py-1.5 h-auto whitespace-nowrap"
                >
                  {t("conversion.banner.details")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
