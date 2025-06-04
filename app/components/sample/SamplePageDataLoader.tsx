import { mockPlaceLists, mockUsers } from "@/lib/mockData";
import type { PlaceList, User } from "@/types"; // User 型もインポート

// SearchableSampleList に渡すデータの型定義 (page.tsx から移動または共通化を検討)
// PlaceListのcreated_byがオプショナルであると仮定して調整
export interface SampleListForClient
  extends Omit<
    PlaceList,
    | "created_by"
    | "places"
    | "sharedUserIds"
    | "ranking"
    | "rankingTitle"
    | "rankingDescription"
  > {
  id: string; // id は PlaceList から必須で継承
  name: string; // name は PlaceList から必須で継承
  description?: string;
  created_by?: string; // created_by をオプショナルとして明示
  ownerId: string; // ownerId を追加
  places: NonNullable<PlaceList["places"]>; // オプショナルから必須に変更し、NonNullable を使用
  sharedUserIds?: PlaceList["sharedUserIds"];
  ranking?: PlaceList["ranking"];
  rankingTitle?: PlaceList["rankingTitle"];
  rankingDescription?: PlaceList["rankingDescription"];
  collaborators: (User & { isOwner: boolean })[];
  place_count: number;
}

export async function SamplePageDataLoader(): Promise<{
  initialSampleLists: SampleListForClient[];
}> {
  const placeLists = mockPlaceLists;
  const allUsers = mockUsers;

  const sampleListsForClient = placeLists.map((list) => {
    const creatorId =
      (list as unknown as PlaceList).created_by ||
      list.sharedUserIds?.[0] ||
      "";
    const owner = allUsers.find((user) => user.id === creatorId);
    const sharedUsers = list.sharedUserIds
      ? allUsers.filter(
          (user) =>
            list.sharedUserIds?.includes(user.id) && user.id !== creatorId
        )
      : [];

    const collaborators = [
      ...(owner ? [{ ...owner, isOwner: true }] : []),
      ...sharedUsers.map((user) => ({
        ...user,
        isOwner: false,
        permission: "edit",
      })),
    ];

    const placeCount = list.places?.length || 0;

    return {
      ...list,
      created_by:
        (list as unknown as PlaceList).created_by ||
        list.sharedUserIds?.[0] ||
        undefined,
      ownerId: creatorId, // ownerId を creatorId から設定
      collaborators,
      place_count: placeCount,
      places: list.places || [],
    } as SampleListForClient;
  });

  return { initialSampleLists: sampleListsForClient };
}
