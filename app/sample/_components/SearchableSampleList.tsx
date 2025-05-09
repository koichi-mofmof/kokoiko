"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PlaceListGroup } from "@/lib/mockData";
import type { Place, User } from "@/types";
import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type SampleListForClient = Omit<PlaceListGroup, "sharedUserIds" | "places"> & {
  collaborators?: User[];
  places: Place[];
  place_count?: number;
};

type SearchableSampleListProps = {
  initialSampleLists: SampleListForClient[];
};

const MAX_AVATARS_DISPLAYED = 3;

export function SearchableSampleList({
  initialSampleLists,
}: SearchableSampleListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSampleLists = useMemo(() => {
    if (!searchQuery) {
      return initialSampleLists;
    }
    return initialSampleLists.filter((list) =>
      list.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [initialSampleLists, searchQuery]);

  return (
    <TooltipProvider>
      <div>
        <div className="mb-4">
          <Input
            type="text"
            placeholder="リスト名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        {filteredSampleLists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSampleLists.map((list) => {
              const placeImages = list.places
                .filter((place) => place.imageUrl)
                .slice(0, 4)
                .map((place) => place.imageUrl as string);

              const displayedCollaborators = list.collaborators?.slice(
                0,
                MAX_AVATARS_DISPLAYED
              );
              const remainingCollaboratorsCount = list.collaborators
                ? list.collaborators.length - MAX_AVATARS_DISPLAYED
                : 0;

              return (
                <Link
                  key={list.id}
                  href={`/sample/${list.id}`}
                  className="block group"
                >
                  <Card className="overflow-hidden h-full flex flex-col transition-all duration-200 ease-in-out group-hover:shadow-lg group-hover:-translate-y-1">
                    <div className="relative w-full h-40 bg-neutral-200 overflow-hidden">
                      {placeImages.length > 0 ? (
                        <div
                          className={`grid w-full h-full ${
                            placeImages.length === 1
                              ? "grid-cols-1 grid-rows-1"
                              : placeImages.length === 2
                              ? "grid-cols-2 grid-rows-1"
                              : placeImages.length === 3
                              ? "grid-cols-2 grid-rows-2"
                              : "grid-cols-2 grid-rows-2"
                          }`}
                        >
                          {placeImages.map((imgUrl, index) => (
                            <div
                              key={index}
                              className={`relative
                                ${
                                  placeImages.length === 1
                                    ? "col-span-1 row-span-1"
                                    : ""
                                }
                                ${
                                  placeImages.length === 2
                                    ? "col-span-1 row-span-1"
                                    : ""
                                }
                                ${
                                  placeImages.length === 3 && index === 0
                                    ? "col-span-2 row-span-1"
                                    : ""
                                }
                                ${
                                  placeImages.length === 3 && index !== 0
                                    ? "col-span-1 row-span-1"
                                    : ""
                                }
                                ${
                                  placeImages.length === 4
                                    ? "col-span-1 row-span-1"
                                    : ""
                                }
                              `}
                            >
                              {imgUrl && (
                                <Image
                                  src={imgUrl}
                                  alt={`${list.name} Spot Image ${index + 1}`}
                                  fill
                                  style={{ objectFit: "cover" }}
                                  className="transition-transform duration-300 ease-in-out group-hover:scale-105"
                                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
                                />
                              )}
                            </div>
                          ))}
                          {placeImages.length === 3 && (
                            <div className="col-span-1 row-span-1 bg-neutral-200"></div>
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-300">
                          <ImageIcon className="h-12 w-12 text-neutral-400" />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 flex flex-col flex-grow">
                      <div className="mb-3">
                        <CardTitle className="text-lg font-semibold text-neutral-900 mb-1 line-clamp-2 group-hover:text-primary-700">
                          {list.name}
                        </CardTitle>
                        {list.description && (
                          <CardDescription className="text-sm text-neutral-600 line-clamp-2">
                            {list.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex-grow"></div>
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-100">
                        <div className="flex items-center">
                          {displayedCollaborators &&
                          displayedCollaborators.length > 0 ? (
                            <div className="flex -space-x-2 overflow-hidden mr-2">
                              {displayedCollaborators.map((collaborator) => (
                                <Tooltip key={collaborator.id}>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-6 w-6 border-2 border-white">
                                      <AvatarImage
                                        src={
                                          collaborator.avatarUrl || undefined
                                        }
                                        alt={collaborator.name || "User"}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {collaborator.name
                                          ? collaborator.name
                                              .slice(0, 1)
                                              .toUpperCase()
                                          : "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{collaborator.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                              {remainingCollaboratorsCount > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-6 w-6 border-2 border-white">
                                      <AvatarFallback className="text-xs bg-neutral-200 text-neutral-600">
                                        +{remainingCollaboratorsCount}
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>他 {remainingCollaboratorsCount} 人</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          ) : (
                            <div className="h-6"></div>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="px-2.5 py-0.5 text-xs leading-5 font-semibold rounded-full bg-neutral-100 text-neutral-700"
                        >
                          {`${list.place_count ?? list.places.length}件`}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            該当するリストは見つかりませんでした。
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}
