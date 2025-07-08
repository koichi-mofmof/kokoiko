import { getAccessibleLists } from "@/lib/dal/lists";
import { createClient } from "@/lib/supabase/server";
import * as permissionCheck from "@/lib/utils/permission-check";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/utils/permission-check");

const mockSupabase = {
  from: jest.fn(),
};

const mockOwnedLists = [
  {
    id: "owned-1",
    name: "My List",
    created_by: "user-1",
    permission: "owner",
    isBookmarked: false,
    is_public: false,
    description: null,
    created_at: null,
    updated_at: null,
    places: [],
    place_count: 0,
    collaborators: [],
  },
];
const mockSharedLists = [
  {
    permission: "view",
    place_lists: {
      id: "shared-1",
      name: "Shared List",
      created_by: "user-2",
      is_public: false,
      description: null,
      created_at: null,
      updated_at: null,
    },
  },
];
const mockBookmarkedLists = [
  {
    place_lists: {
      id: "bookmarked-1",
      name: "Bookmarked List",
      created_by: "user-3",
      is_public: true,
      description: null,
      created_at: null,
      updated_at: null,
    },
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  (createClient as jest.Mock).mockReturnValue(mockSupabase);

  // fromメソッドが呼ばれるたびに、テーブル名に応じたモックを返すように設定
  mockSupabase.from.mockImplementation((tableName) => {
    if (tableName === "place_lists") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockOwnedLists, error: null }),
      };
    }
    if (tableName === "shared_lists") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockSharedLists, error: null }),
      };
    }
    if (tableName === "list_bookmarks") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest
          .fn()
          .mockResolvedValue({ data: mockBookmarkedLists, error: null }),
      };
    }
    // getPlacesForList, getCollaboratorsForList内のfrom呼び出しをモック
    if (tableName === "list_places") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    }
    if (tableName === "profiles") {
      return {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
  });

  // canAccessListを常に許可するようにモック
  jest.spyOn(permissionCheck, "canAccessList").mockResolvedValue({
    canAccess: true,
    permission: "view",
    isPublic: true,
  });
});

describe("getAccessibleLists", () => {
  it("作成・共有・ブックマークしたリストをすべて取得しマージする", async () => {
    const userId = "user-1";
    const lists = await getAccessibleLists(userId);

    expect(lists.length).toBe(3);
    expect(
      lists.some((l) => l.id === "owned-1" && l.permission === "owner")
    ).toBe(true);
    expect(
      lists.some((l) => l.id === "shared-1" && l.permission === "view")
    ).toBe(true);
    expect(lists.some((l) => l.id === "bookmarked-1" && l.isBookmarked)).toBe(
      true
    );
  });

  it("userIdが指定されない場合は空の配列を返す", async () => {
    const lists = await getAccessibleLists(undefined);
    expect(lists).toEqual([]);
  });

  it("DBエラーが発生した場合も空の配列を返す", async () => {
    mockSupabase.from.mockImplementation((tableName) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest
        .fn()
        .mockResolvedValue({ data: null, error: new Error("DB Error") }),
    }));
    const lists = await getAccessibleLists("user-1");
    expect(lists).toEqual([]);
  });
});
