"use client";

import PlaceCard from "@/app/components/places/PlaceCard";
import { Place } from "@/types";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

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

interface MapCameraChangedEvent {
  detail: {
    center: { lat: number; lng: number };
    zoom: number;
    bounds: google.maps.LatLngBoundsLiteral;
    heading: number;
    tilt: number;
  };
}

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

// 新しい内部コンポーネント: 地図の表示範囲を制御
interface MapBoundsControllerProps {
  places: Place[];
}

function MapBoundsController({ places }: MapBoundsControllerProps) {
  const map = useMap();
  const initialBoundsFitted = useRef(false);

  useEffect(() => {
    if (!map || !places || places.length === 0) {
      return;
    }

    // 初回マウント時のみ地図の表示範囲を調整する
    if (!initialBoundsFitted.current) {
      if (places.length === 1) {
        const place = places[0];
        map.setCenter({ lat: place.latitude, lng: place.longitude });
        map.setZoom(15);
        logMessage(`地図の中心を ${place.name} に設定 (Zoom: 15)`);
      } else {
        const bounds = new google.maps.LatLngBounds();
        places.forEach((place) => {
          bounds.extend({ lat: place.latitude, lng: place.longitude });
        });
        map.fitBounds(bounds, 50);
        logMessage(`地図の表示範囲を ${places.length} 個の場所に合わせて調整`);
      }
      initialBoundsFitted.current = true;
    }
  }, [map, places]);

  return null; // このコンポーネントは何もレンダリングしない
}

// カスタムマーカーコンポーネント
interface CustomMarkerProps {
  isSelected: boolean;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ isSelected }) => {
  return (
    <div
      className={`transition-all duration-150 ease-in-out cursor-pointer ${
        isSelected
          ? "scale-115 z-10 drop-shadow-lg"
          : "scale-100 z-0 drop-shadow-md"
      }`}
      style={{ transformOrigin: "bottom center" }}
    >
      {/* ピン本体 */}
      <div
        className={`rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm bg-primary-600`}
      >
        <span className="text-primary-foreground">ココイコ</span>
      </div>
      {/* 下向きの三角形 */}
      <div
        className="w-0 h-0 mx-auto 
        border-l-[8px] border-l-transparent 
        border-r-[8px] border-r-transparent 
        border-t-[10px] border-t-primary-600"
      ></div>
    </div>
  );
};

const MapView: React.FC<MapViewProps> = ({ places, onPlaceSelect }) => {
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

  // マップの位置が変更されたときに状態を保存 (ユーザー操作時)
  // fitBoundsによる変更と区別するため、少し待ってから保存するなどの工夫も可能だが、
  // 今回はシンプルに、カメラが変わったら常に保存する。
  const handleCameraChanged = (e: MapCameraChangedEvent) => {
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
        <MapBoundsController places={places} />
        <MapLoadMonitor />

        <Map
          mapId={"2e9f8abfc83a4ea"}
          style={{ width: "100%", height: "100%" }}
          defaultCenter={savedCenter}
          defaultZoom={savedZoom}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
          onClick={handleMapClick}
          onCameraChanged={handleCameraChanged}
        >
          {places.map((place) => (
            <AdvancedMarker
              key={place.id}
              position={{ lat: place.latitude, lng: place.longitude }}
              onClick={(e) => {
                e.domEvent.stopPropagation();
                handleMarkerClick(place);
              }}
              title={place.name}
            >
              <CustomMarker isSelected={selectedPlace?.id === place.id} />
            </AdvancedMarker>
          ))}
        </Map>

        {selectedPlace && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-10">
            <div className="relative">
              <button
                onClick={() => setSelectedPlace(null)}
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
    </APIProvider>
  );
};

export default MapView;
