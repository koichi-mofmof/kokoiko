import { z } from "zod";

export const AddCommentSchema = z.object({
  comment: z
    .string()
    .min(1, { message: "コメントを入力してください。" })
    .max(500, { message: "コメントは500文字以内で入力してください。" }),
  listPlaceId: z.string().min(1, { message: "不正なリストIDです。" }),
});

export type AddCommentInput = z.infer<typeof AddCommentSchema>;

export const UpdateCommentSchema = z.object({
  commentId: z.string().min(1, { message: "不正なコメントIDです。" }),
  comment: z
    .string()
    .min(1, { message: "コメントを入力してください。" })
    .max(500, { message: "コメントは500文字以内で入力してください。" }),
});

export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;
