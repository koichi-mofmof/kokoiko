"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/hooks/use-i18n";
import { trackConversionEvents } from "@/lib/analytics/events";
import { Bookmark, Share2, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface BookmarkSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId?: string;
  listName?: string;
}

export function BookmarkSignupModal({
  isOpen,
  onClose,
  listId,
  listName,
}: BookmarkSignupModalProps) {
  const { t } = useI18n();
  // ポップアップ表示時のGAイベント送信
  useEffect(() => {
    if (isOpen && listId) {
      trackConversionEvents.promptShown(listId);
    }
  }, [isOpen, listId]);

  // CTAクリック時のイベント処理
  const handleCtaClick = () => {
    if (listId) {
      trackConversionEvents.promptClicked(listId);
    }
    onClose();
  };

  // 閉じる時のイベント処理
  const handleClose = () => {
    if (listId) {
      trackConversionEvents.promptDismissed(listId);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[380px] p-5 bg-white border-0 shadow-2xl rounded-2xl animate-in fade-in-0 zoom-in-95 duration-300"
        onInteractOutside={handleClose}
      >
        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 opacity-60 hover:opacity-100 transition-opacity z-10"
          aria-label={t("common.close")}
        >
          <X className="h-4 w-4 text-gray-500" />
          <span className="sr-only">{t("common.close")}</span>
        </button>

        {/* メインコンテンツ */}
        <div className="text-center space-y-5">
          {/* ブックマークアイコン */}
          <div className="flex justify-center relative">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg relative">
              <Bookmark className="h-8 w-8 text-white fill-white" />
            </div>
          </div>

          {/* 動機に寄り添うタイトル */}
          <DialogTitle className="text-base font-bold text-neutral-800 leading-tight">
            {listName ? (
              <>
                {t("conversion.bookmark.title.prefixWithName", {
                  name: listName,
                })}
                <br />
                <span className="font-extrabold text-yellow-600">
                  {t("conversion.bookmark.title.highlight")}
                </span>
                {t("conversion.bookmark.title.suffix")}
              </>
            ) : (
              <>
                {t("conversion.bookmark.title.prefixGeneric")}
                <br />
                <span className="font-extrabold text-yellow-600">
                  {t("conversion.bookmark.title.highlight")}
                </span>
                {t("conversion.bookmark.title.suffix")}
              </>
            )}
          </DialogTitle>

          {/* ブックマーク機能の価値説明 */}
          <div className="space-y-3 pt-2">
            <div className="space-y-2 text-sm text-neutral-800 font-medium rounded-lg bg-yellow-50 p-4">
              {[
                { icon: Bookmark, text: t("conversion.bookmark.value.pro1") },
                { icon: Share2, text: t("conversion.bookmark.value.pro2") },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex animate-in fade-in-0 slide-in-from-top-2 duration-500 items-center gap-3"
                  style={{
                    animationDelay: `${index * 200 + 300}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <item.icon className="w-4 h-4 text-yellow-600" />
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 簡単さアピール */}
          <p className="text-xs text-gray-500">
            {t("conversion.bookmark.note")}
          </p>
        </div>

        {/* CTA部分 */}
        <div className="mt-4 space-y-3">
          {/* メインCTAボタン */}
          <Link
            href={`/signup?bookmark=${listId}&returnTo=/lists`}
            className="block"
          >
            <Button
              onClick={handleCtaClick}
              className="w-full h-12 text-base font-bold bg-yellow-600 hover:bg-yellow-700 shadow-lg hover:shadow-xl transition-all duration-200 transform"
            >
              {t("conversion.bookmark.cta")}
            </Button>
          </Link>

          {/* すでにアカウントを持っている場合のリンク */}
          <div className="text-center text-xs text-gray-500">
            <Link
              href={`/login?bookmark=${listId}&returnTo=/lists`}
              className="text-yellow-600 hover:text-yellow-700 underline font-medium"
              onClick={() => {
                if (listId) {
                  trackConversionEvents.promptClicked(listId);
                }
                onClose();
              }}
            >
              {t("conversion.bookmark.alreadyHaveAccount")}
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
