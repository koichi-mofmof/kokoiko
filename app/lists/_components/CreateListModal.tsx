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
import { useToast } from "@/hooks/use-toast";
import { createList } from "@/lib/actions/lists";
import { ListPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ListFormComponent, ListFormData } from "./ListFormComponent";

export function CreateListModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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
        toast({
          title: "リストを作成しました",
          description: "新しいリストが正常に作成されました。",
        });
        setOpen(false);
        router.refresh();
        if (result.listId) {
          router.push(`/lists/list/${result.listId}`);
        }
      } else {
        toast({
          title: "エラー",
          description: result.error || "リストの作成に失敗しました",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "リスト作成中に問題が発生しました",
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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="default"
                className="rounded-full w-12 h-12 p-0 shadow-lg flex items-center justify-center sm:rounded-md sm:w-auto sm:h-auto sm:px-4 sm:py-2 sm:gap-2"
                aria-label="新規リスト作成"
                aria-haspopup="menu"
                aria-expanded="false"
              >
                <ListPlus className="h-6 w-6 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">新規リスト作成</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>

      <DialogContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>新しいリストを作成</DialogTitle>
        </DialogHeader>

        <ListFormComponent
          onSubmit={handleSubmit}
          submitButtonText="リストを作成"
          isSubmitting={isSubmitting}
          showCancelButton={true}
          onCancel={handleCancel}
          cancelButtonText="キャンセル"
        />
      </DialogContent>
    </Dialog>
  );
}
