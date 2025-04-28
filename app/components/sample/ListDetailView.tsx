"use client";

import { useEffect, useState } from "react";
import { Place, ViewMode, FilterOptions } from "@/types";
import FilterBar from "@/app/components/ui/FilterBar";
import ViewToggle from "@/app/components/ui/ViewToggle";
import MapView from "@/app/components/map/MapView";
import PlaceList from "@/app/components/places/PlaceList";
import Link from "next/link";
import { Plus } from "lucide-react";

interface ListDetailViewProps {
  places: Place[];
  listId: string; // For "Add Place" link
}

export default function ListDetailView({
  places,
  listId,
}: ListDetailViewProps) {
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
  });

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
        <FilterBar onFilterChange={setFilters} initialFilters={filters} />
        {/* Pass the updated view modes if ViewToggle needs them */}
        <ViewToggle currentView={viewMode} onViewChange={handleViewChange} />
      </div>

      {filteredPlaces.length === 0 ? (
        <div className="bg-white rounded-soft border border-neutral-200 shadow-soft p-8 text-center">
          <p className="text-neutral-600 mb-4">
            フィルター条件に一致する場所がありません。
            <br />
            （または、このリストにはまだ場所が登録されていません）
          </p>
          <Link
            href={`/places/add?listId=${listId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm rounded-soft shadow-soft text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            場所を追加する
          </Link>
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
                // Use a key that changes with places to force re-render if needed, or manage map updates internally
                key={`map-${listId}-${filteredPlaces.length}`}
                places={filteredPlaces}
                onPlaceSelect={handlePlaceSelect}
                // Pass selectedPlace if MapView uses it to highlight
                // selectedPlaceId={selectedPlace?.id} // Removed due to Linter error
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
