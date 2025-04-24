"use client";

import React, { useState } from "react";
import { Place } from "@/types";
import {
  Calendar,
  MapPin,
  Tag,
  ExternalLink,
  CheckCircle,
  Circle,
  Share2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ShareModal from "../share/ShareModal";

interface PlaceCardProps {
  place: Place;
  onClick?: (place: Place) => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onClick }) => {
  const [showShareModal, setShowShareModal] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <>
      <div
        className="bg-white rounded-lg shadow-sm overflow-hidden border border-neutral-100 hover:shadow-md transition-shadow duration-300"
        onClick={() => onClick?.(place)}
      >
        {place.imageUrl && (
          <div className="h-40 overflow-hidden relative">
            <Image
              src={place.imageUrl}
              alt={place.name}
              fill
              style={{ objectFit: "cover" }}
              className="hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-medium text-neutral-800 line-clamp-1">
              {place.name}
            </h3>
            <div className="ml-2 flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShareModal(true);
                }}
                className="p-1 text-neutral-400 hover:text-primary-500 transition-colors"
              >
                <Share2 className="h-4 w-4" />
              </button>
              {place.visited ? (
                <CheckCircle className="h-5 w-5 text-primary-500" />
              ) : (
                <Circle className="h-5 w-5 text-neutral-300" />
              )}
            </div>
          </div>

          <div className="flex items-start mb-3">
            <MapPin className="h-4 w-4 text-neutral-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-neutral-600 ml-1 line-clamp-1">
              {place.address}
            </p>
          </div>

          {place.visitPlanned && (
            <div className="flex items-center mb-3">
              <Calendar className="h-4 w-4 text-neutral-500 flex-shrink-0" />
              <p className="text-sm text-neutral-600 ml-1">
                {formatDate(place.visitPlanned)}
              </p>
            </div>
          )}

          {place.notes && (
            <p className="text-sm text-neutral-700 mb-3 line-clamp-2">
              {place.notes}
            </p>
          )}

          <div className="flex flex-wrap gap-1 mb-3">
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

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        placeId={place.id}
        placeName={place.name}
      />
    </>
  );
};

export default PlaceCard;
