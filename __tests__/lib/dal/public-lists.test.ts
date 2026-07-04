import {
  getPublicListsForHome,
  getPublicListsPaginated,
} from "@/lib/dal/public-lists";
import { createAnonymousClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createAnonymousClient: jest.fn(),
}));

const mockCreate = createAnonymousClient as jest.Mock;
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL; // jest.setup で設定済み

/**
 * public-lists DAL 用の匿名 Supabase クライアントモック。
 * - place_lists: `.eq()` までの await は count を、`.range()` の await はデータを返す
 * - profiles: `.in()` の await はプロフィール配列を返す
 * - rpc: 設定した結果を返す
 */
function makeClient(opts: {
  rpc?: { data: any; error: any };
  count?: number;
  placeListsData?: { data: any; error: any };
  profiles?: any[];
}) {
  return {
    rpc: jest.fn(() =>
      Promise.resolve(opts.rpc ?? { data: null, error: null })
    ),
    from: jest.fn((table: string) => {
      if (table === "profiles") {
        const b: any = {
          select: jest.fn(() => b),
          in: jest.fn(() => b),
          then: (res: any) => res({ data: opts.profiles ?? [], error: null }),
        };
        return b;
      }
      // place_lists
      const b: any = {
        select: jest.fn(() => b),
        eq: jest.fn(() => b),
        order: jest.fn(() => b),
        range: jest.fn(() => ({
          then: (res: any) =>
            res(opts.placeListsData ?? { data: [], error: null }),
        })),
        // count クエリ（.eq() までを await）
        then: (res: any) => res({ count: opts.count ?? 0 }),
      };
      return b;
    }),
  };
}

describe("getPublicListsForHome", () => {
  beforeEach(() => jest.clearAllMocks());

  it("RPC エラー時は空配列を返す", async () => {
    mockCreate.mockReturnValue(
      makeClient({ rpc: { data: null, error: { message: "boom" } } })
    );
    expect(await getPublicListsForHome(8)).toEqual([]);
  });

  it("データが空なら空配列を返す", async () => {
    mockCreate.mockReturnValue(makeClient({ rpc: { data: [], error: null } }));
    expect(await getPublicListsForHome(8)).toEqual([]);
  });

  it("正常系: プロフィールを結合しアバターURLを構築する", async () => {
    mockCreate.mockReturnValue(
      makeClient({
        rpc: {
          data: [
            {
              id: "l1",
              name: "リスト1",
              description: "説明",
              created_by: "u1",
              created_at: "2024-01-01",
              updated_at: "2024-01-02",
              place_count: 5,
            },
            {
              id: "l2",
              name: "リスト2",
              description: null,
              created_by: "u2",
              created_at: "2024-01-01",
              updated_at: "2024-01-02",
              place_count: 3,
            },
          ],
          error: null,
        },
        profiles: [
          {
            id: "u1",
            username: "taro",
            display_name: "タロウ",
            avatar_url: "avatars/u1.png", // ローカルパス → URL構築される
          },
          {
            id: "u2",
            username: "hana",
            display_name: null,
            avatar_url: "https://cdn.example.com/u2.png", // http → そのまま
          },
        ],
      })
    );

    const result = await getPublicListsForHome();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: "l1",
      creatorUsername: "taro",
      creatorDisplayName: "タロウ",
      creatorAvatarUrl: `${SUPA}/storage/v1/object/public/profile_images/avatars/u1.png`,
      placeCount: 5,
    });
    expect(result[1].creatorAvatarUrl).toBe("https://cdn.example.com/u2.png");
    expect(result[1].creatorDisplayName).toBeNull();
  });

  it("予期せぬ例外は空配列にフォールバックする", async () => {
    mockCreate.mockReturnValue({
      rpc: jest.fn(() => {
        throw new Error("unexpected");
      }),
    });
    expect(await getPublicListsForHome()).toEqual([]);
  });
});

describe("getPublicListsPaginated", () => {
  beforeEach(() => jest.clearAllMocks());

  it("デフォルトソート（updated_at）で一覧と総数を返す", async () => {
    mockCreate.mockReturnValue(
      makeClient({
        count: 42,
        placeListsData: {
          data: [
            {
              id: "l1",
              name: "リスト1",
              description: null,
              created_by: "u1",
              created_at: "2024-01-01",
              updated_at: "2024-01-02",
              list_places: [{ count: 7 }],
            },
          ],
          error: null,
        },
        profiles: [
          { id: "u1", username: "taro", display_name: "タロウ", avatar_url: null },
        ],
      })
    );

    const result = await getPublicListsPaginated(20, 0, "updated_at", "desc");

    expect(result.totalCount).toBe(42);
    expect(result.lists).toHaveLength(1);
    expect(result.lists[0]).toMatchObject({
      id: "l1",
      creatorUsername: "taro",
      placeCount: 7,
    });
  });

  it("空結果でも総数を返す（回帰: 旧テスト相当）", async () => {
    mockCreate.mockReturnValue(
      makeClient({ count: 0, placeListsData: { data: [], error: null } })
    );
    const result = await getPublicListsPaginated(10, 0, "updated_at", "desc");
    expect(result.lists).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("データ取得エラー時は空配列・総数0を返す", async () => {
    mockCreate.mockReturnValue(
      makeClient({
        count: 10,
        placeListsData: { data: null, error: { message: "boom" } },
      })
    );

    const result = await getPublicListsPaginated(20, 0, "name", "asc");
    expect(result).toEqual({ lists: [], totalCount: 0 });
  });

  it("place_count ソートは RPC 経路で一覧と総数を返す", async () => {
    mockCreate.mockReturnValue(
      makeClient({
        count: 5,
        rpc: {
          data: [
            {
              id: "l1",
              name: "人気リスト",
              description: null,
              created_by: "u1",
              created_at: "2024-01-01",
              updated_at: "2024-01-02",
              place_count: 99,
            },
          ],
          error: null,
        },
        profiles: [
          { id: "u1", username: "taro", display_name: "タロウ", avatar_url: null },
        ],
      })
    );

    const result = await getPublicListsPaginated(20, 0, "place_count", "desc");

    expect(result.totalCount).toBe(5);
    expect(result.lists[0]).toMatchObject({ id: "l1", placeCount: 99 });
  });

  it("place_count ソートで RPC エラー時は空配列＋総数を保持する", async () => {
    mockCreate.mockReturnValue(
      makeClient({
        count: 8,
        rpc: { data: null, error: { message: "rpc boom" } },
      })
    );

    const result = await getPublicListsPaginated(20, 0, "place_count", "desc");
    expect(result).toEqual({ lists: [], totalCount: 8 });
  });
});
