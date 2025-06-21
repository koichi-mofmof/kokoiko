import {
  removeCollaboratorFromSharedList,
  updateCollaboratorPermissionOnSharedList,
} from "@/lib/actions/lists";
import { getCollaboratorsForList } from "@/lib/dal/lists";

// 権限チェック関数をモック
jest.mock("@/lib/utils/permission-check", () => ({
  canManageShareLinks: jest.fn(),
}));

// createClient をモックします。これが他のimport文よりも先に評価されるように、ファイルの先頭に配置します。
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

// モックされた createClient をインポートし、型付けします。
import { createClient } from "@/lib/supabase/server";
import { canManageShareLinks } from "@/lib/utils/permission-check";

const mockedCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockedCanManageShareLinks = canManageShareLinks as jest.MockedFunction<
  typeof canManageShareLinks
>;

// ヘルパー関数
const mockSuccess = (data: any) => ({ data, error: null });
const mockError = (message = "Supabase error", code = "PGRST000") => ({
  data: null,
  error: { message, code },
});

// 共通のSupabaseクライアントモック
const createMockSupabaseClient = () => ({
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: "test-user" } },
      error: null,
    }),
  },
  storage: {
    from: jest.fn().mockReturnThis(),
    getPublicUrl: jest.fn().mockReturnValue({
      data: { publicUrl: "http://example.com/avatar.png" },
      error: null,
    }),
  },
  from: jest.fn().mockImplementation(() => ({
    select: jest.fn().mockImplementation(() => ({
      eq: jest.fn().mockImplementation(() => ({
        single: jest.fn().mockResolvedValue(mockSuccess(null)),
        in: jest.fn().mockResolvedValue(mockSuccess([])),
      })),
      in: jest.fn().mockResolvedValue(mockSuccess([])),
    })),
    update: jest.fn().mockImplementation(() => ({
      eq: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue(mockSuccess(null)),
      })),
    })),
    delete: jest.fn().mockImplementation(() => ({
      eq: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue(mockSuccess(null)),
      })),
    })),
    upsert: jest.fn().mockResolvedValue(mockSuccess(null)),
  })),
});

beforeEach(() => {
  jest.clearAllMocks();

  // 権限チェック関数のデフォルト設定（通常は許可）
  mockedCanManageShareLinks.mockResolvedValue(true);

  // デフォルトのSupabaseクライアントモック
  mockedCreateClient.mockReturnValue(createMockSupabaseClient() as any);
});

// --- 共有メンバー一覧取得 ---
describe("getCollaboratorsForList: 共有メンバー一覧取得", () => {
  const listId = "list-123";
  const ownerId = "user-owner";

  it("複数メンバー（オーナー/編集/閲覧）が正しく取得できること", async () => {
    const mockOwnerResponse = {
      id: ownerId,
      display_name: "Owner User",
      avatar_url: "owner.png",
    };
    const mockSharedListsResponse = [
      { shared_with_user_id: "user-editor", permission: "edit" },
      { shared_with_user_id: "user-viewer", permission: "view" },
    ];
    const mockSharedProfilesResponse = [
      {
        id: "user-editor",
        display_name: "Editor User",
        avatar_url: "editor.png",
      },
      {
        id: "user-viewer",
        display_name: "Viewer User",
        avatar_url: "viewer.png",
      },
    ];

    // 特定のテスト用にSupabaseクライアントをカスタマイズ
    let fromCallCount = 0;
    const customMockClient = createMockSupabaseClient();
    customMockClient.from = jest
      .fn()
      .mockImplementation((tableName: string) => {
        fromCallCount++;
        if (tableName === "profiles" && fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue(mockSuccess(mockOwnerResponse)),
              }),
            }),
          };
        } else if (tableName === "shared_lists" && fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest
                .fn()
                .mockResolvedValue(mockSuccess(mockSharedListsResponse)),
            }),
          };
        } else if (tableName === "profiles" && fromCallCount === 3) {
          return {
            select: jest.fn().mockReturnValue({
              in: jest
                .fn()
                .mockResolvedValue(mockSuccess(mockSharedProfilesResponse)),
            }),
          };
        }
        return customMockClient.from();
      });
    mockedCreateClient.mockReturnValue(customMockClient as any);

    const actualCollaborators = await getCollaboratorsForList(listId, ownerId);

    expect(actualCollaborators).toHaveLength(3);
    expect(actualCollaborators.find((c) => c.isOwner)).toBeTruthy();
    expect(actualCollaborators.filter((c) => !c.isOwner)).toHaveLength(2);
  });

  it("メンバーが存在しない場合は空配列を返すこと", async () => {
    const mockOwnerResponse = {
      id: ownerId,
      display_name: "Owner User",
      avatar_url: null,
    };

    let fromCallCount = 0;
    const customMockClient = createMockSupabaseClient();
    customMockClient.from = jest
      .fn()
      .mockImplementation((tableName: string) => {
        fromCallCount++;
        if (tableName === "profiles" && fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue(mockSuccess(mockOwnerResponse)),
              }),
            }),
          };
        } else if (tableName === "shared_lists" && fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue(mockSuccess([])),
            }),
          };
        }
        return customMockClient.from();
      });
    mockedCreateClient.mockReturnValue(customMockClient as any);

    const actualCollaborators = await getCollaboratorsForList(listId, ownerId);
    expect(actualCollaborators).toHaveLength(1); // 所有者のみ
    expect(actualCollaborators[0].isOwner).toBe(true);
  });

  it("Supabaseエラー時は空配列を返すこと", async () => {
    const customMockClient = createMockSupabaseClient();
    customMockClient.from = jest
      .fn()
      .mockImplementation((tableName: string) => {
        if (tableName === "shared_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest
                .fn()
                .mockResolvedValue(
                  mockSuccess([
                    { shared_with_user_id: "user1", permission: "view" },
                  ])
                ),
            }),
          };
        } else if (tableName === "profiles") {
          return {
            select: jest.fn().mockReturnValue({
              in: jest
                .fn()
                .mockResolvedValue(mockError("DB error on profiles")),
            }),
          };
        }
        return customMockClient.from();
      });
    mockedCreateClient.mockReturnValue(customMockClient as any);

    const actualCollaborators = await getCollaboratorsForList(listId, ownerId);
    expect(actualCollaborators).toEqual([]);
  });
});

// --- 共有メンバー権限変更 ---
describe("updateCollaboratorPermissionOnSharedList: メンバー権限変更", () => {
  const listId = "list-123";
  const targetUserId = "user-target";
  const currentUserId = "user-current-owner";

  it("オーナーが編集権限を変更できること", async () => {
    const customMockClient = createMockSupabaseClient();
    customMockClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: currentUserId } },
      error: null,
    });

    let fromCallOrder = 0;
    customMockClient.from = jest
      .fn()
      .mockImplementation((tableName: string) => {
        fromCallOrder++;
        if (tableName === "place_lists" && fromCallOrder === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue(
                    mockSuccess({ created_by: currentUserId })
                  ),
              }),
            }),
          };
        } else if (tableName === "shared_lists" && fromCallOrder === 2) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue(mockSuccess({})),
              }),
            }),
          };
        }
        return customMockClient.from();
      });
    mockedCreateClient.mockReturnValue(customMockClient as any);

    const result = await updateCollaboratorPermissionOnSharedList({
      listId,
      targetUserId,
      newPermission: "edit",
    });
    expect(result).toEqual({ success: true });
  });

  it("編集権限ユーザーが他メンバーの権限を変更できること", async () => {
    const editorUserId = "user-editor-performing-action";
    const customMockClient = createMockSupabaseClient();
    customMockClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: editorUserId } },
      error: null,
    });

    let fromCallCount = 0;
    customMockClient.from = jest
      .fn()
      .mockImplementation((tableName: string) => {
        fromCallCount++;
        if (tableName === "place_lists" && fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue(
                    mockSuccess({ created_by: "another-user-owner" })
                  ),
              }),
            }),
          };
        } else if (tableName === "shared_lists" && fromCallCount === 2) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue(mockSuccess({})),
              }),
            }),
          };
        }
        return customMockClient.from();
      });
    mockedCreateClient.mockReturnValue(customMockClient as any);

    const result = await updateCollaboratorPermissionOnSharedList({
      listId,
      targetUserId,
      newPermission: "view",
    });
    expect(result).toEqual({ success: true });
  });

  it("閲覧権限ユーザーは権限変更できないこと", async () => {
    const viewerUserId = "user-viewer-performing-action";
    const customMockClient = createMockSupabaseClient();
    customMockClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: viewerUserId } },
      error: null,
    });

    // 権限チェックで拒否される設定
    mockedCanManageShareLinks.mockResolvedValue(false);
    mockedCreateClient.mockReturnValue(customMockClient as any);

    const result = await updateCollaboratorPermissionOnSharedList({
      listId,
      targetUserId,
      newPermission: "edit",
    });
    expect(result).toEqual({
      success: false,
      error: "この操作を行う権限がありません。",
    });
  });

  it("オーナー自身の権限は変更できないこと", async () => {
    const customMockClient = createMockSupabaseClient();
    customMockClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: currentUserId } },
      error: null,
    });

    customMockClient.from = jest
      .fn()
      .mockImplementation((tableName: string) => {
        if (tableName === "place_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue(
                    mockSuccess({ created_by: currentUserId })
                  ),
              }),
            }),
          };
        }
        return customMockClient.from();
      });
    mockedCreateClient.mockReturnValue(customMockClient as any);

    const result = await updateCollaboratorPermissionOnSharedList({
      listId,
      targetUserId: currentUserId,
      newPermission: "edit",
    });
    expect(result).toEqual({
      success: false,
      error: "オーナーの権限は変更できません。",
    });
  });
});

// --- 共有メンバー解除 ---
describe("removeCollaboratorFromSharedList: メンバー共有解除", () => {
  const listId = "list-123";
  const targetUserId = "user-to-remove";
  const currentUserId = "user-current-owner";

  it("オーナーが他メンバーを解除できること", async () => {
    const customMockClient = createMockSupabaseClient();
    customMockClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: currentUserId } },
      error: null,
    });

    let fromCallOrderDel = 0;
    customMockClient.from = jest
      .fn()
      .mockImplementation((tableName: string) => {
        fromCallOrderDel++;
        if (tableName === "place_lists" && fromCallOrderDel === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue(
                    mockSuccess({ created_by: currentUserId })
                  ),
              }),
            }),
          };
        } else if (tableName === "shared_lists" && fromCallOrderDel === 2) {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue(mockSuccess({})),
              }),
            }),
          };
        }
        return customMockClient.from();
      });
    mockedCreateClient.mockReturnValue(customMockClient as any);

    const result = await removeCollaboratorFromSharedList({
      listId,
      targetUserId,
    });
    expect(result).toEqual({ success: true });
  });

  it("編集権限ユーザーが他メンバーを解除できること", async () => {
    const editorUserId = "user-editor-performing-action";
    const customMockClient = createMockSupabaseClient();
    customMockClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: editorUserId } },
      error: null,
    });

    let fromCallCountDelEd = 0;
    customMockClient.from = jest
      .fn()
      .mockImplementation((tableName: string) => {
        fromCallCountDelEd++;
        if (tableName === "place_lists" && fromCallCountDelEd === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue(
                    mockSuccess({ created_by: "another-user-owner" })
                  ),
              }),
            }),
          };
        } else if (tableName === "shared_lists" && fromCallCountDelEd === 2) {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue(mockSuccess({})),
              }),
            }),
          };
        }
        return customMockClient.from();
      });
    mockedCreateClient.mockReturnValue(customMockClient as any);

    const result = await removeCollaboratorFromSharedList({
      listId,
      targetUserId,
    });
    expect(result).toEqual({ success: true });
  });

  it("閲覧権限ユーザーは解除できないこと", async () => {
    const viewerUserId = "user-viewer-performing-action";
    const customMockClient = createMockSupabaseClient();
    customMockClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: viewerUserId } },
      error: null,
    });

    // 権限チェックで拒否される設定
    mockedCanManageShareLinks.mockResolvedValue(false);
    mockedCreateClient.mockReturnValue(customMockClient as any);

    const result = await removeCollaboratorFromSharedList({
      listId,
      targetUserId,
    });
    expect(result).toEqual({
      success: false,
      error: "この操作を行う権限がありません。",
    });
  });

  it("オーナー自身は解除できないこと", async () => {
    const customMockClient = createMockSupabaseClient();
    customMockClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: currentUserId } },
      error: null,
    });

    customMockClient.from = jest
      .fn()
      .mockImplementation((tableName: string) => {
        if (tableName === "place_lists") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue(
                    mockSuccess({ created_by: currentUserId })
                  ),
              }),
            }),
          };
        }
        return customMockClient.from();
      });
    mockedCreateClient.mockReturnValue(customMockClient as any);

    const result = await removeCollaboratorFromSharedList({
      listId,
      targetUserId: currentUserId,
    });
    expect(result).toEqual({
      success: false,
      error: "オーナーは共有解除できません。",
    });
  });
});
