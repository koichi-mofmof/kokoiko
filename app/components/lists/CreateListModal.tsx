"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { trackListEvents } from "@/lib/analytics/events";
import { createList } from "@/lib/actions/lists";
import { ListPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ListFormComponent, ListFormData } from "./ListFormComponent";

interface CreateListModalProps {
  // 外部から開閉を制御したい場合に指定（空状態のCTAやオンボーディングから起動）
  controlledOpen?: boolean;
  onControlledOpenChange?: (open: boolean) => void;
  // トリガーボタン（ツールバーの「リストを作成」）を表示しない場合
  hideTrigger?: boolean;
}

export function CreateListModal({
  controlledOpen,
  onControlledOpenChange,
  hideTrigger = false,
}: CreateListModalProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onControlledOpenChange ?? setInternalOpen;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useI18n();

  const handleSubmit = async (formData: ListFormData) => {
    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);

      if (formData.description) {
        data.append("description", formData.description);
      }

      if (formData.isPublic) {
        data.append("isPublic", "true");
      }

      const result = await createList(data);

      if (result.success) {
        trackListEvents.createList();
        toast({
          title: t("lists.create.successTitle"),
          description: t("lists.create.successDesc"),
        });
        setOpen(false);
        router.refresh();
        if (result.listId) {
          // 作成直後は必ず空リスト。firstPlace=1 を付けて遷移し、
          // 遷移先で「場所を追加」ダイアログを自動起動して作成→1軒目を1フローに繋ぐ。
          router.push(`/lists/${result.listId}?firstPlace=1`);
        }
      } else {
        toast({
          title: t("common.error"),
          description: result.error || t("lists.create.failed"),
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      let errorMessage = t("lists.create.unexpected");
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  className="h-10 w-10 md:w-auto md:h-auto rounded-full md:rounded-md shadow-lg items-center"
                  aria-label={t("lists.create.aria")}
                  aria-haspopup="menu"
                  aria-expanded="false"
                >
                  <ListPlus className="h-6 w-6 sm:h-4 sm:w-4" />
                  <span className="hidden md:inline">
                    {t("lists.create.cta")}
                  </span>
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
          </Tooltip>
        </TooltipProvider>
      )}

      <DialogContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("lists.create.title")}</DialogTitle>
        </DialogHeader>

        <ListFormComponent
          onSubmit={handleSubmit}
          submitButtonText={t("lists.create.submit")}
          isSubmitting={isSubmitting}
          showCancelButton={true}
          onCancel={handleCancel}
          cancelButtonText={t("common.cancel")}
        />
      </DialogContent>
    </Dialog>
  );
}
