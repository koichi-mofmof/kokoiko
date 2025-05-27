"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Collaborator } from "@/lib/dal/lists";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

interface ParticipantAvatarsProps {
  owner: Collaborator;
  participants: Collaborator[];
  maxDisplay?: number;
}

const getInitials = (name: string): string => {
  const names = name.trim().split(" ");
  if (names.length === 0 || names[0] === "") {
    return "?";
  }
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (
    (names[0].charAt(0) ?? "") + (names[names.length - 1].charAt(0) ?? "")
  ).toUpperCase();
};

export function ParticipantAvatars({
  owner,
  participants,
  maxDisplay = 10,
}: ParticipantAvatarsProps) {
  const otherParticipants = participants.filter((p) => p.id !== owner.id);
  const displayMembers = otherParticipants.slice(0, maxDisplay - 1);
  const remainingCount = Math.max(
    0,
    otherParticipants.length - (maxDisplay - 1)
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center flex-wrap gap-2">
        <Tooltip key={owner.id}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 bg-white rounded-full pl-2 pr-0.5 py-0.5 text-xs border border-neutral-200 shadow-sm cursor-default">
              <span className="text-primary-700 font-medium">作成者</span>
              <Avatar className="h-5 w-5">
                <AvatarImage src={owner.avatarUrl} alt={owner.name} />
                <AvatarFallback className="text-[10px]">
                  {getInitials(owner.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="center"
            className="z-[100] rounded-md bg-black text-white border-0 px-3 py-1.5 text-xs font-medium shadow-md"
          >
            <p>{owner.name}</p>
          </TooltipContent>
        </Tooltip>

        {(displayMembers.length > 0 || remainingCount > 0) && (
          <div className="flex items-center gap-1 bg-white rounded-full pl-2 pr-0.5 py-0.5 text-xs border border-neutral-200 shadow-sm cursor-default">
            <span className="text-neutral-700 mr-1">共同編集者</span>
            <div className="flex -space-x-1">
              {displayMembers.map((member) => (
                <Tooltip key={member.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-5 w-5 border border-white">
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="center"
                    className="z-[100] rounded-md bg-black text-white border-0 px-3 py-1.5 text-xs font-medium shadow-md"
                  >
                    <p>{member.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {remainingCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-5 w-5 border border-white">
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
                    <p>他{remainingCount}人</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
