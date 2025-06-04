jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

import { joinListViaShareLink, verifyShareToken } from "@/lib/actions/lists";

jest.mock("@/lib/actions/lists", () => {
  const original = jest.requireActual("@/lib/actions/lists");
  return {
    ...original,
    verifyShareToken: jest.fn(),
  };
});

describe("joinListViaShareLink", () => {
  let mockFrom: any;
  let mockRpc: any;
  beforeEach(() => {
    jest.resetAllMocks();
    const supabaseMock = require("@/lib/supabase/server");
    mockFrom = jest.fn();
    mockRpc = jest.fn();
    supabaseMock.createClient.mockReturnValue({
      from: mockFrom,
      rpc: mockRpc,
    });
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    }));
  });

  it("有効なトークン・未参加ユーザーで新規参加できること", async () => {
    (verifyShareToken as any).mockResolvedValue({
      success: true,
      listId: "list-1",
      permission: "edit",
    });
    mockFrom.mockImplementation((tableName: string) => {
      if (tableName === "shared_lists") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null }),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
        };
      }
      if (tableName === "list_share_tokens") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: "token-1",
              is_active: true,
              list_id: "list-1",
              default_permission: "edit",
            },
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({ error: null }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
      };
    });
    mockRpc.mockReturnValue({});
    const result = await joinListViaShareLink("token-1", "user-1", "owner-1");
    expect(result.success).toBe(true);
    expect(result.listId).toBe("list-1");
    expect(result.permission).toBe("edit");
  });

  it("有効なトークン・既存参加ユーザーで権限が更新されること", async () => {
    (verifyShareToken as any).mockResolvedValue({
      success: true,
      listId: "list-1",
      permission: "edit",
    });
    mockFrom.mockImplementation((tableName: string) => {
      if (tableName === "shared_lists") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: "shared-1", permission: "view" },
          }),
          update: jest.fn().mockReturnThis(),
        };
      }
      if (tableName === "list_share_tokens") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: "token-1",
              is_active: true,
              list_id: "list-1",
              default_permission: "edit",
            },
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({ error: null }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
      };
    });
    mockRpc.mockReturnValue({});
    const result = await joinListViaShareLink("token-1", "user-1", "owner-1");
    expect(result.success).toBe(true);
    expect(result.listId).toBe("list-1");
    expect(result.permission).toBe("edit");
  });

  it("トークン・ユーザーID・オーナーID未指定の場合はエラーになること", async () => {
    const result = await joinListViaShareLink("", "", "");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(
      /トークン、ユーザーID、またはオーナーIDが指定されていません/
    );
  });

  it("トークンが無効な場合はエラーになること", async () => {
    (verifyShareToken as any).mockResolvedValue({
      success: false,
      reason:
        "共有リンクが削除された可能性がありますので、リストの所有者にご確認ください。",
    });
    mockFrom.mockImplementation((tableName: string) => {
      if (tableName === "list_share_tokens") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({ error: null }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
      };
    });
    const result = await joinListViaShareLink(
      "invalid-token",
      "user-1",
      "owner-1"
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/共有リンクが削除/);
  });

  it("shared_listsのinsertでエラーが発生した場合はエラーになること", async () => {
    (verifyShareToken as any).mockResolvedValue({
      success: true,
      listId: "list-1",
      permission: "edit",
    });
    mockFrom.mockImplementation((tableName: string) => {
      if (tableName === "shared_lists") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null }),
          insert: jest
            .fn()
            .mockReturnValue({ error: { message: "insert error" } }),
          update: jest.fn().mockReturnThis(),
        };
      }
      if (tableName === "list_share_tokens") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: "token-1",
              is_active: true,
              list_id: "list-1",
              default_permission: "edit",
            },
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({ error: null }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
      };
    });
    mockRpc.mockReturnValue({});
    const result = await joinListViaShareLink("token-1", "user-1", "owner-1");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/参加処理中にエラー/);
  });

  it("list_share_tokensのcurrent_uses更新でエラーが発生した場合はエラーになること", async () => {
    (verifyShareToken as any).mockResolvedValue({
      success: true,
      listId: "list-1",
      permission: "edit",
    });
    mockFrom.mockImplementation((tableName: string) => {
      if (tableName === "shared_lists") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null }),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
        };
      }
      if (tableName === "list_share_tokens") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: "token-1",
              is_active: true,
              list_id: "list-1",
              default_permission: "edit",
            },
          }),
          update: jest.fn().mockReturnValue({
            eq: jest
              .fn()
              .mockReturnValue({ error: { message: "update error" } }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
      };
    });
    mockRpc.mockReturnValue({});
    const result = await joinListViaShareLink("token-1", "user-1", "owner-1");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/利用回数の更新中にエラー/);
  });
});
