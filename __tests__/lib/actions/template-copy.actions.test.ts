import { createClient } from "@/lib/supabase/server";
import { copyPlacesToList } from "@/lib/actions/template-copy.actions";
import { getTotalAvailablePlaces } from "@/lib/utils/subscription-utils";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));
jest.mock("@/lib/utils/subscription-utils", () => ({
  getTotalAvailablePlaces: jest.fn(),
}));
jest.mock("@/lib/cloudflare/cdn-cache", () => ({
  revalidateListCache: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const validUuid = "11111111-1111-1111-1111-111111111111";
const targetUuid = "22222222-2222-2222-2222-222222222222";

// await でも .single() でも解決できるチェーン可能なクエリビルダーのモック
function makeBuilder({
  awaitResult,
  singleResult,
}: {
  awaitResult?: unknown;
  singleResult?: unknown;
}) {
  const q: Record<string, unknown> = {};
  q.select = jest.fn(() => q);
  q.eq = jest.fn(() => q);
  q.in = jest.fn(() => q);
  q.order = jest.fn(() => q);
  q.single = jest.fn(() => Promise.resolve(singleResult));
  q.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
    Promise.resolve(awaitResult).then(resolve, reject);
  return q;
}

function sourceRow(placeId: string, tagName?: string) {
  return {
    place_id: placeId,
    places: {
      google_place_id: placeId,
      name: `place-${placeId}`,
      address: "addr",
      latitude: 35.0,
      longitude: 139.0,
      country_code: "JP",
      country_name: "日本",
      admin_area_level_1: "東京都",
      region_hierarchy: { level1: "日本", level2: "東京都" },
    },
    list_place_tags: tagName ? [{ tags: { name: tagName } }] : [],
  };
}

function makeSupabase() {
  return {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
    rpc: jest.fn(),
  };
}

describe("copyPlacesToList", () => {
  let supabase: ReturnType<typeof makeSupabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    supabase = makeSupabase();
    (createClient as jest.Mock).mockResolvedValue(supabase);
  });

  const newTargetInput = {
    sourceListId: validUuid,
    placeIds: ["place_a"],
    target: { type: "new" as const, name: "私のリスト", isPublic: false },
  };

  it("未認証なら unauthorized を返す", async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("no user"),
    });
    const result = await copyPlacesToList(newTargetInput);
    expect(result.success).toBe(false);
    expect(result.errorKey).toBe("errors.common.unauthorized");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("入力が不正（placeIds空）なら検証エラーを返す", async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    const result = await copyPlacesToList({ ...newTargetInput, placeIds: [] });
    expect(result.success).toBe(false);
    expect(result.errorKey).toBe("templateCopy.errors.noSelection");
  });

  it("コピー元が非公開なら permissionDenied を返す", async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    supabase.from.mockReturnValueOnce(
      makeBuilder({
        singleResult: { data: { id: "src", is_public: false }, error: null },
      })
    );
    const result = await copyPlacesToList(newTargetInput);
    expect(result.success).toBe(false);
    expect(result.errorKey).toBe("templateCopy.errors.permissionDenied");
  });

  it("新規リストへ公開リストの地点をコピーできる（プレミアム=無制限）", async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    // from 呼び出し順: 1) コピー元検証 2) コピー元地点取得（新規targetは既存取得なし）
    supabase.from
      .mockReturnValueOnce(
        makeBuilder({
          singleResult: { data: { id: "src", is_public: true }, error: null },
        })
      )
      .mockReturnValueOnce(
        makeBuilder({
          awaitResult: { data: [sourceRow("place_a", "カフェ")], error: null },
        })
      );

    supabase.rpc.mockImplementation((name: string) => {
      if (name === "create_place_list")
        return Promise.resolve({ data: { id: "new-list" }, error: null });
      if (name === "register_place_to_list")
        return Promise.resolve({ data: "lp-1", error: null });
      return Promise.resolve({ data: null, error: null });
    });

    (getTotalAvailablePlaces as jest.Mock).mockResolvedValue({
      totalLimit: Infinity,
      usedPlaces: 0,
      remainingPlaces: Infinity,
      sources: [{ type: "subscription", limit: Infinity, used: 0 }],
    });

    const result = await copyPlacesToList(newTargetInput);

    expect(result.success).toBe(true);
    expect(result.copiedCount).toBe(1);
    expect(result.skippedDuplicates).toBe(0);
    expect(result.targetListId).toBe("new-list");
    expect(supabase.rpc).toHaveBeenCalledWith(
      "register_place_to_list",
      expect.objectContaining({
        list_id_input: "new-list",
        user_id_input: "u1",
        google_place_id_input: "place_a",
        tag_names_input: ["カフェ"],
        visited_status_input: "not_visited",
      })
    );
  });

  it("既存リストへのコピーで重複地点はスキップする", async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    // from 順: 1) コピー元検証 2) コピー元地点 3) コピー先所有者確認 4) コピー先既存地点
    supabase.from
      .mockReturnValueOnce(
        makeBuilder({
          singleResult: { data: { id: "src", is_public: true }, error: null },
        })
      )
      .mockReturnValueOnce(
        makeBuilder({ awaitResult: { data: [sourceRow("place_a")], error: null } })
      )
      .mockReturnValueOnce(
        makeBuilder({
          singleResult: {
            data: { id: targetUuid, created_by: "u1" },
            error: null,
          },
        })
      )
      .mockReturnValueOnce(
        makeBuilder({
          awaitResult: { data: [{ place_id: "place_a" }], error: null },
        })
      );

    (getTotalAvailablePlaces as jest.Mock).mockResolvedValue({
      totalLimit: Infinity,
      usedPlaces: 0,
      remainingPlaces: Infinity,
      sources: [],
    });

    const result = await copyPlacesToList({
      sourceListId: validUuid,
      placeIds: ["place_a"],
      target: { type: "existing", listId: targetUuid },
    });

    expect(result.success).toBe(true);
    expect(result.copiedCount).toBe(0);
    expect(result.skippedDuplicates).toBe(1);
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "register_place_to_list",
      expect.anything()
    );
  });

  it("上限がゼロなら limit.full を返し、新規リストを作らずコピーしない", async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    supabase.from
      .mockReturnValueOnce(
        makeBuilder({
          singleResult: { data: { id: "src", is_public: true }, error: null },
        })
      )
      .mockReturnValueOnce(
        makeBuilder({ awaitResult: { data: [sourceRow("place_a")], error: null } })
      );

    (getTotalAvailablePlaces as jest.Mock).mockResolvedValue({
      totalLimit: 30,
      usedPlaces: 30,
      remainingPlaces: 0,
      sources: [{ type: "free", limit: 30, used: 30 }],
    });

    const result = await copyPlacesToList(newTargetInput);
    expect(result.success).toBe(false);
    expect(result.limitReached).toBe(true);
    expect(result.errorKey).toBe("templateCopy.limit.full");
    expect(result.remainingPlaces).toBe(0);
    expect(result.requestedCount).toBe(1);
    // 副作用がないこと（空リストを作らない）
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "create_place_list",
      expect.anything()
    );
  });

  it("残数を超える選択は limit.exceeded を返し、コピーしない", async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    supabase.from
      .mockReturnValueOnce(
        makeBuilder({
          singleResult: { data: { id: "src", is_public: true }, error: null },
        })
      )
      .mockReturnValueOnce(
        makeBuilder({
          awaitResult: {
            data: [sourceRow("p1"), sourceRow("p2"), sourceRow("p3")],
            error: null,
          },
        })
      );

    (getTotalAvailablePlaces as jest.Mock).mockResolvedValue({
      totalLimit: 30,
      usedPlaces: 28,
      remainingPlaces: 2,
      sources: [{ type: "free", limit: 30, used: 28 }],
    });

    const result = await copyPlacesToList({
      sourceListId: validUuid,
      placeIds: ["p1", "p2", "p3"],
      target: { type: "new", name: "私のリスト", isPublic: false },
    });

    expect(result.success).toBe(false);
    expect(result.limitReached).toBe(true);
    expect(result.errorKey).toBe("templateCopy.limit.exceeded");
    expect(result.remainingPlaces).toBe(2);
    expect(result.requestedCount).toBe(3);
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "create_place_list",
      expect.anything()
    );
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "register_place_to_list",
      expect.anything()
    );
  });

  it("残数ちょうどならコピーできる（境界値）", async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    supabase.from
      .mockReturnValueOnce(
        makeBuilder({
          singleResult: { data: { id: "src", is_public: true }, error: null },
        })
      )
      .mockReturnValueOnce(
        makeBuilder({
          awaitResult: {
            data: [sourceRow("p1"), sourceRow("p2")],
            error: null,
          },
        })
      );

    supabase.rpc.mockImplementation((name: string) => {
      if (name === "create_place_list")
        return Promise.resolve({ data: { id: "new-list" }, error: null });
      return Promise.resolve({ data: "lp", error: null });
    });

    (getTotalAvailablePlaces as jest.Mock).mockResolvedValue({
      totalLimit: 30,
      usedPlaces: 28,
      remainingPlaces: 2,
      sources: [{ type: "free", limit: 30, used: 28 }],
    });

    const result = await copyPlacesToList({
      sourceListId: validUuid,
      placeIds: ["p1", "p2"],
      target: { type: "new", name: "私のリスト", isPublic: false },
    });

    expect(result.success).toBe(true);
    expect(result.copiedCount).toBe(2);
  });
});
