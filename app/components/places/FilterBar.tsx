"use client";

import React, { useState } from "react";
import { Filter, X, Check } from "lucide-react";
import { FilterOptions } from "@/types";
import { availableTags } from "@/lib/data/mockData";

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}

const FilterBar: React.FC<FilterBarProps> = ({
  onFilterChange,
  initialFilters,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(
    initialFilters || {
      tags: [],
      visited: null,
      groupId: null,
      dateRange: null,
    }
  );

  const toggleFilter = () => {
    setIsOpen(!isOpen);
  };

  const handleTagToggle = (tag: string) => {
    const updatedTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];

    const updatedFilters = { ...filters, tags: updatedTags };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleVisitedFilter = (visited: boolean | null) => {
    const updatedFilters = { ...filters, visited };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const clearFilters = () => {
    const emptyFilters: FilterOptions = {
      tags: [],
      visited: null,
      groupId: null,
      dateRange: null,
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className="relative z-20">
      <div className="flex justify-between items-center">
        <button
          onClick={toggleFilter}
          className="flex items-center px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Filter className="h-4 w-4 mr-2" />
          フィルター
          {(filters.tags.length > 0 || filters.visited !== null) && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-emerald-500 text-white rounded-full">
              {filters.tags.length + (filters.visited !== null ? 1 : 0)}
            </span>
          )}
        </button>

        {(filters.tags.length > 0 || filters.visited !== null) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 ml-3"
          >
            クリア
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-800">フィルター</h3>
            <button
              onClick={toggleFilter}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              ステータス
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleVisitedFilter(null)}
                className={`px-3 py-1.5 text-sm rounded-full border ${
                  filters.visited === null
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => handleVisitedFilter(false)}
                className={`px-3 py-1.5 text-sm rounded-full border ${
                  filters.visited === false
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                未訪問
              </button>
              <button
                onClick={() => handleVisitedFilter(true)}
                className={`px-3 py-1.5 text-sm rounded-full border ${
                  filters.visited === true
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                訪問済み
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">タグ</h4>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`inline-flex items-center px-3 py-1.5 text-sm rounded-full border ${
                    filters.tags.includes(tag)
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {filters.tags.includes(tag) && (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
