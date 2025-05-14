"use client";

import {
  PlaceListGrid,
  renderLabeledCollaborators,
} from "@/app/components/common/PlaceListGrid";
import type { PlaceListGroup } from "@/lib/mockData";
import type { Place, User } from "@/types";

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
  return (
    <PlaceListGrid
      initialLists={initialSampleLists}
      getLinkHref={(list) => `/sample/${list.id}`}
      renderCollaborators={renderLabeledCollaborators}
      emptyMessage="該当するリストは見つかりませんでした。"
    />
  );
}
