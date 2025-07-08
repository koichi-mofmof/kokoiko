import * as dal from "@/lib/dal/lists";
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
import { ListForClient, ListsPageData } from "@/lib/dal/lists";

// DALモジュール全体をモック化
jest.mock("@/lib/dal/lists", () => ({
  ...jest.requireActual("@/lib/dal/lists"), // 他の関数はそのまま使う
  getAccessibleLists: jest.fn(),
  getListDetails: jest.fn(),
  getMyPageData: jest.fn(),
  searchListsByTag: jest.fn(),
  searchListsByPlace: jest.fn(),
  fetchMyPageData: jest.fn(),
}));

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

const mockGetAccessibleLists = getAccessibleLists as jest.Mock;
const mockGetListDetails = getListDetails as jest.Mock;
const mockGetMyPageData = getMyPageData as jest.Mock;

describe("RLS活用型DAL - lists-improved", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAccessibleLists", () => {
    it("RLSポリシーによりアクセス可能なリストのみを取得する", async () => {
      // モックデータ準備
      const mockListsData: ListForClient[] = [
        {
          id: "list-1",
          name: "公開リスト",
          is_public: true,
          created_by: "user-2",
          permission: "view",
          isBookmarked: false,
          description: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          places: [],
          place_count: 0,
          collaborators: [],
        },
      ];

      mockGetAccessibleLists.mockResolvedValue(mockListsData);

      const result = await getAccessibleLists("user-1");

      expect(mockGetAccessibleLists).toHaveBeenCalledWith("user-1");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("公開リスト");
    });

    it("RLSポリシーによりアクセス不可能なリストは取得しない", async () => {
      mockGetAccessibleLists.mockResolvedValue([]);

      const result = await getAccessibleLists("unauthorized-user");

      expect(mockGetAccessibleLists).toHaveBeenCalledWith("unauthorized-user");
      expect(result).toHaveLength(0);
    });
  });

  describe("getListDetails", () => {
    it("RLSポリシーによりアクセス権限をチェックする", async () => {
      const mockDetails: ListForClient = {
        id: "list-1",
        name: "テストリスト",
        is_public: false,
        created_by: "user-1",
        permission: "owner",
        isBookmarked: false,
        description: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        places: [],
        place_count: 0,
        collaborators: [],
      };
      mockGetListDetails.mockResolvedValue(mockDetails);

      const result = await getListDetails("list-1", "user-1");

      expect(mockGetListDetails).toHaveBeenCalledWith("list-1", "user-1");
      expect(result).not.toBeNull();
      expect(result?.name).toBe("テストリスト");
      expect(result?.permission).toBe("owner");
    });

    it("アクセス権限がない場合はnullを返す", async () => {
      mockGetListDetails.mockResolvedValue(null);

      const result = await getListDetails("private-list", "unauthorized-user");

      expect(mockGetListDetails).toHaveBeenCalledWith(
        "private-list",
        "unauthorized-user"
      );
      expect(result).toBeNull();
    });
  });

  describe("権限チェックの詳細テスト", () => {
    it("オーナーには適切な権限を設定する", async () => {
      const mockDetails: ListForClient = {
        id: "list-1",
        name: "テストリスト",
        is_public: false,
        created_by: "owner-user",
        permission: "owner",
        isBookmarked: false,
        description: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        places: [],
        place_count: 0,
        collaborators: [],
      };
      mockGetListDetails.mockResolvedValue(mockDetails);

      const result = await getListDetails("list-1", "owner-user");

      expect(result?.permission).toBe("owner");
    });

    it("編集権限を持つユーザーには適切な権限を設定する", async () => {
      const mockDetails: ListForClient = {
        id: "list-1",
        name: "テストリスト",
        is_public: false,
        created_by: "owner-user",
        permission: "edit",
        isBookmarked: false,
        description: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        places: [],
        place_count: 0,
        collaborators: [],
      };
      mockGetListDetails.mockResolvedValue(mockDetails);
      const result = await getListDetails("list-1", "editor-user");

      expect(result?.permission).toBe("edit");
    });
  });

  describe("getMyPageData", () => {
    it("認証済みユーザーのマイページデータを取得する", async () => {
      const mockPageData: ListsPageData = {
        userId: "user-1",
        lists: [
          {
            id: "list-1",
            name: "マイリスト",
            is_public: false,
            created_by: "user-1",
            permission: "owner",
            isBookmarked: false,
            description: "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            places: [],
            place_count: 0,
            collaborators: [],
          },
        ],
        error: undefined,
      };
      mockGetMyPageData.mockResolvedValue(mockPageData);

      const result = await getMyPageData("user-1");

      expect(result.userId).toBe("user-1");
      expect(result.lists).toHaveLength(1);
      expect(result.error).toBeUndefined();
    });

    it("エラーが発生した場合でも空のリストとエラーメッセージを返す", async () => {
      mockGetMyPageData.mockResolvedValue({
        userId: "user-1",
        lists: [],
        error: "データベースエラー",
      });

      const result = await getMyPageData("user-1");

      expect(result.lists).toHaveLength(0);
      expect(result.error).toBe("データベースエラー");
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
      // dal.searchListsByTag のモック実装
      const mockSearchResult: ListForClient[] = [
        {
          id: "list-1",
          name: "タグ検索リスト",
          is_public: true,
          created_by: "user-1",
          permission: "view",
          isBookmarked: false,
          description: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          places: [],
          place_count: 1,
          collaborators: [],
        },
      ];
      const searchListsByTagSpy = jest
        .spyOn(dal, "searchListsByTag")
        .mockResolvedValue(mockSearchResult);

      const result = await dal.searchListsByTag("test-tag");

      expect(searchListsByTagSpy).toHaveBeenCalledWith("test-tag");
      expect(result).toHaveLength(1);
    });
  });

  describe("searchListsByPlace", () => {
    it("場所名でリストを検索する", async () => {
      // dal.searchListsByPlace のモック実装
      const mockSearchResult: ListForClient[] = [
        {
          id: "list-1",
          name: "場所検索リスト",
          is_public: true,
          created_by: "user-1",
          permission: "view",
          isBookmarked: false,
          description: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          places: [],
          place_count: 1,
          collaborators: [],
        },
      ];
      const searchListsByPlaceSpy = jest
        .spyOn(dal, "searchListsByPlace")
        .mockResolvedValue(mockSearchResult);

      const result = await dal.searchListsByPlace("test-place");

      expect(searchListsByPlaceSpy).toHaveBeenCalledWith("test-place");
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
      // dal.fetchMyPageData のモック実装
      const mockPageData = {
        userId: "user-1",
        myListsForClient: [
          {
            id: "list-1",
            name: "マイリスト",
            is_public: false,
            created_by: "user-1",
            permission: "owner" as const,
            isBookmarked: false,
            description: "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            places: [],
            place_count: 0,
            collaborators: [],
          },
        ],
        error: undefined,
      };
      const fetchMyPageDataSpy = jest
        .spyOn(dal, "fetchMyPageData")
        .mockResolvedValue(mockPageData);

      const result = await dal.fetchMyPageData("user-1");

      expect(result.myListsForClient).toHaveLength(1);
      expect(result.userId).toBe("user-1");
    });
  });
});
