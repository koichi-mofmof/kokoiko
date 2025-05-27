"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MyListForClient } from "@/lib/dal/lists";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { DeleteListDialog } from "./DeleteListDialog";
import { EditListDialog } from "./EditListDialog";
import { deleteList } from "@/lib/actions/lists";
import { useToast } from "@/hooks/use-toast";

type ListCardActionsProps = {
  list: MyListForClient;
  className?: string;
  onSuccess?: () => void;
};

export function ListCardActions({
  list,
  className = "",
  onSuccess,
}: ListCardActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  // 権限に基づいたボタンの有効/無効状態を判定
  const isOwner = list.permission === "owner";
  const canEdit = isOwner || list.permission === "edit";
  const hasPermission =
    isOwner || list.permission === "edit" || list.permission === "view";

  const handleEditSuccess = () => {
    if (onSuccess) onSuccess();
    else router.refresh();
  };

  const handleClick = (e: React.MouseEvent) => {
    // Link要素内にあるため、イベントバブリングを防止
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      <div className={className} onClick={handleClick}>
        {canEdit && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                ref={buttonRef}
                variant="ghost"
                size="icon"
                className={`h-8 w-8 absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full shadow-sm z-10 ${
                  !hasPermission ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleClick}
                disabled={!hasPermission}
                aria-label="リストアクション"
              >
                <MoreHorizontal className="h-4 w-4 text-neutral-600" />
                <span className="sr-only">アクション</span>
              </Button>
            </DropdownMenuTrigger>
            {hasPermission && (
              <DropdownMenuContent
                align="end"
                className="w-48"
                onClick={handleClick}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    handleClick(e);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  リストを編集
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        handleClick(e);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      リストを削除
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        )}
      </div>

      {/* 編集ダイアログ */}
      {isEditDialogOpen && (
        <EditListDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          list={list}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* 削除ダイアログ */}
      {isDeleteDialogOpen && (
        <DeleteListDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          listId={list.id}
          listName={list.name}
          onConfirm={async () => {
            setIsDeleteDialogOpen(true);
            const result = await deleteList(list.id);
            if (result.success) {
              toast({
                title: "削除完了",
                description: `リスト「${list.name}」を削除しました。`,
              });
              setIsDeleteDialogOpen(false);
              if (onSuccess) {
                onSuccess();
              } else {
                router.refresh();
              }
            } else {
              toast({
                title: "削除失敗",
                description:
                  result.error ||
                  `リスト「${list.name}」の削除に失敗しました。`,
                variant: "destructive",
              });
              setIsDeleteDialogOpen(false);
            }
          }}
        />
      )}
    </>
  );
}
