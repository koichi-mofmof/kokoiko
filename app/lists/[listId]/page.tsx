import { buildAlternates, getRequestLocale } from "@/lib/i18n/server";
import { buildListMetaDescription } from "@/lib/seo/list-description";
import { CreatorInfoCard } from "@/app/components/lists/CreatorInfoCard";
import { ListCardActions } from "@/app/components/lists/ListCardActions";
import ListDetailView from "@/app/components/lists/ListDetailView";
import { ResumeCopy } from "@/app/components/lists/ResumeCopy";
import { TemplateCopyCTA } from "@/app/components/lists/TemplateCopyCTA";
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
import { canInviteToList } from "@/lib/utils/subscription-utils";
import {
  createServerT,
  loadMessages,
  toOpenGraphLocale,
} from "@/lib/i18n";
import {
  generateBreadcrumbSchema,
  generateItemListSchema,
} from "@/lib/seo/structured-data";
import { createClient } from "@/lib/supabase/server";
import { LockKeyhole, LockKeyholeOpen } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const CLIPPYMAP_SUPPORT_URL = "https://buymeacoffee.com/clippymap";
// username/display_nameはユーザーが変更しうるため、固定のuser_idで判定する
const CLIPPYMAP_USER_ID = "af12b0fd-3812-4b8a-ab89-53b09d084037";

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
    const locale = await getRequestLocale();
    const msgs = await loadMessages(locale);
    const t = createServerT(msgs as Record<string, string>);
    return { title: "ClippyMap", description: t("meta.root.description") };
  }

  const placesCount = lite.placesCount;

  const locale = await getRequestLocale();
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  const description = buildListMetaDescription({
    t,
    listDescription: lite.description,
    placesCount,
    samplePlaceNames: lite.samplePlaceNames,
    primaryRegion: lite.primaryRegion,
  });

  return {
    title: `${lite.name} | ClippyMap`,
    description,
    alternates: await buildAlternates(`/lists/${listId}`),
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
    (c: Collaborator) => !c.isOwner && c.permission === "edit",
  );
  const viewers = listDetails.collaborators.filter(
    (c: Collaborator) => !c.isOwner && c.permission === "view",
  );

  if (!owner) {
    console.error("Owner not found in collaborators for list:", listId);
    notFound();
  }

  // 社交フック（共同編集の招待）の表示可否：所有者かつ未共有かつ無料上限内のときのみ
  const canInvite =
    !!user && listDetails.created_by === user.id
      ? await canInviteToList(supabase, user.id, listId)
      : false;

  // 目玉CTA（このリストをベースに自分用に編集）の表示可否：
  // 公開リストかつ非所有者（＝閲覧者・ゲスト含む）のときのみ。
  const isCopyable =
    listDetails.created_by !== user?.id && !!listDetails.is_public;

  // i18n
  const locale = await getRequestLocale();
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 lg:pb-24">
        {/* 戻るリンクは撤去：ヘッダーのロゴ(→ホーム)とブラウザバックで代替でき、
            縦スペースを地図等の本文に回す。パンくずは JsonLd で別途保持。 */}
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
            {/* 保存（ブックマーク）は熱量ピークのCTAクラスタ（追従バー／右パネル）へ集約。
                ここでは所有者向けの管理メニューのみ残す。 */}
            <ListCardActions list={listDetails} variant="inline" />
          </div>
        </h1>
        {listDetails.description && (
          <p className="mt-1 text-sm text-neutral-500">
            {listDetails.description}
          </p>
        )}

        <div className="mt-1 mb-3">
          <CreatorInfoCard creator={creatorProfile} />
          {listDetails.created_by === CLIPPYMAP_USER_ID && (
            <a
              href={CLIPPYMAP_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block transition-opacity hover:opacity-90"
            >
              <Image
                src="/bmc-button-yellow.png"
                alt={t("lists.creator.support")}
                width={145}
                height={40}
                className="h-10 w-auto"
              />
            </a>
          )}
        </div>

        {/* 本文（リスト/マップ）は全幅。CTAはスマホ=追従バー、
            PC=画面下中央の浮遊ピルで担う（常時表示のため末尾ブロックは持たない）。 */}
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
            canInvite={canInvite}
          />
        </Suspense>
      </div>

      {/* スマホ：追従ボトムバー（親指ゾーン・常時表示） */}
      {isCopyable && (
        <TemplateCopyCTA
          variant="bottomBar"
          sourceListId={listDetails.id}
          sourceListName={listDetails.name}
          places={listDetails.places}
          isLoggedIn={!!user}
        />
      )}

      {/* PC：画面下中央の浮遊ピル（常時表示） */}
      {isCopyable && (
        <TemplateCopyCTA
          variant="desktopPill"
          sourceListId={listDetails.id}
          sourceListName={listDetails.name}
          places={listDetails.places}
          isLoggedIn={!!user}
        />
      )}

      {/* 登録後、ゲスト時に選んだ内容を復元しワンタップでコピー完遂させる（不可視ロジック） */}
      {isCopyable && (
        <ResumeCopy
          sourceListId={listDetails.id}
          places={listDetails.places}
          isLoggedIn={!!user}
        />
      )}
    </>
  );
}
