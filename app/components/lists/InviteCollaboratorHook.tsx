"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { toast } from "@/hooks/use-toast";
import { createShareLink } from "@/lib/actions/lists";
import { trackShareHookEvents } from "@/lib/analytics/events";
import { UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface InviteCollaboratorHookProps {
  listId: string;
  placeCount: number;
}

// 1軒目を追加した直後の熱量ピークで「誰かと一緒に育てませんか？」を差し込み、
// ワンタップで共同編集リンクを作って共有シートに渡す（設定ダイアログは開かない）。
// 表示条件（未共有・上限内・所有者・地点1〜3件）は親（ListDetailView/page）が判定する。
export function InviteCollaboratorHook({
  listId,
  placeCount,
}: InviteCollaboratorHookProps) {
  const { t } = useI18n();
  const dismissKey = `invite-hook-dismissed-${listId}`;
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // このリストで既に閉じた/共有済みなら出さない
    if (
      typeof window !== "undefined" &&
      window.localStorage.getItem(dismissKey)
    ) {
      return;
    }
    setVisible(true);
    trackShareHookEvents.shown(listId, placeCount);
    // 初回表示の1回だけ計測。placeCount 変化での再計測は狙わない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

  const remember = () => {
    try {
      window.localStorage.setItem(dismissKey, "1");
    } catch {
      // localStorage 不可でも致命ではない
    }
  };

  const handleInvite = async () => {
    setSubmitting(true);
    trackShareHookEvents.clicked(listId);
    try {
      const result = await createShareLink({ listId, permission: "edit" });
      if (!result || !result.success) {
        toast({
          title: t("lists.share.createFailedTitle"),
          description: result?.error || t("common.unexpectedError"),
          variant: "destructive",
        });
        return;
      }
      const shareUrl =
        result.shareUrl ||
        `${window.location.origin}/lists/join?token=${result.link?.token}`;

      // ワンタップ：共有シート → 無ければクリップボードコピー
      if (navigator.share) {
        try {
          await navigator.share({
            title: t("lists.share.linkTitle"),
            text: t("invite.hook.shareText"),
            url: shareUrl,
          });
        } catch (e) {
          // ユーザーキャンセルは通知不要
          console.info("Share cancelled or failed:", e);
        }
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: t("lists.share.linkCopied") });
      }
      // 共有できたら以後このリストでは出さない
      remember();
      setVisible(false);
    } catch (e) {
      toast({
        title: t("lists.share.createFailedTitle"),
        description: e instanceof Error ? e.message : t("common.unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    trackShareHookEvents.dismissed(listId);
    remember();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="relative mb-4 rounded-soft border border-primary-100 bg-primary-50 p-4 shadow-soft"
      data-testid="invite-collaborator-hook"
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t("common.close")}
        className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-600"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
          <UserPlus className="h-5 w-5 text-primary-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900">
            {t("invite.hook.title")}
          </p>
          <p className="mt-0.5 text-sm text-neutral-600">
            {t("invite.hook.desc")}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={handleInvite} disabled={submitting}>
              <UserPlus className="mr-1.5 h-4 w-4" />
              {submitting ? t("common.processing") : t("invite.hook.cta")}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              {t("invite.hook.later")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
