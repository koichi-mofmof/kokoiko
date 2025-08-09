"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/hooks/use-i18n";
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
  const { t } = useI18n();
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
          <SelectValue
            placeholder={t("publicLists.filters.sort.placeholder")}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updated_at">
            {t("publicLists.filters.sort.updated_at")}
          </SelectItem>
          <SelectItem value="created_at">
            {t("publicLists.filters.sort.created_at")}
          </SelectItem>
          <SelectItem value="name">
            {t("publicLists.filters.sort.name")}
          </SelectItem>
          <SelectItem value="place_count">
            {t("publicLists.filters.sort.place_count")}
          </SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={toggleOrder}
        className="flex-shrink-0"
        aria-label={t("publicLists.filters.toggleOrderAria")}
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
