import { pickPlaceComment } from "@/lib/dal/comment-utils";

const row = (
  list_place_id: string,
  user_id: string,
  comment: string,
  created_at: string
) => ({ list_place_id, user_id, comment, created_at });

describe("pickPlaceComment", () => {
  it("追加者のコメントを優先して返す（著者ID付き）", () => {
    const comments = [
      row("lp-1", "adder", "追加者の声", "2025-01-02T00:00:00Z"),
      row("lp-1", "collab", "コラボの声", "2025-01-01T00:00:00Z"),
    ];
    expect(pickPlaceComment("lp-1", "adder", comments)).toEqual({
      userId: "adder",
      comment: "追加者の声",
    });
  });

  it("追加者が未記入でもコラボレーターのコメントを表示する", () => {
    const comments = [row("lp-2", "collab", "コラボの声", "2025-01-01T00:00:00Z")];
    expect(pickPlaceComment("lp-2", "adder", comments)).toEqual({
      userId: "collab",
      comment: "コラボの声",
    });
  });

  it("追加者が空白のみならコラボレーターの非空コメントにフォールバック", () => {
    const comments = [
      row("lp-3", "adder", "   ", "2025-01-01T00:00:00Z"),
      row("lp-3", "collab", "コラボの声", "2025-01-02T00:00:00Z"),
    ];
    expect(pickPlaceComment("lp-3", "adder", comments)).toEqual({
      userId: "collab",
      comment: "コラボの声",
    });
  });

  it("同一著者の複数コメントは最古の非空を採用する", () => {
    const comments = [
      row("lp-4", "adder", "後から", "2025-03-01T00:00:00Z"),
      row("lp-4", "adder", "最初のひとこと", "2025-01-01T00:00:00Z"),
    ];
    expect(pickPlaceComment("lp-4", "adder", comments)).toEqual({
      userId: "adder",
      comment: "最初のひとこと",
    });
  });

  it("複数コラボのコメントは最古のものを採用する", () => {
    const comments = [
      row("lp-5", "b", "Bの声", "2025-02-01T00:00:00Z"),
      row("lp-5", "a", "Aの声", "2025-01-01T00:00:00Z"),
    ];
    expect(pickPlaceComment("lp-5", "adder", comments)).toEqual({
      userId: "a",
      comment: "Aの声",
    });
  });

  it("前後の空白はトリムして返す", () => {
    const comments = [row("lp-6", "u", "  ひとこと  ", "2025-01-01T00:00:00Z")];
    expect(pickPlaceComment("lp-6", "u", comments)).toEqual({
      userId: "u",
      comment: "ひとこと",
    });
  });

  it("コメントが無ければ undefined", () => {
    expect(pickPlaceComment("lp-9", "adder", [])).toBeUndefined();
  });
});
