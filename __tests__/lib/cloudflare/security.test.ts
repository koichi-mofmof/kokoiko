import { getPageRateLimit, SECURITY_CONFIG } from "@/lib/cloudflare/security";

describe("getPageRateLimit", () => {
  it("リスト詳細ページはHEAVY_PAGE", () => {
    expect(getPageRateLimit("/lists/abc123")).toBe(
      SECURITY_CONFIG.RATE_LIMITS.HEAVY_PAGE
    );
    expect(getPageRateLimit("/lists/xyz")).toBe(
      SECURITY_CONFIG.RATE_LIMITS.HEAVY_PAGE
    );
  });

  it("ホームページはHOME_PAGE", () => {
    expect(getPageRateLimit("/")).toBe(SECURITY_CONFIG.RATE_LIMITS.HOME_PAGE);
  });

  it("サンプルページはHEAVY_PAGE", () => {
    expect(getPageRateLimit("/sample/123")).toBe(
      SECURITY_CONFIG.RATE_LIMITS.HEAVY_PAGE
    );
  });

  it("APIエンドポイントはAPI", () => {
    expect(getPageRateLimit("/api/foo")).toBe(SECURITY_CONFIG.RATE_LIMITS.API);
  });

  it("認証関連はAUTH", () => {
    expect(getPageRateLimit("/auth/login")).toBe(
      SECURITY_CONFIG.RATE_LIMITS.AUTH
    );
    expect(getPageRateLimit("/login")).toBe(SECURITY_CONFIG.RATE_LIMITS.AUTH);
    expect(getPageRateLimit("/signup")).toBe(SECURITY_CONFIG.RATE_LIMITS.AUTH);
  });

  it("その他はDEFAULT", () => {
    expect(getPageRateLimit("/other")).toBe(
      SECURITY_CONFIG.RATE_LIMITS.DEFAULT
    );
    expect(getPageRateLimit("/lists")).toBe(
      SECURITY_CONFIG.RATE_LIMITS.DEFAULT
    );
  });
});
