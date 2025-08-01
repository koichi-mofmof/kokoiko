"use client";

import { PublicListCard } from "@/components/home/public-list-card";
import { Pagination } from "@/components/ui/pagination";
import { PublicListForHome } from "@/lib/dal/public-lists";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PublicListsFilters } from "./PublicListsFilters";

interface PublicListsPageClientProps {
  initialLists: PublicListForHome[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  searchParams: {
    page?: string;
    search?: string;
    sort?: string;
    order?: string;
  };
}

export function PublicListsPageClient({
  initialLists,
  totalCount,
  currentPage,
  totalPages,
  searchParams,
}: PublicListsPageClientProps) {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.search || "");

  // フィルタリングされたリスト
  const filteredLists = useMemo(() => {
    if (!searchQuery) return initialLists;

    return initialLists.filter(
      (list) =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        list.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        list.creatorDisplayName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        list.creatorUsername.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [initialLists, searchQuery]);

  // 検索処理
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const params = new URLSearchParams(searchParamsHook);
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    params.delete("page"); // 検索時はページをリセット
    router.push(`/public-lists?${params.toString()}`);
  };

  // ソート処理
  const handleSort = (sort: string, order: string) => {
    const params = new URLSearchParams(searchParamsHook);
    params.set("sort", sort);
    params.set("order", order);
    params.delete("page"); // ソート時はページをリセット
    router.push(`/public-lists?${params.toString()}`);
  };

  // ページネーション処理
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParamsHook);
    params.set("page", page.toString());
    router.push(`/public-lists?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* 検索・フィルター・ビュー切り替え */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="リストを検索..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PublicListsFilters
            currentSort={searchParams.sort || "updated_at"}
            currentOrder={searchParams.order || "desc"}
            onSort={handleSort}
          />
        </div>
      </div>

      {/* 結果表示 */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-neutral-600">{totalCount}件の公開リスト</p>
        {searchQuery && (
          <p className="text-sm text-neutral-600">
            「{searchQuery}」の検索結果: {filteredLists.length}件
          </p>
        )}
      </div>

      {/* リスト表示 */}
      {filteredLists.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLists.map((list) => (
              <PublicListCard key={list.id} list={list} />
            ))}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="text-neutral-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            {searchQuery
              ? "検索結果が見つかりません"
              : "まだ公開リストがありません"}
          </h3>
          <p className="text-neutral-600">
            {searchQuery
              ? "別のキーワードで検索してみてください"
              : "最初の公開リストを作成してみませんか？"}
          </p>
        </div>
      )}
    </div>
  );
}
