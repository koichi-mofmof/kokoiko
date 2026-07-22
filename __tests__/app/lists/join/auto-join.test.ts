import { autoJoinFromInvite } from "@/app/lists/join/actions";

const mockGetUser = jest.fn();
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: () => mockGetUser() },
  })),
}));

const mockVerifyShareToken = jest.fn();
const mockJoinListViaShareLink = jest.fn();
jest.mock("@/lib/actions/lists", () => ({
  verifyShareToken: (...args: unknown[]) => mockVerifyShareToken(...args),
  joinListViaShareLink: (...args: unknown[]) =>
    mockJoinListViaShareLink(...args),
}));

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

describe("autoJoinFromInvite（認証直後の自動参加）", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockVerifyShareToken.mockResolvedValue({
      success: true,
      listId: "list-1",
      ownerId: "owner-1",
      permission: "edit",
    });
    mockJoinListViaShareLink.mockResolvedValue({ success: true });
  });

  it("ログイン済みなら参加まで完了し、リストIDを返す", async () => {
    const result = await autoJoinFromInvite("tok");

    expect(mockJoinListViaShareLink).toHaveBeenCalledWith(
      "tok",
      "user-1",
      "owner-1"
    );
    expect(result).toEqual({ success: true, listId: "list-1" });
  });

  it("未ログインなら参加させない", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await autoJoinFromInvite("tok");

    expect(result.success).toBe(false);
    expect(mockJoinListViaShareLink).not.toHaveBeenCalled();
  });

  it("トークンが無効なら参加させず理由を返す", async () => {
    mockVerifyShareToken.mockResolvedValue({
      success: false,
      reasonKey: "errors.common.linkExpired",
    });

    const result = await autoJoinFromInvite("tok");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errorKey).toBe("errors.common.linkExpired");
    expect(mockJoinListViaShareLink).not.toHaveBeenCalled();
  });

  it("参加処理が失敗したら失敗として返す", async () => {
    mockJoinListViaShareLink.mockResolvedValue({
      success: false,
      errorKey: "errors.common.insertFailed",
    });

    const result = await autoJoinFromInvite("tok");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errorKey).toBe("errors.common.insertFailed");
  });
});
