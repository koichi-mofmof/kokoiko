import { jest } from "@jest/globals";

// 型定義を明示的に指定
type MockRpcFunction = jest.MockedFunction<
  (name: string, params?: any) => Promise<any>
>;

// モックしたSupabaseクライアント（型安全）
const mockSupabaseRpc: MockRpcFunction = jest
  .fn()
  .mockResolvedValue({ data: null, error: null });
const mockSupabaseFrom = jest.fn();
const mockSupabaseUpsert = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseUpdate = jest.fn();
const mockSupabaseEq = jest.fn();
const mockSupabaseSingle = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    rpc: mockSupabaseRpc,
    from: mockSupabaseFrom,
  }),
}));

describe("joinListViaShareLink", () => {
  let joinListViaShareLink: any;

  beforeAll(async () => {
    const lists = await import("@/lib/actions/lists");
    joinListViaShareLink = lists.joinListViaShareLink;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトのメソッドチェーン設定
    mockSupabaseFrom.mockReturnValue({
      upsert: mockSupabaseUpsert,
      select: mockSupabaseSelect,
      update: mockSupabaseUpdate,
    });

    mockSupabaseUpsert.mockReturnValue({
      error: null,
    });

    mockSupabaseSelect.mockReturnValue({
      eq: mockSupabaseEq,
    });

    mockSupabaseUpdate.mockReturnValue({
      eq: mockSupabaseEq,
    });

    mockSupabaseEq.mockReturnValue({
      single: mockSupabaseSingle,
      eq: mockSupabaseEq,
    });

    mockSupabaseSingle.mockReturnValue({
      data: { current_uses: 0 },
      error: null,
    });

    // RPC関数のデフォルトレスポンス
    mockSupabaseRpc.mockResolvedValue({ data: null, error: null });
  });

  test("有効なトークン・新規参加ユーザーで正常に処理されること", async () => {
    // セキュリティ関数の正常レスポンス
    // @ts-ignore - テスト用のモック設定
    mockSupabaseRpc.mockResolvedValueOnce({
      data: [
        {
          list_id: "list-1",
          permission: "edit",
          owner_id: "owner-1",
          is_valid: true,
        },
      ],
      error: null,
    });

    const result = await joinListViaShareLink("token-1", "user-1", "owner-1");

    expect(result.success).toBe(true);
    expect(result.listId).toBe("list-1");
    expect(result.permission).toBe("edit");

    // セキュリティ関数が正しく呼ばれたか確認
    expect(mockSupabaseRpc).toHaveBeenCalledWith("verify_share_token_access", {
      token_value: "token-1",
    });

    // upsert が正しく呼ばれたか確認
    expect(mockSupabaseFrom).toHaveBeenCalledWith("shared_lists");
    expect(mockSupabaseUpsert).toHaveBeenCalledWith(
      {
        list_id: "list-1",
        owner_id: "owner-1",
        shared_with_user_id: "user-1",
        permission: "edit",
      },
      {
        onConflict: "list_id,shared_with_user_id",
      }
    );
  });

  test("有効なトークン・既存参加ユーザーで権限が更新されること", async () => {
    // セキュリティ関数の正常レスポンス
    mockSupabaseRpc.mockResolvedValueOnce({
      data: [
        {
          list_id: "list-1",
          permission: "edit",
          owner_id: "owner-1",
          is_valid: true,
        },
      ],
      error: null,
    });

    // current_uses が既に5のケース
    mockSupabaseSingle.mockReturnValueOnce({
      data: { current_uses: 5 },
      error: null,
    });

    const result = await joinListViaShareLink("token-1", "user-1", "owner-1");

    expect(result.success).toBe(true);
    expect(result.listId).toBe("list-1");
    expect(result.permission).toBe("edit");
  });

  test("セキュリティ関数でトークン検証失敗した場合はエラーになること", async () => {
    // セキュリティ関数がエラーを返す
    mockSupabaseRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "Token verification failed" },
    });

    const result = await joinListViaShareLink(
      "invalid-token",
      "user-1",
      "owner-1"
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("無効なトークンです");
    expect(result.details).toBe("Token verification failed");
  });

  test("無効なトークン（is_valid=false）の場合はエラーになること", async () => {
    // セキュリティ関数が無効なトークンを返す
    // @ts-ignore - テスト用のモック設定
    mockSupabaseRpc.mockResolvedValueOnce({
      data: [
        {
          list_id: "list-1",
          permission: "view",
          owner_id: "owner-1",
          is_valid: false, // 無効
        },
      ],
      error: null,
    });

    const result = await joinListViaShareLink(
      "expired-token",
      "user-1",
      "owner-1"
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("無効なトークンです");
  });

  test("トークン・ユーザーID・オーナーID未指定の場合はエラーになること", async () => {
    const result = await joinListViaShareLink("", "", "");

    expect(result.success).toBe(false);
    expect(result.error).toBe("必要な情報が不足しています。");

    // セキュリティ関数は呼ばれない
    expect(mockSupabaseRpc).not.toHaveBeenCalled();
  });

  test("shared_listsのupsertでエラーが発生した場合はエラーになること", async () => {
    // セキュリティ関数の正常レスポンス
    mockSupabaseRpc.mockResolvedValueOnce({
      data: [
        {
          list_id: "list-1",
          permission: "edit",
          owner_id: "owner-1",
          is_valid: true,
        },
      ],
      error: null,
    });

    // upsert でエラー
    mockSupabaseUpsert.mockReturnValueOnce({
      error: { message: "upsert error" },
    });

    const result = await joinListViaShareLink("token-1", "user-1", "owner-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("参加処理中にエラーが発生しました。");
    expect(result.details).toBe("upsert error");
  });

  test("list_share_tokensのcurrent_uses更新でエラーが発生した場合でも参加は成功すること", async () => {
    // セキュリティ関数の正常レスポンス
    mockSupabaseRpc.mockResolvedValueOnce({
      data: [
        {
          list_id: "list-1",
          permission: "edit",
          owner_id: "owner-1",
          is_valid: true,
        },
      ],
      error: null,
    });

    // current_uses取得時にエラー
    mockSupabaseSingle.mockReturnValueOnce({
      data: null,
      error: { message: "update error" },
    });

    const result = await joinListViaShareLink("token-1", "user-1", "owner-1");

    // 参加は成功する（トークン更新失敗は警告レベル）
    expect(result.success).toBe(true);
    expect(result.listId).toBe("list-1");
    expect(result.permission).toBe("edit");
  });

  test("トークン使用回数の更新時にエラーが発生した場合でも参加は成功すること", async () => {
    // セキュリティ関数の正常レスポンス
    mockSupabaseRpc.mockResolvedValueOnce({
      data: [
        {
          list_id: "list-1",
          permission: "edit",
          owner_id: "owner-1",
          is_valid: true,
        },
      ],
      error: null,
    });

    // current_uses取得は成功、更新で失敗
    mockSupabaseSingle.mockReturnValueOnce({
      data: { current_uses: 0 },
      error: null,
    });

    // update でエラー
    mockSupabaseEq.mockReturnValueOnce({
      error: { message: "update error" },
    });

    const result = await joinListViaShareLink("token-1", "user-1", "owner-1");

    // 参加は成功する
    expect(result.success).toBe(true);
    expect(result.listId).toBe("list-1");
    expect(result.permission).toBe("edit");
  });
});
