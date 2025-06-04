"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Place } from "@/types";
import PlaceCard from "@/app/components/places/PlaceCard";
import { X } from "lucide-react";
import ReactDOMServer from "react-dom/server";
import Image from "next/image";

interface OpenStreetMapViewProps {
  places: Place[];
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
const CustomLeafletMarkerIcon = (isSelected: boolean, placeName: string) => {
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
        className={`rounded-full p-2 shadow-md flex items-center justify-center border border-primary-700 ${
          isSelected ? "bg-primary-100" : "bg-white"
        }`}
      >
        <Image
          src="/icon0.svg"
          alt={placeName}
          width={28}
          height={28}
          className={`${isSelected ? "h-7 w-7" : "h-7 w-7"} text-primary-600`}
          style={{ strokeWidth: isSelected ? 2.5 : 2 }}
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
  onPlaceSelect,
  initialCenter,
  initialZoom,
  listId,
  isSample,
}) => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [currentCenter, setCurrentCenter] = useState<L.LatLngTuple>(
    initialCenter ? [initialCenter.lat, initialCenter.lng] : savedCenter
  );
  const [currentZoom, setCurrentZoom] = useState<number>(
    initialZoom ?? savedZoom
  );

  const handleMapClick = () => {
    setSelectedPlace(null);
  };

  useEffect(() => {
    // 外部から initialCenter や initialZoom が変更された場合に対応
    if (initialCenter) {
      setCurrentCenter([initialCenter.lat, initialCenter.lng]);
    }
    if (initialZoom) {
      setCurrentZoom(initialZoom);
    }
  }, [initialCenter, initialZoom]);

  return (
    <div className="relative w-full h-full min-h-[250px] rounded-lg overflow-hidden z-10">
      <MapContainer
        center={currentCenter}
        zoom={currentZoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
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
            return (
              <Marker
                key={place.id}
                position={[place.latitude, place.longitude]}
                icon={CustomLeafletMarkerIcon(isSelected, place.name)}
                eventHandlers={{
                  click: (e: L.LeafletMouseEvent) => {
                    L.DomEvent.stopPropagation(e); // MapContainerのクリックイベントの発火を抑制
                    setSelectedPlace(place);
                    if (onPlaceSelect) {
                      onPlaceSelect(place);
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
};

export default OpenStreetMapView;
