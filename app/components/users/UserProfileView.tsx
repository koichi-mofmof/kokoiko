"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaceListGrid } from "@/components/ui/placelist-grid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ListForClient } from "@/lib/dal/lists";
import type { Database } from "@/types/supabase";
import { ArrowDown, ArrowUp, ListFilter, ListX, Search } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type SortOption = "name" | "updated_at" | "created_at" | "place_count";
type SortOrder = "asc" | "desc";

type UserProfileViewProps = {
  profile: Pick<
    Profile,
    "id" | "username" | "display_name" | "bio" | "avatar_url"
  >;
  lists: ListForClient[];
  stats: {
    publicListCount: number;
    totalPlaceCount: number;
  };
};

export function UserProfileView({
  profile,
  lists,
  stats,
}: UserProfileViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("updated_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const displayName = profile.display_name || profile.username || "ユーザー";
  const avatarUrl = profile.avatar_url;

  const displayLists = useMemo(
    () =>
      lists.map((list) => ({
        ...list,
        is_public: list.is_public ?? undefined,
        description: list.description ?? undefined,
      })),
    [lists]
  );

  const processedLists = useMemo(() => {
    let filteredLists = [...displayLists];

    if (searchQuery) {
      filteredLists = filteredLists.filter((list) =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filteredLists.sort((a, b) => {
      let comparison = 0;
      switch (sortOption) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "updated_at":
          comparison =
            new Date(a.updated_at || 0).getTime() -
            new Date(b.updated_at || 0).getTime();
          break;
        case "created_at":
          comparison =
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime();
          break;
        case "place_count":
          comparison = a.place_count - b.place_count;
          break;
        default:
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filteredLists;
  }, [displayLists, searchQuery, sortOption, sortOrder]);

  const handleSortOptionChange = (value: string) => {
    setSortOption(value as SortOption);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="py-8">
      {/* User Info Section */}
      <header className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={96}
            height={96}
            sizes="(max-width: 640px) 64px, 96px"
            className="h-16 w-16 sm:h-24 sm:w-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-800"
          />
        ) : (
          <div className="flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            <span className="text-4xl font-bold text-gray-500 dark:text-gray-400">
              {displayName[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {displayName}
          </h1>
          {profile.bio && (
            <p className="mt-2 text-sm sm:text-base text-neutral-600 dark:text-neutral-300">
              {profile.bio}
            </p>
          )}

          {/* Stats Section */}
          <section
            aria-labelledby="user-stats-heading"
            className="mt-4 flex justify-center gap-6 sm:justify-start"
          >
            <h2 id="user-stats-heading" className="sr-only">
              ユーザー統計
            </h2>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                {stats.publicListCount}
              </p>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                公開リスト
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                {stats.totalPlaceCount}
              </p>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                総地点数
              </p>
            </div>
          </section>
        </div>
      </header>

      {/* Lists Section */}
      <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 md:mb-0">
            公開中のリスト
          </h2>
        </div>

        {displayLists.length > 0 ? (
          <>
            {/* Search and Sort controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="リストを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative w-full sm:w-[200px]">
                  <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <Select
                    value={sortOption}
                    onValueChange={handleSortOptionChange}
                    data-testid="sort-select"
                  >
                    <SelectTrigger className="pl-10 w-full">
                      <SelectValue placeholder="並び替え" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updated_at">更新日時</SelectItem>
                      <SelectItem value="created_at">作成日時</SelectItem>
                      <SelectItem value="name">リスト名</SelectItem>
                      <SelectItem value="place_count">登録地点数</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSortOrder}
                  className="flex-shrink-0 transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  data-testid="sort-order-button"
                  aria-label="ソート順を切り替え"
                >
                  {sortOrder === "asc" ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {processedLists.length > 0 ? (
              <PlaceListGrid
                initialLists={processedLists}
                getLinkHref={(list) => `/lists/${list.id}`}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                検索条件に一致するリストはありません。
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-16 px-4 rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-700">
            <ListX className="mx-auto h-12 w-12 text-neutral-600" />
            <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
              まだ公開リストがありません
            </h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              このユーザーはまだリストを公開していません。
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
