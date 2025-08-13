import {
  getPublicListsForHome,
  getPublicListsPaginated,
} from "@/lib/dal/public-lists";
import { createAnonymousClient } from "@/lib/supabase/server";

// Supabaseクライアントのモック
jest.mock("@/lib/supabase/server", () => ({
  createAnonymousClient: jest.fn(),
}));

describe("public-lists DAL", () => {
  const mockSupabase = {
    from: jest.fn(),
    rpc: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (createAnonymousClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe("getPublicListsForHome", () => {
    it("should handle empty results", async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const result = await getPublicListsForHome(8);

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const result = await getPublicListsForHome(8);

      expect(result).toEqual([]);
    });
  });

  describe("getPublicListsPaginated", () => {
    it("should handle empty results", async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === "place_lists") {
          return {
            select: jest.fn().mockImplementation((fields) => {
              if (fields === "*") {
                return {
                  count: 0,
                  error: null,
                };
              }
              return {
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  }),
                }),
              };
            }),
          };
        }
        return mockSupabase;
      });

      const result = await getPublicListsPaginated(10, 0, "updated_at", "desc");

      expect(result.lists).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });
});
