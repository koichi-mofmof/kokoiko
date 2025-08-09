import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/hooks/use-i18n";
import type { Database } from "@/types/supabase";
import { Loader2 } from "lucide-react";

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
  const { t } = useI18n();
  if (!link) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs p-6">
        <DialogTitle>{t("lists.share.deleteConfirmTitle")}</DialogTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            className="flex-1"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("common.delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
