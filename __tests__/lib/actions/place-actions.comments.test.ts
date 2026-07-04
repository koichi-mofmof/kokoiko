/**
 * place-actions.ts のコメントCRUD・地点更新/削除の正常系＋異常系を検証する。
 * 既存の place-actions.test.ts（registerPlaceToListAction）とは別ファイルとし、実バリデータを使う。
 */
import {
  addCommentToListPlace,
  deleteComment,
  deleteListPlaceAction,
  getCommentsByListPlaceId,
  updateComment,
  updatePlaceDetailsAction,
} from "@/lib/actions/place-actions";
import { createClient } from "@/lib/supabase/server";
import { revalidateListCache } from "@/lib/cloudflare/cdn-cache";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/cloudflare/cdn-cache", () => ({
  revalidateListCache: jest.fn().mockResolvedValue(undefined),
}));

const mockCreateClient = createClient as jest.Mock;

const UUID = "b3b1c2d3-4e5f-6789-0123-456789abcdef";

type TableCfg = { single?: any; then?: any };

/**
 * テーブル別に single()（取得）と await（変更/一覧）の結果を出し分ける Supabase モック。
 */
function makeClient(opts: {
  user?: any;
  authError?: any;
  tables?: Record<string, TableCfg>;
  rpcError?: any;
}) {
  const tables = opts.tables ?? {};
  return {
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({
          data: { user: opts.user ?? null },
          error: opts.authError ?? null,
        }),
    },
    from: jest.fn((t: string) => {
      const cfg = tables[t] ?? {};
      const singleResult = cfg.single ?? { data: null, error: null };
      const thenResult = cfg.then ?? { data: null, error: null };
      const builder: any = {
        select: jest.fn(() => builder),
        eq: jest.fn(() => builder),
        in: jest.fn(() => builder),
        order: jest.fn(() => builder),
        insert: jest.fn(() => builder),
        update: jest.fn(() => builder),
        delete: jest.fn(() => builder),
        single: jest.fn(() => Promise.resolve(singleResult)),
        then: (resolve: (v: any) => any) => resolve(thenResult),
      };
      return builder;
    }),
    rpc: jest.fn(() => Promise.resolve({ error: opts.rpcError ?? null })),
  };
}

const fd = (entries: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
};

describe("getCommentsByListPlaceId", () => {
  beforeEach(() => jest.clearAllMocks());

  it("コメント一覧を返す", async () => {
    const comments = [{ id: "c1", comment: "hi" }];
    mockCreateClient.mockResolvedValue(
      makeClient({ tables: { list_place_commnts: { then: { data: comments, error: null } } } })
    );
    expect(await getCommentsByListPlaceId("lp1")).toEqual(comments);
  });

  it("エラー時は空配列を返す", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        tables: {
          list_place_commnts: { then: { data: null, error: { message: "boom" } } },
        },
      })
    );
    expect(await getCommentsByListPlaceId("lp1")).toEqual([]);
  });
});

describe("addCommentToListPlace", () => {
  beforeEach(() => jest.clearAllMocks());

  it("未認証なら unauthorized", async () => {
    mockCreateClient.mockResolvedValue(makeClient({ user: null }));
    const r = await addCommentToListPlace({ comment: "hi", listPlaceId: "lp1" });
    expect(r).toEqual({
      success: false,
      errorKey: "errors.common.unauthorized",
      error: "認証が必要です。",
    });
  });

  it("入力が不正なら invalidInput", async () => {
    mockCreateClient.mockResolvedValue(makeClient({ user: { id: "u1" } }));
    const r = await addCommentToListPlace({ comment: "", listPlaceId: "lp1" });
    expect(r.success).toBe(false);
    expect(r.errorKey).toBe("errors.validation.invalidInput");
  });

  it("正常系は success を返す", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        user: { id: "u1" },
        tables: { list_place_commnts: { then: { error: null } } },
      })
    );
    const r = await addCommentToListPlace({ comment: "hi", listPlaceId: "lp1" });
    expect(r).toEqual({ success: true });
  });

  it("insert 失敗なら saveFailed", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        user: { id: "u1" },
        tables: { list_place_commnts: { then: { error: { message: "x" } } } },
      })
    );
    const r = await addCommentToListPlace({ comment: "hi", listPlaceId: "lp1" });
    expect(r.errorKey).toBe("lists.comments.saveFailed");
  });
});

describe("updateComment", () => {
  beforeEach(() => jest.clearAllMocks());

  it("未認証なら unauthorized", async () => {
    mockCreateClient.mockResolvedValue(makeClient({ user: null }));
    const r = await updateComment({ commentId: "c1", comment: "new" });
    expect(r.errorKey).toBe("errors.common.unauthorized");
  });

  it("コメントが無ければ notFound", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        user: { id: "u1" },
        tables: {
          list_place_commnts: { single: { data: null, error: { message: "nf" } } },
        },
      })
    );
    const r = await updateComment({ commentId: "c1", comment: "new" });
    expect(r.errorKey).toBe("lists.comments.notFound");
  });

  it("他人のコメントは noPermission", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        user: { id: "u1" },
        tables: {
          list_place_commnts: {
            single: { data: { user_id: "other", list_place_id: "lp1" }, error: null },
          },
        },
      })
    );
    const r = await updateComment({ commentId: "c1", comment: "new" });
    expect(r.errorKey).toBe("errors.common.noPermission");
  });

  it("正常系は success を返す", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        user: { id: "u1" },
        tables: {
          list_place_commnts: {
            single: { data: { user_id: "u1", list_place_id: "lp1" }, error: null },
            then: { error: null },
          },
        },
      })
    );
    const r = await updateComment({ commentId: "c1", comment: "new" });
    expect(r).toEqual({ success: true });
  });

  it("update 失敗なら updateFailed", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        user: { id: "u1" },
        tables: {
          list_place_commnts: {
            single: { data: { user_id: "u1", list_place_id: "lp1" }, error: null },
            then: { error: { message: "x" } },
          },
        },
      })
    );
    const r = await updateComment({ commentId: "c1", comment: "new" });
    expect(r.errorKey).toBe("lists.comments.updateFailed");
  });
});

describe("deleteComment", () => {
  beforeEach(() => jest.clearAllMocks());

  it("未認証なら unauthorized", async () => {
    mockCreateClient.mockResolvedValue(makeClient({ user: null }));
    const r = await deleteComment("c1");
    expect(r.errorKey).toBe("errors.common.unauthorized");
  });

  it("他人のコメントは noPermission", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        user: { id: "u1" },
        tables: {
          list_place_commnts: {
            single: { data: { user_id: "other", list_place_id: "lp1" }, error: null },
          },
        },
      })
    );
    const r = await deleteComment("c1");
    expect(r.errorKey).toBe("errors.common.noPermission");
  });

  it("正常系は success を返す", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        user: { id: "u1" },
        tables: {
          list_place_commnts: {
            single: { data: { user_id: "u1", list_place_id: "lp1" }, error: null },
            then: { error: null },
          },
        },
      })
    );
    const r = await deleteComment("c1");
    expect(r).toEqual({ success: true });
  });

  it("delete 失敗なら deleteFailed", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        user: { id: "u1" },
        tables: {
          list_place_commnts: {
            single: { data: { user_id: "u1", list_place_id: "lp1" }, error: null },
            then: { error: { message: "x" } },
          },
        },
      })
    );
    const r = await deleteComment("c1");
    expect(r.errorKey).toBe("lists.comments.deleteFailed");
  });
});

describe("updatePlaceDetailsAction", () => {
  beforeEach(() => jest.clearAllMocks());

  it("バリデーション不正（uuidでない）なら invalidInput", async () => {
    mockCreateClient.mockResolvedValue(makeClient({ user: { id: "u1" } }));
    const r = await updatePlaceDetailsAction(
      null,
      fd({ listPlaceId: "not-uuid", visitedStatus: "visited", tags: "[]" })
    );
    expect(r.errorKey).toBe("errors.validation.invalidInput");
    expect(r.fieldErrors).toBeDefined();
  });

  it("正常系は successKey を返す", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({ user: { id: "u1" }, rpcError: null })
    );
    const r = await updatePlaceDetailsAction(
      null,
      fd({
        listPlaceId: UUID,
        visitedStatus: "visited",
        tags: JSON.stringify([{ id: "t1", name: "カフェ" }]),
      })
    );
    expect(r.successKey).toBe("place.update.success");
  });

  it("RPC エラーなら updateFailed", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({ user: { id: "u1" }, rpcError: { message: "rpc boom" } })
    );
    const r = await updatePlaceDetailsAction(
      null,
      fd({ listPlaceId: UUID, visitedStatus: "visited", tags: "[]" })
    );
    expect(r.errorKey).toBe("place.errors.updateFailed");
  });
});

describe("deleteListPlaceAction", () => {
  beforeEach(() => jest.clearAllMocks());

  it("バリデーション不正なら invalidInput", async () => {
    mockCreateClient.mockResolvedValue(makeClient({}));
    const r = await deleteListPlaceAction(fd({ listPlaceId: "not-uuid" }));
    expect(r.errorKey).toBe("errors.validation.invalidInput");
  });

  it("正常系は successKey を返しキャッシュを無効化する", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        tables: { list_places: { single: { data: { list_id: "L1" }, error: null } } },
        rpcError: null,
      })
    );
    const r = await deleteListPlaceAction(fd({ listPlaceId: UUID }));
    expect(r.successKey).toBe("place.delete.success");
    expect(revalidateListCache).toHaveBeenCalledWith("L1");
  });

  it("RPC エラーなら deleteFailed", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        tables: { list_places: { single: { data: { list_id: "L1" }, error: null } } },
        rpcError: { message: "rpc boom" },
      })
    );
    const r = await deleteListPlaceAction(fd({ listPlaceId: UUID }));
    expect(r.errorKey).toBe("place.errors.deleteFailed");
  });
});
