import { ErrorMessageToast } from "@/app/components/lists/ErrorMessageToast";
import { MyLists } from "@/app/components/lists/MyLists";
import { MyPageDataLoader } from "@/app/components/lists/MyPageDataLoader";
import type { Metadata } from "next";
import {
  createServerT,
  loadMessages,
  normalizeLocale,
  toOpenGraphLocale,
} from "@/lib/i18n";
import { cookies } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  return {
    title: `${t("listsPage.title")} | ClippyMap`,
    description: t("listsPage.description"),
    alternates: { canonical: "/lists" },
    openGraph: {
      title: `${t("listsPage.title")} | ClippyMap`,
      description: t("listsPage.description"),
      type: "website",
      locale: toOpenGraphLocale(locale),
      images: [
        {
          url: "/ogp-image.webp",
          width: 1200,
          height: 630,
          alt: `${t("listsPage.title")} - ClippyMap`,
          type: "image/webp",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("listsPage.title")} | ClippyMap`,
      description: t("listsPage.description"),
      images: [
        { url: "/ogp-image.webp", alt: `${t("listsPage.title")} - ClippyMap` },
      ],
    },
  };
}

export default async function MyPage() {
  const { lists, error } = await MyPageDataLoader();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <ErrorMessageToast errorMessage={error} />

      <header className="mb-4 flex flex-row flex-wrap items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900 flex items-center">
          {await (async () => {
            const c = await cookies();
            const l = normalizeLocale(c.get("lang")?.value);
            const m = await loadMessages(l);
            const t = createServerT(m as Record<string, string>);
            return t("listsPage.title");
          })()}
        </h1>
      </header>
      <MyLists initialLists={lists} />
    </div>
  );
}
