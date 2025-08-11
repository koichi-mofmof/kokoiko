import { z } from "zod";

export const createListSchema = z.object({
  name: z.string().min(1, "validation.list.name.required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export const updateListSchema = z.object({
  id: z.string().uuid("validation.list.id.invalid"),
  name: z.string().min(1, "validation.list.name.required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});
