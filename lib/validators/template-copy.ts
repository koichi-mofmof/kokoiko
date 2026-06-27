import { z } from "zod";

/**
 * テンプレコピー機能の入力バリデーション
 * - placeIds は Google Place ID（TEXT）の配列。UUID ではない点に注意。
 * - target は新規作成 / 既存リスト追加の判別ユニオン。
 */
export const copyPlacesSchema = z.object({
  sourceListId: z.string().uuid("validation.list.id.invalid"),
  placeIds: z
    .array(z.string().min(1))
    .min(1, "templateCopy.errors.noSelection"),
  target: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("new"),
      name: z
        .string()
        .min(1, "validation.list.name.required")
        .max(100, "validation.list.name.tooLong"),
      description: z.string().max(500).optional(),
      isPublic: z.boolean().default(false),
    }),
    z.object({
      type: z.literal("existing"),
      listId: z.string().uuid("validation.list.id.invalid"),
    }),
  ]),
});

export type CopyPlacesInput = z.infer<typeof copyPlacesSchema>;
