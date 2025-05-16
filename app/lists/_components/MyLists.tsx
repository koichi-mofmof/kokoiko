"use client";

import {
  PlaceListGrid,
  renderLabeledCollaborators,
} from "@/app/components/common/PlaceListGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MyListForClient as MyListClientData } from "@/lib/dal/lists";
import { ArrowDown, ArrowUp, ListFilter, Search } from "lucide-react";
import { useMemo, useState } from "react";

type MyListsProps = {
  initialLists: MyListClientData[];
};

// 追加: ソートオプションの型定義
type SortOption = "name" | "updated_at" | "created_at" | "place_count";
type SortOrder = "asc" | "desc";

export function MyLists({ initialLists }: MyListsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("updated_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const processedLists = useMemo(() => {
    let lists = [...initialLists];

    // 検索フィルタリング
    if (searchQuery) {
      lists = lists.filter((list) =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // ソート処理
    lists.sort((a, b) => {
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

    return lists;
  }, [initialLists, searchQuery, sortOption, sortOrder]);

  const handleSortOptionChange = (value: string) => {
    setSortOption(value as SortOption);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <TooltipProvider>
      <div>
        {/* 検索バーとソートUIのコンテナ */}
        <div className="mb-6 flex flex-row items-center space-y-0 space-x-4">
          {/* 検索バー */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          {/* ソートUI */}
          <div className="flex items-center space-x-2 sm:flex-shrink-0">
            <div className="relative w-full sm:w-[200px]">
              <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Select value={sortOption} onValueChange={handleSortOptionChange}>
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
              className="flex-shrink-0"
            >
              {sortOrder === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {initialLists.length > 0 ? (
          processedLists.length > 0 ? (
            <PlaceListGrid
              initialLists={processedLists.map((list) => ({
                ...list,
                is_public: list.is_public === null ? undefined : list.is_public,
              }))}
              getLinkHref={(list) => `/lists/${list.id}`}
              renderCollaborators={renderLabeledCollaborators}
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              検索条件に一致するリストはありません。
            </p>
          )
        ) : (
          <p className="text-center text-muted-foreground py-8">
            まだリストは作成されていません。
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}
