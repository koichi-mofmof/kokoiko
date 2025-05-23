"use client";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Place } from "@/types";
import { Check, ChevronRight, Circle, MapPin, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

interface PlaceListProps {
  places: Place[];
  listId: string;
  selectedPlaceId?: string;
  isSample?: boolean;
}
const PlaceList: React.FC<PlaceListProps> = ({
  places,
  listId,
  selectedPlaceId,
  isSample,
}) => {
  const router = useRouter();
  return (
    <div className="space-y-2">
      {places.length === 0 ? (
        <div className="p-4 text-center text-neutral-500">
          登録された場所がありません
        </div>
      ) : (
        places.map((place) => (
          <Card
            key={place.id}
            role="button"
            tabIndex={0}
            aria-label={`${place.name}の詳細を見る`}
            className={`cursor-pointer flex items-center group focus:outline-none focus:ring-2 focus:ring-primary-400 active:scale-[0.98] select-none transition-all ${
              selectedPlaceId === place.id
                ? "border-primary-300 bg-primary-50"
                : "hover:bg-primary-50 active:bg-primary-100"
            }`}
            onClick={() => {
              if (isSample) {
                router.push(`/sample/${listId}/place/${place.id}`);
              } else {
                router.push(`/lists/${listId}/place/${place.id}`);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                if (isSample) {
                  router.push(`/sample/${listId}/place/${place.id}`);
                } else {
                  router.push(`/lists/${listId}/place/${place.id}`);
                }
              }
            }}
          >
            <CardContent className="flex-1 py-4 overflow-hidden">
              <div className="flex items-start">
                <div className="ml-3 flex-grow min-w-0">
                  <div className="flex justify-between">
                    <CardTitle className="text-sm font-medium text-neutral-800">
                      {place.name}
                    </CardTitle>
                  </div>
                  <div className="mt-1 flex items-center text-xs text-neutral-500 w-full gap-2 overflow-hidden">
                    <span className="flex items-center min-w-0 flex-1 overflow-hidden">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate min-w-0 text-xs sm:text-sm text-neutral-600">
                        {place.address}
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {place.tags.map((tagObj, index) => (
                      <span
                        key={tagObj.id || `tag-${index}`}
                        className="mt-2 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                      >
                        <Tag className="h-3 w-3 mr-1 opacity-80" />
                        {tagObj.name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center">
                    {place.visited === "visited" ? (
                      <>
                        <Check className="h-4 w-4 mr-1 text-primary-500" />
                        <span className="text-xs text-primary-700">
                          訪問済み
                        </span>
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4 mr-1 text-neutral-400" />
                        <span className="text-xs text-neutral-600">未訪問</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <ChevronRight className="h-6 w-6 mr-3 text-neutral-400 group-hover:text-primary-500 group-active:text-primary-600 transition-colors ml-2 flex-shrink-0 self-center" />
          </Card>
        ))
      )}
    </div>
  );
};

export default PlaceList;
