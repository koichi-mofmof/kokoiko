"use client";

import MapView from "@/app/components/map/MapView";
import PlaceCard from "@/app/components/places/PlaceCard";
import PlaceList from "@/app/components/places/PlaceList";
import FilterBar from "@/app/components/ui/FilterBar";
import ViewToggle from "@/app/components/ui/ViewToggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { mockPlaces, mockUsers } from "@/lib/mockData";
import { FilterOptions, Place, ViewMode } from "@/types";
import { LogIn, Map as MapIcon, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MapPage() {
  const [places] = useState<Place[]>(mockPlaces);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>(mockPlaces);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [hasMapBeenViewed, setHasMapBeenViewed] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    tags: [],
    visited: null,
    groupId: null,
    dateRange: null,
  });

  // Current user mock
  const currentUser = mockUsers[0];

  // Apply filters when filters state changes
  useEffect(() => {
    let result = [...places];

    // Filter by tags
    if (filters.tags.length > 0) {
      result = result.filter((place) =>
        place.tags.some((tag) => filters.tags.includes(tag))
      );
    }

    // Filter by visited status
    if (filters.visited !== null) {
      result = result.filter((place) => place.visited === filters.visited);
    }

    // Filter by date range (would be implemented here)

    setFilteredPlaces(result);
  }, [filters, places]);

  // マップビューが選択されたら、マップが表示済みであることを記録
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
    <div className="min-h-screen bg-neutral-50">
      <main className="pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Alert className="mb-4">
            <LogIn className="h-4 w-4" />
            <AlertTitle>サンプルデータを表示しています</AlertTitle>
            <AlertDescription className="text-neutral-900 items-center gap-1">
              自分の場所を登録・管理するには
              <Link href="/login" className="underline font-medium px-1">
                ログイン
              </Link>
              が必要です。
            </AlertDescription>
          </Alert>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h1 className="text-2xl font-medium text-neutral-900 flex items-center">
              <MapIcon className="h-6 w-6 text-primary-600 mr-2" />
              マイマップ
            </h1>
          </div>
          <div className="flex justify-between items-center mb-6">
            <FilterBar onFilterChange={setFilters} initialFilters={filters} />
            <ViewToggle
              currentView={viewMode}
              onViewChange={handleViewChange}
            />
          </div>

          {filteredPlaces.length === 0 ? (
            <div className="bg-white rounded-soft border border-neutral-200 shadow-soft p-8 text-center">
              <p className="text-neutral-600 mb-4">
                登録された場所がありません
              </p>
              <Link
                href="/places/add"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm rounded-soft shadow-soft text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                場所を追加する
              </Link>
            </div>
          ) : (
            <>
              <div
                className={`bg-white rounded-soft border border-neutral-200 shadow-soft h-[calc(100vh-18rem)] mb-6 ${
                  viewMode === "map" ? "block" : "hidden"
                }`}
              >
                {(hasMapBeenViewed || viewMode === "map") && (
                  <MapView
                    key="persistent-map-view"
                    places={filteredPlaces}
                    onPlaceSelect={handlePlaceSelect}
                  />
                )}
              </div>

              <div
                className={`grid gap-6 ${
                  viewMode === "cards"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1"
                } ${
                  viewMode === "cards" || viewMode === "list" ? "" : "hidden"
                }`}
              >
                {viewMode === "cards" &&
                  filteredPlaces.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onClick={handlePlaceSelect}
                    />
                  ))}
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
      </main>

      {/* Floating action button for mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Link
          href="/places/add"
          className="inline-flex items-center justify-center p-3 bg-primary-600 text-white rounded-full shadow-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>
    </div>
  );
}
