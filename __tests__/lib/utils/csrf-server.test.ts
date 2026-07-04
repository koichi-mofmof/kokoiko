import {
  getCSRFTokenServer,
  verifyCSRFTokenServer,
} from "@/lib/utils/csrf-server";
import { cookies } from "next/headers";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

const mockCookies = cookies as jest.Mock;

/** csrf cookie の値を制御する */
function setCookieToken(value: string | undefined) {
  mockCookies.mockResolvedValue({
    get: jest.fn((name: string) =>
      name === "clippymap_csrf_token" && value !== undefined
        ? { value }
        : undefined
    ),
  });
}

describe("getCSRFTokenServer", () => {
  beforeEach(() => jest.clearAllMocks());

  it("Cookie のトークンを返す", async () => {
    setCookieToken("abc123");
    expect(await getCSRFTokenServer()).toBe("abc123");
  });

  it("Cookie が無ければ null を返す", async () => {
    setCookieToken(undefined);
    expect(await getCSRFTokenServer()).toBeNull();
  });
});

describe("verifyCSRFTokenServer", () => {
  beforeEach(() => jest.clearAllMocks());

  it("Cookie トークンが無ければ false", async () => {
    setCookieToken(undefined);
    expect(await verifyCSRFTokenServer("submitted")).toBe(false);
  });

  it("送信トークンが空なら false", async () => {
    setCookieToken("abc123");
    expect(await verifyCSRFTokenServer("")).toBe(false);
  });

  it("トークンが一致すれば true", async () => {
    setCookieToken("matching-token-123");
    expect(await verifyCSRFTokenServer("matching-token-123")).toBe(true);
  });

  it("同じ長さでも内容が異なれば false", async () => {
    setCookieToken("abcdefg");
    expect(await verifyCSRFTokenServer("abcdefX")).toBe(false);
  });

  it("長さが異なれば false（定数時間比較の早期 false）", async () => {
    setCookieToken("short");
    expect(await verifyCSRFTokenServer("longer-token")).toBe(false);
  });
});
