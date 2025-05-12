"use client";

import MapboxView from "@/app/components/map/MapboxView";
import PlaceList from "@/app/components/places/PlaceList";
import FilterBar from "@/app/components/ui/FilterBar";
import ViewToggle from "@/app/components/ui/ViewToggle";
import RankingView from "@/app/sample/[listId]/_components/RankingView";
import { FilterOptions, Place, ViewMode } from "@/types";
import { useEffect, useMemo, useState } from "react";

interface ListDetailViewProps {
  places: Place[];
  listId: string;
}

export default function ListDetailView({
  places,
  listId,
}: ListDetailViewProps) {
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>(places);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [hasMapBeenViewed, setHasMapBeenViewed] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    tags: [],
    visited: null,
    groupId: null,
    dateRange: null,
    prefecture: [],
  });

  const availableTags = useMemo(() => {
    const allTags = places.flatMap((place) => place.tags || []);
    return Array.from(new Set(allTags));
  }, [places]);

  const availablePrefectures = useMemo(() => {
    const prefectures = places
      .map((place) => {
        const match = place.address?.match(
          /^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/
        );
        return match ? match[0] : null;
      })
      .filter((pref): pref is string => pref !== null);
    return Array.from(new Set(prefectures));
  }, [places]);

  useEffect(() => {
    let result = [...places];
    if (filters.tags.length > 0) {
      result = result.filter((place) =>
        place.tags?.some((tag) => filters.tags.includes(tag))
      );
    }
    if (filters.visited !== null) {
      result = result.filter((place) => place.visited === filters.visited);
    }
    if (filters.prefecture.length > 0) {
      result = result.filter((place) =>
        filters.prefecture.some((pref) => place.address?.startsWith(pref))
      );
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
      <div
        className={`flex items-center mb-6 ${
          viewMode === "ranking" ? "justify-end" : "justify-between"
        }`}
      >
        {viewMode !== "ranking" && (
          <FilterBar
            onFilterChange={setFilters}
            initialFilters={filters}
            availableTags={availableTags}
            availablePrefectures={availablePrefectures}
          />
        )}
        <ViewToggle currentView={viewMode} onViewChange={handleViewChange} />
      </div>

      {/* Ranking View */}
      <div className={`${viewMode === "ranking" ? "block" : "hidden"}`}>
        <RankingView listId={listId} />
      </div>

      {/* Places Not Found Message */}
      {viewMode !== "ranking" && filteredPlaces.length === 0 && (
        <div className="bg-white rounded-soft border border-neutral-200 shadow-soft p-8 text-center">
          <p className="text-neutral-600 mb-4">
            フィルター条件に一致する場所がありません。
          </p>
        </div>
      )}

      {/* Map View */}
      {filteredPlaces.length > 0 && (
        <div
          className={`bg-white rounded-soft border border-neutral-200 shadow-soft h-[calc(100vh-25rem)] mb-6 ${
            viewMode === "map" ? "block" : "hidden"
          }`}
        >
          {(hasMapBeenViewed || viewMode === "map") && (
            <MapboxView
              places={filteredPlaces}
              onPlaceSelect={handlePlaceSelect}
            />
          )}
        </div>
      )}

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
              onPlaceSelect={handlePlaceSelect}
              selectedPlaceId={selectedPlace?.id}
            />
          )}
        </div>
      )}
    </div>
  );
}
