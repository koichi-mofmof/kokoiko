"use client";

import { Place } from "@/types"; // Place型をインポート
import { RankedPlace } from "@/types"; // 型定義をインポート. PlaceListGroupは不要なので削除
import RankingCard from "./RankingCard"; // コメントアウトを解除

interface RankingDisplayProps {
  rankedPlaces: RankedPlace[];
  places: Place[]; // リストに含まれるすべてのPlace情報
}

export default function RankingDisplay({
  rankedPlaces,
  places,
}: RankingDisplayProps) {
  // rankedPlacesをrank順にソート（念のため）
  const sortedRankedPlaces = [...rankedPlaces].sort((a, b) => a.rank - b.rank);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {sortedRankedPlaces.map((rankedPlace) => {
        const placeDetail = places.find((p) => p.id === rankedPlace.placeId);
        if (!placeDetail) {
          console.warn(
            `Place with id ${rankedPlace.placeId} not found in places list.`
          );
          return null;
        }
        return (
          <RankingCard
            key={rankedPlace.placeId}
            rankedPlace={rankedPlace}
            place={placeDetail}
          />
        );
      })}
    </div>
  );
}
