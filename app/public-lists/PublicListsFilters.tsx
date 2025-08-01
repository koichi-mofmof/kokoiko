"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDown, ArrowUp } from "lucide-react";

interface PublicListsFiltersProps {
  currentSort: string;
  currentOrder: string;
  onSort: (sort: string, order: string) => void;
}

export function PublicListsFilters({
  currentSort,
  currentOrder,
  onSort,
}: PublicListsFiltersProps) {
  const handleSortChange = (value: string) => {
    onSort(value, currentOrder);
  };

  const toggleOrder = () => {
    const newOrder = currentOrder === "asc" ? "desc" : "asc";
    onSort(currentSort, newOrder);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="並び替え" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updated_at">更新日時</SelectItem>
          <SelectItem value="created_at">作成日時</SelectItem>
          <SelectItem value="name">リスト名</SelectItem>
          <SelectItem value="place_count">登録地点数</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={toggleOrder}
        className="flex-shrink-0"
        aria-label="ソート順を切り替え"
      >
        {currentOrder === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
