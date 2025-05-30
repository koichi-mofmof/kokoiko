"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Place, RankedPlace } from "@/types";
import { ArrowRight, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

interface RankingCardProps {
  rankedPlace: RankedPlace;
  place: Place;
  listId?: string;
  isSample?: boolean;
}

// TOP3のスタイル定義をさらに強化
const rankStyles = [
  {
    textColor: "text-amber-500",
    textSize: "text-xl",
    bgGradient: "bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600",
    lightGradient: "bg-gradient-to-br from-yellow-100 via-amber-50 to-white",
    shadowColor: "shadow-amber-300/40",
    borderColor: "border-amber-400",
    glowColor: "from-amber-300/30",
  },
  {
    textColor: "text-slate-600",
    textSize: "text-xl",
    bgGradient: "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600",
    lightGradient: "bg-gradient-to-br from-slate-100 via-slate-50 to-white",
    shadowColor: "shadow-slate-300/40",
    borderColor: "border-slate-400",
    glowColor: "from-slate-300/30",
  },
  {
    textColor: "text-orange-600",
    textSize: "text-xl",
    bgGradient:
      "bg-gradient-to-br from-orange-300 via-orange-400 to-orange-600",
    lightGradient: "bg-gradient-to-br from-orange-100 via-orange-50 to-white",
    shadowColor: "shadow-orange-300/40",
    borderColor: "border-orange-400",
    glowColor: "from-orange-300/30",
  },
];

export default function RankingCard({
  rankedPlace,
  place,
  listId,
  isSample,
}: RankingCardProps) {
  const router = useRouter();
  const isTopThree = rankedPlace.rank <= 3;
  const rankIdx = rankedPlace.rank - 1;

  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!listId) return;
    const url = isSample
      ? `/sample/${listId}/place/${place.id}`
      : `/lists/${listId}/place/${place.id}`;
    router.push(url);
  };

  return (
    <Card
      role="article"
      className={`relative group flex flex-col overflow-hidden rounded-2xl transition-all duration-300 ease-in-out 
      ${
        isTopThree
          ? `${rankStyles[rankIdx].lightGradient} ring-1 ${rankStyles[rankIdx].borderColor} ${rankStyles[rankIdx].shadowColor}`
          : "bg-white dark:bg-neutral-900 hover:bg-gradient-to-b hover:from-gray-50 hover:to-white dark:hover:from-neutral-800 dark:hover:to-neutral-900"
      }
      hover:shadow-xl hover:-translate-y-1 text-card-foreground
      ${
        isTopThree
          ? `shadow-lg ${rankStyles[rankIdx].shadowColor}`
          : "shadow-md"
      }`}
      tabIndex={0}
      aria-label={`${rankedPlace.rank}位: ${place.name}`}
    >
      {/* --- 高級感のある装飾エフェクト --- */}
      {isTopThree && (
        <>
          <div
            className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-20 blur-3xl ${rankStyles[rankIdx].bgGradient}`}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 dark:to-black/5 z-0"
            aria-hidden="true"
          />
        </>
      )}

      {/* --- ランキング表示（さらに洗練） --- */}
      <div className="absolute top-4 left-4 flex items-center z-10">
        {isTopThree ? (
          <div
            className={`flex items-center justify-center w-14 h-14 rounded-full 
          ${rankStyles[rankIdx].bgGradient} shadow-lg ${rankStyles[rankIdx].shadowColor}
          before:content-[''] before:absolute before:inset-0 before:rounded-full before:bg-white/20 before:z-0`}
          >
            <span className="relative text-white text-2xl font-black drop-shadow-md">
              {rankedPlace.rank}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-600 dark:bg-neutral-800">
            <span className="text-lg font-medium text-neutral-50 dark:text-gray-400">
              {rankedPlace.rank}
            </span>
          </div>
        )}
      </div>

      <CardContent
        className={`relative flex flex-1 flex-col p-6 pt-16 z-10 ${
          isTopThree ? "pt-20" : ""
        }`}
      >
        {/* --- 場所名 --- */}
        <h3
          className={`mb-2 font-semibold leading-tight truncate 
          ${
            isTopThree
              ? `${rankStyles[rankIdx].textColor} ${rankStyles[rankIdx].textSize}`
              : "text-neutral-600 text-base"
          }`}
          title={place.name}
        >
          {place.name}
        </h3>

        {/* --- 住所 --- */}
        {place.address && (
          <div
            className={`flex items-center ${
              isTopThree ? "text-sm" : "text-neutral-600 text-xs"
            }`}
          >
            <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
            <span className="truncate" title={place.address}>
              {place.address}
            </span>
          </div>
        )}

        {/* --- ランキングコメント--- */}
        {rankedPlace.comment && (
          <div
            className={`my-4 py-2 px-4 
          ${
            isTopThree
              ? `text-sm bg-gradient-to-r ${rankStyles[rankIdx].glowColor} to-transparent/5 backdrop-blur-sm border-l-4 ${rankStyles[rankIdx].borderColor}`
              : "text-xs bg-neutral-50 dark:bg-neutral-800/50 border-l-4 border-neutral-200 dark:border-neutral-700"
          } 
          shadow-sm`}
          >
            <div className="flex items-start">
              <div className="italic leading-relaxed whitespace-pre-line">
                {(rankedPlace.comment ?? "")
                  .split("\n")
                  .map((line, idx, arr) => (
                    <React.Fragment key={idx}>
                      {line}
                      {idx !== arr.length - 1 && <br />}
                    </React.Fragment>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex-grow" />

        {/* --- 詳細を見るボタン（モダンでおしゃれなデザイン） --- */}
        <div className="mt-auto text-right">
          <Button
            variant={isTopThree ? "outline" : "ghost"}
            size="sm"
            onClick={handleDetailClick}
            tabIndex={0}
            aria-label="詳細を見る"
            className={`group text-sm font-medium rounded-full items-center ${
              isTopThree
                ? `border ${rankStyles[rankIdx].borderColor} ${
                    rankStyles[rankIdx].textColor
                  } hover:bg-gradient-to-r hover:from-transparent hover:to-${
                    rankStyles[rankIdx].textColor.split("-")[1]
                  }-50`
                : "text-neutral-600 hover:text-neutral-700"
            }`}
          >
            詳細を見る
            {isTopThree ? (
              <ArrowRight className="ml-1.5 h-4 w-4 transform transition-all" />
            ) : (
              <ArrowRight className="ml-1.5 h-4 w-4 transform transition-transform" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
