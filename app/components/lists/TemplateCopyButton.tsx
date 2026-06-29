"use client";

import { CopySignupModal } from "@/app/components/conversion/CopySignupModal";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { trackTemplateCopyEvents } from "@/lib/analytics/events";
import type { Place } from "@/types";
import { Copy } from "lucide-react";
import { useState } from "react";
import { TemplateCopyModal } from "./TemplateCopyModal";

interface TemplateCopyButtonProps {
  sourceListId: string;
  sourceListName?: string;
  places: Place[];
  isLoggedIn: boolean;
}

/**
 * 公開リスト詳細に表示する「このマップをベースに自分用に編集」CTA。
 * - 未ログイン時はサインアップ訴求モーダルを表示（ブックマークと同じUX）。
 * - ログイン時はコピーモーダルを開く。
 */
export function TemplateCopyButton({
  sourceListId,
  sourceListName,
  places,
  isLoggedIn,
}: TemplateCopyButtonProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const handleClick = () => {
    // ボタン押下を計測（モーダルを開く前。ログイン状態で区別）
    trackTemplateCopyEvents.buttonClick(sourceListId, isLoggedIn);
    if (!isLoggedIn) {
      setShowSignup(true);
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        className="w-full gap-2 font-bold shadow-sm sm:w-auto"
      >
        <Copy className="h-4 w-4 flex-shrink-0" />
        {t("templateCopy.button")}
      </Button>

      {isLoggedIn ? (
        <TemplateCopyModal
          open={open}
          onOpenChange={setOpen}
          sourceListId={sourceListId}
          places={places}
        />
      ) : (
        <CopySignupModal
          isOpen={showSignup}
          onClose={() => setShowSignup(false)}
          listId={sourceListId}
          listName={sourceListName}
          places={places}
        />
      )}
    </>
  );
}
