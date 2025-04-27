"use client";

import PlaceCard from "@/app/components/places/PlaceCard";
import { Place } from "@/types";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface MapViewProps {
  places: Place[];
  onPlaceSelect?: (place: Place) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}

// デフォルトの地図中心（例：東京駅）
const DEFAULT_CENTER = { lat: 35.681236, lng: 139.767125 };
const DEFAULT_ZOOM = 12;

// マップの状態を保持するためのモジュールスコープの変数
let savedCenter = DEFAULT_CENTER;
let savedZoom = DEFAULT_ZOOM;

// APIリクエストの回数をカウント
let apiRequestCount = 0;

// ログ追加関数
const logMessage = (message: string) => {
  console.log(`[GoogleMapsAPI] ${message}`);
};

// マップロードの監視コンポーネント
function MapLoadMonitor() {
  const map = useMap();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (map && !isLoaded) {
      logMessage(`Googleマップが正常にロードされました`);
      setIsLoaded(true);

      // マップの移動監視
      map.addListener("idle", () => {
        const center = map.getCenter();
        if (center) {
          const lat = center.lat();
          const lng = center.lng();
          const zoom = map.getZoom() || 0;
          logMessage(
            `マップの表示位置が変更されました [${lat.toFixed(4)}, ${lng.toFixed(
              4
            )}, zoom: ${zoom}]`
          );
        }
      });
    }

    return () => {
      // クリーンアップ
    };
  }, [map, isLoaded]);

  return null;
}

const MapView: React.FC<MapViewProps> = ({
  places,
  onPlaceSelect,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
}) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // コンポーネントマウント時のログ
  useEffect(() => {
    apiRequestCount++;
    logMessage(
      `MapViewコンポーネントがマウントされました (${apiRequestCount}回目)`
    );
    logMessage(`Google Maps APIの初期化を開始します...`);

    // DOMにmapIdを持つ要素が表示されるまで待つ
    const mapTimerRef = setTimeout(() => {
      const mapElement = document.getElementById("kokoiko-map");
      if (mapElement) {
        logMessage(`マップ要素がDOMに追加されました`);
      }
    }, 500);

    return () => {
      clearTimeout(mapTimerRef);
      logMessage(`MapViewコンポーネントがアンマウントされました`);
    };
  }, []);

  if (!apiKey) {
    console.error("Google Maps API Key is not configured.");
    return (
      <div className="w-full h-full min-h-[300px] rounded-lg bg-neutral-100 flex items-center justify-center text-red-500">
        Google Maps APIキーが設定されていません。
      </div>
    );
  }

  const handleMarkerClick = (place: Place) => {
    setSelectedPlace(place);
    if (onPlaceSelect) {
      onPlaceSelect(place);
    }
    logMessage(`マーカーがクリックされました: ${place.name}`);
  };

  const handleMapClick = () => {
    setSelectedPlace(null);
  };

  // マップの位置が変更されたときに状態を保存
  const handleCameraChanged = (e: any) => {
    if (e.detail && e.detail.center) {
      savedCenter = {
        lat: e.detail.center.lat,
        lng: e.detail.center.lng,
      };
      if (e.detail.zoom) {
        savedZoom = e.detail.zoom;
      }
    }
  };

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative w-full h-full min-h-[300px] rounded-lg overflow-hidden">
        <Map
          mapId={"kokoiko-map"}
          style={{ width: "100%", height: "100%" }}
          defaultCenter={savedCenter}
          defaultZoom={savedZoom}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
          onClick={handleMapClick}
          onCameraChanged={handleCameraChanged}
        >
          <MapLoadMonitor />

          {places.map((place) => (
            <AdvancedMarker
              key={place.id}
              position={{ lat: place.latitude, lng: place.longitude }}
              onClick={(e) => {
                e.domEvent.stopPropagation();
                handleMarkerClick(place);
              }}
              title={place.name}
              zIndex={selectedPlace?.id === place.id ? 1 : undefined}
            >
              <Pin
                background={
                  selectedPlace?.id === place.id ? "#EA4335" : "#4285F4"
                }
                borderColor={
                  selectedPlace?.id === place.id ? "#FFFFFF" : "#FFFFFF"
                }
                glyphColor={
                  selectedPlace?.id === place.id ? "#FFFFFF" : "#FFFFFF"
                }
              />
            </AdvancedMarker>
          ))}
        </Map>

        {selectedPlace && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-10">
            <div className="relative">
              <button
                onClick={() => setSelectedPlace(null)}
                className="absolute top-2 right-2 z-20 bg-white rounded-full p-1 shadow-md hover:bg-neutral-100 transition-colors"
                aria-label="閉じる"
              >
                <X className="h-4 w-4 text-neutral-600" />
              </button>
              <PlaceCard place={selectedPlace} />
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
};

export default MapView;
