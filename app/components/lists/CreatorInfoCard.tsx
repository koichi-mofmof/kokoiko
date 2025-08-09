"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import type { Database } from "@/types/supabase";
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
    <div className="border-b border-gray-200 py-4 dark:border-gray-800">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-xl font-medium">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="text-sm text-neutral-500 dark:text-gray-400">
              {t("lists.creator.owner")}
            </p>
            <h2 className="truncate font-semibold text-neutral-900 dark:text-white">
              {displayName}
            </h2>
          </div>
        </div>

        <Button asChild variant="secondary" className="ml-3 flex-shrink-0">
          <Link href={`/users/${creator.id}`}>
            {t("lists.creator.viewMore")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
