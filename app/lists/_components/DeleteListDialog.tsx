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
  listId,
  listName,
  onConfirm,
}: DeleteListDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
          title: "エラー",
          description: "予期せぬエラーが発生しました。",
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
          <DialogTitle>リストを削除</DialogTitle>
          <DialogDescription>
            このリスト「{listName}」を削除しますか？この操作は元に戻せません。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmClick}
            disabled={isLoading}
          >
            {isLoading ? "処理中..." : "削除する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
