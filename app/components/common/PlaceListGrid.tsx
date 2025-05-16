"use client";

import { ListCardActions } from "@/app/lists/_components/ListCardActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MyListForClient } from "@/lib/dal/lists";
import type { Place, User } from "@/types";
import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/**
 * リスト表示用の共通型定義
 */
export type ListDisplayItem = {
  id: string;
  name: string;
  description?: string | null;
  places: Place[];
  place_count?: number;
  collaborators?: User[];
  permission?: string;
  is_public?: boolean;
  created_by?: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PlaceListGridProps<T extends ListDisplayItem> = {
  initialLists: T[];
  getLinkHref: (list: T) => string;
  renderCollaborators?: (
    list: T,
    displayedCollaborators: User[],
    remainingCount: number
  ) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
};

const MAX_AVATARS_DISPLAYED = 5; // 表示するアバターの最大数

/**
 * 作成者・参加者ラベル付きアバター表示
 */
export function renderLabeledCollaborators<T extends ListDisplayItem>(
  list: T,
  displayedCollaborators: User[],
  remainingCount: number
) {
  // 作成者と参加者を分離
  const owners = displayedCollaborators.filter((user) => user.isOwner);
  const members = displayedCollaborators.filter((user) => !user.isOwner);

  return (
    <div className="flex items-center">
      {displayedCollaborators && displayedCollaborators.length > 0 ? (
        <div className="flex flex-wrap gap-2 mr-2">
          {/* 作成者の表示 - 従来通り個別に表示 */}
          {owners.map((owner) => (
            <Tooltip key={owner.id}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 bg-white rounded-full pl-2 pr-0.5 py-0.5 text-xs border border-neutral-200 shadow-sm">
                  <span className="text-primary-700 font-medium">作成者</span>
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={owner.avatarUrl || undefined}
                      alt={owner.name || "User"}
                    />
                    <AvatarFallback className="text-[10px]">
                      {owner.name ? owner.name.slice(0, 1).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="center"
                className="z-[100] rounded-md bg-black text-white border-0 px-3 py-1.5 text-xs font-medium shadow-md"
              >
                {owner.name}
              </TooltipContent>
            </Tooltip>
          ))}

          {/* 参加者の表示 - グループ化して表示 */}
          {members.length > 0 && (
            <div className="flex items-center gap-1 bg-white rounded-full pl-2 pr-0.5 py-0.5 text-xs border border-neutral-200 shadow-sm">
              <span className="text-neutral-700 mr-1">参加者</span>
              <div className="flex -space-x-1">
                {members.map((member) => (
                  <Tooltip key={member.id}>
                    <TooltipTrigger asChild>
                      <Avatar className="h-5 w-5 border border-white">
                        <AvatarImage
                          src={member.avatarUrl || undefined}
                          alt={member.name || "User"}
                        />
                        <AvatarFallback className="text-[10px]">
                          {member.name
                            ? member.name.slice(0, 1).toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="center"
                      className="z-[100] rounded-md bg-black text-white border-0 px-3 py-1.5 text-xs font-medium shadow-md"
                    >
                      {member.name}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 bg-white rounded-full px-2 py-0.5 text-xs border border-neutral-200 shadow-sm">
                  <span className="text-neutral-700">
                    他 {remainingCount} 人
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="center"
                className="z-[100] rounded-md bg-black text-white border-0 px-3 py-1.5 text-xs font-medium shadow-md"
              >
                他のメンバー {remainingCount} 人
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      ) : (
        <div className="h-6"></div>
      )}
    </div>
  );
}

/**
 * オーバーラップスタイルのアバター表示
 */
export function renderOverlappingCollaborators<T extends ListDisplayItem>(
  list: T,
  displayedCollaborators: User[],
  remainingCount: number
) {
  return (
    <div className="flex items-center">
      {displayedCollaborators && displayedCollaborators.length > 0 ? (
        <div className="flex -space-x-2 overflow-hidden mr-2">
          {displayedCollaborators.map((collaborator) => (
            <Tooltip key={collaborator.id}>
              <TooltipTrigger asChild>
                <Avatar className="h-6 w-6 border-2 border-white">
                  <AvatarImage
                    src={collaborator.avatarUrl || undefined}
                    alt={collaborator.name || "User"}
                  />
                  <AvatarFallback className="text-xs">
                    {collaborator.name
                      ? collaborator.name.slice(0, 1).toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="center"
                className="z-[100] rounded-md bg-black text-white border-0 px-3 py-1.5 text-xs font-medium shadow-md"
              >
                {collaborator.name}
              </TooltipContent>
            </Tooltip>
          ))}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-6 w-6 border-2 border-white">
                  <AvatarFallback className="text-xs bg-neutral-200 text-neutral-600">
                    +{remainingCount}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="center"
                className="z-[100] rounded-md bg-black text-white border-0 px-3 py-1.5 text-xs font-medium shadow-md"
              >
                他 {remainingCount} 人
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      ) : (
        <div className="h-6"></div>
      )}
    </div>
  );
}

/**
 * 場所リスト表示用の共通グリッドコンポーネント
 */
export function PlaceListGrid<T extends ListDisplayItem>({
  initialLists,
  getLinkHref,
  renderCollaborators = renderLabeledCollaborators,
  emptyMessage = "リストは見つかりませんでした。",
  className = "",
}: PlaceListGridProps<T>) {
  const displayLists = initialLists;

  return (
    <TooltipProvider>
      <div className={className}>
        {displayLists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayLists.map((list) => {
              const placeImages = list.places
                .filter((place) => place.imageUrl)
                .slice(0, 4)
                .map((place) => place.imageUrl as string);

              // コラボレーター情報を表示するためのデータ準備
              const displayedCollaborators = list.collaborators
                ? [...(list.collaborators || [])]
                    .sort((a, b) => {
                      // 作成者を先頭に持ってくる
                      if (a.isOwner && !b.isOwner) return -1;
                      if (!a.isOwner && b.isOwner) return 1;
                      return 0;
                    })
                    .slice(0, MAX_AVATARS_DISPLAYED)
                : [];

              const remainingCollaboratorsCount = list.collaborators
                ? list.collaborators.length - MAX_AVATARS_DISPLAYED
                : 0;

              return (
                <Link
                  key={list.id}
                  href={getLinkHref(list)}
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
                                  placeImages.length >= 4
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
                          {placeImages.length === 3 && ( // 3枚の時に右下を空ける場合
                            <div className="col-span-1 row-span-1 bg-neutral-200"></div>
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-300">
                          <ImageIcon className="h-12 w-12 text-neutral-400" />
                        </div>
                      )}

                      {/* ListCardActionsの追加 - 常に表示し、内部で活性/非活性を制御 */}
                      <ListCardActions
                        list={list as unknown as MyListForClient}
                      />
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
                        {renderCollaborators(
                          list,
                          displayedCollaborators,
                          remainingCollaboratorsCount
                        )}
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
          <p className="text-center text-muted-foreground">{emptyMessage}</p>
        )}
      </div>
    </TooltipProvider>
  );
}
