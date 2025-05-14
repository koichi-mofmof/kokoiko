import { mockPlaceLists, mockUsers } from "@/lib/mockData"; // Import mockUsers and PlaceListGroup
import { List } from "lucide-react"; // ImageIconを追加
import { SearchableSampleList } from "./_components/SearchableSampleList"; // Import the new component
import { SamplePageDataLoader } from "./_components/SamplePageDataLoader"; // 作成したデータローダーをインポート
// import type { PlaceList } from "@/types"; // SamplePageDataLoaderで処理するので不要に

// Sample Page (Server Component for List Overview)
export default async function SampleListPage() {
  // データフェッチ処理をSamplePageDataLoaderに委譲
  const { initialSampleLists } = await SamplePageDataLoader();

  return (
    // Removed the outer container div, now handled by layout.tsx
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-medium text-neutral-900 flex items-center">
          <List className="h-6 w-6 text-primary-600 mr-2" />
          リスト一覧（サンプル）
        </h1>
      </div>

      {/* Use SearchableSampleList component */}
      <SearchableSampleList initialSampleLists={initialSampleLists} />
    </>
  );
}
