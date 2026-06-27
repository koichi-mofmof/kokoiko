import { copyPlacesSchema } from "@/lib/validators/template-copy";

const validUuid = "11111111-1111-1111-1111-111111111111";

describe("copyPlacesSchema", () => {
  it("新規リスト作成の正常な入力を受理する", () => {
    const result = copyPlacesSchema.safeParse({
      sourceListId: validUuid,
      placeIds: ["place_a", "place_b"],
      target: { type: "new", name: "私のリスト", isPublic: false },
    });
    expect(result.success).toBe(true);
  });

  it("既存リスト追加の正常な入力を受理する", () => {
    const result = copyPlacesSchema.safeParse({
      sourceListId: validUuid,
      placeIds: ["place_a"],
      target: { type: "existing", listId: validUuid },
    });
    expect(result.success).toBe(true);
  });

  it("placeIds が空なら拒否し noSelection メッセージを返す", () => {
    const result = copyPlacesSchema.safeParse({
      sourceListId: validUuid,
      placeIds: [],
      target: { type: "new", name: "x", isPublic: false },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe(
        "templateCopy.errors.noSelection"
      );
    }
  });

  it("sourceListId が UUID でなければ拒否する", () => {
    const result = copyPlacesSchema.safeParse({
      sourceListId: "not-a-uuid",
      placeIds: ["p1"],
      target: { type: "new", name: "x", isPublic: false },
    });
    expect(result.success).toBe(false);
  });

  it("新規作成でリスト名が空なら拒否する", () => {
    const result = copyPlacesSchema.safeParse({
      sourceListId: validUuid,
      placeIds: ["p1"],
      target: { type: "new", name: "", isPublic: false },
    });
    expect(result.success).toBe(false);
  });

  it("新規作成でリスト名が100文字超なら拒否する", () => {
    const result = copyPlacesSchema.safeParse({
      sourceListId: validUuid,
      placeIds: ["p1"],
      target: { type: "new", name: "あ".repeat(101), isPublic: false },
    });
    expect(result.success).toBe(false);
  });

  it("既存追加で listId が UUID でなければ拒否する", () => {
    const result = copyPlacesSchema.safeParse({
      sourceListId: validUuid,
      placeIds: ["p1"],
      target: { type: "existing", listId: "bad" },
    });
    expect(result.success).toBe(false);
  });
});
