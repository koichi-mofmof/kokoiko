"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { FilterOptions } from "@/types";

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters: FilterOptions;
}

export default function FilterBar({
  onFilterChange,
  initialFilters,
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  // 利用可能なタグのリスト（実際のアプリではデータから動的に生成される）
  const availableTags = [
    "レストラン",
    "カフェ",
    "公園",
    "ショップ",
    "美術館",
    "観光地",
  ];

  const toggleFilter = () => {
    setIsOpen(!isOpen);
  };

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

  return (
    <div className="relative">
      <button
        onClick={toggleFilter}
        className={`inline-flex items-center px-3 py-2 border ${
          filters.tags.length > 0 || filters.visited !== null
            ? "border-primary-300 text-primary-700 bg-primary-50"
            : "border-neutral-200 text-neutral-700 bg-white"
        } rounded-soft shadow-soft text-sm hover:bg-neutral-50 transition-colors`}
      >
        <Filter className="h-4 w-4 mr-2" />
        フィルター
        {(filters.tags.length > 0 || filters.visited !== null) && (
          <span className="ml-1.5 bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded-full text-xs">
            {filters.tags.length + (filters.visited !== null ? 1 : 0)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-soft shadow-medium p-4 z-10 border border-neutral-200 animate-fadeIn">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-neutral-800 mb-2">タグ</h4>
            <div className="flex flex-wrap gap-2">
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
        </div>
      )}
    </div>
  );
}
