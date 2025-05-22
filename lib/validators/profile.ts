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
