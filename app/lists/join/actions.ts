"use server";

import { joinListViaShareLink, verifyShareToken } from "@/lib/actions/lists";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 招待プレビューから会員登録/ログインして戻ってきた人を、確認ボタンを挟まずに参加させる。
 * 参加の意思は登録前のCTA押下で示されているため、ここで再確認は求めない。
 */
export async function autoJoinFromInvite(
  token: string
): Promise<{ success: true; listId: string } | { success: false; errorKey: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, errorKey: "errors.auth.loginRequired" };
  }

  const verifyResult = await verifyShareToken(token);
  if (!verifyResult.success) {
    return {
      success: false,
      errorKey: verifyResult.reasonKey || "errors.validation.invalidToken",
    };
  }

  const result = await joinListViaShareLink(
    token,
    user.id,
    verifyResult.ownerId
  );

  if (!result.success) {
    return {
      success: false,
      errorKey: result.errorKey || "errors.common.insertFailed",
    };
  }

  revalidatePath(`/lists/${verifyResult.listId}`);
  return { success: true, listId: verifyResult.listId as string };
}

