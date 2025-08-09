import AddCommentForm from "@/app/components/lists/AddCommentForm";
import CommentItem from "@/app/components/lists/CommentItem";
import EditPlaceDialogButton from "@/app/components/places/EditPlaceDialogButton";
import JsonLd from "@/components/seo/JsonLd";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getCommentsByListPlaceId } from "@/lib/actions/place-actions";
import { getListDetails } from "@/lib/dal/lists";
import { fetchAuthenticatedUserWithProfile } from "@/lib/dal/users";
import {
  createServerT,
  loadMessages,
  normalizeLocale,
  toOpenGraphLocale,
} from "@/lib/i18n";
import {
  generateBreadcrumbSchema,
  generatePlaceSchema,
} from "@/lib/seo/structured-data";
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
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
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

  // ログインユーザーまたは未ログインかで処理を分岐
  let list = null;
  if (user) {
    list = await getListDetails(listId, user.id);
  } else {
    // 未ログインの場合は公開リストのみ取得
    const { getPublicListData } = await import("@/lib/dal/lists");
    list = await getPublicListData(listId);
  }

  if (!list?.places) {
    const cookieStore = await cookies();
    const locale = normalizeLocale(cookieStore.get("lang")?.value);
    const msgs = await loadMessages(locale);
    const t = createServerT(msgs as Record<string, string>);
    return { title: "ClippyMap", description: t("meta.root.description") };
  }

  const place = list.places.find((p) => p.id === placeId);
  if (!place) {
    return {
      title: "ClippyMap",
      description: "行きたい場所を共有できるサービス",
    };
  }

  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  const statusText =
    place.visited === "visited"
      ? t("place.status.visited")
      : t("place.status.notVisited");
  const tagsText =
    place.tags && place.tags.length > 0
      ? ` - タグ: ${place.tags.map((tag) => tag.name).join(", ")}`
      : "";

  const description = `${place.address} (${statusText})${tagsText} - ${t(
    "place.meta.registeredIn",
    { list: list.name }
  )}`;

  return {
    title: `${place.name} | ${list.name} | ClippyMap`,
    description,
    alternates: {
      canonical: `/lists/${listId}/place/${placeId}`,
    },
    openGraph: {
      title: `${place.name} | ${list.name} | ClippyMap`,
      description,
      type: "article",
      locale: toOpenGraphLocale(locale),
      images: [
        {
          url: "/ogp-image.webp",
          width: 1200,
          height: 630,
          alt: `${place.name} - ${list.name} - ClippyMap`,
          type: "image/webp",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${place.name} | ${list.name} | ClippyMap`,
      description,
      images: [
        {
          url: "/ogp-image.webp",
          alt: `${place.name} - ${list.name} - ClippyMap`,
        },
      ],
    },
  };
}

export default async function PlaceDetailPage({
  params,
}: PlaceDetailPageProps) {
  const { listId, placeId } = await params;

  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  // ログインユーザーまたは未ログインかで処理を分岐
  let list = null;
  let user = null;

  if (supabaseUser) {
    // ログインユーザーの場合
    const userProfileResult = await fetchAuthenticatedUserWithProfile();
    if (!userProfileResult.userWithProfile) notFound();
    user = userProfileResult.userWithProfile;
    list = await getListDetails(listId, supabaseUser.id);
  } else {
    // 未ログインの場合は公開リストのみ取得
    const { getPublicListData } = await import("@/lib/dal/lists");
    list = await getPublicListData(listId);
  }

  if (!list || !list.places) notFound();
  const place = list.places.find((p) => p.id === placeId);
  if (!place) notFound();

  // i18n for page content
  const cookieStoreForPage = await cookies();
  const localeForPage = normalizeLocale(cookieStoreForPage.get("lang")?.value);
  const msgsForPage = await loadMessages(localeForPage);
  const t = createServerT(msgsForPage as Record<string, string>);

  // 💡 キャッシュ制御: 非公開リストの場合はキャッシュを無効化
  if (!list.is_public) {
    noStore();
  }

  // コメント一覧取得
  let comments: ListPlaceComment[] = [];
  if (place.listPlaceId) {
    comments = await getCommentsByListPlaceId(place.listPlaceId);
  }

  // 権限判定
  const canEditOrDelete =
    list.permission === "owner" || list.permission === "edit";

  // 構造化データの生成
  const breadcrumbs = [
    { name: "ホーム", url: "/" },
    ...(user ? [{ name: "マイリスト", url: "/lists" }] : []),
    { name: list.name, url: `/lists/${listId}` },
    { name: place.name, url: `/lists/${listId}/place/${placeId}` },
  ];

  return (
    <>
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} />
      <JsonLd data={generatePlaceSchema(place, listId, list.name)} />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-4 flex items-center">
          <Link
            href={`/lists/${listId}`}
            className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("place.backToList", { list: list.name })}
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
                    {t("place.status.visited")}
                  </span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 mr-1 text-neutral-400" />
                  <span className="text-xs sm:text-sm text-neutral-600">
                    {t("place.status.notVisited")}
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
                aria-label={t("place.openInGoogleMaps")}
              >
                <Button size="sm" variant="outline">
                  <span className="inline-flex items-center">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {t("place.openInGoogleMaps")}
                  </span>
                </Button>
              </a>
            </div>

            {/* タグラベル＋タグ */}
            {place.tags && place.tags.length > 0 && (
              <div className="mt-4">
                <div className="text-xs sm:text-sm font-semibold text-neutral-600 mb-1">
                  {t("place.tags")}
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
                {t("place.comments")}
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
                      isMyComment={
                        user ? comment.user_id === user.userId : false
                      }
                    />
                  ))}
                </div>
              )}
            </div>
            {place.listPlaceId && canEditOrDelete && user && (
              <AddCommentForm
                listPlaceId={place.listPlaceId}
                displayName={user.displayName}
                avatarUrl={user.avatarUrl || undefined}
              />
            )}

            {/* 登録者情報 */}
            {place.createdByUser && (
              <div className="flex items-center gap-2 mt-6 text-xs sm:text-sm text-neutral-500">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={place.createdByUser.avatarUrl}
                    alt={place.createdByUser.name}
                  />
                  <AvatarFallback className="text-xs bg-neutral-100 text-neutral-600">
                    {place.createdByUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>
                  {t("place.addedBy", { name: place.createdByUser.name })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
