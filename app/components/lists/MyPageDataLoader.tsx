"use server";

import { getMyPageData, ListsPageData } from "@/lib/dal/lists";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * RLS活用型DALを使用するMyPageDataLoader
 * - 新しいgetMyPageData関数を使用
 * - RLSポリシーによる自動権限チェック
 * - パフォーマンス向上（並列処理、インデックス活用）
 */
export async function MyPageDataLoader(): Promise<ListsPageData> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 新しいRLS活用型DALを使用
  const myPageData = await getMyPageData(user.id);

  if (myPageData.error) {
    console.error(
      "Error in MyPageDataLoaderImproved after fetching data:",
      myPageData.error
    );
  }

  return myPageData;
}
