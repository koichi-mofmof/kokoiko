import { createList, deleteList, updateList } from "@/lib/actions/lists";

// モック
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("nanoid", () => require("nanoid/non-secure"));

const mockFrom = jest.fn();
const mockRpc = jest.fn();
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      }),
    },
  })),
}));

describe("リスト関連のサーバーアクション", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRpc.mockReset();
    mockFrom.mockImplementation((tableName) => {
      return {
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValue({ data: { id: "mock-id" }, error: null }),
        match: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        returns: jest.fn().mockReturnThis(),
      };
    });
  });

  // --- createList関数 ---
  describe("createList関数", () => {
    it("正常にリストが作成された場合に成功レスポンスを返すこと", async () => {
      mockRpc.mockResolvedValueOnce({
        data: { id: "new-list-id" },
        error: null,
      });
      const placeListsCreateMock = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { id: "new-list-id" },
          error: null,
        }),
      };
      mockFrom.mockImplementation((tableName) => {
        if (tableName === "place_lists") {
          return placeListsCreateMock;
        }
        return {};
      });
      const formData = new FormData();
      formData.append("name", "テストリスト");
      formData.append("description", "テスト説明");
      formData.append("isPublic", "true");
      const result = await createList(formData);
      expect(result).toEqual({
        success: true,
        listId: "new-list-id",
      });
      const { revalidatePath } = require("next/cache");
      expect(revalidatePath).toHaveBeenCalledWith("/lists");
    });
    it("必須フィールドが不足している場合にエラーを返すこと", async () => {
      const formData = new FormData();
      formData.append("description", "test description");
      const result = await createList(formData);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(
        /名前は必須|Expected string, received null/i
      );
      const { createClient } = require("@/lib/supabase/server");
      expect(createClient().from().insert).not.toHaveBeenCalled();
    });
    it("Supabaseエラーの場合にエラーレスポンスを返すこと", async () => {
      const placeListsCreateErrorMock = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: "データベースエラー" },
        }),
      };
      mockFrom.mockImplementation((tableName) => {
        if (tableName === "place_lists") {
          return placeListsCreateErrorMock;
        }
        return {};
      });
      const formData = new FormData();
      formData.append("name", "テストリスト");
      const result = await createList(formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("エラー");
    });
  });

  // --- updateList関数 ---
  describe("updateList関数", () => {
    it("正常にリストが更新された場合に成功レスポンスを返すこと", async () => {
      mockRpc.mockResolvedValueOnce({
        data: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "更新済みリスト",
        },
        error: null,
      });
      const placeListsUpdateMock = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: "123e4567-e89b-12d3-a456-426614174000",
            name: "更新済みリスト",
          },
          error: null,
        }),
      };
      mockFrom.mockImplementation((tableName) => {
        if (tableName === "place_lists") {
          return placeListsUpdateMock;
        }
        return {};
      });
      const updateData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "更新済みリスト",
        description: "更新された説明",
        isPublic: true,
      };
      const result = await updateList(updateData);
      expect(result).toEqual({
        success: true,
        list: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "更新済みリスト",
        },
      });
      const { revalidatePath } = require("next/cache");
      expect(revalidatePath).toHaveBeenCalledWith("/lists");
    });
    it("IDが不足している場合にエラーを返すこと", async () => {
      const updateData = {
        name: "テストリスト更新",
        description: "some description",
        isPublic: false,
      };
      const result = await updateList(updateData as any);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/無効なリストIDです|Required/i);
    });
    it("必須フィールドが不足している場合にエラーを返すこと", async () => {
      const updateData = {
        id: "123e4567-e89b-12d3-a456-426614174001",
        description: "some description",
        isPublic: false,
      };
      const result = await updateList(updateData as any);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/リスト名は必須です|Required/i);
    });
    it("Supabaseエラーの場合にエラーレスポンスを返すこと", async () => {
      const placeListsUpdateErrorMock = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: "更新エラー" },
        }),
      };
      mockFrom.mockImplementation((tableName) => {
        if (tableName === "place_lists") {
          return placeListsUpdateErrorMock;
        }
        return {};
      });
      const updateData = {
        id: "123e4567-e89b-12d3-a456-426614174002",
        name: "テストリスト更新",
        description: "",
        isPublic: false,
      };
      const result = await updateList(updateData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("エラー");
    });
  });

  // --- deleteList関数 ---
  describe("deleteList関数", () => {
    it("正常にリストが削除された場合に成功レスポンスを返すこと", async () => {
      mockRpc.mockResolvedValueOnce({ data: { success: true }, error: null });
      const mockSuccess = { error: null };
      const mockSelectSuccess = { data: [{ id: "lp1" }], error: null };
      const mockSelectEmptySuccess = { data: [], error: null };
      const listShareTokensDeleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(mockSuccess),
      };
      const sharedListsDeleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(mockSuccess),
      };
      const listPlacesSelectMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(mockSelectSuccess),
      };
      const listPlaceTagsDeleteMock = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue(mockSuccess),
      };
      const listPlacesDeleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(mockSuccess),
      };
      const placeListsDeleteEqMock = jest.fn().mockResolvedValue(mockSuccess);
      const placeListsDeleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({ eq: placeListsDeleteEqMock })),
      };
      mockFrom
        .mockImplementationOnce((tn) =>
          tn === "list_share_tokens" ? listShareTokensDeleteMock : {}
        )
        .mockImplementationOnce((tn) =>
          tn === "shared_lists" ? sharedListsDeleteMock : {}
        )
        .mockImplementationOnce((tn) =>
          tn === "list_places" ? listPlacesSelectMock : {}
        )
        .mockImplementationOnce((tn) =>
          tn === "list_place_tags" ? listPlaceTagsDeleteMock : {}
        )
        .mockImplementationOnce((tn) =>
          tn === "list_places" ? listPlacesDeleteMock : {}
        )
        .mockImplementationOnce((tn) =>
          tn === "place_lists" ? placeListsDeleteMock : {}
        );
      const result = await deleteList("valid-list-id-string");
      expect(result).toEqual({ success: true });
      const { revalidatePath } = require("next/cache");
      expect(revalidatePath).toHaveBeenCalledWith("/lists");
    });
    it("IDが不足している場合にエラーを返すこと", async () => {
      const resultUndefined = await deleteList(undefined as any);
      expect(resultUndefined.success).toBe(false);
      expect(resultUndefined.error).toBe("有効なリストIDが必要です。");
      const resultEmpty = await deleteList("");
      expect(resultEmpty.success).toBe(false);
      expect(resultEmpty.error).toBe("有効なリストIDが必要です。");
      const resultWhitespace = await deleteList("   ");
      expect(resultWhitespace.success).toBe(false);
      expect(resultWhitespace.error).toBe("有効なリストIDが必要です。");
    });
    it("Supabaseエラーの場合にエラーレスポンスを返すこと", async () => {
      const mockDbError = { error: { message: "DBエラー！！" } };
      const mockSuccess = { error: null };
      const mockSelectSuccess = { data: [{ id: "lp1" }], error: null };
      const listShareTokensDeleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(mockSuccess),
      };
      const sharedListsDeleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(mockSuccess),
      };
      const listPlacesSelectMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(mockSelectSuccess),
      };
      const listPlaceTagsDeleteMock = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue(mockSuccess),
      };
      const listPlacesDeleteErrorMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(mockDbError),
      };
      const placeListsDeleteEqMock = jest.fn().mockResolvedValue(mockSuccess);
      const placeListsDeleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({ eq: placeListsDeleteEqMock })),
      };
      mockFrom
        .mockImplementationOnce((tn) =>
          tn === "list_share_tokens" ? listShareTokensDeleteMock : {}
        )
        .mockImplementationOnce((tn) =>
          tn === "shared_lists" ? sharedListsDeleteMock : {}
        )
        .mockImplementationOnce((tn) =>
          tn === "list_places" ? listPlacesSelectMock : {}
        )
        .mockImplementationOnce((tn) =>
          tn === "list_place_tags" ? listPlaceTagsDeleteMock : {}
        )
        .mockImplementationOnce((tn) =>
          tn === "list_places" ? listPlacesDeleteErrorMock : {}
        )
        .mockImplementationOnce((tn) =>
          tn === "place_lists" ? placeListsDeleteMock : {}
        );
      const result = await deleteList("any-valid-list-id");
      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "リスト削除中に予期せぬエラーが発生しました"
      );
    });
  });
});
