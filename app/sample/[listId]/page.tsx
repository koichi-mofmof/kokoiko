import ListDetailView from "@/app/components/sample/ListDetailView";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPlaceListDetails, mockUsers } from "@/lib/mockData";
import { ParticipantAvatars } from "../_components/participant-avatars";

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

  return (
    <>
      {/* Static parts rendered on the server */}
      <div className="mb-6">
        <Link
          href="/sample"
          className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          リスト一覧に戻る
        </Link>
      </div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-medium text-neutral-900 flex items-center">
            {listDetails.name}
          </h1>
          <ParticipantAvatars participants={participants} />
        </div>
        {listDetails.description && (
          <p className="mt-1 text-sm text-neutral-500">
            {listDetails.description}
          </p>
        )}
      </div>

      {/* Interactive part rendered on the client, wrapped in Suspense */}
      <Suspense
        fallback={
          <div className="text-center p-8">リスト詳細を読み込み中...</div>
        }
      >
        <ListDetailView places={listDetails.places} />
      </Suspense>
    </>
  );
}
