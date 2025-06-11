import { ListCardActions } from "@/app/components/lists/ListCardActions";
import ListDetailView from "@/app/components/lists/ListDetailView";
import JsonLd from "@/components/seo/JsonLd";
import { ParticipantAvatars } from "@/components/ui/avatar";
import NoAccess from "@/components/ui/NoAccess";
import type { MyListForClient } from "@/lib/dal/lists";
import { getListDetails } from "@/lib/dal/lists";
import {
  generateBreadcrumbSchema,
  generateItemListSchema,
} from "@/lib/seo/structured-data";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, LockKeyhole, LockKeyholeOpen } from "lucide-react";
import type { Metadata } from "next";
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

  const listDetails: MyListForClient | null = await getListDetails(
    listId,
    user.id
  );

  if (!listDetails) {
    return {
      title: "ClippyMap",
      description: "行きたい場所を共有できるサービス",
    };
  }

  const owner = listDetails.collaborators.find((c) => c.isOwner);
  const placesCount = listDetails.places.length;

  const description = listDetails.description
    ? `${listDetails.description} - ${placesCount}件の場所が登録されています`
    : `${
        owner?.name || "ユーザー"
      }さんが作成したリスト - ${placesCount}件の場所が登録されています`;

  return {
    title: `${listDetails.name} | ClippyMap`,
    description,
    alternates: {
      canonical: `/lists/${listId}`,
    },
    openGraph: {
      title: `${listDetails.name} | ClippyMap`,
      description,
      type: "article",
      locale: "ja_JP",
      images: [
        {
          url: "/ogp-image.png",
          width: 1200,
          height: 630,
          alt: `${listDetails.name} - ClippyMap`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${listDetails.name} | ClippyMap`,
      description,
      images: ["/ogp-image.png"],
    },
  };
}

export default async function ListDetailPage({ params }: ListDetailPageProps) {
  const { listId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const listDetails: MyListForClient | null = await getListDetails(
    listId,
    user.id
  );

  if (!listDetails) {
    return <NoAccess />;
  }

  const owner = listDetails.collaborators.find((c) => c.isOwner);
  const otherParticipants = listDetails.collaborators.filter(
    (c) => !c.isOwner && c.permission === "edit"
  );
  const viewers = listDetails.collaborators.filter(
    (c) => !c.isOwner && c.permission === "view"
  );

  if (!owner) {
    console.error("Owner not found in collaborators for list:", listId);
    notFound();
  }

  // 構造化データの生成
  const breadcrumbs = [
    { name: "ホーム", url: "/" },
    { name: "マイリスト", url: "/lists" },
    { name: listDetails.name, url: `/lists/${listId}` },
  ];

  return (
    <>
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} />
      <JsonLd data={generateItemListSchema(listDetails)} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-4">
          <Link
            href="/lists"
            className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            マイリスト一覧に戻る
          </Link>
        </div>

        <div className="mb-1 relative">
          <h1 className="text-lg sm:text-xl font-semibold text-neutral-900 flex items-center gap-2">
            {listDetails.name}
            {typeof listDetails.is_public === "boolean" ? (
              <span className="ml-1">
                <span
                  aria-label={
                    listDetails.is_public ? "公開リスト" : "非公開リスト"
                  }
                  title={listDetails.is_public ? "公開リスト" : "非公開リスト"}
                >
                  {listDetails.is_public ? (
                    <LockKeyholeOpen className="h-5 w-5 text-primary-500" />
                  ) : (
                    <LockKeyhole className="h-5 w-5 text-neutral-400" />
                  )}
                </span>
              </span>
            ) : null}
            <div className="absolute right-0 top-0 flex items-center gap-2">
              <ListCardActions list={listDetails} />
            </div>
          </h1>
          {listDetails.description && (
            <p className="mt-1 text-sm text-neutral-500">
              {listDetails.description}
            </p>
          )}
        </div>

        <div className="mb-4 flex justify-between">
          <ParticipantAvatars
            owner={owner}
            participants={otherParticipants}
            viewers={viewers}
          />
        </div>

        <Suspense
          fallback={
            <div className="text-center p-8">リスト詳細を読み込み中...</div>
          }
        >
          <ListDetailView
            places={listDetails.places}
            listId={listId}
            permission={listDetails.permission}
          />
        </Suspense>
      </div>
    </>
  );
}
