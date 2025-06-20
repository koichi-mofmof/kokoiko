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
          router.push(`/lists/${result.listId}`);
        }
      } else {
        toast({
          title: "エラー",
          description: result.error || "リストの作成に失敗しました",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      let errorMessage = "リスト作成中に問題が発生しました";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "エラー",
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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                className="h-10 w-10 md:w-auto md:h-auto rounded-full md:rounded-md shadow-lg items-center"
                aria-label="リストを作成"
                aria-haspopup="menu"
                aria-expanded="false"
              >
                <ListPlus className="h-6 w-6 sm:h-4 sm:w-4" />
                <span className="hidden md:inline">リストを作成</span>
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
