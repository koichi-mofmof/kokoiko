"use client";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { autoJoinFromInvite } from "./actions";
import InviteListPreview, { type InvitePreview } from "./InviteListPreview";

export default function JoinListForm({
  token,
  preview,
}: {
  token: string;
  preview: InvitePreview & { permission: "view" | "edit" };
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  const permissionLabel =
    preview.permission === "edit"
      ? t("join.permission.editAndView")
      : t("join.permission.viewOnly");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await autoJoinFromInvite(token);

    if (result.success) {
      // router 遷移ではなく完全な再読み込みで着地させる。参加はアクセス権を変える
      // 操作であり、クライアントのRSCキャッシュは「まだ参加していない自分」の
      // 結果なので、そのまま遷移すると地点や表示順が読み込まれないままになる。
      window.location.replace(`/lists/${result.listId}?joined=1`);
      return;
    }

    setLoading(false);
    toast({
      title: t("join.errorTitle"),
      description: t(result.errorKey),
      variant: "destructive",
    });
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-lg px-4 py-10">
        <InviteListPreview preview={preview} />

        <div className="space-y-3 text-center">
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? t("join.submitting") : t("join.submit")}
          </Button>
          <p className="text-sm text-neutral-500">
            {t("join.permission")}: {permissionLabel}
          </p>
        </div>
      </form>
      <Toaster />
    </>
  );
}
