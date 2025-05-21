import { List } from "lucide-react";
import { SearchableSampleList } from "./_components/SearchableSampleList";
import { SamplePageDataLoader } from "./_components/SamplePageDataLoader";

export default async function SampleListPage() {
  const { initialSampleLists } = await SamplePageDataLoader();

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-medium text-neutral-900 flex items-center">
          <List className="h-6 w-6 text-primary-600 mr-2" />
          マイリスト一覧（サンプル）
        </h1>
      </div>

      <SearchableSampleList initialSampleLists={initialSampleLists} />
    </>
  );
}
