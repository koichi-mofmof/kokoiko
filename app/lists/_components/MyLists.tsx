"use client";

import {
  PlaceListGrid,
  renderLabeledCollaborators,
} from "@/app/components/common/PlaceListGrid";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MyListForClient as MyListClientData } from "@/lib/dal/lists";
import { ArrowDown, ArrowUp, ListFilter } from "lucide-react";
import { useMemo, useState } from "react";

type MyListsProps = {
  initialLists: MyListClientData[];
};

// 追加: ソートオプションの型定義
type SortOption = "name" | "updated_at" | "created_at" | "place_count";
type SortOrder = "asc" | "desc";

export function MyLists({ initialLists }: MyListsProps) {
  // 追加: ソート機能の状態変数
  const [sortOption, setSortOption] = useState<SortOption>("updated_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const processedLists = useMemo(() => {
    const lists = [...initialLists]; // initialListsを直接変更しないようにコピー

    // ソート処理
    lists.sort((a, b) => {
      let comparison = 0;
      switch (sortOption) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "updated_at":
          comparison =
            new Date(b.updated_at || 0).getTime() -
            new Date(a.updated_at || 0).getTime();
          break;
        case "created_at":
          comparison =
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime();
          break;
        case "place_count":
          comparison = b.place_count - a.place_count;
          break;
        default:
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return lists;
  }, [initialLists, sortOption, sortOrder]);

  const handleSortOptionChange = (value: string) => {
    setSortOption(value as SortOption);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <TooltipProvider>
      <div>
        {processedLists.length > 0 || initialLists.length > 0 ? (
          <PlaceListGrid
            initialLists={processedLists}
            getLinkHref={(list) => `/lists/list/${list.id}`}
            renderCollaborators={renderLabeledCollaborators}
            emptyMessage="表示できるリストはありません。"
            externalControls={
              <div className="flex items-center space-x-2">
                <ListFilter className="h-5 w-5 text-muted-foreground" />
                <Select
                  value={sortOption}
                  onValueChange={handleSortOptionChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="並び替え" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated_at">更新日時</SelectItem>
                    <SelectItem value="created_at">作成日時</SelectItem>
                    <SelectItem value="name">リスト名</SelectItem>
                    <SelectItem value="place_count">登録地点数</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={toggleSortOrder}>
                  {sortOrder === "asc" ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            }
          />
        ) : (
          <p className="text-center text-muted-foreground">
            まだリストは作成されていません。
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}
