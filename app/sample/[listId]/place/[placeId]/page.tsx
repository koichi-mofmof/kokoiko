import PlaceMapClient from "@/app/lists/[listId]/place/[placeId]/PlaceMapClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  mockListPlaceComments,
  mockPlaceLists,
  mockUsers,
} from "@/lib/mockData";
import type { ListPlaceComment } from "@/types";
import {
  ArrowLeft,
  Check,
  Circle,
  ExternalLink,
  MapPin,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface SamplePlaceDetailPageProps {
  params: Promise<{ listId: string; placeId: string }>;
}

export default async function SamplePlaceDetailPage({
  params,
}: SamplePlaceDetailPageProps) {
  const { listId, placeId } = await params;
  const list = mockPlaceLists.find((l) => l.id === listId);
  if (!list) notFound();
  const place = list.places.find((p) => p.id === placeId);
  if (!place) notFound();

  // サンプル用コメント: listPlaceIdで絞り込み
  const comments: ListPlaceComment[] = place.listPlaceId
    ? mockListPlaceComments.filter((c) => c.list_place_id === place.listPlaceId)
    : [];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4 flex items-center">
        <Link
          href={`/sample/${listId}`}
          className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {list.name}に戻る
        </Link>
      </div>
      <Card>
        <CardContent className="py-6 relative">
          <CardTitle className="text-neutral-800 sm:text-xl mb-1">
            {place.name}
          </CardTitle>
          <div className="flex items-center text-xs sm:text-sm text-neutral-500 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{place.address}</span>
          </div>
          <div className="mt-3 flex items-center">
            {place.visited === "visited" ? (
              <>
                <Check className="h-4 w-4 mr-1 text-primary-500" />
                <span className="text-xs sm:text-sm text-primary-700">
                  訪問済み
                </span>
              </>
            ) : (
              <>
                <Circle className="h-4 w-4 mr-1 text-neutral-400" />
                <span className="text-xs sm:text-sm text-neutral-600">
                  未訪問
                </span>
              </>
            )}
          </div>

          {/* 地図 */}
          <div className="mt-4 h-[300px] sm:h-[450px]">
            <PlaceMapClient place={place} listId={listId} isSample={true} />
          </div>

          <div className="mt-2">
            <a
              href={place.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Googleマップで開く"
            >
              <Button size="sm" variant="outline">
                <span className="inline-flex items-center">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Google Mapsで開く
                </span>
              </Button>
            </a>
          </div>

          {/* タグラベル＋タグ */}
          {place.tags && place.tags.length > 0 && (
            <div className="mt-4">
              <div className="text-xs sm:text-sm font-semibold text-neutral-600 mb-1">
                タグ
              </div>
              <div className="flex flex-wrap gap-1.5">
                {place.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                  >
                    <Tag className="h-3 w-3 mr-1 opacity-80" />
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* コメントラベル＋コメント一覧 */}
          <div className="mt-6">
            <div className="text-xs sm:text-sm font-semibold text-neutral-600 mb-1">
              コメント
            </div>
            {comments.length > 0 && (
              <div className="space-y-3">
                {comments.map((comment) => {
                  const commentUser = mockUsers.find(
                    (u) => u.id === comment.user_id
                  );
                  return (
                    <div
                      key={comment.id}
                      className="w-full p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <Avatar className="h-8 w-8">
                          {commentUser?.avatarUrl ? (
                            <AvatarImage
                              src={commentUser.avatarUrl}
                              alt={commentUser.name}
                            />
                          ) : (
                            <AvatarFallback>
                              {commentUser?.name?.[0] || "?"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 flex justify-between items-center text-xs text-neutral-700 font-semibold">
                          <span>{commentUser?.name || "ユーザー"}</span>
                          <span className="text-[10px] text-neutral-700">
                            {/* 日付表示（updated_atがなければcreated_at） */}
                            {comment.updated_at
                              ? new Date(comment.updated_at).toLocaleString(
                                  "ja-JP",
                                  {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : comment.created_at
                              ? new Date(comment.created_at).toLocaleString(
                                  "ja-JP",
                                  {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : ""}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-neutral-200 my-1" />
                      <div className="ml-1 text-sm text-neutral-700 whitespace-pre-line">
                        {comment.comment}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
