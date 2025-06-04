"use server";

import { joinListViaShareLink, verifyShareToken } from "@/lib/actions/lists";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function handleJoin(formData: FormData) {
  const token = formData.get("token") as string;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      error: "ログイン情報が取得できません。再度ログインしてください。",
    };
  }
  // トークン検証
  const verifyResult = await verifyShareToken(token);
  if (!verifyResult.success) {
    return {
      success: false,
      error: verifyResult.reason || "無効なトークンです。",
    };
  }
  const result = await joinListViaShareLink(
    token,
    user.id,
    verifyResult.ownerId
  );
  if (result.success) {
    revalidatePath(`/lists/${verifyResult.listId}`);
    redirect(`/lists/${verifyResult.listId}`);
  }
  return {
    success: false,
    error: result.error || "リストへの参加に失敗しました。",
  };
}
