import ListDetailView from "@/app/components/lists/ListDetailView";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPlaceListDetails, mockUsers } from "@/lib/mockData";
import { ParticipantAvatars } from "@/components/ui/avatar";

interface SampleListDetailPageProps {
  params: Promise<{ listId: string }>;
}

// Sample List Detail Page (Server Component - Wrapper)
export default async function SampleListDetailPage({
  params,
}: SampleListDetailPageProps) {
  const { listId } = await params;

  // Use the variable to get details
  const listDetails = await getPlaceListDetails(listId);

  if (!listDetails) {
    notFound(); // Show 404 if list not found
  }

  // Filter participants based on sharedUserIds
  const participants = listDetails.sharedUserIds
    ? mockUsers.filter((user) => listDetails.sharedUserIds?.includes(user.id))
    : []; // If no sharedUserIds, show no participants for now

  // Find the owner of the list
  const owner = mockUsers.find((user) => user.id === listDetails.ownerId);

  // If owner is not found, it's an unexpected state, but we should handle it gracefully.
  // For now, we'll proceed assuming owner will be found as per mock data structure.
  // In a real app, you might want to throw an error or show a specific UI.
  if (!owner) {
    console.error(
      `Owner not found for listId: ${listId} with ownerId: ${listDetails.ownerId}`
    );
    notFound(); // Or handle as a critical error
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href="/sample"
          className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          マイリスト一覧に戻る
        </Link>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-medium text-neutral-900">
          {listDetails.name}
        </h1>
        {listDetails.description && (
          <p className="mt-1 text-sm text-neutral-500">
            {listDetails.description}
          </p>
        )}
      </div>

      <div className="mb-4">
        <ParticipantAvatars owner={owner} participants={participants} />
      </div>

      <Suspense
        fallback={
          <div className="text-center p-8">リスト詳細を読み込み中...</div>
        }
      >
        <ListDetailView
          places={listDetails.places}
          listId={listId}
          isSample={true}
        />
      </Suspense>
    </>
  );
}
