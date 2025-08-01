import {
  getPublicListsForHome,
  getPublicListsPaginated,
} from "@/lib/dal/public-lists";
import { createAnonymousClient } from "@/lib/supabase/server";

// Supabaseクライアントのモック
jest.mock("@/lib/supabase/server", () => ({
  createAnonymousClient: jest.fn(),
}));

describe("Public Lists API Integration", () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createAnonymousClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe("getPublicListsForHome", () => {
    it("should handle empty results", async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === "place_lists") {
          return {
            select: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
          };
        }
        return mockSupabase;
      });

      const result = await getPublicListsForHome(8);

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === "place_lists") {
          return {
            select: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
          };
        }
        return mockSupabase;
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
                data: [],
                error: null,
              };
            }),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
          };
        }
        return mockSupabase;
      });

      const result = await getPublicListsPaginated(10, 0, "updated_at", "desc");

      expect(result.lists).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it("should handle database errors gracefully", async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === "place_lists") {
          return {
            select: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database connection failed" },
            }),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
          };
        }
        return mockSupabase;
      });

      const result = await getPublicListsPaginated(10, 0, "updated_at", "desc");

      expect(result.lists).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe("Error handling", () => {
    it("should handle network errors", async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error("Network error");
      });

      const result = await getPublicListsForHome(8);

      expect(result).toEqual([]);
    });
  });
});
