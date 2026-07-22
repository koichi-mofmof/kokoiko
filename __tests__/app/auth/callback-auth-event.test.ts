import { GET } from "@/app/auth/callback/route";

const mockExchangeCodeForSession = jest.fn();
const mockGetUser = jest.fn();
const mockProfileSingle = jest.fn();
const mockProfileInsert = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: {
      exchangeCodeForSession: (...a: unknown[]) =>
        mockExchangeCodeForSession(...a),
      getUser: () => mockGetUser(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ single: () => mockProfileSingle() }),
      }),
      insert: (...a: unknown[]) => mockProfileInsert(...a),
    }),
  })),
}));

jest.mock("@/lib/actions/lists", () => ({ bookmarkList: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

function authEventOf(res: Response) {
  return new URL(res.headers.get("location")!).searchParams.get("auth_event");
}

describe("GET /auth/callback の登録/ログイン判定", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    // DBトリガーが先に作るため、新規登録でもプロファイルは常に存在する
    mockProfileSingle.mockResolvedValue({ data: { id: "u1" }, error: null });
    mockProfileInsert.mockResolvedValue({ error: null });
  });

  it("登録直後の初回サインインは signup_google として記録する", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          created_at: "2026-07-20T12:14:35.300Z",
          last_sign_in_at: "2026-07-20T12:14:35.595Z",
          user_metadata: {},
        },
      },
    });

    const res = await GET(
      new Request("http://localhost:3000/auth/callback?code=abc")
    );

    expect(authEventOf(res)).toBe("signup_google");
  });

  it("後日の再ログインは login_google として記録する", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          created_at: "2026-07-01T00:00:00.000Z",
          last_sign_in_at: "2026-07-20T12:14:35.000Z",
          user_metadata: {},
        },
      },
    });

    const res = await GET(
      new Request("http://localhost:3000/auth/callback?code=abc")
    );

    expect(authEventOf(res)).toBe("login_google");
  });

  it("auth_method=email なら signup_email として記録する", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          created_at: "2026-07-20T12:14:35.300Z",
          last_sign_in_at: "2026-07-20T12:14:35.595Z",
          // アカウント作成時のプロバイダ。今回の認証方法とは一致しないことがある
          app_metadata: { provider: "email" },
          user_metadata: {},
        },
      },
    });

    const res = await GET(
      new Request(
        "http://localhost:3000/auth/callback?code=abc&auth_method=email"
      )
    );

    expect(authEventOf(res)).toBe("signup_email");
  });

  it("メール登録のアカウントに Google を連携した人が Google でログインしても google と記録する", async () => {
    // app_metadata.provider は "email" のまま残るため、それを見ると誤判定する
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          created_at: "2026-07-01T00:00:00.000Z",
          last_sign_in_at: "2026-07-20T12:14:35.000Z",
          app_metadata: { provider: "email", providers: ["email", "google"] },
          user_metadata: {},
        },
      },
    });

    const res = await GET(
      new Request(
        "http://localhost:3000/auth/callback?code=abc&auth_method=google"
      )
    );

    expect(authEventOf(res)).toBe("login_google");
  });

  it("確認メールを時間差で踏んでも signup として記録する", async () => {
    // 確認メールは数分〜数時間後に踏まれうる。created_at と last_sign_in_at が
    // 離れるため、タイムスタンプ判定だけでは登録がログインに化ける。
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          created_at: "2026-07-20T12:00:00.000Z",
          last_sign_in_at: "2026-07-20T15:30:00.000Z",
          app_metadata: { provider: "email" },
          user_metadata: {},
        },
      },
    });

    const res = await GET(
      new Request(
        "http://localhost:3000/auth/callback?code=abc&auth_method=email&auth_intent=signup"
      )
    );

    expect(authEventOf(res)).toBe("signup_email");
  });

  it("redirect_url で指定された遷移先を保持する", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          created_at: "2026-07-20T12:14:35.300Z",
          last_sign_in_at: "2026-07-20T12:14:35.595Z",
          user_metadata: {},
        },
      },
    });

    const res = await GET(
      new Request(
        "http://localhost:3000/auth/callback?code=abc&redirect_url=" +
          encodeURIComponent("/lists/join?token=t1&auto=1")
      )
    );

    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/lists/join");
    expect(location.searchParams.get("token")).toBe("t1");
    expect(location.searchParams.get("auto")).toBe("1");
  });
});
