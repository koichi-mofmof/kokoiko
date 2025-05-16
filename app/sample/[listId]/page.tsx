import ListDetailView from "@/app/components/lists/ListDetailView";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPlaceListDetails, mockUsers } from "@/lib/mockData";
import { ParticipantAvatars } from "@/app/components/common/ParticipantAvatars";

// Removed local definitions of PlaceListGroup, mockPlaceLists, and getPlaceListDetails

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
    // This case should ideally not happen with current mock data logic
    // but adding a guard for robustness.
    // Depending on requirements, you could notFound() or provide a default owner, or hide ParticipantAvatars.
    // For this sample, if owner is somehow not found, we won't render ParticipantAvatars by passing undefined,
    // which might then require ParticipantAvatars to handle undefined owner or we ensure owner is always passed.
    // Given the current error, we MUST pass a valid owner.
    // Let's assume for mock data, owner will always be found.
    // If not, `ParticipantAvatars` will error out as per the original problem if it doesn't handle undefined owner.
    // The original problem indicates owner is required by ParticipantAvatars.
    // So, if owner is not found from mockUsers, we should probably trigger notFound() or similar error.
    // For now, if owner is not found, this will lead to an error similar to the original one
    // when ParticipantAvatars tries to access owner.id if owner is undefined.
    // A better approach for production would be to ensure data integrity or handle this case explicitly.
    // Forcing an error if owner is not found, as ParticipantAvatars requires it.
    console.error(
      `Owner not found for listId: ${listId} with ownerId: ${listDetails.ownerId}`
    );
    // To ensure ParticipantAvatars gets a valid owner, or we make owner optional there.
    // For now, let's stick to the requirement that owner is mandatory in ParticipantAvatars.
    // If owner is not found, this implies data inconsistency in mock data or logic.
    // Given ParticipantAvatars expects a non-null owner, we should ensure it or handle the error upstream.
    // Let's assume owner will be found based on mock data setup.
    // If a real scenario where owner might not exist, ParticipantAvatars should be made resilient
    // or this page should handle it (e.g., by not rendering it or showing an error).
    // For now, if owner is not found, this will lead to an error similar to the original one
    // when ParticipantAvatars tries to access owner.id if owner is undefined.
    // A better approach for production would be to ensure data integrity or handle this case explicitly.
    // Forcing an error if owner is not found, as ParticipantAvatars requires it.
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
          リスト一覧に戻る
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
        <ListDetailView places={listDetails.places} listId={listId} />
      </Suspense>
    </>
  );
}
