"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { deleteComment, updateComment } from "@/lib/actions/place-actions";
import type { ListPlaceComment } from "@/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";

interface CommentItemProps {
  comment: ListPlaceComment;
  commentUser: { name: string; avatarUrl?: string } | undefined;
  isMyComment: boolean;
}

export default function CommentItem({
  comment,
  commentUser,
  isMyComment,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.comment);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  const handleEdit = async () => {
    const res = await updateComment({
      commentId: comment.id,
      comment: editValue,
    });
    if (res.success) {
      toast({ title: t("lists.comments.updated") });
      setIsEditing(false);
      window.location.reload();
    } else {
      const err = res as { errorKey?: string; error?: string };
      toast({
        title: err.errorKey
          ? t(err.errorKey)
          : err.error || t("lists.comments.updateFailed"),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    const res = await deleteComment(comment.id);
    if (res.success) {
      toast({ title: t("lists.comments.deleted") });
      setIsDeleting(false);
      window.location.reload();
    } else {
      const err = res as { errorKey?: string; error?: string };
      toast({
        title: err.errorKey
          ? t(err.errorKey)
          : err.error || t("lists.comments.deleteFailed"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full p-3 bg-neutral-50 rounded-lg border border-neutral-200">
      <div className="flex items-center gap-3 mb-1">
        <Avatar className="h-8 w-8">
          {commentUser?.avatarUrl ? (
            <AvatarImage src={commentUser.avatarUrl} alt={commentUser.name} />
          ) : (
            <AvatarFallback>{commentUser?.name?.[0] || "?"}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 flex justify-between items-center text-xs text-neutral-700 font-semibold">
          <span>{commentUser?.name || t("user.unknown")}</span>
          <span className="text-[10px] sm:text-xs text-neutral-700">
            {format(new Date(comment.updated_at), "yyyy/MM/dd HH:mm", {
              locale: ja,
            })}
          </span>
        </div>
        {isMyComment && !isEditing && (
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 rounded-full hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  aria-label="操作メニュー"
                >
                  <MoreVertical className="h-5 w-5 text-neutral-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t("lists.comments.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setIsDeleting(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("lists.comments.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      <div className="border-t border-neutral-200 my-1" />
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            maxLength={500}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={handleEdit} disabled={!editValue.trim()}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="ml-1 text-sm text-neutral-700 whitespace-pre-line">
          {comment.comment}
        </div>
      )}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="mb-4 text-sm">
              {t("lists.comments.deleteConfirm")}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsDeleting(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                {t("common.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
