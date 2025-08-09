"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/use-i18n";
import { Place } from "@/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  ChevronRight,
  Circle,
  GripVertical,
  MapPin,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

interface SortablePlaceItemProps {
  place: Place;
  displayOrder: number;
  listId: string;
  selectedPlaceId?: string;
  isSample?: boolean;
  isDragDisabled?: boolean;
}

export function SortablePlaceItem({
  place,
  displayOrder,
  listId,
  selectedPlaceId,
  isSample,
  isDragDisabled = false,
}: SortablePlaceItemProps) {
  const router = useRouter();
  const { t } = useI18n();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: place.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleNavigate = () => {
    if (isSample) {
      router.push(`/sample/${listId}/place/${place.id}`);
    } else {
      router.push(`/lists/${listId}/place/${place.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNavigate();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-opacity ${
        isDragging ? "opacity-50" : "opacity-100"
      } flex items-center gap-1`}
    >
      {/* ドラッグハンドル（Card外に配置） */}
      {!isDragDisabled && (
        <div
          data-testid="drag-handle"
          className="flex-shrink-0 pr-2 py-4 cursor-grab active:cursor-grabbing flex items-center text-neutral-400 hover:text-neutral-600 touch-none"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()} // クリックイベント伝播防止
        >
          <GripVertical className="h-5 w-5" />
        </div>
      )}

      <Card
        role="button"
        tabIndex={0}
        aria-label={t("place.viewDetails", { name: place.name })}
        className={`cursor-pointer flex items-center group focus:outline-none focus:ring-2 focus:ring-primary-400 active:scale-[0.98] select-none transition-all flex-1 ${
          selectedPlaceId === place.id
            ? "border-primary-300 bg-primary-50"
            : "hover:bg-primary-50 active:bg-primary-100"
        } ${isDragging ? "shadow-lg" : ""}`}
        onClick={handleNavigate}
        onKeyDown={handleKeyDown}
      >
        {/* 表示順序番号（サンプルリストでは非表示） */}
        {!isSample && displayOrder > 0 && (
          <div className="flex-shrink-0 pl-2">
            <div className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              {displayOrder}
            </div>
          </div>
        )}

        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center flex-1 min-w-0">
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base sm:text-lg font-medium text-neutral-800 line-clamp-1 flex-1">
                {place.name}
              </CardTitle>
              {place.createdByUser && (
                <div
                  title={t("place.addedBy", { name: place.createdByUser.name })}
                  className="flex-shrink-0"
                >
                  <Avatar className="h-6 w-6">
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
            </div>
            <div className="flex items-center text-xs sm:text-sm text-neutral-500">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">{place.address}</span>
            </div>
            {place.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {place.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center">
              {place.visited === "visited" ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-primary-500" />
                  <span className="text-xs text-primary-700">
                    {t("place.status.visited")}
                  </span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 mr-1 text-neutral-400" />
                  <span className="text-xs text-neutral-600">
                    {t("place.status.notVisited")}
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>
        <ChevronRight className="h-6 w-6 mr-3 text-neutral-400 group-hover:text-primary-500 group-active:text-primary-600 transition-colors ml-2 flex-shrink-0 self-center" />
      </Card>
    </div>
  );
}
