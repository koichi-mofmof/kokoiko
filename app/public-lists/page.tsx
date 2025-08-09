import JsonLd from "@/components/seo/JsonLd";
import { getPublicListsPaginated } from "@/lib/dal/public-lists";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { PublicListsPageClient } from "./PublicListsPageClient";
import {
  createServerT,
  loadMessages,
  normalizeLocale,
  toOpenGraphLocale,
} from "@/lib/i18n";

interface PublicListsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
    order?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  const title = `${t("publicLists.meta.title")} | ${t("app.name")}`;
  const description = t("publicLists.meta.description");
  return {
    title,
    description,
    alternates: { canonical: "/public-lists" },
    openGraph: {
      title,
      description,
      type: "website",
      locale: toOpenGraphLocale(locale),
      images: [
        {
          url: "/ogp-image.webp",
          width: 1200,
          height: 630,
          alt: t("publicLists.ogAlt"),
          type: "image/webp",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "/ogp-image.webp", alt: t("publicLists.ogAlt") }],
    },
  };
}

export default async function PublicListsPage({
  searchParams,
}: PublicListsPageProps) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  const params = await searchParams;
  const page = parseInt(params.page || "1");

  const limit = 12;
  const offset = (page - 1) * limit;

  // ソート条件の取得
  const sortBy = params.sort || "updated_at";
  const sortOrder = (params.order as "asc" | "desc") || "desc";

  // データ取得
  const { lists, totalCount } = await getPublicListsPaginated(
    limit,
    offset,
    sortBy,
    sortOrder
  );

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="bg-neutral-50">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t("publicLists.title"),
          description: t("publicLists.meta.description"),
          url: "https://clippymap.com/public-lists",
          numberOfItems: totalCount,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: totalCount,
            itemListElement: lists.map((list, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "CreativeWork",
                name: list.name,
                description: list.description,
                url: `https://clippymap.com/lists/${list.id}`,
                author: {
                  "@type": "Person",
                  name: list.creatorDisplayName || list.creatorUsername,
                },
                dateModified: list.updatedAt,
              },
            })),
          },
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 md:text-4xl mb-4">
            {t("publicLists.h1.part1")}
            <span className="text-primary-600">
              {t("publicLists.h1.highlight")}
            </span>
          </h1>
          <p className="text-sm sm:text-lg text-neutral-600 max-w-2xl mx-auto">
            {t("publicLists.description.line1")}
            <br />
            {t("publicLists.description.line2")}
          </p>
        </div>

        <Suspense fallback={<PublicListsSkeleton />}>
          <PublicListsPageClient
            initialLists={lists}
            totalCount={totalCount}
            currentPage={page}
            totalPages={totalPages}
            searchParams={params}
          />
        </Suspense>
      </div>
    </div>
  );
}

function PublicListsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-md p-6 h-64 animate-pulse"
        >
          <div className="h-6 bg-neutral-200 rounded mb-4"></div>
          <div className="h-4 bg-neutral-200 rounded mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded mb-2 w-3/4"></div>
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-neutral-200 rounded-full"></div>
                <div className="h-4 bg-neutral-200 rounded w-20"></div>
              </div>
              <div className="h-4 bg-neutral-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
