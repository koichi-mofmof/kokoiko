import { z } from "zod";

export const autocompleteSchema = z.object({
  query: z.string().min(1, "検索クエリは必須です。"),
  sessionToken: z.string().uuid("無効なセッショントークンです。"),
  languageCode: z.string().optional().default("ja"),
  regionCode: z.string().optional().default("JP"),
});

export const placeDetailsSchema = z.object({
  placeId: z.string().min(1, "Place IDは必須です。"),
  sessionToken: z.string().uuid("無効なセッショントークンです。"),
  languageCode: z.string().optional().default("ja"),
  regionCode: z.string().optional().default("JP"),
});
