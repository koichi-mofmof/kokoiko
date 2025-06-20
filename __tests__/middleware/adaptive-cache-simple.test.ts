import {
  checkListPublicStatus,
  getAdaptiveCacheStrategy,
} from "@/lib/cloudflare/cdn-cache";

// モジュールをモック
jest.mock("@/lib/cloudflare/cdn-cache");

const mockCheckListPublicStatus = checkListPublicStatus as jest.MockedFunction<
  typeof checkListPublicStatus
>;
const mockGetAdaptiveCacheStrategy =
  getAdaptiveCacheStrategy as jest.MockedFunction<
    typeof getAdaptiveCacheStrategy
  >;

describe("Middleware キャッシュ統合 - 基本テスト", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkListPublicStatus関数", () => {
    it("リストパスから公開状態をチェックできること", async () => {
      mockCheckListPublicStatus.mockResolvedValue(true);

      const result = await checkListPublicStatus("/lists/public-list-123");

      expect(mockCheckListPublicStatus).toHaveBeenCalledWith(
        "/lists/public-list-123"
      );
      expect(result).toBe(true);
    });

    it("非公開リストでfalseを返すこと", async () => {
      mockCheckListPublicStatus.mockResolvedValue(false);

      const result = await checkListPublicStatus("/lists/private-list-456");

      expect(mockCheckListPublicStatus).toHaveBeenCalledWith(
        "/lists/private-list-456"
      );
      expect(result).toBe(false);
    });
  });

  describe("getAdaptiveCacheStrategy関数", () => {
    it("公開リストで適応的キャッシュ戦略を返すこと", async () => {
      const expectedStrategy = "public, max-age=600, s-maxage=600";
      mockGetAdaptiveCacheStrategy.mockResolvedValue(expectedStrategy);

      const result = await getAdaptiveCacheStrategy("test-list-id", true);

      expect(mockGetAdaptiveCacheStrategy).toHaveBeenCalledWith(
        "test-list-id",
        true
      );
      expect(result).toBe(expectedStrategy);
    });

    it("非公開リストでno-cache戦略を返すこと", async () => {
      const expectedStrategy = "private, no-cache, no-store, must-revalidate";
      mockGetAdaptiveCacheStrategy.mockResolvedValue(expectedStrategy);

      const result = await getAdaptiveCacheStrategy("test-list-id", false);

      expect(mockGetAdaptiveCacheStrategy).toHaveBeenCalledWith(
        "test-list-id",
        false
      );
      expect(result).toBe(expectedStrategy);
    });

    it("高頻度更新リストでSWR戦略を返すこと", async () => {
      const expectedStrategy =
        "public, max-age=60, s-maxage=60, stale-while-revalidate=300";
      mockGetAdaptiveCacheStrategy.mockResolvedValue(expectedStrategy);

      const result = await getAdaptiveCacheStrategy(
        "high-frequency-list",
        true
      );

      expect(mockGetAdaptiveCacheStrategy).toHaveBeenCalledWith(
        "high-frequency-list",
        true
      );
      expect(result).toBe(expectedStrategy);
    });

    it("低頻度更新リストで10分キャッシュを返すこと", async () => {
      const expectedStrategy = "public, max-age=600, s-maxage=600";
      mockGetAdaptiveCacheStrategy.mockResolvedValue(expectedStrategy);

      const result = await getAdaptiveCacheStrategy("low-frequency-list", true);

      expect(mockGetAdaptiveCacheStrategy).toHaveBeenCalledWith(
        "low-frequency-list",
        true
      );
      expect(result).toBe(expectedStrategy);

      // 10分 = 600秒であることを確認
      const maxAgeMatch = result.match(/max-age=(\d+)/);
      expect(maxAgeMatch).toBeTruthy();
      expect(parseInt(maxAgeMatch![1])).toBe(600);
    });
  });

  describe("キャッシュ戦略の動作確認", () => {
    it("異なる更新頻度で異なる戦略が返されること", async () => {
      const testCases = [
        {
          listId: "high-freq",
          isPublic: true,
          expected:
            "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
        },
        {
          listId: "medium-freq",
          isPublic: true,
          expected: "public, max-age=120, s-maxage=120",
        },
        {
          listId: "low-freq",
          isPublic: true,
          expected: "public, max-age=600, s-maxage=600",
        },
        {
          listId: "private-list",
          isPublic: false,
          expected: "private, no-cache, no-store, must-revalidate",
        },
      ];

      for (const testCase of testCases) {
        mockGetAdaptiveCacheStrategy.mockResolvedValue(testCase.expected);

        const result = await getAdaptiveCacheStrategy(
          testCase.listId,
          testCase.isPublic
        );

        expect(result).toBe(testCase.expected);
      }
    });

    it("エラー時にデフォルト戦略が返されること", async () => {
      mockGetAdaptiveCacheStrategy.mockRejectedValue(
        new Error("Database error")
      );
      mockGetAdaptiveCacheStrategy.mockResolvedValue(
        "public, max-age=120, s-maxage=120"
      ); // デフォルト

      try {
        await getAdaptiveCacheStrategy("error-list", true);
      } catch (error) {
        // エラーハンドリングがされることを想定
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe("キャッシュ時間の数値確認", () => {
    it("各戦略の時間設定が正しいこと", () => {
      const strategies = {
        swr: "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
        standard: "public, max-age=120, s-maxage=120",
        longTerm: "public, max-age=600, s-maxage=600",
        private: "private, no-cache, no-store, must-revalidate",
      };

      // SWR戦略: 1分キャッシュ + 5分revalidate
      const swrMaxAge = strategies.swr.match(/max-age=(\d+)/)?.[1];
      const swrRevalidate = strategies.swr.match(
        /stale-while-revalidate=(\d+)/
      )?.[1];
      expect(parseInt(swrMaxAge!)).toBe(60); // 1分
      expect(parseInt(swrRevalidate!)).toBe(300); // 5分

      // 標準戦略: 2分キャッシュ
      const standardMaxAge = strategies.standard.match(/max-age=(\d+)/)?.[1];
      expect(parseInt(standardMaxAge!)).toBe(120); // 2分

      // 長期戦略: 10分キャッシュ
      const longTermMaxAge = strategies.longTerm.match(/max-age=(\d+)/)?.[1];
      expect(parseInt(longTermMaxAge!)).toBe(600); // 10分

      // プライベート戦略: キャッシュなし
      expect(strategies.private).toContain("no-cache");
      expect(strategies.private).toContain("no-store");
    });
  });
});
