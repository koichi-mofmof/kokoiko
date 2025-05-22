import { registerPlaceToListAction } from "@/lib/actions/place-actions";
import { createClient } from "@/lib/supabase/server";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));
jest.mock("@/lib/supabase/server");

describe("registerPlaceToListAction: 地点登録サーバーアクション", () => {
  const validInput = {
    placeId: "abc123",
    name: "テストスポット",
    tags: ["カフェ"],
    listId: "b3b1c2d3-4e5f-6789-0123-456789abcdef",
  };
  const prevState = { success: false };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("認証されていない場合はエラーを返すこと", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    });
    const result = await registerPlaceToListAction(prevState, validInput);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/認証/);
  });

  it("バリデーションエラー時はエラーとフィールドエラーを返すこと", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user1" } }, error: null }),
      },
    });
    // listIdがUUIDでない
    const invalidInput = { ...validInput, listId: "not-a-uuid" };
    const result = await registerPlaceToListAction(prevState, invalidInput);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/入力データ/);
    expect(result.fieldErrors?.listId).toBeDefined();
  });

  it("重複登録時はエラーを返すこと", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user1" } }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "exists" },
                error: null,
              }),
            }),
          }),
        }),
      }),
    });
    const result = await registerPlaceToListAction(prevState, validInput);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/既にこのリストに登録/);
  });

  it("正常系: 新規登録が成功すること", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user1" } }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      }),
      rpc: async () => ({ data: "new-list-place-id", error: null }),
    });
    const result = await registerPlaceToListAction(prevState, validInput);
    expect(result.success).toBe(true);
    expect(result.listPlaceId).toBe("new-list-place-id");
    expect(result.message).toMatch(/追加/);
  });

  it("RPCエラー時はエラーを返すこと", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user1" } }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      }),
      rpc: async () => ({
        data: null,
        error: { message: "Failed to upsert place" },
      }),
    });
    const result = await registerPlaceToListAction(prevState, validInput);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/保存処理中/);
  });
});
