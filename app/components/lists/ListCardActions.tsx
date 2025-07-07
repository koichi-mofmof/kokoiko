"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  createShareLink,
  deleteList,
  fetchShareLinksForList,
} from "@/lib/actions/lists";
import { getListDetails, ListForClient } from "@/lib/dal/lists";
import type { Database } from "@/types/supabase";
import { Edit, MoreHorizontal, Share, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { DeleteListDialog } from "./DeleteListDialog";
import { EditListDialog } from "./EditListDialog";
import { ShareLinkIssuedDialog } from "./ShareLinkIssuedDialog";
import { ShareSettingsDialog } from "./ShareSettingsDialog";

type ListCardActionsProps = {
  list: ListForClient;
  className?: string;
  onSuccess?: () => void;
  variant?: "default" | "inline";
};

export function ListCardActions({
  list: initialList,
  className = "",
  onSuccess,
  variant = "default",
}: ListCardActionsProps) {
  const [list, setList] = useState(initialList);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareLinks, setShareLinks] = useState<
    Partial<Database["public"]["Tables"]["list_share_tokens"]["Row"]>[]
  >([]);
  const [shareLinksLoading, setShareLinksLoading] = useState(false);
  const [shareLinksError, setShareLinksError] = useState<string | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [issuedShareUrl, setIssuedShareUrl] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const userId = initialList.created_by;

  // 権限に基づいたボタンの有効/無効状態を判定
  const isOwner = initialList.permission === "owner";
  const canEdit = isOwner || initialList.permission === "edit";
  const hasPermission =
    isOwner ||
    initialList.permission === "edit" ||
    initialList.permission === "view";

  const handleClick = (e: React.MouseEvent) => {
    // Link要素内にあるため、イベントバブリングを防止
    e.preventDefault();
    e.stopPropagation();
  };

  // 共有リンク一覧取得
  const loadShareLinks = async () => {
    setShareLinksLoading(true);
    setShareLinksError(null);
    const res = await fetchShareLinksForList(initialList.id);
    if (res.success && res.links) {
      setShareLinks(res.links);
    } else {
      setShareLinksError(res.error || "取得に失敗しました");
    }
    setShareLinksLoading(false);
  };

  // 共有メンバー一覧再取得
  const reloadCollaborators = async () => {
    if (!initialList.id || !userId) return;
    const newList = await getListDetails(initialList.id, userId);
    if (newList) setList(newList);
  };

  // 共有リンク発行
  const handleCreateShareLink = async (
    formData: FormData,
    reset?: () => void
  ) => {
    setIsCreatingLink(true);
    try {
      const permission = formData.get("permission") as "view" | "edit";
      const result = await createShareLink({
        listId: initialList.id,
        permission,
      });
      if (result && result.success) {
        if (reset) reset();
        await loadShareLinks();
        setIssuedShareUrl(result.shareUrl || "");
        toast({
          title: "共有リンクを発行しました",
          description: "新しい共有リンクが作成されました。",
        });
      } else if (result && result.upgradeRecommended) {
        // フリープラン上限時は返却のみ（トーストは出さない）
        return result;
      } else {
        toast({
          title: "共有リンクの発行に失敗しました",
          description: result?.error || "予期せぬエラーが発生しました。",
          variant: "destructive",
        });
      }
      return result;
    } catch (e) {
      toast({
        title: "共有リンクの発行に失敗しました",
        description:
          e instanceof Error ? e.message : "予期せぬエラーが発生しました。",
        variant: "destructive",
      });
      return { success: false, error: "予期せぬエラーが発生しました。" };
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleCloseIssuedDialog = useCallback(() => {
    setIssuedShareUrl(null);
  }, []);

  // 共有設定ダイアログを開くときに一覧を取得
  const handleOpenShareDialog = async (e: React.MouseEvent) => {
    handleClick(e);
    await loadShareLinks();
    setIsShareDialogOpen(true);
  };

  const handleShare = async () => {
    // 常にリスト詳細画面のURLを共有
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/lists/${list.id}`;
    const title = list.name;
    const text = list.description || "";

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: "リンクをコピーしました" });
      } catch (err) {
        toast({
          title: "リンクのコピーに失敗しました",
          description: "もう一度お試しください。",
        });
        console.error("Failed to copy link: ", err);
      }
    }
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
                className={`h-8 w-8 ${
                  variant === "default" ? "absolute top-2 right-2" : ""
                } ${!hasPermission ? "opacity-50 cursor-not-allowed" : ""}`}
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
                {list.is_public && (
                  <DropdownMenuItem onClick={handleShare}>
                    <Share className="h-4 w-4 mr-2" />
                    リストを共有
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleOpenShareDialog}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  共同編集者を招待
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
          onSuccess={() => {
            setIsEditDialogOpen(false);
            router.refresh();
          }}
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
              onSuccess?.();
              router.push("/lists");
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

      {/* 共有設定ダイアログ */}
      {isShareDialogOpen && (
        <ShareSettingsDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          list={list}
          links={shareLinks}
          loading={shareLinksLoading}
          error={shareLinksError}
          onCreateLink={handleCreateShareLink}
          isCreatingLink={isCreatingLink}
          onReloadLinks={loadShareLinks}
          onReloadCollaborators={reloadCollaborators}
        />
      )}

      {/* 共有リンク発行後のダイアログ */}
      {issuedShareUrl && (
        <ShareLinkIssuedDialog
          url={issuedShareUrl}
          onClose={handleCloseIssuedDialog}
        />
      )}
    </>
  );
}
