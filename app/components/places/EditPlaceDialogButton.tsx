"use client";
import EditPlaceForm from "@/app/components/places/EditPlaceForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/hooks/use-i18n";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { trackPlaceEvents } from "@/lib/analytics/events";
import { deleteListPlaceAction } from "@/lib/actions/place-actions";
import { Place } from "@/types";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

/**
 * Server Action 内の redirect() は、クライアント側では NEXT_REDIRECT エラーとして
 * reject される（Next.js は「resolveすべき戻り値が無い」ことを伝えるために reject する）。
 * 遷移自体はルーター側で確定済みなので、これは削除成功のサインであり、
 * エラーとして扱わず握り潰してよい。
 */
function isNextRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
    return true;
  }
  return error instanceof Error && error.message.startsWith("NEXT_REDIRECT");
}

export default function EditPlaceDialogButton({
  place,
  listId, // listId を props として受け取る (revalidatePathなどで使用する可能性を考慮)
}: {
  place: Place;
  listId: string;
}) {
  const [open, setOpen] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { refreshSubscription } = useSubscription();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { t } = useI18n();

  const handleDeleteClick = () => {
    if (!place.listPlaceId) {
      toast({
        title: t("common.error"),
        description: t("place.errors.listPlaceIdMissingDelete"),
        variant: "destructive",
      });
      return;
    }
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!place.listPlaceId || isDeleting) return;

    try {
      setIsDeleting(true);
      const formData = new FormData();
      formData.append("listPlaceId", place.listPlaceId);

      // 成功時はサーバーアクションが redirect するため await 以降に到達しない
      // ことがある。計測の取りこぼしを避けるためここで先に発火させる。
      trackPlaceEvents.deletePlace(place.id);

      const result = await deleteListPlaceAction(formData);

      const err = result as { errorKey?: string; error?: string } | undefined;
      if (err?.errorKey || err?.error) {
        toast({
          title: t("common.error"),
          description: err.errorKey
            ? t(err.errorKey)
            : `${t("common.deleteError")}: ${err.error}`,
          variant: "destructive",
        });
        return;
      }

      // 削除成功。地点が消えること自体が結果として分かるため成功トーストは出さない。
      await refreshSubscription();
      setOpen(false);
      // サーバー側で listId を特定できず redirect しなかった場合のフォールバック
      if ((result as { successKey?: string } | undefined)?.successKey) {
        router.replace(`/lists/${listId}`);
      }
    } catch (error) {
      // 成功時の遷移。再throwしても async ハンドラ内なのでエラーバウンダリには届かず、
      // 未処理のrejectionになるだけなのでここで握り潰す
      if (isNextRedirectError(error)) return;
      toast({
        title: t("common.error"),
        description: `${t("common.deleting")}: ${
          error instanceof Error ? error.message : t("common.unknownError")
        }`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  // 編集ボタンのクリックハンドラ。listPlaceIdがない場合はダイアログを開かない
  const handleEditClick = () => {
    if (!place.listPlaceId) {
      toast({
        title: t("common.error"),
        description: t("place.errors.listPlaceIdMissingEdit"),
        variant: "destructive",
      });
      return;
    }
    setOpen(true);
  };

  // Dialogの開閉時に呼ばれる
  const handleDialogOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Dialogが閉じたらDropdownMenuTriggerのボタンにフォーカスを戻す
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 0);
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            ref={triggerRef}
            className="p-2 rounded-full hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
            aria-label={t("common.actionsMenu")}
          >
            <MoreVertical className="h-5 w-5 text-neutral-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={handleEditClick}
            disabled={!place.listPlaceId}
          >
            <Edit className="h-4 w-4 mr-2" />
            {t("place.menu.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={handleDeleteClick}
            disabled={!place.listPlaceId || isDeleting}
            data-testid="delete-menu-item"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("place.menu.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("place.delete.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("place.delete.confirmDesc", { name: place.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("common.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("place.menu.edit")}</DialogTitle>
          </DialogHeader>
          {place.listPlaceId ? (
            <EditPlaceForm
              place={place}
              listPlaceId={place.listPlaceId}
              listId={listId}
              onCancel={() => setOpen(false)}
            />
          ) : (
            <p className="text-sm text-destructive p-4">
              {t("place.errors.invalidListInfo")}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
