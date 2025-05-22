import { z } from "zod";

export const createListSchema = z.object({
  name: z.string().min(1, "リスト名は必須です"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export const updateListSchema = z.object({
  id: z.string().uuid("無効なリストIDです"),
  name: z.string().min(1, "リスト名は必須です"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});
