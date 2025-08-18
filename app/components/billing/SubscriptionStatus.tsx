"use client";

import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriptionStatusProps {
  label: string;
  currentValue: number;
  maxValue: number | null;
  loading?: boolean;
}

export function SubscriptionStatus({
  label,
  currentValue,
  maxValue,
  loading,
}: SubscriptionStatusProps) {
  if (loading) {
    return (
      <div className="space-y-1 w-full">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>
    );
  }

  const isUnlimited = maxValue === null || maxValue === Infinity;
  const progressValue =
    !isUnlimited && maxValue > 0 ? (currentValue / maxValue) * 100 : 0;
  const displayMaxValue = isUnlimited ? "∞" : maxValue;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <p className="text-xs font-medium text-neutral-600 truncate pr-2">
          {label}
        </p>
        <p className="text-xs text-neutral-500 flex-shrink-0">
          {`${currentValue} / ${displayMaxValue}`}
        </p>
      </div>
      <Progress
        value={isUnlimited ? 100 : progressValue}
        className={`h-1.5 ${isUnlimited ? "opacity-50" : ""}`}
      />
    </div>
  );
}
