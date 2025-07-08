"use client";

import RankingView from "@/app/components/lists/RankingView";
import PlaceList from "@/app/components/places/PlaceList";
import FilterBar from "@/components/ui/FilterBar";
import ViewToggle from "@/components/ui/ViewToggle";
import { FilterOptions, Place, ViewMode } from "@/types";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import AddPlaceButtonClient from "../places/AddPlaceButtonClient";

interface ListDetailViewProps {
  places: Place[];
  listId: string;
  permission?: string | null;
}

// OpenStreetMapView を動的にインポートし、SSRを無効にする
const DynamicOpenStreetMapView = dynamic(
  () => import("@/app/components/map/OpenStreetMapView"),
  {
    ssr: false,
    loading: () => (
      <p className="flex justify-center items-center h-full">
        Map is loading...
      </p>
    ),
  }
);

export default function ListDetailView({
  places,
  listId,
  permission,
}: ListDetailViewProps) {
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>(places);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [hasMapBeenViewed, setHasMapBeenViewed] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    tags: [],
    tagsCondition: "OR",
    visited: null,
    groupId: null,
    dateRange: null,
    hierarchicalRegion: {},
  });

  const availableTags = useMemo(() => {
    const allTagNames = places.flatMap((place) =>
      (place.tags || []).map((tagObj) => tagObj.name)
    );
    return Array.from(new Set(allTagNames)).sort((a, b) =>
      a.localeCompare(b, "ja")
    );
  }, [places]);

  useEffect(() => {
    let result = [...places];

    // タグフィルター（AND/OR条件対応）
    if (filters.tags.length > 0) {
      result = result.filter((place) => {
        const placeTags = place.tags?.map((tagObj) => tagObj.name) || [];

        if (filters.tagsCondition === "OR") {
          // OR条件：選択されたタグのいずれかを持つ
          return filters.tags.some((filterTag) =>
            placeTags.includes(filterTag)
          );
        } else {
          // AND条件：選択されたタグを全て持つ
          return filters.tags.every((filterTag) =>
            placeTags.includes(filterTag)
          );
        }
      });
    }

    if (filters.visited !== null) {
      result = result.filter((place) => place.visited === filters.visited);
    }

    // 階層地域フィルター
    if (filters.hierarchicalRegion?.country) {
      result = result.filter((place) => {
        return place.countryCode === filters.hierarchicalRegion?.country;
      });
    }

    if (
      filters.hierarchicalRegion?.states &&
      filters.hierarchicalRegion.states.length > 0
    ) {
      result = result.filter((place) => {
        return (
          place.adminAreaLevel1 &&
          filters.hierarchicalRegion?.states?.includes(place.adminAreaLevel1)
        );
      });
    }
    setFilteredPlaces(result);
    setSelectedPlace(null);
  }, [filters, places]);

  useEffect(() => {
    if (viewMode === "map" && !hasMapBeenViewed) {
      setHasMapBeenViewed(true);
    }
  }, [viewMode, hasMapBeenViewed]);

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
  };

  const handleViewChange = (view: ViewMode) => {
    setViewMode(view);
  };

  return (
    <div>
      <div className="inline-flex items-center justify-between mb-4 w-full">
        {/* 左：FilterBar */}
        <div className="flex justify-start">
          {viewMode !== "ranking" && (
            <FilterBar
              onFilterChange={setFilters}
              initialFilters={filters}
              availableTags={availableTags}
              listId={listId}
            />
          )}
        </div>
        {/* 中央：ビュートグル */}
        <div className="flex justify-center">
          <ViewToggle currentView={viewMode} onViewChange={handleViewChange} />
        </div>
        {/* 右：場所を追加ボタン */}
        <div className="flex justify-end">
          {viewMode !== "ranking" &&
            (permission === "edit" || permission === "owner") && (
              <AddPlaceButtonClient listId={listId} />
            )}
        </div>
      </div>

      {/* List View */}
      {filteredPlaces.length > 0 && (
        <div
          className={`grid gap-6 ${
            viewMode === "list" ? "grid-cols-1" : "hidden"
          }`}
        >
          {/* PlaceListはviewModeがlistの時のみ中身をレンダリングする（負荷軽減のため） */}
          {viewMode === "list" && (
            <PlaceList
              places={filteredPlaces}
              listId={listId}
              selectedPlaceId={selectedPlace?.id}
            />
          )}
        </div>
      )}

      {/* Ranking View */}
      <div className={`${viewMode === "ranking" ? "block" : "hidden"}`}>
        <RankingView listId={listId} places={places} permission={permission} />
      </div>

      {/* Places Not Found Message */}
      {viewMode !== "ranking" && places.length === 0 && (
        <div className="bg-white rounded-soft border border-neutral-200 shadow-soft p-8 text-center">
          <p className="text-sm text-neutral-600 mb-4">
            このリストにはまだ場所が登録されていません。
          </p>
        </div>
      )}
      {viewMode !== "ranking" &&
        places.length > 0 &&
        filteredPlaces.length === 0 && (
          <div className="bg-white rounded-soft border border-neutral-200 shadow-soft p-8 text-center">
            <p className="text-sm text-neutral-600 mb-4">
              フィルター条件に一致する場所がありません。
            </p>
          </div>
        )}

      {/* Map View */}
      {filteredPlaces.length > 0 && (
        <div
          className={`bg-white rounded-soft border border-neutral-200 shadow-soft h-[calc(100vh-25rem)] ${
            viewMode === "map" ? "block" : "hidden"
          }`}
        >
          {(hasMapBeenViewed || viewMode === "map") && (
            <DynamicOpenStreetMapView
              places={filteredPlaces}
              onPlaceSelect={handlePlaceSelect}
              listId={listId}
            />
          )}
        </div>
      )}
    </div>
  );
}
