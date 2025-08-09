"use client";

import { Toaster } from "@/components/ui/toaster";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { handleJoin } from "./actions";

interface VerifyResult {
  permission: "view" | "edit";
  listName: string | null;
  ownerName: string | null;
}

export default function JoinListForm({
  token,
  verifyResult,
}: {
  token: string;
  verifyResult: VerifyResult;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  // 権限を日本語に変換
  const permissionLabel =
    verifyResult.permission === "edit"
      ? t("join.permission.editAndView")
      : t("join.permission.viewOnly");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await handleJoin(formData);
    setLoading(false);
    if (!result.success) {
      const err = result as { errorKey?: string; error?: string };
      toast({
        title: t("join.errorTitle"),
        description: err.errorKey
          ? t(err.errorKey)
          : err.error || t("join.errorDesc"),
        variant: "destructive",
      });
    }
    // 成功時はredirectで遷移するため何もしない
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="flex flex-col items-center justify-center py-16 gap-4"
      >
        <CheckCircle2 className="w-12 h-12 text-primary-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t("join.title")}</h2>
        <p className="text-neutral-500 mb-4">
          <span className="font-semibold">{t("join.listName")}:</span>{" "}
          {verifyResult.listName || t("join.notAvailable")}
          <br />
          <span className="font-semibold">{t("join.owner")}:</span>{" "}
          {verifyResult.ownerName || t("join.notAvailable")}
          <br />
          <span className="font-semibold">{t("join.permission")}:</span>{" "}
          {permissionLabel}
        </p>
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="px-6 py-2 rounded bg-primary-600 text-white font-semibold hover:bg-primary-700 transition"
          disabled={loading}
        >
          {loading ? t("join.submitting") : t("join.submit")}
        </button>
      </form>
      <Toaster />
    </>
  );
}
