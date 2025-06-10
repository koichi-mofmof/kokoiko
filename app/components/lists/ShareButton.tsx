"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Share } from "lucide-react";

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (error) {
        // ユーザーが共有をキャンセルした場合などはエラーになりますが、
        // ユーザーに通知する必要はないためコンソールにログを残すだけとします。
        console.error("Share failed:", error);
      }
    } else {
      // Web Share APIがサポートされていないブラウザ向けのフォールバック処理
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: "リンクをコピーしました" });
      } catch (err) {
        toast({
          title: "リンクのコピーに失敗しました",
          description: "もう一度お試しください。",
          variant: "destructive",
        });
        console.error("Failed to copy link: ", err);
      }
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleShare}
      aria-label="共有"
      className="flex items-center gap-2"
    >
      <Share className="h-5 w-5" />
      <span>共有</span>
    </Button>
  );
}
