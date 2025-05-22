import { List } from "lucide-react";
import { ErrorMessageToast } from "./_components/ErrorMessageToast";
import { MyLists } from "./_components/MyLists";
import { MyPageDataLoader } from "./_components/MyPageDataLoader";

export default async function MyPage() {
  const { myListsForClient, error } = await MyPageDataLoader();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <ErrorMessageToast errorMessage={error} />
      <header className="mb-4 flex flex-row flex-wrap items-center justify-between">
        <div className="mr-4 mb-2">
          <h1 className="text-xl font-bold text-neutral-900 flex items-center">
            <List className="h-6 w-6 text-primary-600 mr-3" />
            マイリスト一覧
          </h1>
          <p className="text-neutral-600 text-xs sm:text-sm mt-2">
            あなたが作成したリストや、共同編集者として参加しているリストを表示しています。
          </p>
        </div>
      </header>
      <MyLists initialLists={myListsForClient} />
    </div>
  );
}
