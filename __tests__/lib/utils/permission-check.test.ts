import {
  canJoinViaToken,
  canManageShareLinks,
  hasListPermission,
} from "@/lib/utils/permission-check";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.Mock;

type TableResults = Record<string, { data: any; error: any }>;

/** テーブルごとに single() の結果を返す Supabase モック */
function makeClient(results: TableResults) {
  mockCreateClient.mockResolvedValue({
    from: jest.fn((table: string) => {
      const result = results[table] ?? { data: null, error: null };
      const builder: any = {
        select: jest.fn(() => builder),
        eq: jest.fn(() => builder),
        single: jest.fn(() => Promise.resolve(result)),
      };
      return builder;
    }),
  });
}

const PGRST116 = { code: "PGRST116", message: "No rows" };

describe("hasListPermission", () => {
  beforeEach(() => jest.clearAllMocks());

  it("listId / userId が無ければ false", async () => {
    expect(await hasListPermission("", "u1", "view")).toBe(false);
    expect(await hasListPermission("l1", "", "view")).toBe(false);
  });

  it("オーナーは常に true", async () => {
    makeClient({
      place_lists: { data: { created_by: "u1" }, error: null },
    });
    expect(await hasListPermission("l1", "u1", "manage")).toBe(true);
  });

  it("place_lists 取得で PGRST116 以外のエラーなら false", async () => {
    makeClient({
      place_lists: { data: null, error: { code: "XX", message: "db" } },
    });
    expect(await hasListPermission("l1", "u1", "view")).toBe(false);
  });

  it("共有レコードが無ければ false", async () => {
    makeClient({
      place_lists: { data: { created_by: "owner" }, error: null },
      shared_lists: { data: null, error: PGRST116 },
    });
    expect(await hasListPermission("l1", "u1", "view")).toBe(false);
  });

  it.each([
    ["view", "view", true],
    ["view", "edit", false],
    ["edit", "view", true],
    ["edit", "edit", true],
    ["manage", "edit", true],
    ["manage", "view", true],
  ])(
    "共有権限 %s で要求 %s の判定は %s",
    async (granted, required, expected) => {
      makeClient({
        place_lists: { data: { created_by: "owner" }, error: null },
        shared_lists: { data: { permission: granted }, error: null },
      });
      expect(await hasListPermission("l1", "u1", required as any)).toBe(
        expected
      );
    }
  );

  it("未知の権限値は false にフォールバックする", async () => {
    makeClient({
      place_lists: { data: { created_by: "owner" }, error: null },
      shared_lists: { data: { permission: "superuser" }, error: null },
    });
    expect(await hasListPermission("l1", "u1", "view")).toBe(false);
  });
});

describe("canManageShareLinks", () => {
  beforeEach(() => jest.clearAllMocks());

  it("編集権限相当があれば true（オーナー）", async () => {
    makeClient({
      place_lists: { data: { created_by: "u1" }, error: null },
    });
    expect(await canManageShareLinks("l1", "u1")).toBe(true);
  });

  it("閲覧権限のみなら false", async () => {
    makeClient({
      place_lists: { data: { created_by: "owner" }, error: null },
      shared_lists: { data: { permission: "view" }, error: null },
    });
    expect(await canManageShareLinks("l1", "u1")).toBe(false);
  });
});

describe("canJoinViaToken", () => {
  beforeEach(() => jest.clearAllMocks());

  it("token / userId が無ければ invalidInput", async () => {
    const r = await canJoinViaToken("", "u1");
    expect(r).toEqual({
      canJoin: false,
      error: "errors.validation.invalidInput",
    });
  });

  it("トークンが存在しなければ invalidToken", async () => {
    makeClient({
      list_share_tokens: { data: null, error: PGRST116 },
    });
    const r = await canJoinViaToken("tok", "u1");
    expect(r.canJoin).toBe(false);
    expect(r.error).toBe("errors.validation.invalidToken");
  });

  it("無効化されたトークンは forbidden", async () => {
    makeClient({
      list_share_tokens: {
        data: { list_id: "l1", is_active: false, default_permission: "view" },
        error: null,
      },
    });
    const r = await canJoinViaToken("tok", "u1");
    expect(r.error).toBe("errors.common.forbidden");
  });

  it("期限切れトークンは linkExpired", async () => {
    makeClient({
      list_share_tokens: {
        data: {
          list_id: "l1",
          is_active: true,
          expires_at: "2000-01-01T00:00:00Z",
          default_permission: "view",
        },
        error: null,
      },
    });
    const r = await canJoinViaToken("tok", "u1");
    expect(r.error).toBe("errors.common.linkExpired");
  });

  it("利用上限に達したトークンは limitReached", async () => {
    makeClient({
      list_share_tokens: {
        data: {
          list_id: "l1",
          is_active: true,
          max_uses: 3,
          current_uses: 3,
          default_permission: "view",
        },
        error: null,
      },
    });
    const r = await canJoinViaToken("tok", "u1");
    expect(r.error).toBe("errors.common.limitReached");
  });

  it("既に参加済みなら forbidden（listId と permission を返す）", async () => {
    makeClient({
      list_share_tokens: {
        data: {
          list_id: "l1",
          is_active: true,
          default_permission: "view",
        },
        error: null,
      },
      shared_lists: { data: { permission: "edit" }, error: null },
    });
    const r = await canJoinViaToken("tok", "u1");
    expect(r).toEqual({
      canJoin: false,
      error: "errors.common.forbidden",
      listId: "l1",
      permission: "edit",
    });
  });

  it("有効なトークンなら canJoin true（default_permission を返す）", async () => {
    makeClient({
      list_share_tokens: {
        data: {
          list_id: "l1",
          is_active: true,
          default_permission: "edit",
        },
        error: null,
      },
      shared_lists: { data: null, error: PGRST116 },
    });
    const r = await canJoinViaToken("tok", "u1");
    expect(r).toEqual({
      canJoin: true,
      listId: "l1",
      permission: "edit",
    });
  });
});
