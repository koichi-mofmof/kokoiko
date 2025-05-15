"use server";

import { fetchMyPageData, MyPageData } from "@/lib/dal/lists";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function MyPageDataLoader(): Promise<MyPageData> {
  const supabase = await createClient(); // まずクライアントを生成
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(); // 生成したクライアントを使用

  if (authError || !user) {
    redirect("/login");
  }

  const myPageData = await fetchMyPageData(user.id);

  if (myPageData.error) {
    console.error(
      "Error in MyPageDataLoader after fetching data:",
      myPageData.error
    );
  }

  return myPageData;
}
