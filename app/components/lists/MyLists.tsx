"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlaceListGrid,
  renderLabeledCollaborators,
} from "@/components/ui/placelist-grid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ListForClient as MyListClientData } from "@/lib/dal/lists";
import { ArrowDown, ArrowUp, ListFilter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CreateListModal } from "./CreateListModal";

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

  // 区分ごとにリストを分類
  const ownerLists = processedLists.filter(
    (list) => list.permission === "owner"
  );
  const editorLists = processedLists.filter(
    (list) => list.permission === "edit"
  );
  const viewerLists = processedLists.filter(
    (list) => list.permission === "view"
  );
  const bookmarkedLists = processedLists.filter((list) => list.isBookmarked);

  return (
    <TooltipProvider>
      <div>
        {/* 1行目: 検索バーのみ */}
        <div className="flex flex-row items-center space-y-0 mb-4">
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
        </div>

        {/* 2行目: ソートUIとリストを作成ボタン */}
        <div className="flex flex-row items-center justify-between space-x-4 mb-4">
          {/* ソートUI */}
          <div className="flex items-center space-x-2">
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
          {/* リストを作成ボタン */}
          <div>
            <CreateListModal />
          </div>
        </div>

        <Tabs defaultValue="my-lists" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-lists">作成・共有リスト</TabsTrigger>
            <TabsTrigger value="bookmarked">ブックマーク</TabsTrigger>
          </TabsList>
          <TabsContent value="my-lists" className="mt-4">
            {initialLists.length > 0 ? (
              processedLists.filter(
                (l) =>
                  l.permission !== null &&
                  ["owner", "edit", "view"].includes(l.permission)
              ).length > 0 ? (
                <div className="space-y-8">
                  {/* セクションごとにリストを表示（Accordion化） */}
                  <Accordion
                    type="multiple"
                    defaultValue={
                      [
                        ownerLists.length > 0 ? "owner" : null,
                        editorLists.length > 0 ? "editor" : null,
                        viewerLists.length > 0 ? "viewer" : null,
                      ].filter(Boolean) as string[]
                    }
                    className="space-y-4"
                  >
                    {ownerLists.length > 0 && (
                      <AccordionItem value="owner">
                        <AccordionTrigger>
                          自分が作成したリスト（{ownerLists.length}件）
                        </AccordionTrigger>
                        <AccordionContent>
                          <PlaceListGrid
                            initialLists={ownerLists.map((list) => ({
                              ...list,
                              is_public:
                                list.is_public === null
                                  ? undefined
                                  : list.is_public,
                            }))}
                            getLinkHref={(list) => `/lists/${list.id}`}
                            renderCollaborators={renderLabeledCollaborators}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    {editorLists.length > 0 && (
                      <AccordionItem value="editor">
                        <AccordionTrigger>
                          共同編集者として参加しているリスト（
                          {editorLists.length}
                          件）
                        </AccordionTrigger>
                        <AccordionContent>
                          <PlaceListGrid
                            initialLists={editorLists.map((list) => ({
                              ...list,
                              is_public:
                                list.is_public === null
                                  ? undefined
                                  : list.is_public,
                            }))}
                            getLinkHref={(list) => `/lists/${list.id}`}
                            renderCollaborators={renderLabeledCollaborators}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    {viewerLists.length > 0 && (
                      <AccordionItem value="viewer">
                        <AccordionTrigger>
                          閲覧者として招待されたリスト（{viewerLists.length}件）
                        </AccordionTrigger>
                        <AccordionContent>
                          <PlaceListGrid
                            initialLists={viewerLists.map((list) => ({
                              ...list,
                              is_public:
                                list.is_public === null
                                  ? undefined
                                  : list.is_public,
                            }))}
                            getLinkHref={(list) => `/lists/${list.id}`}
                            renderCollaborators={renderLabeledCollaborators}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </div>
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
          </TabsContent>
          <TabsContent value="bookmarked" className="mt-4">
            {bookmarkedLists.length > 0 ? (
              <PlaceListGrid
                initialLists={bookmarkedLists.map((list) => ({
                  ...list,
                  is_public:
                    list.is_public === null ? undefined : list.is_public,
                }))}
                getLinkHref={(list) => `/lists/${list.id}`}
                renderCollaborators={renderLabeledCollaborators}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery
                  ? "検索条件に一致するブックマークはありません。"
                  : "ブックマークしたリストはありません。"}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
