import { createClient } from "@/lib/supabase/server";
import { bookmarkList, unbookmarkList } from "@/lib/actions/lists";

// Supabaseクライアントのモック
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

// revalidatePathのモック
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// 共通のモックセットアップ
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

// ユーザーセットアップのヘルパー関数
async function setupUser() {
  const user = { id: "user-uuid-123", email: "test@example.com" };
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user }, error: null });
  return { user };
}

describe("bookmarkList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  const listId = "list-uuid-123";
  const user = { id: "user-uuid-456" };

  it("未認証の場合はエラーを返す", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });
    const result = await bookmarkList(listId);
    expect(result).toEqual({
      success: false,
      errorKey: "errors.common.unauthorized",
      error: "ログインが必要です。",
    });
  });

  it("listIdがない場合はエラーを返す", async () => {
    const result = await bookmarkList("");
    expect(result).toEqual({
      success: false,
      errorKey: "errors.validation.invalidInput",
      error: "リストIDが無効です。",
    });
  });

  it("対象リストが非公開の場合はエラーを返す", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    });
    mockSupabase.single.mockResolvedValue({
      data: { is_public: false },
      error: null,
    });
    const result = await bookmarkList(listId);
    expect(result).toEqual({
      success: false,
      errorKey: "errors.common.forbidden",
      error: "このリストはブックマークできません。",
    });
  });

  it("正常にブックマークできる", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    });
    mockSupabase.single.mockResolvedValue({
      data: { is_public: true },
      error: null,
    });
    mockSupabase.insert.mockResolvedValue({ error: null });

    const result = await bookmarkList(listId);
    expect(mockSupabase.from).toHaveBeenCalledWith("list_bookmarks");
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      list_id: listId,
      user_id: user.id,
    });
    expect(result).toEqual({ success: true });
  });

  it("既にブックマーク済みの場合は成功を返す (unique constraint violation)", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    });
    mockSupabase.single.mockResolvedValue({
      data: { is_public: true },
      error: null,
    });
    mockSupabase.insert.mockResolvedValue({ error: { code: "23505" } }); // 複合ユニークキー制約違反

    const result = await bookmarkList(listId);
    expect(result).toEqual({ success: true, alreadyExists: true });
  });
});

describe("unbookmarkList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  const listId = "list-uuid-123";
  const user = { id: "user-uuid-123" };

  it("正常にブックマークを解除できる", async () => {
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user },
      error: null,
    });

    const secondEqMock = jest.fn().mockResolvedValue({ error: null });
    const firstEqMock = jest.fn(() => ({ eq: secondEqMock }));
    const deleteMock = jest.fn(() => ({ eq: firstEqMock }));
    (mockSupabase.from as jest.Mock).mockReturnValue({ delete: deleteMock });

    const result = await unbookmarkList(listId);

    expect(result).toEqual({ success: true });
    expect(mockSupabase.from).toHaveBeenCalledWith("list_bookmarks");
    expect(deleteMock).toHaveBeenCalled();
    expect(firstEqMock).toHaveBeenCalledWith("list_id", listId);
    expect(secondEqMock).toHaveBeenCalledWith("user_id", user.id);
  });

  it("DBエラーが発生した場合は失敗を返す", async () => {
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user },
      error: null,
    });

    const dbError = { message: "DB Connection Error" };
    const secondEqMock = jest.fn().mockResolvedValue({ error: dbError });
    const firstEqMock = jest.fn(() => ({ eq: secondEqMock }));
    const deleteMock = jest.fn(() => ({ eq: firstEqMock }));
    (mockSupabase.from as jest.Mock).mockReturnValue({ delete: deleteMock });

    const result = await unbookmarkList(listId);
    expect(result).toEqual({
      success: false,
      errorKey: "errors.common.deleteFailed",
      error: "ブックマークの削除に失敗しました。",
    });
  });

  it("ユーザーが未認証の場合はエラーを返す", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });
    const result = await unbookmarkList("list-uuid-123");
    expect(result).toEqual({
      success: false,
      errorKey: "errors.common.unauthorized",
      error: "ログインが必要です。",
    });
  });
});
