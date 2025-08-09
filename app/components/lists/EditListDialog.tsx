"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/hooks/use-i18n";
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
  const { t } = useI18n();

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
          title: t("lists.edit.successTitle"),
          description: t("lists.edit.successDesc"),
        });
        onSuccess();
        handleClose();
      } else {
        toast({
          title: t("common.error"),
          description: result.error || t("lists.edit.failed"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating list:", error);
      toast({
        title: t("common.error"),
        description: t("common.unexpectedError"),
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
          <DialogTitle>{t("lists.edit.title")}</DialogTitle>
          <DialogDescription>{t("lists.edit.desc")}</DialogDescription>
        </DialogHeader>

        <ListFormComponent
          initialData={initialData}
          onSubmit={handleSubmit}
          submitButtonText={t("lists.edit.submit")}
          isSubmitting={isLoading}
          showCancelButton={true}
          onCancel={handleCancel}
          cancelButtonText={t("common.cancel")}
        />
      </DialogContent>
    </Dialog>
  );
}
