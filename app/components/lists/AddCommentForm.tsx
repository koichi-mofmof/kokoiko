"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { addCommentToListPlace } from "@/lib/actions/place-actions";
import { useState, useTransition } from "react";

interface AddCommentFormProps {
  listPlaceId: string;
  displayName: string;
  avatarUrl?: string;
}

export default function AddCommentForm({
  listPlaceId,
  displayName,
  avatarUrl,
}: AddCommentFormProps) {
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!comment.trim()) {
      setError(t("lists.comments.enterPlease"));
      return;
    }
    startTransition(async () => {
      const res = await addCommentToListPlace({ comment, listPlaceId });
      if (res.success) {
        toast({ title: t("lists.comments.added") });
        setComment("");
        setOpen(false);
        window.location.reload();
      } else {
        setError(
          res.errorKey
            ? t(res.errorKey)
            : res.error || t("lists.comments.addFailed")
        );
      }
    });
  };

  if (!open) {
    return (
      <div className="mt-3">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          {t("lists.comments.add")}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 mt-4 bg-neutral-50 border border-neutral-200 rounded-lg p-3"
    >
      <div className="flex items-center gap-3 mb-1 min-h-8">
        <Avatar className="h-8 w-8">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={displayName} />
          ) : (
            <AvatarFallback>{displayName?.[0] || "?"}</AvatarFallback>
          )}
        </Avatar>
        <span className="text-xs text-neutral-700 font-semibold">
          {displayName}
        </span>
      </div>
      <div className="border-t border-neutral-200 my-1" />
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("lists.comments.placeholder")}
        maxLength={500}
        rows={3}
        className="resize-none"
        disabled={isPending}
      />
      {error && <div className="text-xs text-destructive">{error}</div>}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(false)}
          disabled={isPending}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isPending || !comment.trim()} size="sm">
          {isPending ? t("common.processing") : t("lists.comments.submit")}
        </Button>
      </div>
    </form>
  );
}
