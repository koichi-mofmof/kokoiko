import { getListDetails } from "@/lib/dal/lists";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const supabaseMock = require("@/lib/supabase/server");
let mockFrom: jest.Mock<any, any>;

describe("getListDetailsのアクセス制御", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockFrom = jest.fn();
    (supabaseMock.createClient as jest.Mock).mockReturnValue({
      from: mockFrom,
    });
  });

  function addCommonTableMocks(base: Record<string, any>) {
    return (tableName: string) => {
      if (tableName === "profiles") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: "owner-1", display_name: "オーナー", avatar_url: null },
          }),
        };
      }
      if (tableName === "list_places") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          returns: jest.fn().mockReturnThis(),
        };
      }
      if (
        tableName === "list_place_tags" ||
        tableName === "list_places_tags" ||
        tableName === "list_tags"
      ) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
        };
      }
      return base[tableName] ? base[tableName]() : {};
    };
  }

  it("公開リストは誰でもアクセスできる（正常系）", async () => {
    mockFrom.mockImplementation(
      addCommonTableMocks({
        place_lists: () => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: "list-public",
              name: "公開リスト",
              description: "説明",
              is_public: true,
              created_at: "2024-01-01",
              updated_at: "2024-01-02",
              created_by: "owner-1",
            },
            error: null,
          }),
        }),
        shared_lists: () => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null }),
        }),
      })
    );
    const result = await getListDetails("list-public", "any-user");
    expect(result).not.toBeNull();
    expect(result?.id).toBe("list-public");
    expect(result?.is_public).toBe(true);
    expect(result?.permission).toBe("view");
  });

  it("公開リストでもRLS拒否時はnullを返す（異常系）", async () => {
    mockFrom.mockImplementation((tableName: string) => {
      if (tableName === "place_lists") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest
            .fn()
            .mockResolvedValue({ data: null, error: { message: "RLS拒否" } }),
        };
      }
      return {};
    });
    const result = await getListDetails("list-public", "any-user");
    expect(result).toBeNull();
  });

  describe("非公開リストの閲覧権限", () => {
    it("作成者は非公開リストにアクセスできる", async () => {
      mockFrom.mockImplementation(
        addCommonTableMocks({
          place_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: "list-private",
                name: "非公開リスト",
                is_public: false,
                created_by: "user-1",
              },
              error: null,
            }),
          }),
          shared_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null }),
          }),
        })
      );
      const result = await getListDetails("list-private", "user-1");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("list-private");
      expect(result?.is_public).toBe(false);
    });
    it("共有ユーザー（閲覧権限）は非公開リストを閲覧できる", async () => {
      mockFrom.mockImplementation(
        addCommonTableMocks({
          place_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: "list-private",
                name: "非公開リスト",
                is_public: false,
                created_by: "owner-1",
              },
              error: null,
            }),
          }),
          shared_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: "shared-1", user_id: "user-2", permission: "view" },
            }),
          }),
        })
      );
      const result = await getListDetails("list-private", "user-2");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("list-private");
      expect(result?.permission).toBe("view");
    });
    it("共有ユーザー（編集権限）は非公開リストを閲覧・編集できる", async () => {
      mockFrom.mockImplementation(
        addCommonTableMocks({
          place_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: "list-private",
                name: "非公開リスト",
                is_public: false,
                created_by: "owner-1",
              },
              error: null,
            }),
          }),
          shared_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: "shared-2", user_id: "user-3", permission: "edit" },
            }),
          }),
        })
      );
      const result = await getListDetails("list-private", "user-3");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("list-private");
      expect(result?.permission).toBe("edit");
    });
    it("権限のないユーザーは非公開リストにアクセスできない", async () => {
      mockFrom.mockImplementation(
        addCommonTableMocks({
          place_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: "list-private",
                name: "非公開リスト",
                is_public: false,
                created_by: "owner-1",
              },
              error: null,
            }),
          }),
          shared_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null }),
          }),
        })
      );
      const result = await getListDetails("list-private", "user-4");
      expect(result).toBeNull();
    });
    it("非公開リストでもRLS拒否時はnullを返す", async () => {
      mockFrom.mockImplementation((tableName: string) => {
        if (tableName === "place_lists") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest
              .fn()
              .mockResolvedValue({ data: null, error: { message: "RLS拒否" } }),
          };
        }
        return {};
      });
      const result = await getListDetails("list-private", "user-1");
      expect(result).toBeNull();
    });
  });

  describe("リスト編集権限の検証", () => {
    it("オーナーは編集権限を持つ", async () => {
      mockFrom.mockImplementation(
        addCommonTableMocks({
          place_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: "list-edit",
                name: "編集リスト",
                is_public: false,
                created_by: "owner-1",
              },
              error: null,
            }),
          }),
          shared_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null }),
          }),
        })
      );
      const result = await getListDetails("list-edit", "owner-1");
      expect(result?.permission).toBe("owner");
    });
    it("編集権限ユーザーは編集権限を持つ", async () => {
      mockFrom.mockImplementation(
        addCommonTableMocks({
          place_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: "list-edit",
                name: "編集リスト",
                is_public: false,
                created_by: "owner-1",
              },
              error: null,
            }),
          }),
          shared_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: "shared-3", user_id: "user-5", permission: "edit" },
            }),
          }),
        })
      );
      const result = await getListDetails("list-edit", "user-5");
      expect(result?.permission).toBe("edit");
    });
    it("閲覧権限ユーザーは編集権限を持たない", async () => {
      mockFrom.mockImplementation(
        addCommonTableMocks({
          place_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: "list-edit",
                name: "編集リスト",
                is_public: false,
                created_by: "owner-1",
              },
              error: null,
            }),
          }),
          shared_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: "shared-4", user_id: "user-6", permission: "view" },
            }),
          }),
        })
      );
      const result = await getListDetails("list-edit", "user-6");
      expect(result?.permission).toBe("view");
    });
    it("権限のないユーザーは編集権限を持たない", async () => {
      mockFrom.mockImplementation(
        addCommonTableMocks({
          place_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: "list-edit",
                name: "編集リスト",
                is_public: false,
                created_by: "owner-1",
              },
              error: null,
            }),
          }),
          shared_lists: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null }),
          }),
        })
      );
      const result = await getListDetails("list-edit", "user-7");
      expect(result?.permission).toBeUndefined();
    });
  });
});
