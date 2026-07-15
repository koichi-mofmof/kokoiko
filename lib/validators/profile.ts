import { z } from "zod";

// i18n対応: 呼び出し側で t を渡してローカライズされたメッセージを生成する。
// 画面表示にそのまま使えるよう、メッセージは i18n キーではなく翻訳済み文字列を返す。
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
