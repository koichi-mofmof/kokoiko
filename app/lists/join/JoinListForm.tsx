"use client";

import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
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

  // 権限を日本語に変換
  const permissionLabel =
    verifyResult.permission === "edit" ? "閲覧＋編集" : "閲覧のみ";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await handleJoin(formData);
    setLoading(false);
    if (!result.success) {
      toast({
        title: "リスト参加エラー",
        description: result.error || "リストへの参加に失敗しました。",
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
        <h2 className="text-xl font-semibold mb-2">リストへの参加</h2>
        <p className="text-neutral-500 mb-4">
          <span className="font-semibold">リスト名:</span>{" "}
          {verifyResult.listName || "取得不可"}
          <br />
          <span className="font-semibold">作成者:</span>{" "}
          {verifyResult.ownerName || "取得不可"}
          <br />
          <span className="font-semibold">権限:</span> {permissionLabel}
        </p>
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="px-6 py-2 rounded bg-primary-600 text-white font-semibold hover:bg-primary-700 transition"
          disabled={loading}
        >
          {loading ? "参加中..." : "このリストに参加する"}
        </button>
      </form>
      <Toaster />
    </>
  );
}
