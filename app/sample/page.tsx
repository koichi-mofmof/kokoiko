import { SamplePageDataLoader } from "@/app/components/sample/SamplePageDataLoader";
import { SearchableSampleList } from "@/app/components/sample/SearchableSampleList";

export default async function SampleListPage() {
  const { initialSampleLists } = await SamplePageDataLoader();

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-neutral-900 flex items-center">
          マイリスト一覧（サンプル）
        </h1>
      </div>

      <SearchableSampleList initialSampleLists={initialSampleLists} />
    </>
  );
}
