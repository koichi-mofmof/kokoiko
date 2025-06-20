/**
 * 階層フィルターアクションのテスト
 */

import {
  clearRegionCache,
  getAllAvailableCountries,
  getAllAvailableStates,
  getAvailableCountries,
  getAvailableStates,
  getHierarchicalFilterOptions,
  invalidateRegionCache,
  updateRegionUsage,
} from "@/lib/actions/hierarchical-filter-actions";

// Supabaseクライアントのモック
const mockSupabaseClient = {
  from: jest.fn(),
};

const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();
const mockNot = jest.fn();
const mockUpsert = jest.fn();

// createClientのモック
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}));

describe("hierarchical-filter-actions", () => {
  beforeEach(async () => {
    // モックをリセット
    jest.clearAllMocks();
    await clearRegionCache();

    // チェーンメソッドのセットアップ（完全なチェーンをサポート）
    const mockChain = {
      select: mockSelect,
      eq: mockEq,
      in: mockIn,
      not: mockNot,
      upsert: mockUpsert,
    };

    // 各メソッドが他のメソッドを返すように設定
    mockSupabaseClient.from.mockReturnValue(mockChain);
    mockSelect.mockReturnValue(mockChain);
    mockEq.mockReturnValue(mockChain);
    mockIn.mockReturnValue(mockChain);
    mockNot.mockReturnValue(mockChain);
    mockUpsert.mockReturnValue(mockChain);
  });

  describe("getAvailableCountries", () => {
    test("リストの国一覧を正しく取得", async () => {
      // list_places のモックデータ
      const mockListPlaces = [
        { place_id: "place1" },
        { place_id: "place2" },
        { place_id: "place3" },
      ];

      // places のモックデータ
      const mockPlaces = [
        { country_code: "JP", country_name: "日本" },
        { country_code: "JP", country_name: "日本" },
        { country_code: "US", country_name: "United States" },
      ];

      // 最初の呼び出し（list_places）
      mockEq.mockResolvedValueOnce({
        data: mockListPlaces,
        error: null,
      });

      // 2番目の呼び出し（places）
      mockNot.mockResolvedValueOnce({
        data: mockPlaces,
        error: null,
      });

      const result = await getAvailableCountries("test-list-id");

      expect(result).toEqual([
        { value: "JP", label: "日本", count: 2 },
        { value: "US", label: "United States", count: 1 },
      ]);

      // Supabaseクライアントの呼び出しを確認
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("list_places");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("places");
    });

    test("空のリストの場合は空配列を返す", async () => {
      mockEq.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await getAvailableCountries("empty-list-id");

      expect(result).toEqual([]);
    });

    test("データベースエラー時は例外をスロー", async () => {
      mockEq.mockResolvedValueOnce({
        data: null,
        error: new Error("Database error"),
      });

      await expect(getAvailableCountries("error-list-id")).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getAvailableStates", () => {
    test("指定された国の州一覧を正しく取得", async () => {
      // list_places のモックデータ
      const mockListPlaces = [{ place_id: "place1" }, { place_id: "place2" }];

      // places のモックデータ
      const mockPlaces = [
        { admin_area_level_1: "California" },
        { admin_area_level_1: "New York" },
      ];

      // 最初の呼び出し（list_places）
      mockEq.mockResolvedValueOnce({
        data: mockListPlaces,
        error: null,
      });

      // 2番目の呼び出し（places）
      mockNot.mockResolvedValueOnce({
        data: mockPlaces,
        error: null,
      });

      const result = await getAvailableStates("test-list-id", "US");

      expect(result).toEqual([
        { value: "California", label: "California", count: 1 },
        { value: "New York", label: "New York", count: 1 },
      ]);
    });

    test("重複する州がある場合は正しくカウント", async () => {
      const mockListPlaces = [
        { place_id: "place1" },
        { place_id: "place2" },
        { place_id: "place3" },
      ];

      const mockPlaces = [
        { admin_area_level_1: "California" },
        { admin_area_level_1: "California" },
        { admin_area_level_1: "New York" },
      ];

      mockEq.mockResolvedValueOnce({
        data: mockListPlaces,
        error: null,
      });

      mockNot.mockResolvedValueOnce({
        data: mockPlaces,
        error: null,
      });

      const result = await getAvailableStates("test-list-id", "US");

      expect(result).toEqual([
        { value: "California", label: "California", count: 2 },
        { value: "New York", label: "New York", count: 1 },
      ]);
    });
  });

  describe("getHierarchicalFilterOptions", () => {
    test("国と州の選択肢を正しく取得", async () => {
      // 国一覧のモック
      const mockListPlaces = [{ place_id: "place1" }];
      const mockCountries = [{ country_code: "JP", country_name: "日本" }];

      // 州一覧のモック
      const mockStates = [{ admin_area_level_1: "東京都" }];

      // 最初の呼び出し（countries）
      mockEq.mockResolvedValueOnce({
        data: mockListPlaces,
        error: null,
      });
      mockNot.mockResolvedValueOnce({
        data: mockCountries,
        error: null,
      });

      // 2番目の呼び出し（states）
      mockEq.mockResolvedValueOnce({
        data: mockListPlaces,
        error: null,
      });
      mockNot.mockResolvedValueOnce({
        data: mockStates,
        error: null,
      });

      const result = await getHierarchicalFilterOptions("test-list-id", "JP");

      expect(result).toEqual({
        countries: [{ value: "JP", label: "日本", count: 1 }],
        states: [{ value: "東京都", label: "東京都", count: 1 }],
      });
    });

    test("国が選択されていない場合は州は空配列", async () => {
      const mockListPlaces = [{ place_id: "place1" }];
      const mockCountries = [{ country_code: "JP", country_name: "日本" }];

      mockEq.mockResolvedValueOnce({
        data: mockListPlaces,
        error: null,
      });
      mockNot.mockResolvedValueOnce({
        data: mockCountries,
        error: null,
      });

      const result = await getHierarchicalFilterOptions("test-list-id");

      expect(result).toEqual({
        countries: [{ value: "JP", label: "日本", count: 1 }],
        states: [],
      });
    });
  });

  describe("getAllAvailableCountries", () => {
    test("地域階層テーブルから全ての国を取得", async () => {
      const mockRegions = [
        { country_code: "JP", country_name: "日本", usage_count: 5 },
        { country_code: "US", country_name: "United States", usage_count: 3 },
        { country_code: "JP", country_name: "日本", usage_count: 2 }, // 重複
      ];

      mockNot.mockResolvedValueOnce({
        data: mockRegions,
        error: null,
      });

      const result = await getAllAvailableCountries();

      expect(result).toEqual([
        { value: "JP", label: "日本", count: 7 }, // 5 + 2
        { value: "US", label: "United States", count: 3 },
      ]);
    });
  });

  describe("getAllAvailableStates", () => {
    test("指定された国の全ての州を取得", async () => {
      const mockRegions = [
        { admin_area_level_1: "東京都", usage_count: 10 },
        { admin_area_level_1: "大阪府", usage_count: 5 },
      ];

      mockNot.mockResolvedValueOnce({
        data: mockRegions,
        error: null,
      });

      const result = await getAllAvailableStates("JP");

      expect(result).toEqual([
        { value: "東京都", label: "東京都", count: 10 },
        { value: "大阪府", label: "大阪府", count: 5 },
      ]);
    });
  });

  describe("updateRegionUsage", () => {
    test("地域使用頻度を正しく更新", async () => {
      mockUpsert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await updateRegionUsage("JP", "日本", "東京都");

      expect(mockUpsert).toHaveBeenCalledWith(
        {
          country_code: "JP",
          country_name: "日本",
          admin_area_level_1: "東京都",
          admin_area_level_1_type: "prefecture",
          usage_count: 1,
        },
        {
          onConflict: "country_code,admin_area_level_1",
          ignoreDuplicates: false,
        }
      );
    });

    test("エラー時は例外をスローしない（ログのみ）", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockUpsert.mockResolvedValueOnce({
        data: null,
        error: new Error("Update error"),
      });

      await expect(updateRegionUsage("JP", "日本")).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error updating region usage:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("キャッシュ機能", () => {
    test("同じリクエストはキャッシュから返される", async () => {
      const mockListPlaces = [{ place_id: "place1" }];
      const mockCountries = [{ country_code: "JP", country_name: "日本" }];

      // 最初の呼び出し
      mockEq.mockResolvedValueOnce({
        data: mockListPlaces,
        error: null,
      });
      mockNot.mockResolvedValueOnce({
        data: mockCountries,
        error: null,
      });

      const result1 = await getAvailableCountries("test-list-id");
      const result2 = await getAvailableCountries("test-list-id");

      expect(result1).toEqual(result2);
      // 2回目の呼び出しではSupabaseは呼ばれない
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2); // 1回目のみ
    });

    test("キャッシュクリアが正しく動作", async () => {
      const mockListPlaces = [{ place_id: "place1" }];
      const mockCountries = [{ country_code: "JP", country_name: "日本" }];

      // 最初の呼び出し
      mockEq.mockResolvedValue({
        data: mockListPlaces,
        error: null,
      });
      mockNot.mockResolvedValue({
        data: mockCountries,
        error: null,
      });

      await getAvailableCountries("test-list-id");
      await clearRegionCache();
      await getAvailableCountries("test-list-id");

      // キャッシュクリア後は再度Supabaseが呼ばれる
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(4); // 2回分
    });

    test("特定パターンのキャッシュ無効化", async () => {
      // キャッシュに複数のエントリを作成
      const mockData = {
        data: [{ place_id: "place1" }],
        error: null,
      };

      mockEq.mockResolvedValue(mockData);
      mockNot.mockResolvedValue({
        data: [{ country_code: "JP", country_name: "日本" }],
        error: null,
      });

      await getAvailableCountries("list1");
      await getAvailableCountries("list2");

      // list1のキャッシュのみ無効化
      await invalidateRegionCache("list1");

      await getAvailableCountries("list1"); // 再取得される
      await getAvailableCountries("list2"); // キャッシュから返される

      // list1の分だけ追加でSupabaseが呼ばれる
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(6); // 3回分
    });
  });

  describe("エラーハンドリング", () => {
    test("list_places取得エラー時は例外をスロー", async () => {
      mockEq.mockResolvedValueOnce({
        data: null,
        error: new Error("List places error"),
      });

      await expect(getAvailableCountries("error-list")).rejects.toThrow(
        "List places error"
      );
    });

    test("places取得エラー時は例外をスロー", async () => {
      mockEq.mockResolvedValueOnce({
        data: [{ place_id: "place1" }],
        error: null,
      });

      mockNot.mockResolvedValueOnce({
        data: null,
        error: new Error("Places error"),
      });

      await expect(getAvailableCountries("error-list")).rejects.toThrow(
        "Places error"
      );
    });
  });

  describe("ソート機能", () => {
    test("使用頻度順にソートされる", async () => {
      const mockListPlaces = [
        { place_id: "place1" },
        { place_id: "place2" },
        { place_id: "place3" },
        { place_id: "place4" },
      ];

      const mockPlaces = [
        { country_code: "US", country_name: "United States" }, // 1回
        { country_code: "JP", country_name: "日本" }, // 3回
        { country_code: "JP", country_name: "日本" },
        { country_code: "JP", country_name: "日本" },
      ];

      mockEq.mockResolvedValueOnce({
        data: mockListPlaces,
        error: null,
      });
      mockNot.mockResolvedValueOnce({
        data: mockPlaces,
        error: null,
      });

      const result = await getAvailableCountries("test-list-id");

      expect(result).toEqual([
        { value: "JP", label: "日本", count: 3 }, // 使用頻度が高い
        { value: "US", label: "United States", count: 1 },
      ]);
    });

    test("使用頻度が同じ場合はアルファベット順", async () => {
      const mockListPlaces = [{ place_id: "place1" }, { place_id: "place2" }];

      const mockPlaces = [
        { country_code: "US", country_name: "United States" },
        { country_code: "JP", country_name: "Japan" }, // アルファベット順で先
      ];

      mockEq.mockResolvedValueOnce({
        data: mockListPlaces,
        error: null,
      });
      mockNot.mockResolvedValueOnce({
        data: mockPlaces,
        error: null,
      });

      const result = await getAvailableCountries("test-list-id");

      expect(result).toEqual([
        { value: "JP", label: "Japan", count: 1 }, // アルファベット順
        { value: "US", label: "United States", count: 1 },
      ]);
    });
  });
});
