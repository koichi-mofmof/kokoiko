"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/hooks/use-i18n";
import { trackConversionEvents } from "@/lib/analytics/events";
import type { Place } from "@/types";
import { Check, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface CopySignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId?: string;
  listName?: string;
  places?: Place[];
}

/**
 * 非ログインユーザーが「このマップをベースに自分用に編集」を押した際に表示する
 * サインアップ訴求モーダル（リストプレビュー型）。
 * コピーで手に入る中身を具体的に見せて転換を促す。
 * サインアップ/ログイン後は元のリストに戻り、そのままコピーできる。
 */
export function CopySignupModal({
  isOpen,
  onClose,
  listId,
  listName,
  places = [],
}: CopySignupModalProps) {
  const { t } = useI18n();

  // 表示時のGAイベント送信（ブックマークと同じ conversion イベントを再利用）
  useEffect(() => {
    if (isOpen && listId) {
      trackConversionEvents.promptShown(listId, "copy");
    }
  }, [isOpen, listId]);

  const returnTo = listId ? `/lists/${listId}` : "/lists";
  const previewPlaces = places.slice(0, 3);
  const remainingCount = Math.max(0, places.length - previewPlaces.length);

  const handleCtaClick = () => {
    if (listId) {
      trackConversionEvents.promptClicked(listId, "copy");
    }
    onClose();
  };

  const handleClose = () => {
    if (listId) {
      trackConversionEvents.promptDismissed(listId, "copy");
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[400px] gap-0 overflow-hidden border-0 p-0 shadow-2xl rounded-2xl animate-in fade-in-0 zoom-in-95 duration-300 [&>button:last-child]:!text-white [&>button:last-child]:!bg-transparent [&>button:last-child]:opacity-90 [&>button:last-child]:z-10"
        onInteractOutside={handleClose}
      >
        {/* ヘッダー（背景はインラインで指定し、端末/キャッシュ差で白背景になるのを防ぐ） */}
        <div
          className="px-6 pb-8 pt-7 text-center"
          style={{
            backgroundImage:
              "linear-gradient(to bottom right, #577045, #3c4732)",
          }}
        >
          {/* 最重要メッセージ：問いかけを大きく。リスト名は文脈として一段小さく */}
          <DialogTitle className="text-white">
            <span className="block text-sm font-medium text-white/85">
              {listName
                ? t("conversion.copy.title.prefixWithName", { name: listName })
                : t("conversion.copy.title.prefixGeneric")}
            </span>
            <span className="mt-1 block text-xl font-extrabold leading-snug">
              {t("conversion.copy.title.highlight")}
              {t("conversion.copy.title.suffix")}
            </span>
          </DialogTitle>
        </div>

        {/* 本文 */}
        <div className="space-y-4 px-6 pb-6 pt-5">
          {/* リストプレビュー（コピーで手に入る中身を具体化） */}
          {previewPlaces.length > 0 && (
            <div className="-mt-9 rounded-xl border border-neutral-200 bg-white p-3 shadow-md">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                {t("conversion.copy.preview.title")}
              </p>
              <ul className="space-y-1.5">
                {previewPlaces.map((place) => (
                  <li
                    key={place.id}
                    className="flex items-center gap-2 text-sm text-neutral-800"
                  >
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary-500" />
                    <span className="truncate">{place.name}</span>
                    {place.tags[0] && (
                      <span className="ml-auto flex-shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] text-primary-700">
                        {place.tags[0].name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {remainingCount > 0 && (
                <p className="mt-2 text-xs text-neutral-400">
                  {t("conversion.copy.preview.more", { count: remainingCount })}
                </p>
              )}
            </div>
          )}

          {/* 価値訴求（左寄せ） */}
          <ul className="space-y-2.5">
            {[
              t("conversion.copy.value.pro1"),
              t("conversion.copy.value.pro2"),
            ].map((text, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                  <Check className="h-3 w-3 text-primary-600" />
                </span>
                <span className="text-sm leading-snug text-neutral-700">
                  {text}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="space-y-2 pt-1">
            <Link href={`/signup?returnTo=${returnTo}`} className="block">
              <Button
                onClick={handleCtaClick}
                className="h-12 w-full text-base font-bold shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                {t("conversion.copy.cta")}
              </Button>
            </Link>
            <p className="text-center text-[10px] leading-relaxed text-neutral-400">
              {t("conversion.copy.note")}
            </p>
            <div className="text-center">
              <Link
                href={`/login?returnTo=${returnTo}`}
                className="text-xs font-medium text-primary-600 underline hover:text-primary-700"
                onClick={handleCtaClick}
              >
                {t("conversion.copy.alreadyHaveAccount")}
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
