import { mockPlaceLists, mockUsers } from "@/lib/mockData"; // Import mockUsers and PlaceListGroup
import { List } from "lucide-react"; // ImageIconを追加
import { SearchableSampleList } from "./_components/SearchableSampleList"; // Import the new component

// Sample Page (Server Component for List Overview)
export default async function SampleListPage() {
  const placeLists = mockPlaceLists;
  const allUsers = mockUsers; // Get all users from mock data

  // Prepare data for SearchableSampleList
  const sampleListsForClient = placeLists.map((list) => {
    const collaborators = list.sharedUserIds
      ? allUsers.filter((user) => list.sharedUserIds?.includes(user.id))
      : [];
    // const imageUrl = list.places?.find((p) => p.imageUrl)?.imageUrl; // 変更：imageUrlは使用しない
    const placeCount = list.places?.length || 0;

    return {
      ...list, // listオブジェクト全体を渡し、placesも含まれるようにする
      collaborators,
      // image_url: imageUrl, // 変更：imageUrlは渡さない
      place_count: placeCount,
    };
  });

  return (
    // Removed the outer container div, now handled by layout.tsx
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium text-neutral-900 flex items-center">
          <List className="h-6 w-6 text-primary-600 mr-2" />{" "}
          {/* Changed Icon */}
          リスト一覧
        </h1>
      </div>

      {/* Use SearchableSampleList component */}
      <SearchableSampleList initialSampleLists={sampleListsForClient} />
    </>
  );
}
