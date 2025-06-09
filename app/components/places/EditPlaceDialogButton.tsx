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
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { deleteListPlaceAction } from "@/lib/actions/place-actions";
import { Place } from "@/types";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

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

  const handleDeleteClick = () => {
    if (!place.listPlaceId) {
      toast({
        title: "エラー",
        description:
          "この場所のリスト内IDが見つかりません。削除できませんでした。",
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
      const result = await deleteListPlaceAction(formData);

      if (result?.success) {
        toast({ title: "成功", description: result.success });
        await refreshSubscription();
        setOpen(false);
        router.push(`/lists/${listId}`);
      } else if (result?.error) {
        toast({
          title: "エラー",
          description: `削除エラー: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: `削除中に問題が発生しました: ${
          error instanceof Error ? error.message : "不明なエラー"
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
        title: "エラー",
        description: "この場所のリスト内IDが見つかりません。編集できません。",
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
            aria-label="操作メニュー"
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
            場所を編集
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={handleDeleteClick}
            disabled={!place.listPlaceId || isDeleting}
            data-testid="delete-menu-item"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            場所を削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              本当に「{place.name}
              」をリストから削除しますか？この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>場所を編集</DialogTitle>
          </DialogHeader>
          {place.listPlaceId ? (
            <EditPlaceForm
              place={place}
              listPlaceId={place.listPlaceId}
              onCancel={() => setOpen(false)}
            />
          ) : (
            <p className="text-sm text-destructive p-4">
              場所のリスト情報が正しくないため、編集フォームを表示できません。
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
