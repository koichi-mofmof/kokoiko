"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/hooks/use-i18n";
import { Place, RankedPlace } from "@/types";
import { ArrowRight, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

interface RankingCardProps {
  rankedPlace: RankedPlace;
  place: Place;
  listId?: string;
}

// テーマ：旅への期待感を高める、洗練されたデザイン
const rankStyles = [
  // 1位: Royal Gold
  {
    cardBg:
      "bg-gradient-to-br from-yellow-50 via-white to-yellow-50 dark:from-yellow-900/20 dark:via-neutral-900 dark:to-yellow-900/20",
    border: "border-yellow-400/80 dark:border-yellow-600/60",
    shadow: "shadow-xl shadow-yellow-500/20 dark:shadow-yellow-600/10",
    hover:
      "hover:border-yellow-400 dark:hover:border-yellow-500 hover:shadow-2xl hover:shadow-yellow-500/30",
    rankBadge:
      "bg-gradient-to-br from-yellow-300 to-amber-500 text-white ring-4 ring-white dark:ring-neutral-900",
    textColor: "text-amber-700 dark:text-amber-300",
    nameColor: "text-amber-950 dark:text-amber-100",
    accent: "text-amber-600 dark:text-amber-400",
    ribbon: "bg-gradient-to-r from-yellow-400 to-amber-500",
    bgAccent: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  // 2位: Elegant Silver
  {
    cardBg:
      "bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-800/20 dark:via-neutral-900 dark:to-slate-800/20",
    border: "border-slate-400/70 dark:border-slate-600/50",
    shadow: "shadow-lg shadow-slate-500/15 dark:shadow-slate-600/10",
    hover:
      "hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-xl hover:shadow-slate-500/20",
    rankBadge:
      "bg-gradient-to-br from-slate-300 to-gray-500 text-white ring-4 ring-white dark:ring-neutral-900",
    textColor: "text-slate-700 dark:text-slate-300",
    nameColor: "text-slate-900 dark:text-slate-100",
    accent: "text-slate-600 dark:text-slate-400",
    ribbon: "bg-gradient-to-r from-slate-300 to-gray-500",
    bgAccent: "bg-slate-100 dark:bg-slate-800/30",
  },
  // 3位: Warm Bronze
  {
    cardBg:
      "bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-orange-900/20 dark:via-neutral-900 dark:to-orange-900/20",
    border: "border-orange-400/70 dark:border-orange-600/50",
    shadow: "shadow-lg shadow-orange-500/15 dark:shadow-orange-600/10",
    hover:
      "hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-xl hover:shadow-orange-500/20",
    rankBadge:
      "bg-gradient-to-br from-orange-300 to-rose-500 text-white ring-4 ring-white dark:ring-neutral-900",
    textColor: "text-orange-700 dark:text-orange-300",
    nameColor: "text-orange-950 dark:text-orange-100",
    accent: "text-orange-600 dark:text-orange-400",
    ribbon: "bg-gradient-to-r from-orange-400 to-rose-500",
    bgAccent: "bg-orange-100 dark:bg-orange-900/30",
  },
];

const defaultStyle = {
  cardBg: "bg-white dark:bg-neutral-900",
  border: "border-neutral-200 dark:border-neutral-800",
  shadow: "shadow-md shadow-neutral-300/10 dark:shadow-black/10",
  hover:
    "hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg hover:shadow-neutral-300/20 dark:hover:shadow-black/20",
  rankBadge:
    "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 ring-2 ring-white dark:ring-neutral-900",
  textColor: "text-neutral-600 dark:text-neutral-400",
  nameColor: "text-neutral-800 dark:text-neutral-100",
  accent: "text-neutral-500 dark:text-neutral-500",
  ribbon: "bg-neutral-200 dark:bg-neutral-800",
  bgAccent: "bg-neutral-100 dark:bg-neutral-800/50",
};

export default function RankingCard({
  rankedPlace,
  place,
  listId,
}: RankingCardProps) {
  const router = useRouter();
  const { t } = useI18n();
  const isTopThree = rankedPlace.rank <= 3;
  const rankIdx = rankedPlace.rank - 1;
  const style = isTopThree ? rankStyles[rankIdx] : defaultStyle;

  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!listId) return;
    const url = `/lists/${listId}/place/${place.id}`;
    router.push(url);
  };

  // 4位以下とそれ以上でクラスを切り替え
  const cardClasses = `relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 ease-in-out 
    ${style.cardBg} ${style.border} ${style.shadow} ${style.hover}
    ${isTopThree ? "" : "scale-[0.92] sm:scale-[0.95]"}`;

  return (
    <Card
      role="article"
      className={`${cardClasses} transform transition-all duration-500 hover:-translate-y-1`}
      tabIndex={0}
      aria-label={t("lists.ranking.rankAria", {
        rank: rankedPlace.rank,
        name: place.name,
      })}
    >
      <div className="relative flex flex-col h-full">
        {/* ランク表示バッジ - より目立つ位置に */}
        <div className="absolute -left-2 -top-2 z-10 flex items-center justify-center">
          <div
            className={`flex-shrink-0 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 
              ${
                isTopThree
                  ? "w-12 h-12 sm:w-14 sm:h-14"
                  : "w-9 h-9 sm:w-10 sm:h-10"
              } 
              ${style.rankBadge}`}
            style={{ transform: isTopThree ? "scale(1.05)" : "" }}
          >
            <span
              className={`font-bold drop-shadow-sm ${
                isTopThree ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
              }`}
            >
              {rankedPlace.rank}
            </span>
          </div>
        </div>

        {/* カードコンテンツ */}
        <div
          className={`flex-1 flex flex-col p-4 pt-5 sm:p-5 ${
            isTopThree ? "sm:pt-6" : "pt-4 sm:pt-5 sm:p-4"
          }`}
        >
          {/* 施設名 - ランクバッジを避けるようにパディング */}
          <div
            className={`pl-8 sm:pl-10 pr-2 sm:pr-3 mb-3 ${
              isTopThree ? "" : "pl-7 sm:pl-9 mb-2"
            }`}
          >
            <h3
              className={`font-bold leading-tight tracking-tight 
                ${isTopThree ? "text-lg sm:text-xl" : "text-sm sm:text-base"} 
                ${style.nameColor} transition-colors duration-300`}
              title={place.name}
              style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
              }}
            >
              {place.name}
            </h3>
          </div>

          {/* 分割線 - トップ3のみ装飾付き */}
          <div
            className={`w-full h-px ${style.bgAccent} mb-3 ${
              isTopThree ? "" : "mb-2"
            }`}
          />

          {/* 情報コンテンツエリア */}
          <div className="flex-1 flex flex-col">
            {/* 住所 */}
            {place.address && (
              <div
                className={`flex items-start ${
                  isTopThree ? "text-sm" : "text-xs sm:text-sm"
                } ${style.textColor} transition-colors duration-300 mb-3 ${
                  isTopThree ? "" : "mb-2"
                }`}
              >
                <MapPin
                  className={`${
                    isTopThree ? "mr-2 h-4 w-4" : "mr-1.5 h-3.5 w-3.5"
                  } flex-shrink-0 ${style.accent}`}
                />
                <span className="truncate" title={place.address}>
                  {place.address}
                </span>
              </div>
            )}

            {/* コメント - 装飾を強化 */}
            {rankedPlace.comment && (
              <div
                className={`relative mt-1 mb-4 ${
                  isTopThree ? style.bgAccent : ""
                } rounded-lg p-3 ${isTopThree ? "" : "p-2 mb-3"}`}
              >
                <blockquote
                  className={`italic ${isTopThree ? "text-sm" : "text-xs"} ${
                    style.textColor
                  } transition-colors duration-300`}
                >
                  {rankedPlace.comment}
                </blockquote>
              </div>
            )}
          </div>

          {/* アクションエリア - 視線の最終到達点 */}
          <div className="flex justify-end mt-auto pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDetailClick}
              tabIndex={0}
              aria-label={t("lists.ranking.seeDetails")}
              className={`group/button rounded-full transition-all duration-300 ease-in-out
                ${isTopThree ? "px-5 py-2.5 text-sm" : "px-3.5 py-1.5 text-xs"} 
                ${
                  style.textColor
                } bg-white dark:bg-neutral-900 border-current/30
                hover:border-current/70 hover:bg-black/5 dark:hover:bg-white/5
                hover:scale-105 active:scale-95`}
            >
              {t("lists.ranking.seeDetails")}
              <ArrowRight
                className={`ml-1.5 ${
                  isTopThree ? "h-4 w-4" : "h-3.5 w-3.5"
                } transform transition-transform duration-300 group-hover/button:translate-x-1`}
              />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
