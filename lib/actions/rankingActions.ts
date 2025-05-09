"use server";

import { revalidatePath } from "next/cache";
import { mockPlaceLists, PlaceListGroup, RankedPlace } from "@/lib/mockData"; // mockPlacesは不要なので削除

// 実際にはここでSupabaseクライアント等を使用してDB操作を行う
// 以下はモックデータ操作の例

export async function updateRankingAction(
  listId: string,
  rankingTitle: string | undefined,
  rankingDescription: string | undefined,
  rankedPlaces: RankedPlace[]
): Promise<PlaceListGroup | { error: string }> {
  console.log("[Server Action] updateRankingAction called with:", {
    listId,
    rankingTitle,
    rankingDescription,
    rankedPlaces,
  });

  // 対象のリストをモックデータから検索
  const listIndex = mockPlaceLists.findIndex((list) => list.id === listId);

  if (listIndex === -1) {
    console.error(`[Server Action] List with id ${listId} not found.`);
    return { error: `リスト(ID: ${listId})が見つかりません。` };
  }

  // モックデータを更新
  const updatedList: PlaceListGroup = {
    ...mockPlaceLists[listIndex],
    rankingTitle:
      rankingTitle || mockPlaceLists[listIndex].name + " のランキング", // タイトルが空ならデフォルト値を設定
    rankingDescription: rankingDescription,
    ranking: rankedPlaces,
    // updatedAt: new Date(), // 実際のDBなら更新日時も更新
  };
  mockPlaceLists[listIndex] = updatedList;

  console.log("[Server Action] Mock data updated:", mockPlaceLists[listIndex]);

  // キャッシュの再検証 (関連するページパスを指定)
  // この例では、特定のリスト詳細ページと、もしあればリスト一覧ページなどを再検証
  revalidatePath(`/sample/${listId}`);
  revalidatePath("/sample"); // 例: サンプルリスト一覧ページがあれば

  // 更新後のリストデータを返す (クライアント側でUIを即時更新するため)
  return updatedList;
}

// 他にもランキング関連のActionがあればここに追加
// 例: getRankingAction など (ただし、今回は RankingView で getPlaceListDetails を使用)
