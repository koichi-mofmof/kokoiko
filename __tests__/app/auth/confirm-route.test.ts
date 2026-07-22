import { GET } from "@/app/auth/confirm/route";

const mockVerifyOtp = jest.fn();
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: { verifyOtp: (...a: unknown[]) => mockVerifyOtp(...a) },
  })),
}));

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

function locationOf(res: Response) {
  return new URL(res.headers.get("location")!);
}

describe("GET /auth/confirm（token_hash によるメール確認）", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyOtp.mockResolvedValue({ error: null });
  });

  it("token_hash を検証して遷移先へ送る", async () => {
    // code_verifier のcookieを必要としないため、別ブラウザで開いても成立する
    const res = await GET(
      new Request(
        "http://localhost:3000/auth/confirm?token_hash=abc&type=signup&next=%2Flists"
      )
    );

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      type: "signup",
      token_hash: "abc",
    });
    expect(locationOf(res).pathname).toBe("/lists");
  });

  it("新規登録として計測できるようパラメータを付ける", async () => {
    const res = await GET(
      new Request(
        "http://localhost:3000/auth/confirm?token_hash=abc&type=signup&next=%2Flists"
      )
    );

    expect(locationOf(res).searchParams.get("auth_event")).toBe("signup_email");
  });

  it("招待リンクの遷移先を保持する", async () => {
    const res = await GET(
      new Request(
        "http://localhost:3000/auth/confirm?token_hash=abc&type=signup&next=" +
          encodeURIComponent("/lists/join?token=t1&auto=1")
      )
    );

    const url = locationOf(res);
    expect(url.pathname).toBe("/lists/join");
    expect(url.searchParams.get("token")).toBe("t1");
    expect(url.searchParams.get("auto")).toBe("1");
  });

  it("next に絶対URLが来てもパス部分だけを使う", async () => {
    // メールテンプレートの {{ .RedirectTo }} は自サイトの絶対URLで渡ってくる
    const res = await GET(
      new Request(
        "http://localhost:3000/auth/confirm?token_hash=abc&type=signup&next=" +
          encodeURIComponent("http://localhost:3000/lists/join?token=t1")
      )
    );

    const url = locationOf(res);
    expect(url.origin).toBe("http://localhost:3000");
    expect(url.pathname).toBe("/lists/join");
    expect(url.searchParams.get("token")).toBe("t1");
  });

  it("外部URLへは飛ばさない", async () => {
    const res = await GET(
      new Request(
        "http://localhost:3000/auth/confirm?token_hash=abc&type=signup&next=" +
          encodeURIComponent("https://evil.example.com/steal")
      )
    );

    const url = locationOf(res);
    expect(url.origin).toBe("http://localhost:3000");
    expect(url.pathname).toBe("/lists");
  });

  it("token_hash が無ければ検証せずログインへ送る", async () => {
    const res = await GET(new Request("http://localhost:3000/auth/confirm"));

    expect(mockVerifyOtp).not.toHaveBeenCalled();
    const url = locationOf(res);
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("auth_error")).toBe("confirm");
  });

  it("検証に失敗したらログインへ送る（Googleのエラーにはしない）", async () => {
    mockVerifyOtp.mockResolvedValue({ error: { message: "expired" } });

    const res = await GET(
      new Request(
        "http://localhost:3000/auth/confirm?token_hash=abc&type=signup&next=%2Flists"
      )
    );

    const url = locationOf(res);
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("auth_error")).toBe("confirm");
    expect(url.searchParams.get("google_error")).toBeNull();
  });
});
