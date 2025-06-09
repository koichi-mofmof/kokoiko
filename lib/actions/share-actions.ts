"use server";

import {
  deleteShareLink as deleteShareLinkCore,
  updateShareLink as updateShareLinkCore,
} from "@/lib/actions/lists";

export async function deleteShareLinkAction(id: string) {
  return await deleteShareLinkCore(id);
}

export async function updateShareLinkAction({
  id,
  default_permission,
  is_active,
}: {
  id: string;
  default_permission: "view" | "edit";
  is_active: boolean;
}) {
  return await updateShareLinkCore({ id, default_permission, is_active });
}
