import { SignupPromptWrapper } from "@/app/components/conversion/SignupPromptWrapper";
import { BookmarkButton } from "@/app/components/lists/BookmarkButton";
import { CreatorInfoCard } from "@/app/components/lists/CreatorInfoCard";
import { ListCardActions } from "@/app/components/lists/ListCardActions";
import ListDetailView from "@/app/components/lists/ListDetailView";
import JsonLd from "@/components/seo/JsonLd";
import { ParticipantAvatars } from "@/components/ui/avatar";
import NoAccess from "@/components/ui/NoAccess";
import type { Collaborator, ListForClient } from "@/lib/dal/lists";
import {
  getListDetails,
  getListMetadataLite,
  getPublicListData,
} from "@/lib/dal/lists";
import { getUserProfile } from "@/lib/dal/user-public-lists";
import {
  createServerT,
  loadMessages,
  normalizeLocale,
  toOpenGraphLocale,
} from "@/lib/i18n";
import {
  generateBreadcrumbSchema,
  generateItemListSchema,
} from "@/lib/seo/structured-data";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, LockKeyhole, LockKeyholeOpen } from "lucide-react";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface ListDetailPageProps {
  params: Promise<{ listId: string }>;
}

export async function generateMetadata({
  params,
}: ListDetailPageProps): Promise<Metadata> {
  const { listId } = await params;
  // 軽量メタデータ取得（公開リストのみ）
  const lite = await getListMetadataLite(listId);

  if (!lite) {
    const cookieStore = await cookies();
    const locale = normalizeLocale(cookieStore.get("lang")?.value);
    const msgs = await loadMessages(locale);
    const t = createServerT(msgs as Record<string, string>);
    return { title: "ClippyMap", description: t("meta.root.description") };
  }

  const placesCount = lite.placesCount;

  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  const description = lite.description
    ? `${lite.description} - ${t("listsDetail.placesCount", {
        n: placesCount,
      })}`
    : `${t("listsDetail.placesCount", { n: placesCount })}`;

  return {
    title: `${lite.name} | ClippyMap`,
    description,
    alternates: {
      canonical: `/lists/${listId}`,
    },
    openGraph: {
      title: `${lite.name} | ClippyMap`,
      description,
      type: "article",
      locale: toOpenGraphLocale(locale),
      images: [
        {
          url: "/ogp-image.webp",
          width: 1200,
          height: 630,
          alt: `${lite.name} - ClippyMap`,
          type: "image/webp",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${lite.name} | ClippyMap`,
      description,
      images: [
        {
          url: "/ogp-image.webp",
          alt: `${lite.name} - ClippyMap`,
        },
      ],
    },
  };
}

export default async function ListDetailPage({ params }: ListDetailPageProps) {
  const { listId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ログインユーザーまたは未ログインかで処理を分岐
  let listDetails: ListForClient | null = null;

  if (user) {
    listDetails = await getListDetails(listId, user.id);
  } else {
    // 未ログインの場合は公開リストのみ取得
    listDetails = await getPublicListData(listId);
  }

  if (!listDetails) {
    // 未ログインで非公開リストアクセス、またはリストが存在しない場合
    // アクセス権限がない場合は統一してNoAccessコンポーネントを表示
    return <NoAccess />;
  }

  // Creator profile
  const creatorProfile = await getUserProfile(listDetails.created_by);

  // 💡 キャッシュ制御: 非公開はキャッシュしない
  if (!listDetails.is_public) {
    noStore();
  }

  const owner = listDetails.collaborators.find((c: Collaborator) => c.isOwner);
  const otherParticipants = listDetails.collaborators.filter(
    (c: Collaborator) => !c.isOwner && c.permission === "edit"
  );
  const viewers = listDetails.collaborators.filter(
    (c: Collaborator) => !c.isOwner && c.permission === "view"
  );

  if (!owner) {
    console.error("Owner not found in collaborators for list:", listId);
    notFound();
  }

  // i18n
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);

  // 構造化データの生成
  const breadcrumbs = [
    { name: t("footer.link.home"), url: "/" },
    { name: t("listsPage.title"), url: "/lists" },
    { name: listDetails.name, url: `/lists/${listId}` },
  ];

  return (
    <>
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} />
      <JsonLd data={generateItemListSchema(listDetails)} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-4">
          <Link
            href={user ? "/lists" : "/"}
            className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {user ? t("noAccess.backToLists") : t("noAccess.backToHome")}
          </Link>
        </div>

        {/* サインアップ誘導バナー（非ログインユーザーのみ） */}
        <SignupPromptWrapper listId={listId} showBanner={true} />

        <h1 className="flex items-start justify-between gap-4 text-lg sm:text-xl font-semibold text-neutral-900">
          <span className="flex items-center gap-2">
            {listDetails.name}
            {typeof listDetails.is_public === "boolean" ? (
              <span className="ml-1">
                <span
                  aria-label={
                    listDetails.is_public
                      ? t("lists.public")
                      : t("lists.private")
                  }
                  title={
                    listDetails.is_public
                      ? t("lists.public")
                      : t("lists.private")
                  }
                >
                  {listDetails.is_public ? (
                    <LockKeyholeOpen className="h-5 w-5 text-primary-500" />
                  ) : (
                    <LockKeyhole className="h-5 w-5 text-neutral-400" />
                  )}
                </span>
              </span>
            ) : null}
          </span>
          <div className="flex-shrink-0 flex items-center gap-2">
            {listDetails.created_by !== user?.id && listDetails.is_public && (
              <BookmarkButton
                listId={listDetails.id}
                initialIsBookmarked={listDetails.isBookmarked}
                listName={listDetails.name}
              />
            )}
            <ListCardActions list={listDetails} variant="inline" />
          </div>
        </h1>
        {listDetails.description && (
          <p className="mt-1 text-sm text-neutral-500">
            {listDetails.description}
          </p>
        )}

        <div className="my-4">
          <CreatorInfoCard creator={creatorProfile} />
        </div>

        <div className="mb-4 flex justify-between">
          <ParticipantAvatars
            participants={otherParticipants}
            viewers={viewers}
          />
        </div>
        <Suspense fallback={<div>Loading places...</div>}>
          <ListDetailView
            listId={listId}
            places={listDetails.places}
            permission={listDetails.permission}
          />
        </Suspense>
      </div>
    </>
  );
}
