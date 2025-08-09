"use server";

import { createClient } from "@/lib/supabase/server";
import { RankedPlace } from "@/types";

// ランキングビュー用データ取得API
export async function fetchRankingViewData(listId: string) {
  const supabase = await createClient();

  // 1. ランキング取得
  const { data: rankings, error: rankingError } = await supabase
    .from("list_place_rankings")
    .select("place_id, rank, comment")
    .eq("list_id", listId)
    .order("rank", { ascending: true });
  if (rankingError)
    return {
      errorKey: "errors.common.fetchFailed",
      error: rankingError.message,
    };

  // place_id→placeIdへ変換
  const rankingsCamel = (rankings || []).map(
    (r: { place_id: string; rank: number; comment?: string }) => ({
      placeId: r.place_id,
      rank: r.rank,
      comment: r.comment,
    })
  );

  // 2. リスト内の場所取得
  const { data: listPlaces, error: listPlacesError } = await supabase
    .from("list_places")
    .select("place_id")
    .eq("list_id", listId);
  if (listPlacesError)
    return {
      errorKey: "errors.common.fetchFailed",
      error: listPlacesError.message,
    };
  const placeIds = listPlaces?.map((lp) => lp.place_id) || [];

  // 3. placesテーブルから詳細取得
  let places = [];
  if (placeIds.length > 0) {
    const { data: placesData, error: placesError } = await supabase
      .from("places")
      .select("*")
      .in("id", placeIds);
    if (placesError)
      return {
        errorKey: "errors.common.fetchFailed",
        error: placesError.message,
      };
    places = placesData || [];
  }

  return {
    rankings: rankingsCamel,
    places,
  };
}

// ランキング保存API
export async function saveRankingViewData({
  listId,
  rankedPlaces,
}: {
  listId: string;
  rankedPlaces: RankedPlace[];
}) {
  const supabase = await createClient();

  // 認証ユーザー取得
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      errorKey: "errors.common.unauthorized",
      error: "認証エラー: ログインが必要です",
    };
  }
  const userId = user.id;

  // 1. 既存ランキング削除
  await supabase.from("list_place_rankings").delete().eq("list_id", listId);

  // 2. 新ランキング一括insert
  if (rankedPlaces.length > 0) {
    const insertRows = rankedPlaces.map((r) => ({
      list_id: listId,
      place_id: r.placeId,
      rank: r.rank,
      comment: r.comment || null,
      created_by: userId,
    }));
    const { error: insertError } = await supabase
      .from("list_place_rankings")
      .insert(insertRows);
    if (insertError)
      return {
        errorKey: "errors.common.insertFailed",
        error: insertError.message,
      };
  }

  return { success: true };
}
