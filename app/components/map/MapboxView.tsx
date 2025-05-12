"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import { Place } from "@/types";
import PlaceCard from "@/app/components/places/PlaceCard";
import { X } from "lucide-react";

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
  // MapView.tsx の CustomMarker のスタイルを参考に、Mapboxで同等の表現を目指します。
  // MapboxではマーカーにHTML要素を直接指定できるため、より柔軟なスタイリングが可能です。
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
      <div
        className={`rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm ${
          isSelected ? "bg-primary-700" : "bg-primary-600"
        }`}
      >
        <span className="text-primary-foreground">ココイコ</span>
      </div>
      <div
        className={`w-0 h-0 mx-auto 
        border-l-[8px] border-l-transparent 
        border-r-[8px] border-r-transparent 
        border-t-[10px] ${
          isSelected ? "border-t-primary-700" : "border-t-primary-600"
        }`}
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

  useEffect(() => {
    mapboxLoadCount++; // カウントを増やす
    logMessage(
      `Mapboxマップの初期化処理が実行されました（${mapboxLoadCount}回目）`
    ); // ログ出力

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
    if (!mapContainerRef.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: savedCenter,
      zoom: savedZoom,
    });

    // 言語設定を日本語に
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

  useEffect(() => {
    if (!mapRef.current || !places) return;
    const map = mapRef.current;

    // 既存のマーカーとReact Rootをクリア
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // unmount処理を非同期に実行
    const rootsToUnmount = Array.from(markerRootsRef.current.values());
    markerRootsRef.current.clear();
    setTimeout(() => {
      rootsToUnmount.forEach((root) => root.unmount());
    }, 0);

    const bounds = new mapboxgl.LngLatBounds();

    places.forEach((place) => {
      const markerContainer = document.createElement("div");
      const isSelected = selectedPlace?.id === place.id;

      // マーカーコンテナに対応するReact Rootを作成（または取得）し、コンポーネントをレンダリング
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

      // イベントリスナーはマーカーコンテナの親要素（mapboxglが生成するラッパー）に設定
      marker.getElement().addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedPlace(place);
        if (onPlaceSelect) {
          onPlaceSelect(place);
        }
        logMessage(`マーカーがクリックされました: ${place.name}`);
      });
      markersRef.current.push(marker);
      bounds.extend([place.longitude, place.latitude]);
    });

    if (places.length > 0 && map.getCanvas()) {
      if (places.length === 1) {
        map.setCenter([places[0].longitude, places[0].latitude]);
        map.setZoom(15);
        logMessage(`地図の中心を ${places[0].name} に設定 (Zoom: 15)`);
      } else if (places.length > 1) {
        map.fitBounds(bounds, { padding: 80, duration: 0 });
        logMessage(`地図の表示範囲を ${places.length} 個の場所に合わせて調整`);
      }
    }
  }, [mapRef, places, onPlaceSelect, selectedPlace]);

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
