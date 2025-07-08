import {
  getUserProfile,
  getUserPublicLists,
  getUserStats,
} from "@/lib/dal/user-public-lists";
import { createClient } from "@/lib/supabase/server";

// Supabaseクライアントのモック
jest.mock("@/lib/supabase/server");

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  storage: {
    from: jest.fn().mockReturnThis(),
    getPublicUrl: jest.fn(),
  },
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe("DAL - user-public-lists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // getUserProfileのテスト
  describe("getUserProfile", () => {
    it("ユーザーIDでプロファイルを正しく取得する", async () => {
      const mockProfile = {
        id: "user-1",
        username: "testuser",
        display_name: "Test User",
        bio: "This is a test bio.",
        avatar_url: "avatar.jpg",
      };
      mockSupabase.single.mockResolvedValue({ data: mockProfile, error: null });
      mockSupabase.storage.from("profile_images").getPublicUrl.mockReturnValue({
        data: {
          publicUrl:
            "https://mock.supabase.co/storage/v1/object/public/profile_images/avatar.png",
        },
      });

      const profile = await getUserProfile("user-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
      expect(profile).toEqual(mockProfile);
    });

    it("プロファイルが存在しない場合はnullを返す", async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      const profile = await getUserProfile("non-existent-user");

      expect(profile).toBeNull();
    });
  });

  // getUserPublicListsのテスト
  describe("getUserPublicLists", () => {
    it("ユーザーの公開リストのみを取得する", async () => {
      const mockLists = [
        {
          id: "list-1",
          name: "Public List 1",
          is_public: true,
          list_places: [{ count: 5 }],
        },
        {
          id: "list-2",
          name: "Public List 2",
          is_public: true,
          list_places: [{ count: 10 }],
        },
      ];
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockLists, error: null }),
      });

      const lists = await getUserPublicLists("user-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("place_lists");
      expect(lists).toHaveLength(2);
      expect(lists[0].name).toBe("Public List 1");
      expect(lists[0].place_count).toBe(5);
      expect(lists[1].place_count).toBe(10);
    });

    it("公開リストがない場合は空配列を返す", async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const lists = await getUserPublicLists("user-with-no-public-lists");
      expect(lists).toEqual([]);
    });
  });

  // getUserStatsのテスト
  describe("getUserStats", () => {
    it("ユーザーの公開リストと総地点数を正しく計算する", async () => {
      mockSupabase.from
        // 1. 公開リスト数のカウント
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            // `from().select(..., { count: 'exact' })` の結果をモック
            then: (callback: any) => callback({ count: 3, error: null }),
          }),
        }))
        // 2. 公開リストのID取得
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            then: (callback: any) =>
              callback({
                data: [{ id: "list-1" }, { id: "list-2" }],
                error: null,
              }),
          }),
        }))
        // 3. 総地点数のカウント
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnThis(),
            then: (callback: any) => callback({ count: 42, error: null }),
          }),
        }));

      const stats = await getUserStats("user-1");

      expect(stats.publicListCount).toBe(3);
      expect(stats.totalPlaceCount).toBe(42);
      expect(mockSupabase.from).toHaveBeenCalledWith("place_lists");
      expect(mockSupabase.from).toHaveBeenCalledWith("list_places");
    });

    it("統計情報がない場合は0を返す", async () => {
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          then: (callback: any) => callback({ count: 0, error: null }),
        }),
      }));

      const stats = await getUserStats("new-user");
      expect(stats.publicListCount).toBe(0);
      expect(stats.totalPlaceCount).toBe(0);
    });
  });
});
