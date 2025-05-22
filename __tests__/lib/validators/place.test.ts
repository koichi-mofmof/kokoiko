import {
  PlaceToRegisterSchema,
  VisitedStatusEnum,
} from "@/lib/validators/place";

describe("PlaceToRegisterSchema", () => {
  it("正常系: 必須項目が揃っていればバリデーションOK", () => {
    const result = PlaceToRegisterSchema.safeParse({
      placeId: "abc123",
      name: "テストスポット",
      tags: ["カフェ"],
      listId: "b3b1c2d3-4e5f-6789-0123-456789abcdef",
    });
    expect(result.success).toBe(true);
  });

  it("正常系: 任意項目も含めてバリデーションOK", () => {
    const result = PlaceToRegisterSchema.safeParse({
      placeId: "abc123",
      name: "テストスポット",
      address: "東京都港区芝公園4-2-8",
      latitude: 35.6586,
      longitude: 139.7454,
      tags: ["観光地", "ランドマーク"],
      memo: "夜景がきれいです。",
      listId: "b3b1c2d3-4e5f-6789-0123-456789abcdef",
      visited_status: VisitedStatusEnum.Enum.visited,
    });
    expect(result.success).toBe(true);
  });

  it("異常系: 必須項目不足でエラー", () => {
    const result = PlaceToRegisterSchema.safeParse({});
    const issues = result.success ? [] : result.error.issues;
    expect(result.success).toBe(false);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("異常系: listIdがUUIDでない場合エラー", () => {
    const result = PlaceToRegisterSchema.safeParse({
      placeId: "abc123",
      name: "テストスポット",
      tags: ["カフェ"],
      listId: "not-a-uuid",
    });
    const issues = result.success ? [] : result.error.issues;
    expect(result.success).toBe(false);
    expect(issues.some((i) => i.path.includes("listId"))).toBe(true);
  });

  it("異常系: タグが空文字の場合エラー", () => {
    const result = PlaceToRegisterSchema.safeParse({
      placeId: "abc123",
      name: "テストスポット",
      tags: [""],
      listId: "b3b1c2d3-4e5f-6789-0123-456789abcdef",
    });
    const issues = result.success ? [] : result.error.issues;
    expect(result.success).toBe(false);
    expect(issues.some((i) => i.path.includes("tags"))).toBe(true);
  });

  it("異常系: memoが1001文字以上でエラー", () => {
    const result = PlaceToRegisterSchema.safeParse({
      placeId: "abc123",
      name: "テストスポット",
      tags: ["カフェ"],
      listId: "b3b1c2d3-4e5f-6789-0123-456789abcdef",
      memo: "あ".repeat(1001),
    });
    const issues = result.success ? [] : result.error.issues;
    expect(result.success).toBe(false);
    expect(issues.some((i) => i.path.includes("memo"))).toBe(true);
  });

  it("異常系: visited_statusが不正な値でエラー", () => {
    const result = PlaceToRegisterSchema.safeParse({
      placeId: "abc123",
      name: "テストスポット",
      tags: ["カフェ"],
      listId: "b3b1c2d3-4e5f-6789-0123-456789abcdef",
      visited_status: "invalid-status",
    });
    const issues = result.success ? [] : result.error.issues;
    expect(result.success).toBe(false);
    expect(issues.some((i) => i.path.includes("visited_status"))).toBe(true);
  });
});
