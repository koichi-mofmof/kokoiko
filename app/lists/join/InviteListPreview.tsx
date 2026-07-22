"use client";

import { useI18n } from "@/hooks/use-i18n";
import type { GuestPreviewPlace } from "@/lib/actions/share-preview";
import { MapPin } from "lucide-react";

export type InvitePreview = {
  listName: string;
  ownerName: string;
  placeCount: number;
  places: GuestPreviewPlace[];
};

/**
 * 招待リンクを踏んだ人に見せるリストの中身。
 * 未ログイン（登録導線）とログイン済み（参加確認）で同じ情報を出すために共有する。
 */
export default function InviteListPreview({
  preview,
}: {
  preview: InvitePreview;
}) {
  const { t } = useI18n();
  const remaining = Math.max(preview.placeCount - preview.places.length, 0);

  return (
    <>
      <div className="text-center mb-6">
        <p className="text-sm text-neutral-500 mb-2">
          {t("join.guest.invitedBy", { name: preview.ownerName })}
        </p>
        <h1 className="text-2xl font-semibold">{preview.listName}</h1>
        <p className="text-sm text-neutral-500 mt-2">
          {t("join.guest.placeCount", { count: preview.placeCount })}
        </p>
      </div>

      {preview.places.length > 0 && (
        <ul className="mb-4 divide-y rounded-lg border">
          {preview.places.map((place) => (
            <li key={place.id} className="flex items-center gap-2 px-4 py-3">
              <MapPin className="h-4 w-4 shrink-0 text-primary-600" />
              <span className="truncate">{place.name}</span>
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <p className="mb-6 text-center text-sm text-neutral-500">
          {t("join.guest.remaining", { count: remaining })}
        </p>
      )}
    </>
  );
}
