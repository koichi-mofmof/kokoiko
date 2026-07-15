"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/hooks/use-i18n";
import type { Database } from "@/types/supabase";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type CreatorInfoCardProps = {
  creator: Pick<
    Profile,
    "id" | "username" | "display_name" | "bio" | "avatar_url"
  > | null;
};

export function CreatorInfoCard({ creator }: CreatorInfoCardProps) {
  const { t } = useI18n();
  if (!creator) {
    return null;
  }
  const displayName =
    creator.display_name || creator.username || t("user.unknown");
  const avatarUrl = creator.avatar_url;

  return (
    <div className="border-b border-gray-200 pb-3 pt-1 dark:border-gray-800">
      {/* カード全体を作成者プロフィールへのリンクに（「他のリストを見る」ボタンは廃止） */}
      <Link
        href={`/users/${creator.id}`}
        className="group flex w-fit max-w-full items-center gap-3 rounded-lg -mx-2 px-2 py-1 transition-colors hover:bg-neutral-50 dark:hover:bg-gray-800/50"
        aria-label={t("lists.creator.viewMore")}
      >
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
          <AvatarFallback className="text-xl font-medium">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-neutral-500 dark:text-gray-400">
            {t("lists.creator.owner")}
          </p>
          <h2 className="flex items-center gap-0.5 truncate font-semibold text-neutral-900 group-hover:underline dark:text-white">
            {displayName}
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-neutral-400" />
          </h2>
        </div>
      </Link>
    </div>
  );
}
