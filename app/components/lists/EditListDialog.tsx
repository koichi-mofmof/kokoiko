"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { updateList } from "@/lib/actions/lists";
import { ListForClient } from "@/lib/dal/lists";
import { useState } from "react";
import { ListFormComponent, ListFormData } from "./ListFormComponent";

type EditListDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  list: ListForClient;
  onSuccess: () => void;
};

export function EditListDialog({
  isOpen,
  onClose,
  list,
  onSuccess,
}: EditListDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const initialData: ListFormData = {
    name: list.name,
    description: list.description || "",
    isPublic: list.is_public || false,
  };

  const handleSubmit = async (formData: ListFormData) => {
    setIsLoading(true);

    try {
      const result = await updateList({
        id: list.id,
        name: formData.name,
        description: formData.description,
        isPublic: formData.isPublic,
      });

      if (result.success) {
        toast({
          title: "更新完了",
          description: "リストが更新されました。",
        });
        onSuccess();
        handleClose();
      } else {
        toast({
          title: "エラー",
          description: result.error || "リストの更新中にエラーが発生しました。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating list:", error);
      toast({
        title: "エラー",
        description: "予期せぬエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
  const handleCancel = () => {
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => handleClose()}>
      <DialogContent
        className="sm:max-w-[425px]"
        onClick={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>リストを編集</DialogTitle>
          <DialogDescription>
            リストの情報を更新してください。
          </DialogDescription>
        </DialogHeader>

        <ListFormComponent
          initialData={initialData}
          onSubmit={handleSubmit}
          submitButtonText="更新する"
          isSubmitting={isLoading}
          showCancelButton={true}
          onCancel={handleCancel}
          cancelButtonText="キャンセル"
        />
      </DialogContent>
    </Dialog>
  );
}
