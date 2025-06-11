import AddCommentForm from "@/app/components/lists/AddCommentForm";
import CommentItem from "@/app/components/lists/CommentItem";
import EditPlaceDialogButton from "@/app/components/places/EditPlaceDialogButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getCommentsByListPlaceId } from "@/lib/actions/place-actions";
import { getListDetails } from "@/lib/dal/lists";
import { fetchAuthenticatedUserWithProfile } from "@/lib/dal/users";
import { createClient } from "@/lib/supabase/server";
import { ListPlaceComment } from "@/types";
import {
  ArrowLeft,
  Check,
  Circle,
  ExternalLink,
  MapPin,
  Tag,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PlaceMapClient from "./PlaceMapClient";

interface PlaceDetailPageProps {
  params: Promise<{ listId: string; placeId: string }>;
}

export async function generateMetadata({
  params,
}: PlaceDetailPageProps): Promise<Metadata> {
  const { listId, placeId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      title: "ClippyMap",
      description: "行きたい場所を共有できるサービス",
    };
  }

  const list = await getListDetails(listId, user.id);
  if (!list?.places) {
    return {
      title: "ClippyMap",
      description: "行きたい場所を共有できるサービス",
    };
  }

  const place = list.places.find((p) => p.id === placeId);
  if (!place) {
    return {
      title: "ClippyMap",
      description: "行きたい場所を共有できるサービス",
    };
  }

  const statusText = place.visited === "visited" ? "訪問済み" : "未訪問";
  const tagsText =
    place.tags && place.tags.length > 0
      ? ` - タグ: ${place.tags.map((tag) => tag.name).join(", ")}`
      : "";

  const description = `${place.address} (${statusText})${tagsText} - ${list.name}に登録された場所`;

  return {
    title: `${place.name} | ${list.name} | ClippyMap`,
    description,
    openGraph: {
      title: `${place.name} | ${list.name} | ClippyMap`,
      description,
      type: "article",
      locale: "ja_JP",
      images: [
        {
          url: "/ogp-image.png",
          width: 1200,
          height: 630,
          alt: `${place.name} - ${list.name} - ClippyMap`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${place.name} | ${list.name} | ClippyMap`,
      description,
      images: ["/ogp-image.png"],
    },
  };
}

export default async function PlaceDetailPage({
  params,
}: PlaceDetailPageProps) {
  const { listId, placeId } = await params;
  const userProfileResult = await fetchAuthenticatedUserWithProfile();
  if (!userProfileResult.userWithProfile) notFound();
  const user = userProfileResult.userWithProfile;

  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();
  if (!supabaseUser) notFound();

  const list = await getListDetails(listId, supabaseUser.id);
  if (!list || !list.places) notFound();
  const place = list.places.find((p) => p.id === placeId);
  if (!place) notFound();

  // コメント一覧取得
  let comments: ListPlaceComment[] = [];
  if (place.listPlaceId) {
    comments = await getCommentsByListPlaceId(place.listPlaceId);
  }

  // 権限判定
  const canEditOrDelete =
    list.permission === "owner" || list.permission === "edit";

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-4 flex items-center">
        <Link
          href={`/lists/${listId}`}
          className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {list.name}に戻る
        </Link>
      </div>
      <Card>
        <CardContent className="py-6 relative">
          {canEditOrDelete && (
            <div className="absolute right-4 top-4 z-10">
              <EditPlaceDialogButton place={place} listId={listId} />
            </div>
          )}
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
            <PlaceMapClient place={place} listId={listId} />
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
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    commentUser={list.collaborators?.find(
                      (c) => c.id === comment.user_id
                    )}
                    isMyComment={comment.user_id === user.userId}
                  />
                ))}
              </div>
            )}
          </div>
          {place.listPlaceId && canEditOrDelete && (
            <AddCommentForm
              listPlaceId={place.listPlaceId}
              displayName={user.displayName}
              avatarUrl={user.avatarUrl || undefined}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
