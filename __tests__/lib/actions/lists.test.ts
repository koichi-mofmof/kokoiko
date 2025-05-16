import { createList, updateList, deleteList } from "@/lib/actions/lists";
import { redirect } from "next/navigation";

// モック
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

// next/cacheからのモックを追加
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const mockFrom = jest.fn();
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
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
    // mockFrom のデフォルト実装を設定
    const defaultTableMock = {
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }), // singleはPromiseを返すことが多い
      match: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      returns: jest.fn().mockReturnThis(),
    };
    mockFrom.mockImplementation((tableName) => {
      // 各メソッドを新しいjest.fn()で返し、テスト間の干渉を防ぐ
      return {
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValue({ data: { id: "mock-id" }, error: null }), // .single() のデフォルトの戻り値
        match: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        returns: jest.fn().mockReturnThis(),
      };
    });
  });

  describe("createList関数", () => {
    it("正常にリストが作成された場合に成功レスポンスを返すこと", async () => {
      // スパバースクライアントのモック設定
      // const { createClient } = require("@/lib/supabase/server"); // 不要

      const placeListsCreateMock = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { id: "new-list-id" }, // ここで期待するIDを返す
          error: null,
        }),
      };
      mockFrom.mockImplementation((tableName) => {
        if (tableName === "place_lists") {
          return placeListsCreateMock;
        }
        return {}; // デフォルトの空モック
      });

      // FormDataオブジェクトの作成
      const formData = new FormData();
      formData.append("name", "テストリスト");
      formData.append("description", "テスト説明");
      formData.append("isPublic", "true");

      // 関数実行
      const result = await createList(formData);

      // 期待される結果の検証
      expect(result).toEqual({
        success: true,
        listId: "new-list-id",
      });

      // revalidatePathが呼ばれることを確認
      const { revalidatePath } = require("next/cache");
      expect(revalidatePath).toHaveBeenCalledWith("/lists");
    });

    it("必須フィールドが不足している場合にエラーを返すこと", async () => {
      // name を追加しない FormData オブジェクト
      const formData = new FormData();
      formData.append("description", "test description"); // nameなし

      // 関数実行
      const result = await createList(formData);

      // 期待される結果の検証
      expect(result.success).toBe(false);
      // Zodが返す実際のエラーメッセージに合わせて修正 (例: "name: Expected string, received null" や "リスト名は必須です")
      // createListSchemaではnameはstring().min(1, "リスト名は必須です")
      // formData.get('name') が null の場合、型エラーが先に発生する可能性がある
      expect(result.error).toMatch(
        /名前は必須|Expected string, received null/i
      );

      // Supabaseは呼ばれないこと
      const { createClient } = require("@/lib/supabase/server");
      expect(createClient().from().insert).not.toHaveBeenCalled();
    });

    it("Supabaseエラーの場合にエラーレスポンスを返すこと", async () => {
      // スパバースクライアントのモック設定
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

      // FormDataオブジェクトの作成
      const formData = new FormData();
      formData.append("name", "テストリスト");

      // 関数実行
      const result = await createList(formData);

      // 期待される結果の検証
      expect(result.success).toBe(false);
      expect(result.error).toContain("エラー");
    });
  });

  describe("updateList関数", () => {
    it("正常にリストが更新された場合に成功レスポンスを返すこと", async () => {
      // スパバースクライアントのモック設定
      // const { createClient } = require("@/lib/supabase/server"); // mockFrom を直接使うのでこれは不要になる

      // update().select().single()が成功する場合のモック
      // from("place_lists") の呼び出しに対するモックを設定
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
        return {}; // 他のテーブル呼び出しがあれば適宜設定
      });

      // 更新データの作成
      const updateData = {
        id: "123e4567-e89b-12d3-a456-426614174000", // UUID形式に変更
        name: "更新済みリスト",
        description: "更新された説明",
        isPublic: true,
      };

      // 関数実行
      const result = await updateList(updateData);

      // 期待される結果の検証
      expect(result).toEqual({
        success: true,
        list: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "更新済みリスト",
        },
      });

      // revalidatePathが呼ばれることを確認
      const { revalidatePath } = require("next/cache");
      expect(revalidatePath).toHaveBeenCalledWith("/lists");
    });

    it("IDが不足している場合にエラーを返すこと", async () => {
      // IDなしの更新データ
      const updateData = {
        // id: undefined, // id を含めない
        name: "テストリスト更新",
        description: "some description",
        isPublic: false,
      };

      // 関数実行
      const result = await updateList(updateData as any); // as anyで型エラーを回避

      // 期待される結果の検証
      expect(result.success).toBe(false);
      // updateListSchemaではidはstring().uuid("無効なリストIDです")
      // idが渡されない場合、Zodは通常 "Required" のようなエラーを出す
      expect(result.error).toMatch(/無効なリストIDです|Required/i);
    });

    it("必須フィールドが不足している場合にエラーを返すこと", async () => {
      // 名前なしの更新データ
      const updateData = {
        id: "123e4567-e89b-12d3-a456-426614174001", // UUID形式に
        // name: undefined, // name を含めない
        description: "some description",
        isPublic: false,
      };

      // 関数実行
      const result = await updateList(updateData as any); // as any で型エラー回避

      // 期待される結果の検証
      expect(result.success).toBe(false);
      // updateListSchemaではnameはstring().min(1, "リスト名は必須です")
      // nameが渡されない場合、Zodは "Required" または "リスト名は必須です" に近いエラーを出す
      expect(result.error).toMatch(/リスト名は必須です|Required/i);
    });

    it("Supabaseエラーの場合にエラーレスポンスを返すこと", async () => {
      // スパバースクライアントのモック設定
      const { createClient } = require("@/lib/supabase/server");
      // const mockSupabase = createClient();

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

      // 更新用データ
      const updateData = {
        id: "123e4567-e89b-12d3-a456-426614174002", // UUID形式に
        name: "テストリスト更新",
        description: "",
        isPublic: false,
      };

      // 関数実行
      const result = await updateList(updateData);

      // 期待される結果の検証
      expect(result.success).toBe(false);
      expect(result.error).toContain("エラー");
    });
  });

  describe("deleteList関数", () => {
    it("正常にリストが削除された場合に成功レスポンスを返すこと", async () => {
      const mockSuccess = { error: null };
      const mockSelectSuccess = { data: [{ id: "lp1" }], error: null }; // list_places の select 用 (空でないデータ)
      const mockSelectEmptySuccess = { data: [], error: null }; // list_places の select 用 (空データ)

      // 1. list_share_tokens.delete().eq()
      const listShareTokensDeleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(mockSuccess),
      };
      // 2. shared_lists.delete().eq()
      const sharedListsDeleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(mockSuccess),
      };
      // 3a. list_places.select().eq() (タグ検索用)
      const listPlacesSelectMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(mockSelectSuccess),
      };
      // 3b. list_place_tags.delete().in()
      const listPlaceTagsDeleteMock = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue(mockSuccess),
      };
      // 4. list_places.delete().eq()
      const listPlacesDeleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(mockSuccess),
      };
      // 5. place_lists.delete().eq().eq()
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
        ) // for tags
        .mockImplementationOnce((tn) =>
          tn === "list_place_tags" ? listPlaceTagsDeleteMock : {}
        ) // for tags (only if listPlacesSelectMock returns data)
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
      // アクション内のガード節で処理されるため、Supabaseモックは不要
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
      // 例: 4. list_places の削除 (list_places.delete().eq()) でエラーを発生させる
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
      // ここでエラーを発生させる
      const listPlacesDeleteErrorMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(mockDbError),
      };
      // place_lists は呼ばれないはずなので、適当なモックでも良いが、念のため成功モック
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
        ) // for tags
        .mockImplementationOnce((tn) =>
          tn === "list_place_tags" ? listPlaceTagsDeleteMock : {}
        )
        .mockImplementationOnce((tn) =>
          tn === "list_places" ? listPlacesDeleteErrorMock : {}
        ) // <--- ERROR HERE
        .mockImplementationOnce((tn) =>
          tn === "place_lists" ? placeListsDeleteMock : {}
        ); // Should not be called

      const result = await deleteList("any-valid-list-id");

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "リスト内の場所削除中にエラーが発生しました"
      );
    });
  });
});
