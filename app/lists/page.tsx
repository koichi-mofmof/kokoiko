import { ErrorMessageToast } from "@/app/components/lists/ErrorMessageToast";
import { MyLists } from "@/app/components/lists/MyLists";
import { MyPageDataLoader } from "@/app/components/lists/MyPageDataLoader";
import { List } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "マイリスト一覧 | ClippyMap",
  description: "あなたが作成・共有されたリストの一覧ページ",
  alternates: {
    canonical: "/lists",
  },
  openGraph: {
    title: "マイリスト一覧 | ClippyMap",
    description: "あなたが作成・共有されたリストの一覧ページ",
    type: "website",
    locale: "ja_JP",
    images: [
      {
        url: "/ogp-image.png",
        width: 1200,
        height: 630,
        alt: "マイリスト一覧 - ClippyMap",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "マイリスト一覧 | ClippyMap",
    description: "あなたが作成・共有されたリストの一覧ページ",
    images: ["/ogp-image.png"],
  },
};

export default async function MyPage() {
  const { lists, error } = await MyPageDataLoader();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <ErrorMessageToast errorMessage={error} />

      <header className="mb-4 flex flex-row flex-wrap items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900 flex items-center">
          <List className="h-6 w-6 text-primary-600 mr-3" />
          マイリスト一覧
        </h1>
      </header>
      <MyLists initialLists={lists} />
    </div>
  );
}
