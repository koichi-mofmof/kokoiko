import {
  removeCollaboratorFromSharedList,
  updateCollaboratorPermissionOnSharedList,
} from "@/lib/actions/lists";
import { getCollaboratorsForList } from "@/lib/dal/lists";

// createClient をモックします。これが他のimport文よりも先に評価されるように、ファイルの先頭に配置します。
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

// モックされた createClient をインポートし、型付けします。
import { createClient } from "@/lib/supabase/server";

const mockedCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

// モック用の型定義 (実際の型定義をインポートすることを推奨)
enum SharedListPermission {
  OWNER = "owner", // 実際のプロダクションコードの権限文字列に合わせる
  EDIT = "edit",
  VIEW = "view",
}

// Collaborator 型は dal/lists.ts からインポートすることを推奨しますが、
// ここではテスト用に簡略化されたものを使用します。実際の型に合わせて調整してください。
interface MockCollaborator {
  id: string; // dal/lists.ts の Collaborator 型は id を持つ
  userId?: string; // テストコード内のMockCollaboratorはuserIdだったため、整合性のため残すか検討
  name: string;
  avatarUrl: string | undefined;
  permission: SharedListPermission | string | undefined; // string も許容
  isOwner?: boolean;
}

// Supabaseクライアントのモックを初期化
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  storage: {
    from: jest.fn().mockReturnThis(),
    getPublicUrl: jest.fn(),
  },
  from: jest.fn(), // from は都度設定するので、ここでは一旦 jest.fn() のみ
  // select, update, delete, eq, in, single は from の後にチェーンされるので、
  // from のモック実装内でこれらを返すようにする
  mockSuccess: (data: any) => ({ data, error: null }),
  mockError: (message = "Supabase error", code = "PGRST000") => ({
    data: null,
    error: { message, code },
  }),
};

// from の後にチェーンされるメソッドのデフォルトモック
const mockChainFunctions = {
  select: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  // eq: jest.fn().mockReturnThis(), // eqは特殊なので個別に設定することが多い
  // in: jest.fn().mockReturnThis(), // inも同様
  // single: jest.fn(), // singleも同様
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedCreateClient.mockReturnValue(mockSupabase as any);
  mockSupabase.storage.getPublicUrl.mockReturnValue({
    data: { publicUrl: "http://example.com/avatar.png" },
    error: null,
  });

  (mockSupabase.from as jest.Mock).mockImplementation(() => ({
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(), // デフォルトのeqはthisを返す
    in: jest.fn().mockReturnThis(), // デフォルトのinはthisを返す
    single: jest.fn(), // デフォルトのsingleはPromiseを返さないので注意
  }));

  // mockChainFunctions の各関数もクリアしておく (もしグローバルに使っている場合)
  Object.values(mockChainFunctions).forEach((mockFn) => {
    if (jest.isMockFunction(mockFn)) {
      mockFn.mockClear().mockReturnThis();
    }
  });
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

    let fromCallCount = 0;
    (mockSupabase.from as jest.Mock).mockImplementation((tableName: string) => {
      fromCallCount++;
      if (tableName === "profiles" && fromCallCount === 1) {
        // 最初のprofiles呼び出し（所有者取得）
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue(mockSupabase.mockSuccess(mockOwnerResponse)),
            }),
          }),
        };
      } else if (tableName === "shared_lists" && fromCallCount === 2) {
        // shared_lists呼び出し
        return {
          select: jest.fn().mockReturnValue({
            eq: jest
              .fn()
              .mockResolvedValue(
                mockSupabase.mockSuccess(mockSharedListsResponse)
              ),
          }),
        };
      } else if (tableName === "profiles" && fromCallCount === 3) {
        // 3番目のprofiles呼び出し（共有ユーザー取得）
        return {
          select: jest.fn().mockReturnValue({
            in: jest
              .fn()
              .mockResolvedValue(
                mockSupabase.mockSuccess(mockSharedProfilesResponse)
              ),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
      }; // fallback
    });

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
    (mockSupabase.from as jest.Mock).mockImplementation((tableName: string) => {
      fromCallCount++;
      if (tableName === "profiles" && fromCallCount === 1) {
        // 所有者取得
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue(mockSupabase.mockSuccess(mockOwnerResponse)),
            }),
          }),
        };
      } else if (tableName === "shared_lists" && fromCallCount === 2) {
        // 共有リスト取得（空）
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockSupabase.mockSuccess([])),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
      };
    });

    const actualCollaborators = await getCollaboratorsForList(listId, ownerId);
    expect(actualCollaborators).toHaveLength(1); // 所有者のみ
    expect(actualCollaborators[0].isOwner).toBe(true);
  });

  it("Supabaseエラー時(profiles取得失敗など)は空配列を返すこと（またはエラーをスローするなど、関数の仕様による）", async () => {
    const mockEqSharedError = jest
      .fn()
      .mockResolvedValue(
        mockSupabase.mockSuccess([
          { shared_with_user_id: "user1", permission: "view" },
        ])
      );
    const mockInProfilesError = jest
      .fn()
      .mockResolvedValue(mockSupabase.mockError("DB error on profiles"));
    (mockSupabase.from as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === "shared_lists") {
        return { select: jest.fn().mockReturnThis(), eq: mockEqSharedError };
      } else if (tableName === "profiles") {
        return { select: jest.fn().mockReturnThis(), in: mockInProfilesError };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
      };
    });
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
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: currentUserId } },
      error: null,
    });

    const mockSelectPlaceList = jest.fn().mockReturnThis();
    const mockEqPlaceList = jest.fn().mockReturnThis();
    const mockSinglePlaceList = jest
      .fn()
      .mockResolvedValue(
        mockSupabase.mockSuccess({ created_by: currentUserId })
      );

    const mockUpdateShared = jest.fn().mockReturnThis();
    const mockEqUpdateListId = jest.fn();
    const mockEqUpdateUserId = jest
      .fn()
      .mockResolvedValue(mockSupabase.mockSuccess({}));

    mockEqUpdateListId.mockImplementation(() => ({ eq: mockEqUpdateUserId }));

    let fromCallOrder = 0;
    (mockSupabase.from as jest.Mock).mockImplementation((tableName: string) => {
      fromCallOrder++;
      if (tableName === "place_lists" && fromCallOrder === 1) {
        return {
          select: mockSelectPlaceList,
          eq: mockEqPlaceList,
          single: mockSinglePlaceList,
        };
      } else if (tableName === "shared_lists" && fromCallOrder === 2) {
        return { update: mockUpdateShared, eq: mockEqUpdateListId };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        update: jest.fn().mockReturnThis(),
      };
    });

    const result = await updateCollaboratorPermissionOnSharedList({
      listId,
      targetUserId,
      newPermission: "edit",
    });
    expect(result).toEqual({ success: true });
    expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
    expect(mockSupabase.from).toHaveBeenNthCalledWith(1, "place_lists");
    expect(mockSelectPlaceList).toHaveBeenCalledWith("created_by");
    expect(mockEqPlaceList).toHaveBeenCalledWith("id", listId);
    expect(mockSinglePlaceList).toHaveBeenCalledTimes(1);

    expect(mockSupabase.from).toHaveBeenNthCalledWith(2, "shared_lists");
    expect(mockUpdateShared).toHaveBeenCalledWith({ permission: "edit" });
    expect(mockEqUpdateListId).toHaveBeenCalledWith("list_id", listId);
    expect(mockEqUpdateUserId).toHaveBeenCalledWith(
      "shared_with_user_id",
      targetUserId
    );
  });

  it("編集権限ユーザーが他メンバーの権限を変更できること", async () => {
    const editorUserId = "user-editor-performing-action";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: editorUserId } },
      error: null,
    });

    const mockSelectPlaceListPerm = jest.fn().mockReturnThis();
    const mockEqPlaceListPerm = jest.fn().mockReturnThis();
    const mockSinglePlaceListPerm = jest
      .fn()
      .mockResolvedValue(
        mockSupabase.mockSuccess({ created_by: "another-user-owner" })
      );

    const mockSelectSharedPerm = jest.fn().mockReturnThis();
    const mockEqSharedListIdPerm = jest.fn();
    const mockSingleSharedPerm = jest
      .fn()
      .mockResolvedValue(mockSupabase.mockSuccess({ permission: "edit" }));
    const mockEqSharedUserIdPerm = jest
      .fn()
      .mockReturnValue({ single: mockSingleSharedPerm });
    mockEqSharedListIdPerm.mockImplementation(() => ({
      eq: mockEqSharedUserIdPerm,
    }));

    const mockUpdateSharedPerm = jest.fn().mockReturnThis();
    const mockEqUpdateListIdPerm = jest.fn();
    const mockEqUpdateUserIdPerm = jest
      .fn()
      .mockResolvedValue(mockSupabase.mockSuccess({}));
    mockEqUpdateListIdPerm.mockImplementation(() => ({
      eq: mockEqUpdateUserIdPerm,
    }));

    let fromCallCount = 0;
    (mockSupabase.from as jest.Mock).mockImplementation((tableName: string) => {
      fromCallCount++;
      if (tableName === "place_lists" && fromCallCount === 1) {
        return {
          select: mockSelectPlaceListPerm,
          eq: mockEqPlaceListPerm,
          single: mockSinglePlaceListPerm,
        };
      } else if (tableName === "shared_lists" && fromCallCount === 2) {
        return {
          select: mockSelectSharedPerm,
          eq: mockEqSharedListIdPerm /* singleはmockEqSharedUserIdPermが提供 */,
        };
      } else if (tableName === "shared_lists" && fromCallCount === 3) {
        return { update: mockUpdateSharedPerm, eq: mockEqUpdateListIdPerm };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        update: jest.fn().mockReturnThis(),
      };
    });

    const result = await updateCollaboratorPermissionOnSharedList({
      listId,
      targetUserId,
      newPermission: "view",
    });
    expect(result).toEqual({ success: true });
    expect(mockEqPlaceListPerm).toHaveBeenCalledWith("id", listId);
    expect(mockSinglePlaceListPerm).toHaveBeenCalledTimes(1);
    expect(mockEqSharedListIdPerm).toHaveBeenCalledWith("list_id", listId);
    expect(mockEqSharedUserIdPerm).toHaveBeenCalledWith(
      "shared_with_user_id",
      editorUserId
    );
    expect(mockSingleSharedPerm).toHaveBeenCalledTimes(1);
    expect(mockEqUpdateListIdPerm).toHaveBeenCalledWith("list_id", listId);
    expect(mockEqUpdateUserIdPerm).toHaveBeenCalledWith(
      "shared_with_user_id",
      targetUserId
    );
  });

  it("閲覧権限ユーザーは権限変更できないこと", async () => {
    const viewerUserId = "user-viewer-performing-action";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: viewerUserId } },
      error: null,
    });

    const mockSelectPlaceListView = jest.fn().mockReturnThis();
    const mockEqPlaceListView = jest.fn().mockReturnThis();
    const mockSinglePlaceListView = jest
      .fn()
      .mockResolvedValue(
        mockSupabase.mockSuccess({ created_by: "another-user-owner" })
      );

    const mockSelectSharedView = jest.fn().mockReturnThis();
    const mockEqSharedListIdView = jest.fn();
    const mockSingleSharedView = jest
      .fn()
      .mockResolvedValue(mockSupabase.mockSuccess({ permission: "view" }));
    const mockEqSharedUserIdView = jest
      .fn()
      .mockReturnValue({ single: mockSingleSharedView });
    mockEqSharedListIdView.mockImplementation(() => ({
      eq: mockEqSharedUserIdView,
    }));

    const mockUpdateSharedView = jest.fn();

    let fromCallCountView = 0;
    (mockSupabase.from as jest.Mock).mockImplementation((tableName: string) => {
      fromCallCountView++;
      if (tableName === "place_lists" && fromCallCountView === 1) {
        return {
          select: mockSelectPlaceListView,
          eq: mockEqPlaceListView,
          single: mockSinglePlaceListView,
        };
      } else if (tableName === "shared_lists" && fromCallCountView === 2) {
        return {
          select: mockSelectSharedView,
          eq: mockEqSharedListIdView,
          /* singleはmockEqSharedUserIdViewが提供 */ update:
            mockUpdateSharedView,
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        update: jest.fn().mockReturnThis(),
      };
    });

    const result = await updateCollaboratorPermissionOnSharedList({
      listId,
      targetUserId,
      newPermission: "edit",
    });
    expect(result).toEqual({
      success: false,
      error: "この操作を行う権限がありません。",
    });
    expect(mockUpdateSharedView).not.toHaveBeenCalled();
    expect(mockEqSharedListIdView).toHaveBeenCalledWith("list_id", listId);
    expect(mockEqSharedUserIdView).toHaveBeenCalledWith(
      "shared_with_user_id",
      viewerUserId
    );
    expect(mockSingleSharedView).toHaveBeenCalledTimes(1);
  });

  it("オーナー自身の権限は変更できないこと", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: currentUserId } },
      error: null,
    });

    const mockSelectPlaceListOwner = jest.fn().mockReturnThis();
    const mockEqPlaceListOwner = jest.fn().mockReturnThis();
    const mockSinglePlaceListOwner = jest
      .fn()
      .mockResolvedValue(
        mockSupabase.mockSuccess({ created_by: currentUserId })
      );
    const mockUpdateOwner = jest.fn();

    (mockSupabase.from as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === "place_lists") {
        return {
          select: mockSelectPlaceListOwner,
          eq: mockEqPlaceListOwner,
          single: mockSinglePlaceListOwner,
          update: mockUpdateOwner,
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        update: mockUpdateOwner,
      };
    });

    const result = await updateCollaboratorPermissionOnSharedList({
      listId,
      targetUserId: currentUserId,
      newPermission: "edit",
    });
    expect(result).toEqual({
      success: false,
      error: "オーナーの権限は変更できません。",
    });
    expect(mockUpdateOwner).not.toHaveBeenCalled();
    expect(mockEqPlaceListOwner).toHaveBeenCalledWith("id", listId);
  });
});

// --- 共有メンバー解除 ---
describe("removeCollaboratorFromSharedList: メンバー共有解除", () => {
  const listId = "list-123";
  const targetUserId = "user-to-remove";
  const currentUserId = "user-current-owner";

  it("オーナーが他メンバーを解除できること", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: currentUserId } },
      error: null,
    });

    const mockSelectPlaceListDel = jest.fn().mockReturnThis();
    const mockEqPlaceListDel = jest.fn().mockReturnThis();
    const mockSinglePlaceListDel = jest
      .fn()
      .mockResolvedValue(
        mockSupabase.mockSuccess({ created_by: currentUserId })
      );

    const mockDeleteShared = jest.fn().mockReturnThis();
    const mockEqDelListId = jest.fn();
    const mockEqDelUserId = jest
      .fn()
      .mockResolvedValue(mockSupabase.mockSuccess({}));
    mockEqDelListId.mockImplementation(() => ({ eq: mockEqDelUserId }));

    let fromCallOrderDel = 0;
    (mockSupabase.from as jest.Mock).mockImplementation((tableName: string) => {
      fromCallOrderDel++;
      if (tableName === "place_lists" && fromCallOrderDel === 1) {
        return {
          select: mockSelectPlaceListDel,
          eq: mockEqPlaceListDel,
          single: mockSinglePlaceListDel,
        };
      } else if (tableName === "shared_lists" && fromCallOrderDel === 2) {
        return { delete: mockDeleteShared, eq: mockEqDelListId };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        delete: jest.fn().mockReturnThis(),
      };
    });
    const result = await removeCollaboratorFromSharedList({
      listId,
      targetUserId,
    });
    expect(result).toEqual({ success: true });
    expect(mockDeleteShared).toHaveBeenCalledTimes(1);
    expect(mockEqDelListId).toHaveBeenCalledWith("list_id", listId);
    expect(mockEqDelUserId).toHaveBeenCalledWith(
      "shared_with_user_id",
      targetUserId
    );
  });

  it("編集権限ユーザーが他メンバーを解除できること", async () => {
    const editorUserId = "user-editor-performing-action";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: editorUserId } },
      error: null,
    });

    const mockSelectPlaceListDelEd = jest.fn().mockReturnThis();
    const mockEqPlaceListDelEd = jest.fn().mockReturnThis();
    const mockSinglePlaceListDelEd = jest
      .fn()
      .mockResolvedValue(
        mockSupabase.mockSuccess({ created_by: "another-user-owner" })
      );

    const mockSelectSharedDelEdPerm = jest.fn().mockReturnThis();
    const mockEqSharedListIdDelEdPerm = jest.fn();
    const mockSingleSharedDelEdPerm = jest
      .fn()
      .mockResolvedValue(mockSupabase.mockSuccess({ permission: "edit" }));
    const mockEqSharedUserIdDelEdPerm = jest
      .fn()
      .mockReturnValue({ single: mockSingleSharedDelEdPerm });
    mockEqSharedListIdDelEdPerm.mockImplementation(() => ({
      eq: mockEqSharedUserIdDelEdPerm,
    }));

    const mockDeleteSharedDelEd = jest.fn().mockReturnThis();
    const mockEqDelListIdEd = jest.fn();
    const mockEqDelUserIdEd = jest
      .fn()
      .mockResolvedValue(mockSupabase.mockSuccess({}));
    mockEqDelListIdEd.mockImplementation(() => ({ eq: mockEqDelUserIdEd }));

    let fromCallCountDelEd = 0;
    (mockSupabase.from as jest.Mock).mockImplementation((tableName: string) => {
      fromCallCountDelEd++;
      if (tableName === "place_lists" && fromCallCountDelEd === 1) {
        return {
          select: mockSelectPlaceListDelEd,
          eq: mockEqPlaceListDelEd,
          single: mockSinglePlaceListDelEd,
        };
      } else if (tableName === "shared_lists" && fromCallCountDelEd === 2) {
        return {
          select: mockSelectSharedDelEdPerm,
          eq: mockEqSharedListIdDelEdPerm /* singleはmockEqSharedUserIdDelEdPermが提供 */,
        };
      } else if (tableName === "shared_lists" && fromCallCountDelEd === 3) {
        return { delete: mockDeleteSharedDelEd, eq: mockEqDelListIdEd };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        delete: jest.fn().mockReturnThis(),
      };
    });

    const result = await removeCollaboratorFromSharedList({
      listId,
      targetUserId,
    });
    expect(result).toEqual({ success: true });
    expect(mockDeleteSharedDelEd).toHaveBeenCalledTimes(1);
    expect(mockEqSharedListIdDelEdPerm).toHaveBeenCalledWith("list_id", listId);
    expect(mockEqSharedUserIdDelEdPerm).toHaveBeenCalledWith(
      "shared_with_user_id",
      editorUserId
    );
    expect(mockSingleSharedDelEdPerm).toHaveBeenCalledTimes(1);
    expect(mockEqDelListIdEd).toHaveBeenCalledWith("list_id", listId);
    expect(mockEqDelUserIdEd).toHaveBeenCalledWith(
      "shared_with_user_id",
      targetUserId
    );
  });

  it("閲覧権限ユーザーは解除できないこと", async () => {
    const viewerUserId = "user-viewer-performing-action";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: viewerUserId } },
      error: null,
    });

    const mockSelectPlaceListViewDel = jest.fn().mockReturnThis();
    const mockEqPlaceListViewDel = jest.fn().mockReturnThis();
    const mockSinglePlaceListViewDel = jest
      .fn()
      .mockResolvedValue(
        mockSupabase.mockSuccess({ created_by: "another-user-owner" })
      );

    const mockSelectSharedViewDel = jest.fn().mockReturnThis();
    const mockEqSharedListIdViewDel = jest.fn();
    const mockSingleSharedViewDel = jest
      .fn()
      .mockResolvedValue(mockSupabase.mockSuccess({ permission: "view" }));
    const mockEqSharedUserIdViewDel = jest
      .fn()
      .mockReturnValue({ single: mockSingleSharedViewDel });
    mockEqSharedListIdViewDel.mockImplementation(() => ({
      eq: mockEqSharedUserIdViewDel,
    }));

    const mockDeleteView = jest.fn();

    let fromCallCountViewDel = 0;
    (mockSupabase.from as jest.Mock).mockImplementation((tableName: string) => {
      fromCallCountViewDel++;
      if (tableName === "place_lists" && fromCallCountViewDel === 1) {
        return {
          select: mockSelectPlaceListViewDel,
          eq: mockEqPlaceListViewDel,
          single: mockSinglePlaceListViewDel,
        };
      } else if (tableName === "shared_lists" && fromCallCountViewDel === 2) {
        return {
          select: mockSelectSharedViewDel,
          eq: mockEqSharedListIdViewDel,
          /* singleはmockEqSharedUserIdViewDelが提供 */ delete: mockDeleteView,
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        delete: jest.fn().mockReturnThis(),
      };
    });

    const result = await removeCollaboratorFromSharedList({
      listId,
      targetUserId,
    });
    expect(result).toEqual({
      success: false,
      error: "この操作を行う権限がありません。",
    });
    expect(mockDeleteView).not.toHaveBeenCalled();
    expect(mockEqSharedListIdViewDel).toHaveBeenCalledWith("list_id", listId);
    expect(mockEqSharedUserIdViewDel).toHaveBeenCalledWith(
      "shared_with_user_id",
      viewerUserId
    );
    expect(mockSingleSharedViewDel).toHaveBeenCalledTimes(1);
  });

  it("オーナー自身は解除できないこと", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: currentUserId } },
      error: null,
    });
    const mockSelectPlaceListOwnerDel = jest.fn().mockReturnThis();
    const mockEqPlaceListOwnerDel = jest.fn().mockReturnThis();
    const mockSinglePlaceListOwnerDel = jest
      .fn()
      .mockResolvedValue(
        mockSupabase.mockSuccess({ created_by: currentUserId })
      );
    const mockDeleteOwner = jest.fn();

    (mockSupabase.from as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === "place_lists") {
        return {
          select: mockSelectPlaceListOwnerDel,
          eq: mockEqPlaceListOwnerDel,
          single: mockSinglePlaceListOwnerDel,
          delete: mockDeleteOwner,
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        delete: mockDeleteOwner,
      };
    });

    const result = await removeCollaboratorFromSharedList({
      listId,
      targetUserId: currentUserId,
    });
    expect(result).toEqual({
      success: false,
      error: "オーナーは共有解除できません。",
    });
    expect(mockDeleteOwner).not.toHaveBeenCalled();
    expect(mockEqPlaceListOwnerDel).toHaveBeenCalledWith("id", listId);
  });
});
