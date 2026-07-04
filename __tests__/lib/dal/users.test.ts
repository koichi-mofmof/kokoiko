import { fetchAuthenticatedUserWithProfile } from "@/lib/dal/users";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.Mock;

/**
 * profiles 取得・storage・auth を制御できる Supabase クライアントのモックを生成する。
 */
function makeClient(opts: {
  user?: { id: string; email?: string } | null;
  authError?: { message: string } | null;
  profile?: any;
  profileError?: any;
  publicUrl?: string;
}) {
  const profileResult = {
    data: opts.profile ?? null,
    error: opts.profileError ?? null,
  };

  const profilesBuilder: any = {
    select: jest.fn(() => profilesBuilder),
    eq: jest.fn(() => profilesBuilder),
    single: jest.fn(() => Promise.resolve(profileResult)),
  };

  return {
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({
          data: { user: opts.user ?? null },
          error: opts.authError ?? null,
        })
      ),
    },
    from: jest.fn(() => profilesBuilder),
    storage: {
      from: jest.fn(() => ({
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: opts.publicUrl ?? "https://cdn.example.com/a.png" },
        })),
      })),
    },
  };
}

describe("fetchAuthenticatedUserWithProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("未認証の場合は userUnauthenticated を返す", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({ user: null, authError: { message: "no session" } })
    );

    const result = await fetchAuthenticatedUserWithProfile();

    expect(result.userUnauthenticated).toBe(true);
    expect(result.userWithProfile).toBeNull();
    expect(result.errorKey).toBe("errors.common.unauthorized");
  });

  it("認証済みでローカルアバターパスは public URL に解決される", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        user: { id: "user-1", email: "a@example.com" },
        profile: {
          username: "taro",
          display_name: "タロウ",
          bio: "こんにちは",
          avatar_url: "profile/abc.png",
        },
        publicUrl: "https://cdn.example.com/profile/abc.png",
      })
    );

    const result = await fetchAuthenticatedUserWithProfile();

    expect(result.userUnauthenticated).toBe(false);
    expect(result.userWithProfile).toEqual({
      userId: "user-1",
      email: "a@example.com",
      username: "taro",
      displayName: "タロウ",
      bio: "こんにちは",
      avatarUrl: "https://cdn.example.com/profile/abc.png",
      avatarPath: "profile/abc.png",
    });
  });

  it("http(s) で始まるアバター URL はそのまま使う", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        user: { id: "user-2", email: "b@example.com" },
        profile: {
          username: "hanako",
          display_name: "ハナコ",
          bio: "",
          avatar_url: "https://lh3.googleusercontent.com/avatar.png",
        },
      })
    );

    const result = await fetchAuthenticatedUserWithProfile();

    expect(result.userWithProfile?.avatarUrl).toBe(
      "https://lh3.googleusercontent.com/avatar.png"
    );
    expect(result.userWithProfile?.avatarPath).toBe(
      "https://lh3.googleusercontent.com/avatar.png"
    );
  });

  it("アバターが無い場合は avatarUrl が null になる", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        user: { id: "user-3", email: "c@example.com" },
        profile: {
          username: "x",
          display_name: "X",
          bio: "",
          avatar_url: null,
        },
      })
    );

    const result = await fetchAuthenticatedUserWithProfile();

    expect(result.userWithProfile?.avatarUrl).toBeNull();
    expect(result.userWithProfile?.avatarPath).toBeNull();
  });

  it("プロフィール取得に失敗しても基本情報は返し errorKey を付ける", async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        user: { id: "user-4", email: "d@example.com" },
        profileError: { message: "db down" },
      })
    );

    const result = await fetchAuthenticatedUserWithProfile();

    expect(result.userUnauthenticated).toBe(false);
    expect(result.userWithProfile).toMatchObject({
      userId: "user-4",
      email: "d@example.com",
      username: "",
      displayName: "",
      avatarUrl: null,
    });
    expect(result.errorKey).toBe("errors.common.fetchFailed");
  });
});
