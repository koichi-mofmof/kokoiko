import { getListDetails } from "@/lib/dal/lists";
import { canAccessList } from "@/lib/utils/permission-check";

/**
 * テーブルごとに結果を返す Supabase クライアントのモックを生成する。
 * チェーン（select/eq/in/order）は自身を返し、await・single・maybeSingle 時に
 * そのテーブル用の結果を解決する thenable として振る舞う。
 */
type TableResults = Record<string, { data: any; error: any }>;

function makeSupabaseClient(results: TableResults) {
  return {
    auth: { getUser: jest.fn() },
    from: jest.fn((table: string) => {
      const result = results[table] ?? { data: null, error: null };
      const builder: any = {
        select: jest.fn(() => builder),
        eq: jest.fn(() => builder),
        in: jest.fn(() => builder),
        neq: jest.fn(() => builder),
        order: jest.fn(() => builder),
        single: jest.fn(() => Promise.resolve(result)),
        maybeSingle: jest.fn(() => Promise.resolve(result)),
        then: (resolve: (v: any) => any) => resolve(result),
      };
      return builder;
    }),
  };
}

// 各テストで差し替えられるよう、可変の参照を保持する
let currentClient: ReturnType<typeof makeSupabaseClient>;

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(currentClient)),
}));

jest.mock("@/lib/supabase/storage", () => ({
  getStoragePublicUrl: jest
    .fn()
    .mockResolvedValue("https://example.com/avatar.png"),
}));

// getListDetails のアクセス判定は canAccessList に委譲されるためモックする
jest.mock("@/lib/utils/permission-check", () => {
  const actual = jest.requireActual("@/lib/utils/permission-check");
  return {
    ...actual,
    canAccessList: jest.fn(),
  };
});

const mockCanAccessList = canAccessList as jest.Mock;

// =============================================================
// canAccessList: アクセス制御ロジック本体（実装をそのまま検証）
// =============================================================
describe("canAccessList（アクセス制御ロジック）", () => {
  // 実装を検証するため、このブロックだけ本物の canAccessList を使う
  const realCanAccessList = jest.requireActual(
    "@/lib/utils/permission-check"
  ).canAccessList as typeof canAccessList;

  const setClient = (results: TableResults) => {
    currentClient = makeSupabaseClient(results);
  };

  it("公開リストは未ログインユーザーでも view 権限でアクセスできる", async () => {
    setClient({
      place_lists: {
        data: { created_by: "owner-1", is_public: true },
        error: null,
      },
    });

    const result = await realCanAccessList("list-public");
    expect(result).toEqual({ canAccess: true, permission: "view" });
  });

  it("公開リストの作成者は manage 権限を持つ", async () => {
    setClient({
      shared_lists: { data: null, error: null },
      place_lists: {
        data: { created_by: "owner-1", is_public: true },
        error: null,
      },
    });

    const result = await realCanAccessList("list-public", "owner-1");
    expect(result).toEqual({ canAccess: true, permission: "manage" });
  });

  it("共有ユーザー（編集権限）は edit 権限でアクセスできる", async () => {
    setClient({
      shared_lists: { data: { permission: "edit", list_id: "l" }, error: null },
      place_lists: {
        data: { created_by: "owner-1", is_public: false },
        error: null,
      },
    });

    const result = await realCanAccessList("list-private", "user-2");
    expect(result).toEqual({ canAccess: true, permission: "edit" });
  });

  it("非公開リストの作成者は manage 権限を持つ", async () => {
    setClient({
      shared_lists: { data: null, error: null },
      place_lists: {
        data: { created_by: "user-1", is_public: false },
        error: null,
      },
    });

    const result = await realCanAccessList("list-private", "user-1");
    expect(result).toEqual({ canAccess: true, permission: "manage" });
  });

  it("権限のないユーザーは非公開リストにアクセスできない", async () => {
    setClient({
      shared_lists: { data: null, error: null },
      place_lists: {
        data: { created_by: "owner-1", is_public: false },
        error: null,
      },
    });

    const result = await realCanAccessList("list-private", "stranger");
    expect(result).toEqual({ canAccess: false, permission: null });
  });

  it("未ログインユーザーは非公開リストにアクセスできない", async () => {
    setClient({
      place_lists: {
        data: { created_by: "owner-1", is_public: false },
        error: null,
      },
    });

    const result = await realCanAccessList("list-private");
    expect(result).toEqual({ canAccess: false, permission: null });
  });

  it("存在しない/RLS 拒否のリストはアクセス不可", async () => {
    setClient({
      shared_lists: { data: null, error: null },
      place_lists: {
        data: null,
        error: { code: "PGRST116", message: "No rows returned" },
      },
    });

    const result = await realCanAccessList("missing-list", "user-1");
    expect(result).toEqual({ canAccess: false, permission: null });
  });

  it("listId が空ならアクセス不可", async () => {
    const result = await realCanAccessList("");
    expect(result).toEqual({ canAccess: false, permission: null });
  });
});

// =============================================================
// getListDetails: canAccessList への委譲・owner 上書き・組み立て
// =============================================================
describe("getListDetails（アクセス制御の委譲と結果組み立て）", () => {
  const baseList = {
    id: "list-1",
    name: "テストリスト",
    description: "説明",
    is_public: false,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    created_by: "owner-1",
  };

  /** getListDetails が辿る各テーブルの既定モックを用意する */
  const setClientForList = (
    list: any,
    opts: { listError?: any; isBookmarked?: boolean } = {}
  ) => {
    currentClient = makeSupabaseClient({
      place_lists: { data: opts.listError ? null : list, error: opts.listError ?? null },
      list_places: { data: [], error: null },
      list_bookmarks: {
        data: opts.isBookmarked ? { id: "bm-1" } : null,
        error: null,
      },
      profiles: {
        data: { id: list?.created_by, display_name: "オーナー", avatar_url: null },
        error: null,
      },
      shared_lists: { data: [], error: null },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("canAccessList が拒否したら null を返す", async () => {
    mockCanAccessList.mockResolvedValue({ canAccess: false, permission: null });
    setClientForList(baseList);

    const result = await getListDetails("list-1", "stranger");
    expect(result).toBeNull();
  });

  it("アクセス許可でもリスト取得に失敗したら null を返す", async () => {
    mockCanAccessList.mockResolvedValue({ canAccess: true, permission: "view" });
    setClientForList(baseList, {
      listError: { code: "PGRST116", message: "No rows returned" },
    });

    const result = await getListDetails("list-1", "user-1");
    expect(result).toBeNull();
  });

  it("作成者は permission が owner に上書きされる", async () => {
    // canAccessList が manage を返しても、作成者なら owner になる
    mockCanAccessList.mockResolvedValue({
      canAccess: true,
      permission: "manage",
    });
    setClientForList({ ...baseList, created_by: "user-1" });

    const result = await getListDetails("list-1", "user-1");
    expect(result).not.toBeNull();
    expect(result?.permission).toBe("owner");
  });

  it("共有（編集権限）ユーザーは edit がそのまま反映される", async () => {
    mockCanAccessList.mockResolvedValue({ canAccess: true, permission: "edit" });
    setClientForList(baseList); // created_by: owner-1

    const result = await getListDetails("list-1", "user-2");
    expect(result?.permission).toBe("edit");
  });

  it("共有（閲覧権限）ユーザーは view がそのまま反映される", async () => {
    mockCanAccessList.mockResolvedValue({ canAccess: true, permission: "view" });
    setClientForList(baseList);

    const result = await getListDetails("list-1", "user-3");
    expect(result?.permission).toBe("view");
  });

  it("公開リストは未ログインでも取得でき view 権限になる", async () => {
    mockCanAccessList.mockResolvedValue({ canAccess: true, permission: "view" });
    setClientForList({ ...baseList, is_public: true });

    const result = await getListDetails("list-1");
    expect(result).not.toBeNull();
    expect(result?.is_public).toBe(true);
    expect(result?.permission).toBe("view");
  });

  it("ブックマーク済みなら isBookmarked が true になる", async () => {
    mockCanAccessList.mockResolvedValue({ canAccess: true, permission: "view" });
    setClientForList(baseList, { isBookmarked: true });

    const result = await getListDetails("list-1", "user-2");
    expect(result?.isBookmarked).toBe(true);
  });

  it("place_count は取得した地点数を反映する", async () => {
    mockCanAccessList.mockResolvedValue({ canAccess: true, permission: "view" });
    setClientForList(baseList);

    const result = await getListDetails("list-1", "user-2");
    expect(result?.place_count).toBe(0);
    expect(result?.places).toEqual([]);
  });
});
