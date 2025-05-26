"use client";

import { Button } from "@/components/ui/button";
import { Place } from "@/types";
import { Check, Circle, MapPin, Tag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

interface PlaceCardProps {
  place: Place;
  onClick?: (place: Place) => void;
  listId?: string;
  isSample?: boolean;
  onClose?: () => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  onClick,
  listId,
  isSample,
  onClose,
}) => {
  const router = useRouter();
  const visitStatusElement =
    place.visited === "visited" ? (
      <div className="flex items-center text-xs text-primary-700">
        <Check className="h-5 w-5 mr-1 text-primary-500" />
        訪問済み
      </div>
    ) : (
      <div className="flex items-center text-xs text-neutral-600">
        <Circle className="h-5 w-5 mr-1 text-neutral-400" />
        未訪問
      </div>
    );

  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!listId) return;
    const url = isSample
      ? `/sample/${listId}/place/${place.id}`
      : `/lists/${listId}/place/${place.id}`;
    router.push(url);
  };

  return (
    <>
      <div
        className="sm:min-w-[300px] bg-white rounded-lg shadow-sm overflow-hidden border border-neutral-100 hover:shadow-md transition-shadow duration-300 flex flex-col justify-between"
        onClick={() => onClick?.(place)}
      >
        <div className="p-3 sm:p-4 flex flex-col min-h-[160px]">
          <div className="relative flex items-start justify-between mb-1">
            <h3 className="sm:text-lg font-medium text-neutral-800 line-clamp-1 pr-8">
              {place.name}
            </h3>
            {onClose && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="absolute right-0 top-0 p-1 rounded-full hover:bg-neutral-100 focus:outline-none"
                aria-label="閉じる"
                tabIndex={0}
              >
                <X className="h-5 w-5 text-neutral-400" strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="flex items-center mb-3 gap-1">
            <MapPin className="h-4 w-4 text-neutral-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-neutral-600 line-clamp-1">
              {place.address}
            </span>
          </div>
          {place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {place.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          {visitStatusElement}
          <div className="flex-grow" />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDetailClick}
              tabIndex={0}
              aria-label="詳細を見る"
            >
              詳細を見る
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlaceCard;
