"use client";

import { PublicListCard } from "@/components/home/public-list-card";
import { Pagination } from "@/components/ui/pagination";
import { useI18n } from "@/hooks/use-i18n";
import { PublicListForHome } from "@/lib/dal/public-lists";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  const { t } = useI18n();
  const committedSearch = searchParams.search || "";
  const [searchQuery, setSearchQuery] = useState(committedSearch);

  // 検索はサーバー側（DB）で実行される。入力をデバウンスして URL を更新し、
  // 全公開リストを対象に名前・説明を部分一致検索する。
  useEffect(() => {
    if (searchQuery === committedSearch) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParamsHook);
      if (searchQuery) {
        params.set("search", searchQuery);
      } else {
        params.delete("search");
      }
      params.delete("page"); // 検索時はページをリセット
      router.push(`/public-lists?${params.toString()}`);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, committedSearch, searchParamsHook, router]);

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
              placeholder={t("publicLists.search.placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
        <p className="text-sm text-neutral-600">
          {t("publicLists.result.total", { n: totalCount })}
        </p>
        {committedSearch && (
          <p className="text-sm text-neutral-600">
            {t("publicLists.result.search", {
              query: committedSearch,
              n: totalCount,
            })}
          </p>
        )}
      </div>

      {/* リスト表示 */}
      {initialLists.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialLists.map((list) => (
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
            {committedSearch
              ? t("publicLists.empty.searchTitle")
              : t("publicLists.empty.noneTitle")}
          </h3>
          <p className="text-neutral-600">
            {committedSearch
              ? t("publicLists.empty.searchDesc")
              : t("publicLists.empty.noneDesc")}
          </p>
        </div>
      )}
    </div>
  );
}
