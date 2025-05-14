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
import type { Place } from "@/types";
import { ArrowDown, ArrowUp, ListFilter } from "lucide-react";
import { useMemo, useState } from "react";
import { Collaborator } from "./MyPageDataLoader";

// MyPageで表示するリストの型。page.tsxから渡される型と合わせる
type MyListClientData = {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string;
  places: Place[];
  place_count: number;
  collaborators: Collaborator[];
  permission?: string; // 閲覧者の権限（viewかedit）
};

type MyListsProps = {
  initialLists: MyListClientData[];
};

// 追加: ソートオプションの型定義
type SortOption = "name" | "updated_at" | "created_at" | "place_count";
type SortOrder = "asc" | "desc";

export function MyLists({ initialLists }: MyListsProps) {
  // setSearchQueryは将来の検索機能のために残すが、ESLint警告を抑制
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const [searchQuery, setSearchQuery] = useState(""); // PlaceListGrid側で検索するため不要
  // 追加: ソート機能の状態変数
  const [sortOption, setSortOption] = useState<SortOption>("updated_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const processedLists = useMemo(() => {
    let lists = [...initialLists]; // initialListsを直接変更しないようにコピー

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
  }, [initialLists, sortOption, sortOrder]); // searchQueryを依存配列から削除

  const handleSortOptionChange = (value: string) => {
    setSortOption(value as SortOption);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <TooltipProvider>
      <div>
        {/* ソートUIはPlaceListGridのexternalControlsに渡すため、ここでの直接レンダリングは削除 */}
        {/* <div className="mb-4 flex items-center space-x-2"> ... </div> */}

        {processedLists.length > 0 || initialLists.length > 0 ? ( // initialListsも考慮して空かどうか判断
          <PlaceListGrid
            initialLists={processedLists} // ソート済みのリストを渡す
            getLinkHref={(list) => `/mypage/list/${list.id}`}
            renderCollaborators={renderLabeledCollaborators}
            emptyMessage="表示できるリストはありません。" // メッセージを調整 (検索結果に応じてPlaceListGrid側で変化)
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
