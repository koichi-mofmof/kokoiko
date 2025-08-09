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
      errorKey: "errors.auth.loginRequired",
      error: "errors.auth.loginRequired",
    };
  }
  // トークン検証
  const verifyResult = await verifyShareToken(token);
  if (!verifyResult.success) {
    return {
      success: false,
      errorKey: verifyResult.reasonKey || "errors.validation.invalidToken",
      error: verifyResult.reason || "join.invalidToken",
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
    errorKey: result.errorKey || undefined,
    error: result.error || "join.errorDesc",
  };
}
