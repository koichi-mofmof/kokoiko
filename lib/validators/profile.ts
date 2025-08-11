import { z } from "zod";

export const profileSchema = z.object({
  display_name: z
    .string()
    .max(50, { message: "表示名は50文字以下で入力してください。" })
    .optional(),
  bio: z
    .string()
    .max(500, { message: "自己紹介は500文字以下で入力してください。" })
    .optional(),
});

// i18n対応版: 呼び出し側で t を渡してローカライズされたメッセージを生成
export function createProfileSchemaT(
  t: (key: string, params?: Record<string, string | number>) => string
) {
  return z.object({
    display_name: z
      .string()
      .max(50, { message: t("validation.profile.displayName.max50") })
      .optional(),
    bio: z
      .string()
      .max(500, { message: t("validation.profile.bio.max500") })
      .optional(),
  });
}
