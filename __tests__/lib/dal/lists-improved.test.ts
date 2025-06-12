import {
  getAccessibleLists,
  getListDetails,
  getMyPageData,
  getPublicListData,
  getUserListStats,
  searchListsByPlace,
  searchListsByTag,
} from "@/lib/dal/lists";
import { createClient } from "@/lib/supabase/server";

// Supabaseクライアントのモック
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/supabase/storage", () => ({
  getStoragePublicUrl: jest
    .fn()
    .mockResolvedValue("https://example.com/avatar.jpg"),
}));

const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
};

(createClient as jest.Mock).mockResolvedValue(mockSupabase);

describe("RLS活用型DAL - lists-improved", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAccessibleLists", () => {
    it("RLSポリシーによりアクセス可能なリストのみを取得する", async () => {
      const mockLists = [
        {
          id: "list-1",
          name: "公開リスト",
          description: "テスト用公開リスト",
          is_public: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          created_by: "user-1",
        },
      ];

      // place_lists テーブルのクエリ
      mockSupabase.from.mockImplementation((table) => {
        if (table === "place_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockLists,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "list_places") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "shared_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: "user-1",
                    display_name: "Test User",
                    avatar_url: null,
                  },
                  error: null,
                }),
              }),
              in: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const result = await getAccessibleLists("user-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("place_lists");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("公開リスト");
    });

    it("未ログインユーザーは空配列を返す", async () => {
      const result = await getAccessibleLists(); // userIdなし

      expect(result).toHaveLength(0);
    });
  });

  describe("getListDetails", () => {
    it("RLSポリシーによりアクセス権限をチェックする", async () => {
      const mockList = {
        id: "list-1",
        name: "テストリスト",
        description: "テスト用リスト",
        is_public: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "place_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockList,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "list_places") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "shared_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const result = await getListDetails("list-1", "user-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("place_lists");
      expect(result).not.toBeNull();
      expect(result?.name).toBe("テストリスト");
      expect(result?.permission).toBe("owner");
    });

    it("アクセス権限がない場合はnullを返す", async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === "place_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Row not found" },
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const result = await getListDetails("private-list", "unauthorized-user");

      expect(result).toBeNull();
    });

    it("オーナーには適切な権限を設定する", async () => {
      const mockList = {
        id: "list-1",
        name: "オーナーリスト",
        description: "オーナーのリスト",
        is_public: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        created_by: "owner-user",
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "place_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockList,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "list_places") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "shared_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const result = await getListDetails("list-1", "owner-user");

      expect(result?.permission).toBe("owner");
    });

    it("編集権限を持つユーザーには適切な権限を設定する", async () => {
      const mockList = {
        id: "list-1",
        name: "共有リスト",
        description: "編集可能な共有リスト",
        is_public: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        created_by: "owner-user",
      };

      const mockSharedEntry = {
        permission: "edit",
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "place_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockList,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "list_places") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "shared_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockSharedEntry,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const result = await getListDetails("list-1", "editor-user");

      expect(result?.permission).toBe("edit");
    });
  });

  describe("getMyPageData", () => {
    it("認証済みユーザーのマイページデータを取得する", async () => {
      const mockLists = [
        {
          id: "list-1",
          name: "マイリスト",
          description: "ユーザーのリスト",
          is_public: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          created_by: "user-1",
        },
      ];

      mockSupabase.from.mockImplementation((table) => {
        if (table === "place_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockLists,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "list_places") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "shared_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: "user-1",
                    display_name: "Test User",
                    avatar_url: null,
                  },
                  error: null,
                }),
              }),
              in: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const result = await getMyPageData("user-1");

      expect(result.userId).toBe("user-1");
      expect(result.lists).toHaveLength(1);
      expect(result.error).toBeUndefined();
    });

    it("エラーが発生した場合でも空のリストを返す", async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === "place_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockRejectedValue(new Error("Database error")),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const result = await getMyPageData("user-1");

      expect(result.lists).toHaveLength(0);
      expect(result.userId).toBe("user-1");
      expect(result.error).toBeUndefined(); // getAccessibleListsのエラーはキャッチされるため、getMyPageDataレベルではエラーにならない
    });
  });

  describe("getPublicListData", () => {
    it("公開リストのデータを取得する", async () => {
      const mockPublicList = {
        id: "public-list-1",
        name: "公開リスト",
        description: "誰でも見れるリスト",
        is_public: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "place_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockPublicList,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "list_places") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "shared_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const result = await getPublicListData("public-list-1");

      expect(result).not.toBeNull();
      expect(result?.name).toBe("公開リスト");
      expect(result?.permission).toBe("view");
    });
  });

  describe("searchListsByTag", () => {
    it("タグ名でリストを検索する", async () => {
      const mockTagResults = [
        {
          list_places: {
            place_lists: [
              {
                id: "list-1",
                name: "レストランリスト",
                description: "美味しいレストラン",
                is_public: true,
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-01T00:00:00Z",
                created_by: "user-1",
              },
            ],
          },
          tags: { name: "レストラン" },
        },
      ];

      const mockList = {
        id: "list-1",
        name: "レストランリスト",
        description: "美味しいレストラン",
        is_public: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "list_place_tags") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: mockTagResults,
                error: null,
              }),
            }),
          };
        }
        if (table === "place_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockList,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "list_places") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "shared_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: "user-1",
                    display_name: "Test User",
                    avatar_url: null,
                  },
                  error: null,
                }),
              }),
              in: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const result = await searchListsByTag("レストラン", "user-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("list_place_tags");
      expect(result).toHaveLength(1);
    });
  });

  describe("searchListsByPlace", () => {
    it("場所名でリストを検索する", async () => {
      const mockPlaceResults = [
        {
          list_id: "list-1",
          places: { name: "東京駅" },
          place_lists: {
            id: "list-1",
            name: "東京観光リスト",
            description: "東京の観光スポット",
            is_public: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
            created_by: "user-1",
          },
        },
      ];

      const mockList = {
        id: "list-1",
        name: "東京観光リスト",
        description: "東京の観光スポット",
        is_public: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
      };

      mockSupabase.from.mockImplementation((table) => {
        if (
          table === "list_places" &&
          mockSupabase.from.mock.calls.length === 1
        ) {
          // 最初の呼び出し: searchListsByPlace
          return {
            select: jest.fn().mockReturnValue({
              ilike: jest.fn().mockResolvedValue({
                data: mockPlaceResults,
                error: null,
              }),
            }),
          };
        }
        if (table === "place_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockList,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "list_places") {
          // 2回目以降の呼び出し: getListDetails内での場所取得
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "shared_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: "user-1",
                    display_name: "Test User",
                    avatar_url: null,
                  },
                  error: null,
                }),
              }),
              in: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const result = await searchListsByPlace("東京", "user-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("list_places");
      expect(result).toHaveLength(1);
    });
  });

  describe("getUserListStats", () => {
    it("ユーザーのリスト統計情報を取得する", async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation((table) => {
        callCount++;
        if (table === "place_lists" && callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 5 }),
            }),
          };
        }
        if (table === "shared_lists" && callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 3 }),
            }),
          };
        }
        if (table === "list_places" && callCount === 3) {
          return {
            select: jest.fn().mockReturnValue({
              data: null,
              count: 25,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const result = await getUserListStats("user-1");

      expect(result.ownedListsCount).toBe(5);
      expect(result.sharedListsCount).toBe(3);
      expect(result.totalPlacesCount).toBe(25);
    });

    it("エラーが発生した場合は0を返す", async () => {
      mockSupabase.from.mockImplementation(() => {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockRejectedValue(new Error("Database error")),
          }),
        };
      });

      const result = await getUserListStats("user-1");

      expect(result.ownedListsCount).toBe(0);
      expect(result.sharedListsCount).toBe(0);
      expect(result.totalPlacesCount).toBe(0);
    });
  });

  describe("レガシー互換性", () => {
    it("fetchMyPageData は getMyPageData と同じ結果を返す", async () => {
      const mockLists = [
        {
          id: "list-1",
          name: "テストリスト",
          description: "テスト用",
          is_public: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          created_by: "user-1",
        },
      ];

      mockSupabase.from.mockImplementation((table) => {
        if (table === "place_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockLists,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "list_places") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "shared_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: "user-1",
                    display_name: "Test User",
                    avatar_url: null,
                  },
                  error: null,
                }),
              }),
              in: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const { fetchMyPageData } = await import("@/lib/dal/lists");
      const result = await fetchMyPageData("user-1");

      expect(result.myListsForClient).toHaveLength(1);
      expect(result.userId).toBe("user-1");
    });
  });
});
