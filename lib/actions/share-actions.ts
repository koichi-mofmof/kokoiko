"use server";
import { createShareLink } from "@/lib/actions/lists";
import {
  deleteShareLink as deleteShareLinkCore,
  updateShareLink as updateShareLinkCore,
} from "@/lib/actions/lists";

export async function createShareLinkAction(formData: FormData): Promise<void> {
  const listId = formData.get("listId") as string;
  const permission = formData.get("permission") as "view" | "edit";
  const expiresAt = formData.get("expiresAt") as string;
  const maxUses = formData.get("maxUses")
    ? Number(formData.get("maxUses"))
    : undefined;
  await createShareLink({
    listId,
    permission,
    expiresAt: expiresAt || undefined,
    maxUses: maxUses || undefined,
  });
}

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
