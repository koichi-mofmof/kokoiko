"use client";

import {
  PlaceListGrid,
  renderLabeledCollaborators,
} from "@/app/components/common/PlaceListGrid";
import { Input } from "@/components/ui/input";
import type { PlaceListGroup } from "@/lib/mockData";
import type { Place, User } from "@/types";
import { useState, useMemo } from "react";

type SampleListForClient = Omit<PlaceListGroup, "sharedUserIds" | "places"> & {
  collaborators?: User[];
  places: Place[];
  place_count?: number;
};

type SearchableSampleListProps = {
  initialSampleLists: SampleListForClient[];
};

export function SearchableSampleList({
  initialSampleLists,
}: SearchableSampleListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLists = useMemo(() => {
    if (!searchTerm) {
      return initialSampleLists;
    }
    return initialSampleLists.filter((list) =>
      list.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [initialSampleLists, searchTerm]);

  return (
    <div>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="リスト名で検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="search-input"
          className="max-w-sm"
        />
      </div>
      <PlaceListGrid
        initialLists={filteredLists}
        getLinkHref={(list) => `/sample/${list.id}`}
        renderCollaborators={renderLabeledCollaborators}
        emptyMessage={
          searchTerm
            ? "検索条件に一致するリストはありません。"
            : "該当するリストは見つかりませんでした。"
        }
      />
    </div>
  );
}
