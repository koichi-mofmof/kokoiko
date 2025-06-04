import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Share2 } from "lucide-react";

export function ShareLinkIssuedDialog({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(getFullUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "共有リンク",
          text: "このリストをシェアします",
          url: getFullUrl(),
        });
      } catch (e) {
        // ユーザーがキャンセルした場合など
        console.info("Share operation was cancelled by the user or failed:", e);
      }
    } else {
      handleCopy();
    }
  };

  // 絶対URLを返す
  const getFullUrl = () => {
    if (url.startsWith("http")) return url;
    if (typeof window !== "undefined") {
      return window.location.origin + url;
    }
    return url;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[425px]"
        onClick={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>共有リンクをシェア</DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            発行された共有リンク
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={getFullUrl()}
              readOnly
              className="border rounded px-2 py-1 text-xs w-full bg-neutral-100 font-mono"
              onFocus={(e) => e.target.select()}
            />
            <Button type="button" variant="secondary" onClick={handleCopy}>
              {copied ? "コピー済み" : "コピー"}
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={onClose}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
            共有
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
