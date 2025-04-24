"use client";

import React, { useEffect, useRef } from "react";
import { Place } from "@/types";

interface MapViewProps {
  places: Place[];
  selectedPlaceId?: string;
  onPlaceSelect: (place: Place) => void;
}

const MapView: React.FC<MapViewProps> = ({
  places,
  selectedPlaceId,
  onPlaceSelect,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);

  // This is a mock implementation for visualization
  // In a real implementation, we would use the Google Maps API
  useEffect(() => {
    if (!mapRef.current) return;

    const mapElement = mapRef.current;

    // Create a simple visual representation of pins
    mapElement.innerHTML = "";

    const mapContainer = document.createElement("div");
    mapContainer.className =
      "relative w-full h-full bg-neutral-100 rounded-lg overflow-hidden";

    // For the prototype, we'll just show a background image
    const mapImage = document.createElement("img");
    mapImage.src =
      "https://images.pexels.com/photos/4429428/pexels-photo-4429428.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
    mapImage.className =
      "absolute inset-0 w-full h-full object-cover opacity-50";
    mapContainer.appendChild(mapImage);

    // Add pins for each place
    places.forEach((place) => {
      const pin = document.createElement("div");

      // Calculate position based on lat/long (this is just for visualization)
      // In a real app, this would use the Google Maps API
      const left = ((place.longitude - 139.6) / 0.5) * 100;
      const top = (1 - (place.latitude - 35.5) / 0.5) * 100;

      pin.className = `absolute transform -translate-x-1/2 -translate-y-1/2 animate-pulse`;
      pin.style.left = `${Math.min(Math.max(left, 5), 95)}%`;
      pin.style.top = `${Math.min(Math.max(top, 10), 90)}%`;

      // Create pin element
      const pinInner = document.createElement("div");
      pinInner.className = `h-5 w-5 bg-primary-500 rounded-full flex items-center justify-center
                            border-2 border-white shadow-md
                            ${
                              selectedPlaceId === place.id
                                ? "ring-4 ring-primary-300 scale-125"
                                : ""
                            }`;

      // Add a tooltip with place name
      const tooltip = document.createElement("div");
      tooltip.className =
        "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-neutral-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10";
      tooltip.textContent = place.name;

      // Wrap pin and tooltip
      const wrapper = document.createElement("div");
      wrapper.className = "group cursor-pointer";
      wrapper.onclick = () => onPlaceSelect(place);

      wrapper.appendChild(pinInner);
      wrapper.appendChild(tooltip);
      pin.appendChild(wrapper);
      mapContainer.appendChild(pin);
    });

    mapElement.appendChild(mapContainer);

    // Add a notice that this is a mock implementation
    const notice = document.createElement("div");
    notice.className =
      "absolute bottom-2 right-2 bg-white bg-opacity-75 text-xs text-neutral-600 px-2 py-1 rounded";
    notice.textContent = "サンプルマップ表示 (実装時はGoogle Maps APIを使用)";
    mapContainer.appendChild(notice);
  }, [places, selectedPlaceId, onPlaceSelect]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full min-h-[300px] rounded-lg bg-neutral-100"
    ></div>
  );
};

export default MapView;
