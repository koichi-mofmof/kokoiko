import { resolvePostProfileSetupDestination } from "@/lib/utils/post-profile-setup-destination";

describe("resolvePostProfileSetupDestination", () => {
  it("招待で参加したリストを見ている最中は、その場に留まる", () => {
    // 招待経由の登録は /lists/[listId] に着地する。
    // ここで /lists へ飛ばすと、招待されたリストから引き剥がされてしまう。
    expect(
      resolvePostProfileSetupDestination("/lists/497764de-b985-41ff-9c49")
    ).toBeNull();
  });

  it("リスト内の地点ページでも留まる", () => {
    expect(
      resolvePostProfileSetupDestination("/lists/list-1/place/place-1")
    ).toBeNull();
  });

  it("参加確認画面でも留まる", () => {
    expect(resolvePostProfileSetupDestination("/lists/join")).toBeNull();
  });

  it("行き先が無い通常の登録では、最初のリスト作成へ導く", () => {
    expect(resolvePostProfileSetupDestination("/lists")).toBe(
      "/lists?firstList=1"
    );
    expect(resolvePostProfileSetupDestination("/")).toBe("/lists?firstList=1");
    expect(resolvePostProfileSetupDestination("/settings")).toBe(
      "/lists?firstList=1"
    );
  });

  it("pathname が取れない場合も既定の導線に落とす", () => {
    expect(resolvePostProfileSetupDestination(null)).toBe("/lists?firstList=1");
    expect(resolvePostProfileSetupDestination("")).toBe("/lists?firstList=1");
  });
});
