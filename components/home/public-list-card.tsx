import { PublicListForHome } from "@/lib/dal/public-lists";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PublicListCardProps {
  list: PublicListForHome;
}

export function PublicListCard({ list }: PublicListCardProps) {
  const relativeTime = formatDistanceToNow(new Date(list.updatedAt), {
    addSuffix: true,
    locale: ja,
  });

  return (
    <Link href={`/lists/${list.id}`} data-testid="public-list-card">
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 h-full flex flex-col border border-neutral-100">
        <h3 className="font-semibold text-lg text-neutral-900 mb-2 line-clamp-2 flex-shrink-0">
          {list.name}
        </h3>

        {list.description && (
          <p className="text-neutral-600 text-sm mb-4 line-clamp-3 flex-1">
            {list.description}
          </p>
        )}

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-2">
            <div
              className="flex items-center space-x-2"
              data-testid="creator-info"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={list.creatorAvatarUrl || undefined}
                  alt={list.creatorDisplayName || list.creatorUsername}
                />
                <AvatarFallback className="text-xs">
                  {(list.creatorDisplayName || list.creatorUsername)
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-neutral-500 truncate">
                {list.creatorDisplayName || list.creatorUsername}
              </span>
            </div>

            <div className="text-sm text-neutral-500 flex-shrink-0">
              {list.placeCount}地点
            </div>
          </div>

          <div className="text-xs text-neutral-400">{relativeTime}に更新</div>
        </div>
      </div>
    </Link>
  );
}
