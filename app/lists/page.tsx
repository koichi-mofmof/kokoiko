import { ErrorMessageToast } from "@/app/components/lists/ErrorMessageToast";
import { MyLists } from "@/app/components/lists/MyLists";
import { MyPageDataLoader } from "@/app/components/lists/MyPageDataLoader";
import { List } from "lucide-react";

export default async function MyPage() {
  const { myListsForClient, error } = await MyPageDataLoader();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <ErrorMessageToast errorMessage={error} />
      <header className="mb-4 flex flex-row flex-wrap items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900 flex items-center">
          <List className="h-6 w-6 text-primary-600 mr-3" />
          マイリスト一覧
        </h1>
      </header>
      <MyLists initialLists={myListsForClient} />
    </div>
  );
}
