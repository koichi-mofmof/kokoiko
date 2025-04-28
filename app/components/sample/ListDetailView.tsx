"use client";

import MapView from "@/app/components/map/MapView";
import PlaceList from "@/app/components/places/PlaceList";
import FilterBar from "@/app/components/ui/FilterBar";
import ViewToggle from "@/app/components/ui/ViewToggle";
import { FilterOptions, Place, ViewMode } from "@/types";
import { useEffect, useState, useMemo } from "react";

interface ListDetailViewProps {
  places: Place[];
}

export default function ListDetailView({ places }: ListDetailViewProps) {
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>(places);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  // Set default view to list
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [hasMapBeenViewed, setHasMapBeenViewed] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    tags: [],
    visited: null,
    groupId: null, // groupId might be relevant here if filtering within the list
    dateRange: null,
    prefecture: [],
  });

  // Derive unique available tags from the places data
  const availableTags = useMemo(() => {
    const allTags = places.flatMap((place) => place.tags || []);
    return Array.from(new Set(allTags));
  }, [places]);

  // Derive unique available prefectures from the places data
  const availablePrefectures = useMemo(() => {
    const prefectures = places
      .map((place) => {
        // Simple extraction: Assumes prefecture is at the beginning and ends with 都, 道, 府, or 県
        const match = place.address?.match(
          /^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/
        );
        return match ? match[0] : null;
      })
      .filter((pref): pref is string => pref !== null);
    return Array.from(new Set(prefectures));
  }, [places]);

  // Apply filters when filters state or initial places change
  useEffect(() => {
    let result = [...places];

    // Filter by tags
    if (filters.tags.length > 0) {
      result = result.filter((place) =>
        place.tags?.some((tag) => filters.tags.includes(tag))
      );
    }

    // Filter by visited status
    if (filters.visited !== null) {
      result = result.filter((place) => place.visited === filters.visited);
    }

    // Filter by prefecture
    if (filters.prefecture.length > 0) {
      result = result.filter((place) =>
        filters.prefecture.some((pref) => place.address?.startsWith(pref))
      );
    }

    // TODO: Implement other filters like dateRange if needed

    setFilteredPlaces(result);
    // Reset selected place when filters change
    setSelectedPlace(null);
  }, [filters, places]);

  // Track if map has been viewed to avoid re-rendering cost
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
      <div className="flex justify-between items-center mb-6">
        <FilterBar
          onFilterChange={setFilters}
          initialFilters={filters}
          availableTags={availableTags}
          availablePrefectures={availablePrefectures}
        />
        {/* Pass the updated view modes if ViewToggle needs them */}
        <ViewToggle currentView={viewMode} onViewChange={handleViewChange} />
      </div>

      {filteredPlaces.length === 0 ? (
        <div className="bg-white rounded-soft border border-neutral-200 shadow-soft p-8 text-center">
          <p className="text-neutral-600 mb-4">
            フィルター条件に一致する場所がありません。
          </p>
        </div>
      ) : (
        <>
          {/* Map View (conditionally rendered) */}
          <div
            className={`bg-white rounded-soft border border-neutral-200 shadow-soft h-[calc(100vh-25rem)] mb-6 ${
              // Adjusted height calculation
              viewMode === "map" ? "block" : "hidden"
            }`}
          >
            {(hasMapBeenViewed || viewMode === "map") && (
              <MapView
                places={filteredPlaces}
                onPlaceSelect={handlePlaceSelect}
              />
            )}
          </div>

          {/* List View (always grid-cols-1 when not map) */}
          <div
            className={`grid gap-6 ${
              viewMode === "map" ? "hidden" : "grid-cols-1"
            }`}
          >
            {viewMode === "list" && (
              <PlaceList
                places={filteredPlaces}
                onPlaceSelect={handlePlaceSelect}
                selectedPlaceId={selectedPlace?.id}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
