import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { User } from "@/types";

interface ParticipantAvatarsProps {
  participants: User[];
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
  participants,
  maxDisplay = 4,
}: ParticipantAvatarsProps) {
  const displayParticipants = participants.slice(0, maxDisplay);
  const remainingCount = Math.max(0, participants.length - maxDisplay);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center -space-x-2 rtl:space-x-reverse ml-2">
        {" "}
        {/* 左マージンを追加 */}
        {displayParticipants.map((participant) => (
          <Tooltip key={participant.id}>
            <TooltipTrigger asChild>
              {/* biome-ignore lint/a11y/useAltText: Decorative image */}
              <Avatar className="h-8 w-8 border-2 border-background cursor-default">
                <AvatarImage src={participant.avatarUrl} />
                <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{participant.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8 border-2 border-background cursor-default">
                <AvatarFallback>+{remainingCount}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>他{remainingCount}人の参加者</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
