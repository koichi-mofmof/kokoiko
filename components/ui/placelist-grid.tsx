"use client";

import { ListCardActions } from "@/app/components/lists/ListCardActions";
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
import { LockKeyhole, LockKeyholeOpen } from "lucide-react";
import Link from "next/link";

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

const MAX_AVATARS_DISPLAYED = 5;

export function renderLabeledCollaborators<T extends ListDisplayItem>(
  list: T,
  displayedCollaborators: User[],
  remainingCount: number
) {
  const owners = displayedCollaborators.filter((user) => user.isOwner);
  const members = displayedCollaborators.filter(
    (user) => !user.isOwner && user.permission === "edit"
  );
  const viewers = displayedCollaborators.filter(
    (user) => !user.isOwner && user.permission === "view"
  );

  return (
    <div className="flex items-center">
      {displayedCollaborators && displayedCollaborators.length > 0 ? (
        <div className="flex flex-wrap gap-2 mr-2">
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
          {members.length > 0 && (
            <div className="flex items-center gap-1 bg-white rounded-full pl-2 pr-0.5 py-0.5 text-xs border border-neutral-200 shadow-sm">
              <span className="text-neutral-700 mr-1">共同編集者</span>
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
          {viewers.length > 0 && (
            <div className="flex items-center gap-1 bg-white rounded-full pl-2 pr-0.5 py-0.5 text-xs border border-neutral-200 shadow-sm">
              <span className="text-neutral-700 mr-1">閲覧者</span>
              <div className="flex -space-x-1">
                {viewers.map((viewer) => (
                  <Tooltip key={viewer.id}>
                    <TooltipTrigger asChild>
                      <Avatar className="h-5 w-5 border border-white">
                        <AvatarImage
                          src={viewer.avatarUrl || undefined}
                          alt={viewer.name || "User"}
                        />
                        <AvatarFallback className="text-[10px]">
                          {viewer.name
                            ? viewer.name.slice(0, 1).toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="center"
                      className="z-[100] rounded-md bg-black text-white border-0 px-3 py-1.5 text-xs font-medium shadow-md"
                    >
                      {viewer.name}
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
              const displayedCollaborators = list.collaborators
                ? [...(list.collaborators || [])]
                    .sort((a, b) => {
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
                  <Card className="overflow-hidden h-full flex flex-col transition-all duration-200 ease-in-out group-hover:shadow-lg group-hover:-translate-y-1 relative">
                    <div className="absolute top-2 right-2 z-10">
                      <ListCardActions
                        list={list as unknown as MyListForClient}
                      />
                    </div>
                    <CardContent className="p-4 flex flex-col flex-grow">
                      <div className="mb-3">
                        <CardTitle
                          className="text-lg font-semibold text-neutral-900 mb-1 line-clamp-2 group-hover:text-primary-700 flex items-center gap-2"
                          data-testid="list-name"
                        >
                          {list.name}
                          {typeof list.is_public === "boolean" ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  aria-label={
                                    list.is_public
                                      ? "公開リスト"
                                      : "非公開リスト"
                                  }
                                >
                                  {list.is_public ? (
                                    <LockKeyholeOpen className="h-4 w-4 text-primary-500" />
                                  ) : (
                                    <LockKeyhole className="h-4 w-4 text-neutral-400" />
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" align="center">
                                {list.is_public ? "公開リスト" : "非公開リスト"}
                              </TooltipContent>
                            </Tooltip>
                          ) : null}
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
