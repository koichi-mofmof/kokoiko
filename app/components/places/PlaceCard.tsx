"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
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
  const { t } = useI18n();
  const visitStatusElement =
    place.visited === "visited" ? (
      <div className="flex items-center text-xs text-primary-700">
        <Check className="h-5 w-5 mr-1 text-primary-500" />
        {t("place.status.visited")}
      </div>
    ) : (
      <div className="flex items-center text-xs text-neutral-600">
        <Circle className="h-5 w-5 mr-1 text-neutral-400" />
        {t("place.status.notVisited")}
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
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className="sm:text-lg font-medium text-neutral-800 line-clamp-1 flex-1">
                {place.name}
              </h3>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="ml-2 p-1 rounded-full hover:bg-neutral-100 focus:outline-none flex-shrink-0"
                aria-label={t("common.close")}
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
          <div className="inline-flex justify-between mt-3">
            {place.createdByUser && (
              <div
                title={`${place.createdByUser.name}さんが追加`}
                className="flex items-center gap-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={place.createdByUser.avatarUrl}
                    alt={place.createdByUser.name}
                  />
                  <AvatarFallback className="text-xs bg-primary-100 text-primary-700">
                    {place.createdByUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDetailClick}
                tabIndex={0}
                aria-label={t("place.viewDetails", { name: place.name })}
              >
                {t("place.detail.view")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlaceCard;
