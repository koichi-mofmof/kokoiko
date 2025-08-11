import {
  updateDisplayOrders,
  getListWithDisplayOrders,
  getDisplayOrdersForList,
  normalizeDisplayOrders,
} from "@/lib/actions/place-display-orders";
import { createClient } from "@/lib/supabase/server";
import { hasListPermission } from "@/lib/utils/permission-check";

// Supabaseクライアントをモック（jest.setup.jsのモックを上書き）
jest.mock("@/lib/supabase/server");

// getListDetailsをモック
jest.mock("@/lib/dal/lists", () => ({
  getListDetails: jest.fn(),
}));

// hasListPermissionをモック
jest.mock("@/lib/utils/permission-check", () => ({
  hasListPermission: jest.fn(),
}));

describe("place-display-orders API", () => {
  let mockSupabase: any;
  let mockAuth: any;
  let mockFrom: any;
  let mockSelect: any;
  let mockEq: any;
  let mockSingle: any;
  let mockUpsert: any;
  let mockInsert: any;
  let mockDelete: any;
  let mockOrder: any;
  let mockHasListPermission: jest.MockedFunction<typeof hasListPermission>;

  beforeEach(() => {
    // モックの初期化
    mockAuth = {
      getUser: jest.fn(),
    };

    // hasListPermissionのモック初期化
    mockHasListPermission = jest.mocked(hasListPermission);
    mockHasListPermission.mockReset();

    mockSingle = jest.fn();
    mockOrder = jest.fn();
    mockInsert = jest.fn().mockResolvedValue({ error: null });

    // deleteメソッドのチェーンメソッド対応を強化
    const deleteEqMock = jest.fn().mockResolvedValue({ error: null });
    mockDelete = jest.fn().mockReturnValue({
      eq: deleteEqMock,
    });

    mockEq = jest.fn().mockReturnValue({
      single: mockSingle,
      order: mockOrder,
    });
    mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    mockUpsert = jest.fn();

    mockFrom = jest.fn().mockImplementation((tableName) => {
      if (tableName === "list_place_display_order") {
        return {
          select: mockSelect,
          upsert: mockUpsert,
          insert: mockInsert,
          delete: mockDelete,
        };
      }
      if (tableName === "place_lists") {
        return {
          select: mockSelect,
        };
      }
      return {
        select: mockSelect,
        upsert: mockUpsert,
        insert: mockInsert,
        delete: mockDelete,
      };
    });

    mockSupabase = {
      auth: mockAuth,
      from: mockFrom,
    };

    // jest.setup.jsのモックを完全にリセットして上書き
    jest.mocked(createClient).mockReset();
    jest.mocked(createClient).mockResolvedValue(mockSupabase);

    // 実行時にSupabaseクライアントのdeleteメソッドを確実に上書き
    Object.defineProperty(mockSupabase, "from", {
      value: mockFrom,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("updateDisplayOrders", () => {
    const validUser = { id: "user-123" };
    const testListId = "list-123";
    const testDisplayOrders = [
      { placeId: "place-1", displayOrder: 1 },
      { placeId: "place-2", displayOrder: 2 },
    ];

    beforeEach(() => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: validUser },
        error: null,
      });

      // 権限チェック用のselectのモック設定をリセット
      mockSingle.mockClear();
      mockInsert.mockClear();
      mockDelete.mockClear();
    });

    describe("正常系", () => {
      it("リストオーナーが順序更新できる", async () => {
        // hasListPermissionをモック（リストオーナーなので編集権限あり）
        mockHasListPermission.mockResolvedValue(true);

        // テストケース内で直接Supabaseクライアントを再定義
        const testSupabaseClient = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: validUser },
              error: null,
            }),
          },
          from: jest.fn().mockImplementation((tableName) => {
            if (tableName === "list_place_display_order") {
              return {
                delete: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ error: null }),
                }),
                insert: jest.fn().mockResolvedValue({ error: null }),
              };
            }
            return mockFrom(tableName);
          }),
        };

        jest.mocked(createClient).mockResolvedValue(testSupabaseClient as any);

        const result = await updateDisplayOrders({
          listId: testListId,
          displayOrders: testDisplayOrders,
        });

        expect(result).toEqual({ success: true });
      });

      it("編集権限ありのコラボレーターが順序更新できる", async () => {
        // hasListPermissionをモック（コラボレーターで編集権限あり）
        mockHasListPermission.mockResolvedValue(true);

        // テストケース内で直接Supabaseクライアントを再定義
        const testSupabaseClient = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: validUser },
              error: null,
            }),
          },
          from: jest.fn().mockImplementation((tableName) => {
            if (tableName === "list_place_display_order") {
              return {
                delete: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ error: null }),
                }),
                insert: jest.fn().mockResolvedValue({ error: null }),
              };
            }
            return mockFrom(tableName);
          }),
        };

        jest.mocked(createClient).mockResolvedValue(testSupabaseClient as any);

        const result = await updateDisplayOrders({
          listId: testListId,
          displayOrders: testDisplayOrders,
        });

        expect(result).toEqual({ success: true });
      });

      it("複数の場所の順序を一括更新する", async () => {
        const largeOrderList = Array.from({ length: 10 }, (_, i) => ({
          placeId: `place-${i + 1}`,
          displayOrder: i + 1,
        }));

        // hasListPermissionをモック（リストオーナーなので編集権限あり）
        mockHasListPermission.mockResolvedValue(true);

        // テストケース内で直接Supabaseクライアントを再定義
        const testSupabaseClient = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: validUser },
              error: null,
            }),
          },
          from: jest.fn().mockImplementation((tableName) => {
            if (tableName === "list_place_display_order") {
              return {
                delete: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ error: null }),
                }),
                insert: jest.fn().mockResolvedValue({ error: null }),
              };
            }
            return mockFrom(tableName);
          }),
        };

        jest.mocked(createClient).mockResolvedValue(testSupabaseClient as any);

        const result = await updateDisplayOrders({
          listId: testListId,
          displayOrders: largeOrderList,
        });

        expect(result).toEqual({ success: true });
      });
    });

    describe("認証・権限エラー", () => {
      it("未認証ユーザーはエラーになる", async () => {
        mockAuth.getUser.mockResolvedValue({
          data: { user: null },
          error: new Error("Unauthorized"),
        });

        const result = await updateDisplayOrders({
          listId: testListId,
          displayOrders: testDisplayOrders,
        });

        expect(result).toEqual({
          errorKey: "errors.common.unauthorized",
          error: "認証エラー: ログインが必要です",
        });
      });

      it("リストが見つからない場合はエラーになる", async () => {
        // hasListPermissionがfalseを返す（リストが見つからない、または権限なし）
        mockHasListPermission.mockResolvedValue(false);

        const result = await updateDisplayOrders({
          listId: "non-existent-list",
          displayOrders: testDisplayOrders,
        });

        expect(result).toEqual({
          errorKey: "errors.common.listNotFoundOrNoPermission",
          error: "リストが見つからないか、編集権限がありません",
        });
      });

      it("編集権限がない場合はエラーになる", async () => {
        // hasListPermissionがfalseを返す（編集権限なし）
        mockHasListPermission.mockResolvedValue(false);

        const result = await updateDisplayOrders({
          listId: testListId,
          displayOrders: testDisplayOrders,
        });

        expect(result).toEqual({
          errorKey: "errors.common.listNotFoundOrNoPermission",
          error: "リストが見つからないか、編集権限がありません",
        });
      });

      it("権限なしユーザーはエラーになる", async () => {
        // hasListPermissionがfalseを返す（権限なし）
        mockHasListPermission.mockResolvedValue(false);

        const result = await updateDisplayOrders({
          listId: testListId,
          displayOrders: testDisplayOrders,
        });

        expect(result).toEqual({
          errorKey: "errors.common.listNotFoundOrNoPermission",
          error: "リストが見つからないか、編集権限がありません",
        });
      });
    });

    describe("データベースエラー", () => {
      beforeEach(() => {
        mockSingle.mockResolvedValue({
          data: {
            created_by: validUser.id,
            shared_lists: [],
          },
          error: null,
        });
      });

      it("データベース更新エラーを処理する", async () => {
        // hasListPermissionをモック（リストオーナーなので編集権限あり）
        mockHasListPermission.mockResolvedValue(true);

        // テストケース内で直接Supabaseクライアントを再定義
        const testSupabaseClient = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: validUser },
              error: null,
            }),
          },
          from: jest.fn().mockImplementation((tableName) => {
            if (tableName === "place_lists") {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: {
                        created_by: validUser.id,
                        shared_lists: [],
                      },
                      error: null,
                    }),
                  }),
                }),
              };
            }
            if (tableName === "list_place_display_order") {
              return {
                delete: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ error: null }),
                }),
                insert: jest.fn().mockResolvedValue({
                  error: new Error("Database connection failed"),
                }),
              };
            }
            return mockFrom(tableName);
          }),
        };

        jest.mocked(createClient).mockResolvedValue(testSupabaseClient as any);

        const result = await updateDisplayOrders({
          listId: testListId,
          displayOrders: testDisplayOrders,
        });

        expect(result).toEqual({
          errorKey: "errors.common.insertFailed",
          error: "Database connection failed",
        });
      });
    });
  });

  describe("getDisplayOrdersForList", () => {
    const testListId = "list-123";

    it("リストの表示順序を正しく取得する", async () => {
      const mockOrderData = [
        { place_id: "place-1", display_order: 1 },
        { place_id: "place-2", display_order: 2 },
        { place_id: "place-3", display_order: 3 },
      ];

      mockOrder.mockReturnValue({
        data: mockOrderData,
        error: null,
      });

      const result = await getDisplayOrdersForList(testListId);

      expect(result).toEqual({
        success: true,
        displayOrders: [
          { placeId: "place-1", displayOrder: 1 },
          { placeId: "place-2", displayOrder: 2 },
          { placeId: "place-3", displayOrder: 3 },
        ],
      });

      expect(mockFrom).toHaveBeenCalledWith("list_place_display_order");
      expect(mockSelect).toHaveBeenCalledWith("place_id, display_order");
      expect(mockEq).toHaveBeenCalledWith("list_id", testListId);
    });

    it("空のリストの場合空配列を返す", async () => {
      mockOrder.mockReturnValue({
        data: [],
        error: null,
      });

      const result = await getDisplayOrdersForList(testListId);

      expect(result).toEqual({
        success: true,
        displayOrders: [],
      });
    });

    it("データベースエラーを処理する", async () => {
      mockOrder.mockReturnValue({
        data: null,
        error: new Error("Query failed"),
      });

      const result = await getDisplayOrdersForList(testListId);

      expect(result).toEqual({
        errorKey: "errors.common.fetchFailed",
        error: "Query failed",
      });
    });
  });

  describe("normalizeDisplayOrders", () => {
    const validUser = { id: "user-123" };
    const testListId = "list-123";

    beforeEach(() => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: validUser },
        error: null,
      });

      // 権限チェック用のモック
      mockSingle.mockResolvedValue({
        data: {
          created_by: validUser.id,
          shared_lists: [],
        },
        error: null,
      });
    });

    it("順序が不整合の場合に正規化する", async () => {
      // hasListPermissionをモック（リストオーナーなので編集権限あり）
      mockHasListPermission.mockResolvedValue(true);

      // 不整合な順序データ（2, 5, 8, 10）
      const mockOrderData = [
        { id: "order-1", place_id: "place-1", display_order: 2 },
        { id: "order-2", place_id: "place-2", display_order: 5 },
        { id: "order-3", place_id: "place-3", display_order: 8 },
        { id: "order-4", place_id: "place-4", display_order: 10 },
      ];

      // select().eq().order()チェーンの設定
      mockOrder.mockReturnValue({
        data: mockOrderData,
        error: null,
      });
      mockUpsert.mockResolvedValue({ error: null });

      const result = await normalizeDisplayOrders(testListId);

      expect(result).toEqual({ success: true });

      // 正規化された順序（1, 2, 3, 4）でupsertが呼ばれることを確認
      expect(mockUpsert).toHaveBeenCalledWith([
        { id: "order-1", display_order: 1, updated_at: expect.any(String) },
        { id: "order-2", display_order: 2, updated_at: expect.any(String) },
        { id: "order-3", display_order: 3, updated_at: expect.any(String) },
        { id: "order-4", display_order: 4, updated_at: expect.any(String) },
      ]);
    });

    it("空のリストの場合は何もしない", async () => {
      // hasListPermissionをモック（リストオーナーなので編集権限あり）
      mockHasListPermission.mockResolvedValue(true);

      mockOrder.mockReturnValue({
        data: [],
        error: null,
      });

      const result = await normalizeDisplayOrders(testListId);

      expect(result).toEqual({ success: true });
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it("順序が既に正規化されている場合でも処理する", async () => {
      // hasListPermissionをモック（リストオーナーなので編集権限あり）
      mockHasListPermission.mockResolvedValue(true);

      const mockOrderData = [
        { id: "order-1", place_id: "place-1", display_order: 1 },
        { id: "order-2", place_id: "place-2", display_order: 2 },
        { id: "order-3", place_id: "place-3", display_order: 3 },
      ];

      mockOrder.mockReturnValue({
        data: mockOrderData,
        error: null,
      });
      mockUpsert.mockResolvedValue({ error: null });

      const result = await normalizeDisplayOrders(testListId);

      expect(result).toEqual({ success: true });
      expect(mockUpsert).toHaveBeenCalled(); // 処理は実行される
    });

    it("権限がない場合はエラーになる", async () => {
      // hasListPermissionがfalseを返す（権限なし）
      mockHasListPermission.mockResolvedValue(false);

      const result = await normalizeDisplayOrders(testListId);

      expect(result).toEqual({
        errorKey: "errors.common.listNotFoundOrNoPermission",
        error: "リストが見つからないか、編集権限がありません",
      });
    });
  });
});
