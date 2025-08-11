import { z } from "zod";

export const AddCommentSchema = z.object({
  comment: z
    .string()
    .min(1, { message: "validation.comment.required" })
    .max(500, { message: "validation.comment.max500" }),
  listPlaceId: z.string().min(1, { message: "validation.list.id.invalid" }),
});

export type AddCommentInput = z.infer<typeof AddCommentSchema>;

export const UpdateCommentSchema = z.object({
  commentId: z.string().min(1, { message: "validation.comment.id.invalid" }),
  comment: z
    .string()
    .min(1, { message: "validation.comment.required" })
    .max(500, { message: "validation.comment.max500" }),
});

export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;
