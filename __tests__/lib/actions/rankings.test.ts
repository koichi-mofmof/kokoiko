import {
  fetchRankingViewData,
  saveRankingViewData,
} from "@/lib/actions/rankings";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.Mock;

type TableResults = Record<string, { data?: any; error?: any }>;

/**
 * テーブルごとに結果を返す Supabase クライアントのモック。
 * select/eq/order/in/delete/insert は自身を返し、await 時に結果を解決する。
 */
function makeClient(
  results: TableResults,
  opts: { user?: any; authError?: any } = {}
) {
  const insertSpy = jest.fn();
  const deleteSpy = jest.fn();

  const client = {
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({
          data: { user: opts.user ?? null },
          error: opts.authError ?? null,
        })
      ),
    },
    from: jest.fn((table: string) => {
      const result = results[table] ?? { data: [], error: null };
      const builder: any = {
        select: jest.fn(() => builder),
        eq: jest.fn(() => builder),
        in: jest.fn(() => builder),
        order: jest.fn(() => builder),
        delete: jest.fn(() => {
          deleteSpy(table);
          return builder;
        }),
        insert: jest.fn((rows: any) => {
          insertSpy(table, rows);
          return builder;
        }),
        then: (resolve: (v: any) => any) => resolve(result),
      };
      return builder;
    }),
    __insertSpy: insertSpy,
    __deleteSpy: deleteSpy,
  };
  return client;
}

describe("fetchRankingViewData", () => {
  beforeEach(() => jest.clearAllMocks());

  it("ランキング・地点を取得して camelCase で返す", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        list_place_rankings: {
          data: [{ place_id: "p1", rank: 1, comment: "最高" }],
          error: null,
        },
        list_places: { data: [{ place_id: "p1" }], error: null },
        places: { data: [{ id: "p1", name: "場所1" }], error: null },
      })
    );

    const result = await fetchRankingViewData("list-1");

    expect(result.rankings).toEqual([
      { placeId: "p1", rank: 1, comment: "最高" },
    ]);
    expect(result.places).toEqual([{ id: "p1", name: "場所1" }]);
  });

  it("地点が無い場合は places クエリを実行せず空配列を返す", async () => {
    const client = makeClient({
      list_place_rankings: { data: [], error: null },
      list_places: { data: [], error: null },
    });
    mockCreateClient.mockResolvedValue(client);

    const result = await fetchRankingViewData("list-1");

    expect(result.rankings).toEqual([]);
    expect(result.places).toEqual([]);
    expect(client.from).not.toHaveBeenCalledWith("places");
  });

  it("ランキング取得エラー時は errorKey を返す", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        list_place_rankings: { data: null, error: { message: "boom" } },
      })
    );

    const result = await fetchRankingViewData("list-1");

    expect(result.errorKey).toBe("errors.common.fetchFailed");
    expect(result.error).toBe("boom");
  });
});

describe("saveRankingViewData", () => {
  beforeEach(() => jest.clearAllMocks());

  it("未認証なら unauthorized を返す", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({}, { user: null, authError: { message: "no" } })
    );

    const result = await saveRankingViewData({
      listId: "list-1",
      rankedPlaces: [{ placeId: "p1", rank: 1 }] as any,
    });

    expect(result.errorKey).toBe("errors.common.unauthorized");
  });

  it("既存削除のうえ新ランキングを insert し success を返す", async () => {
    const client = makeClient(
      { list_place_rankings: { error: null } },
      { user: { id: "user-1" } }
    );
    mockCreateClient.mockResolvedValue(client);

    const result = await saveRankingViewData({
      listId: "list-1",
      rankedPlaces: [
        { placeId: "p1", rank: 1, comment: "good" },
        { placeId: "p2", rank: 2 },
      ] as any,
    });

    expect(result.success).toBe(true);
    expect(client.__deleteSpy).toHaveBeenCalledWith("list_place_rankings");
    expect(client.__insertSpy).toHaveBeenCalledWith("list_place_rankings", [
      {
        list_id: "list-1",
        place_id: "p1",
        rank: 1,
        comment: "good",
        created_by: "user-1",
      },
      {
        list_id: "list-1",
        place_id: "p2",
        rank: 2,
        comment: null,
        created_by: "user-1",
      },
    ]);
  });

  it("ランキングが空なら insert せず success を返す", async () => {
    const client = makeClient(
      { list_place_rankings: { error: null } },
      { user: { id: "user-1" } }
    );
    mockCreateClient.mockResolvedValue(client);

    const result = await saveRankingViewData({
      listId: "list-1",
      rankedPlaces: [],
    });

    expect(result.success).toBe(true);
    expect(client.__insertSpy).not.toHaveBeenCalled();
  });

  it("insert エラー時は insertFailed を返す", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(
        { list_place_rankings: { error: { message: "insert boom" } } },
        { user: { id: "user-1" } }
      )
    );

    const result = await saveRankingViewData({
      listId: "list-1",
      rankedPlaces: [{ placeId: "p1", rank: 1 }] as any,
    });

    expect(result.errorKey).toBe("errors.common.insertFailed");
    expect(result.error).toBe("insert boom");
  });
});
