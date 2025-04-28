"use client";

import React from "react";
import { Place } from "@/types";
import { MapPin, ExternalLink, Calendar, Check, Circle } from "lucide-react";
import Link from "next/link";

interface PlaceListProps {
  places: Place[];
  onPlaceSelect: (place: Place) => void;
  selectedPlaceId?: string;
}

const PlaceList: React.FC<PlaceListProps> = ({
  places,
  onPlaceSelect,
  selectedPlaceId,
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-2">
      {places.length === 0 ? (
        <div className="p-4 text-center text-neutral-500">
          登録された場所がありません
        </div>
      ) : (
        places.map((place) => (
          <div
            key={place.id}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedPlaceId === place.id
                ? "border-primary-300 bg-primary-50"
                : "border-neutral-200 bg-white hover:bg-neutral-50"
            }`}
            onClick={() => onPlaceSelect(place)}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                {place.visited ? (
                  <Check className="h-5 w-5 text-primary-500" />
                ) : (
                  <Circle className="h-5 w-5 text-neutral-300" />
                )}
              </div>

              <div className="ml-3 flex-grow">
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium text-neutral-800">
                    {place.name}
                  </h3>
                  {place.visitPlanned && (
                    <span className="text-xs text-neutral-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(place.visitPlanned)}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center text-xs text-neutral-500">
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{place.address}</span>
                </div>

                {place.notes && (
                  <p className="mt-1 text-xs text-neutral-600 line-clamp-1">
                    {place.notes}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap gap-1">
                  {place.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2 py-0.5 text-xs bg-neutral-100 text-neutral-600 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-2">
                  <Link
                    href={place.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    マップで開く
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PlaceList;
