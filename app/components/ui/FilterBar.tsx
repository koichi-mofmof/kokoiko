"use client";

import { sortPrefectures } from "@/lib/utils/geography";
import { FilterOptions } from "@/types";
import { Filter } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters: FilterOptions;
  availableTags: string[];
  availablePrefectures: string[];
}

export default function FilterBar({
  onFilterChange,
  initialFilters,
  availableTags,
  availablePrefectures,
}: FilterBarProps) {
  const [filters, setFilters] = useState<FilterOptions>(() => ({
    ...initialFilters,
    prefecture: initialFilters.prefecture || [],
  }));

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];

    const newFilters = { ...filters, tags: newTags };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleVisitedChange = (value: boolean | null) => {
    const newFilters = { ...filters, visited: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePrefectureToggle = (prefecture: string) => {
    const newPrefectures = filters.prefecture.includes(prefecture)
      ? filters.prefecture.filter((p) => p !== prefecture)
      : [...filters.prefecture, prefecture];
    const newFilters = { ...filters, prefecture: newPrefectures };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex items-center justify-center h-9 w-9 sm:w-auto sm:px-3 py-2 border ${
            filters.tags.length > 0 ||
            filters.visited !== null ||
            filters.prefecture.length > 0
              ? "border-primary-300 text-primary-700 bg-primary-50"
              : "border-neutral-200 text-neutral-700 bg-white"
          } rounded-soft shadow-soft text-sm hover:bg-neutral-50 transition-colors`}
        >
          <Filter className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">フィルター</span>
          {(filters.tags.length > 0 ||
            filters.visited !== null ||
            filters.prefecture.length > 0) && (
            <span className="ml-1.5 bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded-full text-xs hidden sm:inline">
              {filters.tags.length +
                (filters.visited !== null ? 1 : 0) +
                filters.prefecture.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-80 max-h-[70vh] overflow-y-auto bg-white rounded-soft shadow-medium p-4 z-[1100] border border-neutral-200 animate-fadeIn"
      >
        <div className="mb-4">
          <h4 className="text-sm font-medium text-neutral-800 mb-2">タグ</h4>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-2.5 py-1.5 rounded-full text-xs ${
                  filters.tags.includes(tag)
                    ? "bg-primary-100 text-primary-800 border border-primary-200"
                    : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
                } transition-colors`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-neutral-800 mb-2">
            都道府県
          </h4>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {sortPrefectures(availablePrefectures).map((pref) => (
              <button
                key={pref}
                onClick={() => handlePrefectureToggle(pref)}
                className={`px-2.5 py-1.5 rounded-full text-xs ${
                  filters.prefecture.includes(pref)
                    ? "bg-primary-100 text-primary-800 border border-primary-200"
                    : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
                } transition-colors`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-neutral-800 mb-2">
            訪問ステータス
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() => handleVisitedChange(true)}
              className={`px-2.5 py-1.5 rounded-full text-xs ${
                filters.visited === true
                  ? "bg-primary-100 text-primary-800 border border-primary-200"
                  : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
              } transition-colors`}
            >
              訪問済み
            </button>
            <button
              onClick={() => handleVisitedChange(false)}
              className={`px-2.5 py-1.5 rounded-full text-xs ${
                filters.visited === false
                  ? "bg-primary-100 text-primary-800 border border-primary-200"
                  : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
              } transition-colors`}
            >
              未訪問
            </button>
            <button
              onClick={() => handleVisitedChange(null)}
              className={`px-2.5 py-1.5 rounded-full text-xs ${
                filters.visited === null
                  ? "bg-primary-100 text-primary-800 border border-primary-200"
                  : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
              } transition-colors`}
            >
              すべて
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
