import {
  getAdaptiveCacheStrategy,
  CACHE_CONTROL,
  checkListPublicStatus,
  revalidateListCache,
  purgeListFromEdgeCache,
} from "@/lib/cloudflare/cdn-cache";
import { createClient } from "@/lib/supabase/server";

// Supabaseクライアントのモック
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

// CloudFlare Cache APIのモック
const mockCache = {
  delete: jest.fn(),
  put: jest.fn(),
  match: jest.fn(),
};

// globalThisにcachesを追加
Object.defineProperty(globalThis, "caches", {
  value: {
    default: mockCache,
  },
  writable: true,
});

const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
};

describe("適応的キャッシュ戦略テスト", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  describe("getAdaptiveCacheStrategy", () => {
    it("非公開リストの場合はno-cacheを返すこと", async () => {
      const result = await getAdaptiveCacheStrategy("test-list-id", false);
      expect(result).toBe(CACHE_CONTROL.PRIVATE);
    });

    it("高頻度更新（3回以上/時）の場合はSWR戦略を返すこと", async () => {
      // 3件の更新履歴をモック
      const mockListPlaces = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: "1" }, { id: "2" }, { id: "3" }],
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockListPlaces);

      const result = await getAdaptiveCacheStrategy(
        "high-frequency-list",
        true
      );

      expect(result).toBe(CACHE_CONTROL.PUBLIC_LISTS_SWR);
      expect(result).toBe(
        "public, max-age=60, s-maxage=60, stale-while-revalidate=300"
      );
      expect(mockListPlaces.select).toHaveBeenCalledWith("id");
      expect(mockListPlaces.eq).toHaveBeenCalledWith(
        "list_id",
        "high-frequency-list"
      );
      expect(mockListPlaces.limit).toHaveBeenCalledWith(5);
    });

    it("中頻度更新（1-2回/時）の場合は2分キャッシュを返すこと", async () => {
      // 2件の更新履歴をモック
      const mockListPlaces = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: "1" }, { id: "2" }],
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockListPlaces);

      const result = await getAdaptiveCacheStrategy(
        "medium-frequency-list",
        true
      );

      expect(result).toBe(CACHE_CONTROL.PUBLIC_LISTS);
      expect(result).toBe("public, max-age=120, s-maxage=120");
    });

    it("低頻度更新（0回/時）の場合は10分キャッシュを返すこと", async () => {
      // 更新履歴なしをモック
      const mockListPlaces = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockListPlaces);

      const result = await getAdaptiveCacheStrategy("low-frequency-list", true);

      expect(result).toBe("public, max-age=600, s-maxage=600");

      // 10分 = 600秒であることを確認
      const maxAgeMatch = result.match(/max-age=(\d+)/);
      expect(maxAgeMatch).toBeTruthy();
      expect(parseInt(maxAgeMatch![1])).toBe(600);
    });

    it("Supabaseエラー時はデフォルト戦略を返すこと", async () => {
      const mockListPlaces = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error("Database error")),
      };

      mockSupabaseClient.from.mockReturnValue(mockListPlaces);

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = await getAdaptiveCacheStrategy("error-list", true);

      expect(result).toBe(CACHE_CONTROL.PUBLIC_LISTS);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to determine adaptive cache strategy:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("過去1時間の更新履歴を正しく検索すること", async () => {
      const mockListPlaces = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [] }),
      };

      mockSupabaseClient.from.mockReturnValue(mockListPlaces);

      // 現在時刻をモック
      const fixedDate = new Date("2024-01-01T12:00:00Z");
      const dateSpy = jest
        .spyOn(Date, "now")
        .mockReturnValue(fixedDate.getTime());

      await getAdaptiveCacheStrategy("test-list", true);

      // 1時間前の時刻を計算
      const oneHourAgo = new Date(
        fixedDate.getTime() - 60 * 60 * 1000
      ).toISOString();

      expect(mockListPlaces.gte).toHaveBeenCalledWith("updated_at", oneHourAgo);

      dateSpy.mockRestore();
    });
  });

  describe("checkListPublicStatus", () => {
    it("公開リストの場合はtrueを返すこと", async () => {
      const mockPlaceLists = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { is_public: true },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockPlaceLists);

      const result = await checkListPublicStatus("/lists/public-list-id");

      expect(result).toBe(true);
      expect(mockPlaceLists.select).toHaveBeenCalledWith("is_public");
      expect(mockPlaceLists.eq).toHaveBeenCalledWith("id", "public-list-id");
    });

    it("非公開リストの場合はfalseを返すこと", async () => {
      const mockPlaceLists = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { is_public: false },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockPlaceLists);

      const result = await checkListPublicStatus("/lists/private-list-id");

      expect(result).toBe(false);
    });

    it("リストが見つからない場合はfalseを返すこと", async () => {
      const mockPlaceLists = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockPlaceLists);

      const result = await checkListPublicStatus("/lists/nonexistent-list");

      expect(result).toBe(false);
    });

    it("URLが無効な場合はfalseを返すこと", async () => {
      const result = await checkListPublicStatus("/invalid/path");
      expect(result).toBe(false);
    });

    it("joinパスの場合はfalseを返すこと", async () => {
      const result = await checkListPublicStatus("/lists/join");
      expect(result).toBe(false);
    });
  });

  describe("purgeListFromEdgeCache", () => {
    it("CloudFlare Cache APIでリストキャッシュを削除すること", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await purgeListFromEdgeCache("test-list-id");

      expect(mockCache.delete).toHaveBeenCalledTimes(2);
      expect(mockCache.delete).toHaveBeenCalledWith(
        new Request("/lists/test-list-id")
      );
      expect(mockCache.delete).toHaveBeenCalledWith(
        new Request("/lists/test-list-id/")
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "✅ Edge cache cleared for list: test-list-id"
      );

      consoleSpy.mockRestore();
    });

    it("Cache APIエラー時は警告ログを出力すること", async () => {
      mockCache.delete.mockRejectedValue(new Error("Cache API error"));
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      await purgeListFromEdgeCache("error-list-id");

      expect(consoleSpy).toHaveBeenCalledWith(
        "❌ Failed to clear edge cache:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("キャッシュ時間の定数確認", () => {
    it("CACHE_CONTROLの値が正しく設定されていること", () => {
      expect(CACHE_CONTROL.PUBLIC_LISTS).toBe(
        "public, max-age=120, s-maxage=120"
      );
      expect(CACHE_CONTROL.PUBLIC_LISTS_SWR).toBe(
        "public, max-age=60, s-maxage=60, stale-while-revalidate=300"
      );
      expect(CACHE_CONTROL.PRIVATE).toBe(
        "private, no-cache, no-store, must-revalidate"
      );
    });

    it("低頻度更新時の10分キャッシュが正しく設定されていること", () => {
      const tenMinutesCache = "public, max-age=600, s-maxage=600";

      // 600秒 = 10分であることを確認
      const maxAgeMatch = tenMinutesCache.match(/max-age=(\d+)/);
      expect(maxAgeMatch).toBeTruthy();
      expect(parseInt(maxAgeMatch![1])).toBe(10 * 60); // 10分 = 600秒
    });
  });
});
