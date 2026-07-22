import { loginWithGoogle } from "@/lib/actions/auth";

const mockSignInWithOAuth = jest.fn();
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: { signInWithOAuth: (...a: unknown[]) => mockSignInWithOAuth(...a) },
  })),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({ get: () => ({ value: "ja" }) })),
}));

function redirectToOf() {
  return new URL(mockSignInWithOAuth.mock.calls[0][0].options.redirectTo);
}

describe("loginWithGoogle のコールバックURL", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/o/oauth2/auth" },
      error: null,
    });
  });

  it("認証方法として auth_method=google を明示する", async () => {
    // app_metadata.provider では判別できない（メール登録後にGoogleを連携した人など）
    await loginWithGoogle("/lists");

    const url = redirectToOf();
    expect(url.pathname).toBe("/auth/callback");
    expect(url.searchParams.get("auth_method")).toBe("google");
  });

  it("遷移先を redirect_url として保持する", async () => {
    await loginWithGoogle("/lists/join?token=t1&auto=1");

    expect(redirectToOf().searchParams.get("redirect_url")).toBe(
      "/lists/join?token=t1&auto=1"
    );
  });

  it("ブックマーク用に /auth/callback 付きで渡された場合も auth_method を落とさない", async () => {
    await loginWithGoogle("/auth/callback?bookmark=list-1");

    const url = redirectToOf();
    expect(url.pathname).toBe("/auth/callback");
    expect(url.searchParams.get("bookmark")).toBe("list-1");
    expect(url.searchParams.get("auth_method")).toBe("google");
  });
});
