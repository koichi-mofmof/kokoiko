import { registerPlaceToListAction } from "@/lib/actions/place-actions";
import { createClient } from "@/lib/supabase/server";
import { getActiveSubscription } from "@/lib/dal/subscriptions";
import { getRegisteredPlacesCountThisMonth } from "@/lib/utils/subscription-utils";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/dal/subscriptions");
jest.mock("@/lib/utils/subscription-utils");

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
    // サブスクリプション関連のモックをデフォルト値に設定
    (getActiveSubscription as jest.Mock).mockResolvedValue(null);
    (getRegisteredPlacesCountThisMonth as jest.Mock).mockResolvedValue(0);
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
      rpc: jest.fn().mockResolvedValue({ data: "new-id", error: null }),
    });
    // listIdがUUIDでない
    const invalidInput = { ...validInput, listId: "not-a-uuid" };
    const result = await registerPlaceToListAction(prevState, invalidInput);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/入力データ/);
    expect(result.fieldErrors?.listId).toBeDefined();
  });

  it("重複登録時はエラーを返すこと", async () => {
    const mockSupabase = {
      auth: {
        getUser: async () => ({ data: { user: { id: "user1" } }, error: null }),
      },
      from: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: "exists" },
          error: null,
        }),
      })),
      rpc: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    const result = await registerPlaceToListAction(prevState, validInput);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/既にこのリストに登録/);
  });

  it("正常系: 新規登録が成功すること", async () => {
    const mockSupabase = {
      auth: {
        getUser: async () => ({ data: { user: { id: "user1" } }, error: null }),
      },
      from: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })),
      rpc: jest
        .fn()
        .mockResolvedValue({ data: "new-list-place-id", error: null }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    const result = await registerPlaceToListAction(prevState, validInput);
    expect(result.success).toBe(true);
    expect(result.listPlaceId).toBe("new-list-place-id");
    expect(result.message).toMatch(/追加/);
  });

  it("RPCエラー時はエラーを返すこと", async () => {
    const mockSupabase = {
      auth: {
        getUser: async () => ({ data: { user: { id: "user1" } }, error: null }),
      },
      from: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })),
      rpc: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Failed to upsert place" },
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    const result = await registerPlaceToListAction(prevState, validInput);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/保存処理中/);
  });
});
