"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { trackTemplateCopyEvents } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";
import type { Place } from "@/types";
import { Copy } from "lucide-react";
import { useState } from "react";
import { TemplateCopyModal } from "./TemplateCopyModal";

interface TemplateCopyButtonProps {
  sourceListId: string;
  sourceListName?: string;
  places: Place[];
  isLoggedIn: boolean;
  /** 呼び出し側で見た目を差し替えるための追加クラス（配置バリアント用） */
  className?: string;
  /** ボタンのラベルを差し替える（未指定なら既定コピー） */
  label?: string;
}

/**
 * 公開リスト詳細に表示する「このマップをベースに自分用に編集」CTA。
 * - ログイン状態に関わらず同じコピーモーダルを開く（体験先行）。
 * - 未ログインの場合は、地点選択・リスト名入力まで進めたうえで、最後の
 *   「保存」の瞬間にサインアップへ送る（登録後にコピーを自動復元＝ResumeCopy）。
 */
export function TemplateCopyButton({
  sourceListId,
  sourceListName,
  places,
  isLoggedIn,
  className,
  label,
}: TemplateCopyButtonProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    // ボタン押下を計測（モーダルを開く前。ログイン状態で区別）
    trackTemplateCopyEvents.buttonClick(sourceListId, isLoggedIn);
    setOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        className={cn("w-full gap-2 font-bold shadow-sm sm:w-auto", className)}
      >
        <Copy className="h-4 w-4 flex-shrink-0" />
        {label ?? t("templateCopy.button")}
      </Button>

      <TemplateCopyModal
        open={open}
        onOpenChange={setOpen}
        sourceListId={sourceListId}
        sourceListName={sourceListName}
        places={places}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}
