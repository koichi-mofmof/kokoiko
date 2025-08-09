"use client";

import { BookmarkSignupModal } from "@/app/components/conversion/BookmarkSignupModal";
import { useI18n } from "@/hooks/use-i18n";
import { bookmarkList, unbookmarkList } from "@/lib/actions/lists";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";

type BookmarkButtonProps = {
  listId: string;
  initialIsBookmarked: boolean;
  className?: string;
  listName?: string;
};

export function BookmarkButton({
  listId,
  initialIsBookmarked,
  className,
  listName,
}: BookmarkButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [user, setUser] = useState<User | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const handleClick = async () => {
    if (!user) {
      setShowSignupModal(true);
      return;
    }

    setIsPending(true);
    const newBookmarkedState = !isBookmarked;
    setIsBookmarked(newBookmarkedState);

    const action = newBookmarkedState ? bookmarkList : unbookmarkList;
    const result = await action(listId);

    if (!result.success) {
      // Revert on failure
      setIsBookmarked(!newBookmarkedState);
      // TODO: エラーのtoastを表示する
      console.error(result.error);
    }
    setIsPending(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "p-2 rounded-full hover:bg-gray-100 transition-colors",
          className
        )}
        aria-label={
          isBookmarked ? t("lists.bookmark.remove") : t("lists.bookmark.add")
        }
      >
        <Bookmark
          className={cn(
            "h-6 w-6",
            isBookmarked ? "text-yellow-500 fill-yellow-400" : "text-gray-500"
          )}
        />
      </button>

      <BookmarkSignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        listId={listId}
        listName={listName}
      />
    </>
  );
}
