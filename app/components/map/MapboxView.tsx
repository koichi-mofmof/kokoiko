"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import { Place } from "@/types";
import PlaceCard from "@/app/components/places/PlaceCard";
import { X, MapPinHouse } from "lucide-react";

interface MapboxViewProps {
  places: Place[];
  onPlaceSelect?: (place: Place) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}

// デフォルトの地図中心（例：東京駅）
const DEFAULT_CENTER = { lat: 35.681236, lng: 139.767125 };
const DEFAULT_ZOOM = 12;

let savedCenter = DEFAULT_CENTER;
let savedZoom = DEFAULT_ZOOM;

let mapboxLoadCount = 0; // マップ初期化回数をカウントする変数

const logMessage = (message: string) => {
  console.log(`[MapboxAPI] ${message}`);
};

// カスタムマーカーコンポーネント（Mapbox用）
interface CustomMapboxMarkerProps {
  isSelected: boolean;
  placeName: string;
}

const CustomMapboxMarker: React.FC<CustomMapboxMarkerProps> = ({
  isSelected,
  placeName,
}) => {
  return (
    <div
      className={`transition-all duration-150 ease-in-out cursor-pointer ${
        isSelected
          ? "scale-115 z-10 drop-shadow-lg"
          : "scale-100 z-0 drop-shadow-md"
      }`}
      style={{ transformOrigin: "bottom center" }}
      title={placeName} // マーカーにタイトル属性を追加
    >
      {/* ピン本体 */}
      <div
        className={`rounded-full p-2 shadow-md flex items-center justify-center border border-primary-700 ${
          isSelected ? "bg-primary-100" : "bg-white"
        }`}
      >
        <MapPinHouse
          className={`${
            isSelected ? "h-7 w-7 text-primary-700" : "h-6 w-6 text-primary-600"
          }`}
          strokeWidth={isSelected ? 2.5 : 2}
        />
      </div>
      {/* 下向きの三角形 */}
      <div
        className={`w-0 h-0 mx-auto 
        border-l-[8px] border-l-transparent 
        border-r-[8px] border-r-transparent 
        border-t-[10px] border-t-primary-700`}
      ></div>
    </div>
  );
};

const MapboxView: React.FC<MapboxViewProps> = ({ places, onPlaceSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const markerRootsRef = useRef<Map<string, ReactDOM.Root>>(new Map());

  // useEffect for map initialization (初回のみ実行)
  useEffect(() => {
    mapboxLoadCount++;
    logMessage(
      `Mapboxマップの初期化処理が実行されました（${mapboxLoadCount}回目）`
    );
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
    if (!mapContainerRef.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: savedCenter,
      zoom: savedZoom,
    });

    const language = new MapboxLanguage({ defaultLanguage: "ja" });
    mapInstance.addControl(language);
    mapRef.current = mapInstance;

    mapInstance.on("load", () => {
      logMessage("Mapboxマップが正常にロードされました");
    });

    mapInstance.on("moveend", () => {
      const center = mapInstance.getCenter();
      const zoom = mapInstance.getZoom();
      savedCenter = { lat: center.lat, lng: center.lng };
      savedZoom = zoom;
      logMessage(
        `マップの表示位置が変更されました [${center.lat.toFixed(
          4
        )}, ${center.lng.toFixed(4)}, zoom: ${zoom}]`
      );
    });

    mapInstance.on("click", () => {
      setSelectedPlace(null);
    });

    return () => {
      mapInstance.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect for updating markers (appearance and click handlers)
  // Runs when 'places' or 'selectedPlace' changes.
  useEffect(() => {
    if (!mapRef.current || !places) return;
    const map = mapRef.current;

    // Clear existing markers and their React roots
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    const rootsToUnmount = Array.from(markerRootsRef.current.values());
    markerRootsRef.current.clear();
    setTimeout(() => {
      rootsToUnmount.forEach((root) => root.unmount());
    }, 0);

    places.forEach((place) => {
      const markerContainer = document.createElement("div");
      const isSelected = selectedPlace?.id === place.id;

      let root = markerRootsRef.current.get(place.id);
      if (!root) {
        root = ReactDOM.createRoot(markerContainer);
        markerRootsRef.current.set(place.id, root);
      }
      root.render(
        <CustomMapboxMarker isSelected={isSelected} placeName={place.name} />
      );

      const marker = new mapboxgl.Marker(markerContainer)
        .setLngLat([place.longitude, place.latitude])
        .addTo(map);

      marker.getElement().addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedPlace(place);
        if (onPlaceSelect) {
          onPlaceSelect(place);
        }
        logMessage(`マーカーがクリックされました: ${place.name}`);
      });
      markersRef.current.push(marker);
    });
  }, [places, selectedPlace, onPlaceSelect]);

  // useEffect for fitting map to bounds ONLY when 'places' array changes
  // Runs only when 'places' prop changes reference.
  useEffect(() => {
    if (!mapRef.current || !places) return;
    const map = mapRef.current;

    const bounds = new mapboxgl.LngLatBounds();
    let validPlacesExist = false;
    places.forEach((p) => {
      if (p.longitude != null && p.latitude != null) {
        bounds.extend([p.longitude, p.latitude]);
        validPlacesExist = true;
      }
    });

    if (map.getCanvas() && validPlacesExist) {
      if (
        places.length === 1 &&
        places[0].longitude != null &&
        places[0].latitude != null
      ) {
        map.setCenter([places[0].longitude, places[0].latitude]);
        map.setZoom(15);
        logMessage(`地図の中心を ${places[0].name} に設定 (Zoom: 15)`);
      } else if (places.length > 1) {
        map.fitBounds(bounds, { padding: 80, duration: 0 });
        logMessage(`地図の表示範囲を ${places.length} 個の場所に合わせて調整`);
      }
    }
  }, [places]); // Only depends on 'places'

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-lg overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />
      {selectedPlace && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-10">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPlace(null);
              }}
              className="absolute top-3 right-3 z-20 bg-white rounded-full p-1 shadow-md hover:bg-neutral-100 transition-colors"
              aria-label="閉じる"
            >
              <X className="h-4 w-4 text-neutral-600" />
            </button>
            <PlaceCard place={selectedPlace} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxView;
