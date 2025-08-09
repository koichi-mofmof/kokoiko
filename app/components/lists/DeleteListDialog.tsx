"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type DeleteListDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  listName: string;
  onConfirm?: () => Promise<void>;
};

export function DeleteListDialog({
  isOpen,
  onClose,
  listName,
  onConfirm,
}: DeleteListDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  const handleConfirmClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onConfirm) {
      setIsLoading(true);
      try {
        await onConfirm();
      } catch (error) {
        console.error("Error in onConfirm:", error);
        toast({
          title: t("common.error"),
          description: t("common.unexpectedError"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // イベント伝播を防止するためのクローズハンドラ
  const handleClose = (e?: React.MouseEvent | React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };

  // キャンセルボタンのクリックハンドラ
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => handleClose()}>
      <DialogContent
        className="sm:max-w-[425px]"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{t("lists.delete.confirmTitle")}</DialogTitle>
          <DialogDescription>
            {t("lists.delete.confirmDesc", { name: listName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmClick}
            disabled={isLoading}
          >
            {isLoading ? t("common.processing") : t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
