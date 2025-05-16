"use client";

import { Place } from "@/types";
import { CheckCircle, Circle, ExternalLink, MapPin, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface PlaceCardProps {
  place: Place;
  onClick?: (place: Place) => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onClick }) => {
  const visitStatusElement = place.visited ? (
    <div className="flex items-center text-xs text-primary-700">
      <CheckCircle className="h-5 w-5 mr-1 text-primary-500" />
      訪問済み
    </div>
  ) : (
    <div className="flex items-center text-xs text-neutral-600">
      <Circle className="h-5 w-5 mr-1 text-neutral-400" />
      未訪問
    </div>
  );

  return (
    <>
      <div
        className="bg-white rounded-lg shadow-sm overflow-hidden border border-neutral-100 hover:shadow-md transition-shadow duration-300"
        onClick={() => onClick?.(place)}
      >
        {place.imageUrl && (
          <div className="h-32 sm:h-40 overflow-hidden relative">
            <Image
              src={place.imageUrl}
              alt={place.name}
              fill
              style={{ objectFit: "cover" }}
              className="hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-base sm:text-lg font-medium text-neutral-800 line-clamp-1">
              {place.name}
            </h3>
          </div>

          <div className="flex items-start mb-3">
            <MapPin className="h-4 w-4 text-neutral-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-neutral-600 ml-1 line-clamp-1">
              {place.address}
            </p>
          </div>

          {place.user_comment && (
            <div
              className={`mt-2 pl-3 py-2 border-l-4 border-primary-300 bg-neutral-50 dark:bg-neutral-800/60 rounded-r-md`}
            >
              <p className="text-xs text-neutral-600 line-clamp-2">
                &quot;{place.user_comment}&quot;
              </p>
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-1 mb-3">
            {place.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>

          <div className="mb-3">{visitStatusElement}</div>

          <Link
            href={place.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Google マップで開く
          </Link>
        </div>
      </div>
    </>
  );
};

export default PlaceCard;
