import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import React from "react";
import type { Database } from "@/types/supabase";

interface DeleteShareLinkDialogProps {
  open: boolean;
  link: Database["public"]["Tables"]["list_share_tokens"]["Row"] | null;
  loading: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export function DeleteShareLinkDialog({
  open,
  link,
  loading,
  onClose,
  onDelete,
}: DeleteShareLinkDialogProps) {
  if (!link) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs p-6">
        <DialogTitle>本当に削除しますか？</DialogTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            className="flex-1"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            削除
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
