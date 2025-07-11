import { z } from "zod";

// visited_status_enum の値をZodスキーマとして定義
export const VisitedStatusEnum = z.enum(["visited", "not_visited"]);

// 入力データのスキーマ定義 (zodを使用)
export const PlaceToRegisterSchema = z.object({
  placeId: z.string().min(1), // Google Place ID
  name: z.string().min(1),
  address: z.string().optional(), // formattedAddress
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  tags: z.array(
    z
      .string()
      .min(1, { message: "タグは1文字以上入力してください。" })
      .max(50, { message: "タグは50文字以内で入力してください。" })
  ),
  memo: z
    .string()
    .max(1000, { message: "メモは1000文字以内で入力してください。" })
    .optional(),
  listId: z.string().uuid(),
  visited_status: VisitedStatusEnum.optional(),
  // 階層地域情報（オプション）
  countryCode: z.string().optional(),
  countryName: z.string().optional(),
  adminAreaLevel1: z.string().optional(),
  regionHierarchy: z.record(z.any()).optional(), // JSONB形式
});

export const UpdatePlaceDetailsSchema = z.object({
  listPlaceId: z.string().uuid(),
  visitedStatus: z.enum(["visited", "not_visited"]),
  tags: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, "タグ名は空にできません"),
    })
  ),
});

export const DeletePlaceSchema = z.object({
  listPlaceId: z.string().uuid(),
});
