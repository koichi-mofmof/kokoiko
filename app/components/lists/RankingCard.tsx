"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Place, RankedPlace } from "@/types";
import { Award, Crown, ExternalLink, MapPin, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface RankingCardProps {
  rankedPlace: RankedPlace;
  place: Place;
}

export default function RankingCard({ rankedPlace, place }: RankingCardProps) {
  const isTopThree = rankedPlace.rank <= 3;

  const getRankBadgeStyle = (rank: number): string => {
    switch (rank) {
      case 1:
        return "bg-yellow-500 text-white shadow-sm";
      case 2:
        return "bg-slate-500 text-white shadow-sm";
      case 3:
        return "bg-amber-600 text-white shadow-sm";
      default:
        return "";
    }
  };

  const getRankCommentBorderStyle = (rank: number): string => {
    switch (rank) {
      case 1:
        return "border-yellow-500 dark:border-yellow-600";
      case 2:
        return "border-slate-500 dark:border-slate-600";
      case 3:
        return "border-amber-600 dark:border-amber-600";
      default:
        return "border-neutral-300 dark:border-neutral-600";
    }
  };

  if (isTopThree) {
    return (
      <Card
        className={`overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl relative hover:scale-[1.01]`}
      >
        <div
          className={`absolute -top-0.5 -left-0.5 w-[70px] h-[70px] overflow-hidden z-10`}
        >
          <div
            className={`absolute top-[18px] -left-[22px] w-[95px] transform -rotate-45 text-center py-1 text-sm font-bold tracking-normal ${getRankBadgeStyle(
              rankedPlace.rank
            )}`}
          >
            {rankedPlace.rank === 1 && (
              <Crown className="inline-block h-3.5 w-3.5 mb-px mr-0.5" />
            )}
            {rankedPlace.rank}位
          </div>
        </div>

        <CardHeader className="p-0 relative aspect-[16/9] w-full">
          {place.imageUrl ? (
            <>
              <Image
                src={place.imageUrl}
                alt={place.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent group-hover:from-black/40 transition-colors duration-300"></div>
            </>
          ) : (
            <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center rounded-t-xl">
              <Award className="w-16 h-16 text-neutral-300 dark:text-neutral-600 opacity-80" />
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 space-y-2.5">
          <CardTitle
            className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 truncate"
            title={place.name}
          >
            {place.name}
          </CardTitle>
          {place.address && (
            <div className="flex items-start text-neutral-500 dark:text-neutral-400">
              <MapPin className="h-4 w-4 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0 mr-1.5" />
              <CardDescription className="text-sm text-neutral-600 dark:text-neutral-400 ml-0 line-clamp-1">
                {place.address}
              </CardDescription>
            </div>
          )}
          {rankedPlace.comment && (
            <div
              className={`mt-2.5 pl-3 py-2 border-l-4 ${getRankCommentBorderStyle(
                rankedPlace.rank
              )} bg-neutral-50 dark:bg-neutral-800/60 rounded-r-md`}
            >
              <p className="italic text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                &quot;{rankedPlace.comment}&quot;
              </p>
            </div>
          )}
          {place.tags && place.tags.length > 0 && (
            <div className="pt-1.5 flex flex-wrap gap-1.5">
              {place.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                >
                  <Tag className="h-3 w-3 mr-1 opacity-70" />
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          {/* Google Maps Link Start */}
          {place.googleMapsUrl && (
            <div className="pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-700/60">
              <Link
                href={place.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 transition-colors dark:text-primary-500 dark:hover:text-primary-400"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Google マップで開く
              </Link>
            </div>
          )}
          {/* Google Maps Link End */}
        </CardContent>
      </Card>
    );
  } else {
    return (
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/70 rounded-lg group">
        <CardContent className="p-3.5 space-y-2">
          <div className="flex items-center">
            <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold mr-2.5 bg-neutral-700 text-white dark:bg-neutral-400 dark:text-neutral-900 shadow-sm">
              {rankedPlace.rank}
            </span>
            <CardTitle
              className="text-base font-medium text-neutral-700 dark:text-neutral-200 truncate"
              title={place.name}
            >
              {place.name}
            </CardTitle>
          </div>
          {place.address && (
            <div className="flex items-start text-xs text-neutral-500/90 dark:text-neutral-400/90">
              <MapPin className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400 mt-px flex-shrink-0 mr-1" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400 ml-0 line-clamp-1">
                {place.address}
              </span>
            </div>
          )}
          {rankedPlace.comment && (
            <p className="text-xs text-neutral-500/90 dark:text-neutral-400/90 italic pt-1.5 border-t border-neutral-200/70 dark:border-neutral-700/60 mt-2">
              &ldquo;{rankedPlace.comment}&rdquo;
            </p>
          )}
          {place.tags && place.tags.length > 0 && (
            <div className="pt-1.5 flex flex-wrap gap-1">
              {place.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                >
                  <Tag className="h-3 w-3 mr-1 opacity-70" />
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          {/* Google Maps Link Start */}
          {place.googleMapsUrl && (
            <div className="pt-2.5 mt-2.5 border-t border-neutral-200/70 dark:border-neutral-700/60">
              <Link
                href={place.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-primary-600 hover:text-primary-700 transition-colors dark:text-primary-500 dark:hover:text-primary-400"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Google マップで開く
              </Link>
            </div>
          )}
          {/* Google Maps Link End */}
        </CardContent>
      </Card>
    );
  }
}
