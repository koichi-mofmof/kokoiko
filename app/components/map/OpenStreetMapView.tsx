"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Place, DisplayOrderedPlace } from "@/types";
import PlaceCard from "@/app/components/places/PlaceCard";
import { trackMapEvents } from "@/lib/analytics/events";
import { Maximize2, Minimize2, X } from "lucide-react";
import ReactDOMServer from "react-dom/server";
import { createPortal } from "react-dom";
import Image from "next/image";

interface OpenStreetMapViewProps {
  places: Place[];
  displayOrders?: DisplayOrderedPlace[];
  onPlaceSelect?: (place: Place) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  listId?: string;
  isSample?: boolean;
}

const DEFAULT_CENTER: L.LatLngTuple = [35.681236, 139.767125]; // 東京駅
const DEFAULT_ZOOM = 12;

let savedCenter: L.LatLngTuple = DEFAULT_CENTER;
let savedZoom = DEFAULT_ZOOM;

// Custom Marker Component
const CustomLeafletMarkerIcon = (
  isSelected: boolean,
  placeName: string,
  orderNumber?: number
) => {
  const iconHtml = ReactDOMServer.renderToString(
    <div
      className={`transition-all duration-150 ease-in-out cursor-pointer ${
        isSelected
          ? "scale-110 z-[1000] drop-shadow-lg" // z-indexを高く設定
          : "scale-100 z-auto drop-shadow-md"
      }`}
      style={{ transformOrigin: "bottom center" }}
      title={placeName}
    >
      <div
        className={`rounded-full p-2 shadow-md flex items-center justify-center border border-primary-700 relative ${
          isSelected ? "bg-primary-100" : "bg-white"
        }`}
      >
        {orderNumber && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold border border-white">
            {orderNumber}
          </div>
        )}
        <Image
          src="/icon0.webp"
          alt={placeName}
          width={28}
          height={28}
          className={`${isSelected ? "h-7 w-7" : "h-7 w-7"} text-primary-600`}
          style={{ strokeWidth: isSelected ? 2.5 : 2 }}
          sizes="28px"
          quality={75}
        />
      </div>
      <div
        className={`w-0 h-0 mx-auto 
        border-l-[8px] border-l-transparent 
        border-r-[8px] border-r-transparent 
        border-t-[10px] border-t-primary-700`}
      ></div>
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: "dummy", // leaflet自身のスタイルを避けるため
    iconSize: [44, 44], // アイコンの最大レンダリングサイズに合わせる (以前は [40, 40])
    iconAnchor: [22, 44], // 新しいiconSizeの底辺中央に設定 (以前は [20, 40])
  });
};

// Map Resizer and Mover Component
const MapEvents = ({
  center,
  zoom,
  places,
  onMapClick,
}: {
  center: L.LatLngTuple;
  zoom: number;
  places: Place[];
  onMapClick: () => void;
}) => {
  const map = useMap();

  // コンテナ寸法の変化（dvh変動・全画面切替・タブ表示切替など）に追随して
  // invalidateSize を呼び、タイルがグレーのまま/読み込まれない問題を防ぐ。
  useEffect(() => {
    const el = map.getContainer();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);

  // 初回マウント時、コンテナのレイアウト（特にモバイルのdvh）が確定してから
  // タイルを読み込ませる。確定タイミングに幅があるため複数回キックする。
  useEffect(() => {
    const raf = requestAnimationFrame(() => map.invalidateSize());
    const timers = [100, 300, 600].map((d) =>
      window.setTimeout(() => map.invalidateSize(), d)
    );
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [map]);

  useEffect(() => {
    map.setView(center, zoom);
    map.invalidateSize();
  }, [center, zoom, map]);

  useEffect(() => {
    if (!places || places.length === 0) {
      map.invalidateSize();
      return;
    }

    if (places.length === 1 && places[0].latitude && places[0].longitude) {
      map.setView([places[0].latitude, places[0].longitude], 15);
    } else if (places.length > 1) {
      const bounds = L.latLngBounds(
        places
          .filter((p) => p.latitude && p.longitude)
          .map((p) => [p.latitude as number, p.longitude as number])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
    map.invalidateSize();
  }, [places, map]);

  useEffect(() => {
    map.on("click", onMapClick);
    return () => {
      map.off("click", onMapClick);
    };
  }, [map, onMapClick]);

  map.on("moveend", () => {
    const newCenter = map.getCenter();
    savedCenter = [newCenter.lat, newCenter.lng];
    savedZoom = map.getZoom();
    console.log(
      `[LeafletMap] Map moved to: [${newCenter.lat.toFixed(
        4
      )}, ${newCenter.lng.toFixed(4)}], zoom: ${savedZoom}`
    );
  });

  return null;
};

const OpenStreetMapView: React.FC<OpenStreetMapViewProps> = ({
  places,
  displayOrders = [],
  onPlaceSelect,
  initialCenter,
  initialZoom,
  listId,
  isSample,
}) => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentCenter, setCurrentCenter] = useState<L.LatLngTuple>(
    initialCenter ? [initialCenter.lat, initialCenter.lng] : savedCenter
  );
  const [currentZoom, setCurrentZoom] = useState<number>(
    initialZoom ?? savedZoom
  );

  const handleMapClick = () => {
    setSelectedPlace(null);
  };

  // 全画面中は背面スクロールを固定し、Escで終了できるようにする
  useEffect(() => {
    if (!isFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen]);

  useEffect(() => {
    // 外部から initialCenter や initialZoom が変更された場合に対応
    if (initialCenter) {
      setCurrentCenter([initialCenter.lat, initialCenter.lng]);
    }
    if (initialZoom) {
      setCurrentZoom(initialZoom);
    }
  }, [initialCenter, initialZoom]);

  const mapView = (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[10000] h-[100dvh] w-screen overflow-hidden bg-white"
          : "relative w-full h-full min-h-[250px] rounded-lg overflow-hidden z-10"
      }
    >
      {/* 全画面切替ボタン（Leafletのズームは左上・帰属は右下なので右上に配置）。
          全画面時はノッチ回避のため safe-area 分だけ下げる。 */}
      <button
        type="button"
        onClick={() => setIsFullscreen((v) => !v)}
        className="absolute right-3 top-3 z-[1100] rounded-full bg-white p-2 shadow-md transition-colors hover:bg-neutral-100"
        style={
          isFullscreen
            ? { top: "max(0.75rem, env(safe-area-inset-top))" }
            : undefined
        }
        aria-label={isFullscreen ? "全画面を終了" : "地図を全画面表示"}
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4 text-neutral-700" />
        ) : (
          <Maximize2 className="h-4 w-4 text-neutral-700" />
        )}
      </button>
      {/* パーセンテージ高さ(h-full)の連鎖は初期化時に高さ0へ解決されタイルが
          読み込まれないことがあるため、絶対配置で親の実寸（min-h含む）を必ず埋める。
          インラインstyleでLeafletの.leaflet-container指定に確実に勝たせる。 */}
      <MapContainer
        center={currentCenter}
        zoom={currentZoom}
        scrollWheelZoom={true}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents
          center={currentCenter}
          zoom={currentZoom}
          places={places}
          onMapClick={handleMapClick}
        />
        {places.map((place) => {
          if (place.latitude && place.longitude) {
            const isSelected = selectedPlace?.id === place.id;

            // 表示順序番号を取得
            const displayOrder = displayOrders.find(
              (order) => order.placeId === place.id
            )?.displayOrder;

            // 順序番号表示の条件：displayOrderが存在する場合
            const orderNumber = displayOrder ? displayOrder : undefined;

            return (
              <Marker
                key={place.id}
                position={[place.latitude, place.longitude]}
                icon={CustomLeafletMarkerIcon(
                  isSelected,
                  place.name,
                  orderNumber
                )}
                eventHandlers={{
                  click: (e: L.LeafletMouseEvent) => {
                    L.DomEvent.stopPropagation(e); // MapContainerのクリックイベントの発火を抑制
                    setSelectedPlace(place);
                    if (onPlaceSelect) {
                      onPlaceSelect(place);
                    }
                    if (!isSample) {
                      trackMapEvents.clickPlace(place.id);
                    }
                    console.log(`[LeafletMap] Marker clicked: ${place.name}`);
                  },
                }}
              />
            );
          }
          return null;
        })}
      </MapContainer>
      {selectedPlace && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-120 sm:max-w-xl z-[1000]">
          {" "}
          {/* z-indexをマーカーより高く */}
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
            <PlaceCard
              place={selectedPlace}
              listId={listId}
              isSample={isSample}
            />
          </div>
        </div>
      )}
    </div>
  );

  // 全画面時は body 直下へポータル。祖先のスタッキング文脈に閉じ込められず、
  // ヘッダー等の上に確実に重なる（縮小ボタンが隠れて戻せない問題を解消）。
  return isFullscreen ? createPortal(mapView, document.body) : mapView;
};

export default OpenStreetMapView;
