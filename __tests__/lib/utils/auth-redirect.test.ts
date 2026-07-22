import {
  AUTH_PASSTHROUGH_PARAMS,
  buildAuthHref,
  resolvePostAuthRedirect,
} from "@/lib/utils/auth-redirect";

describe("auth-redirect", () => {
  describe("buildAuthHref", () => {
    it("引き継ぎ対象パラメータをそのまま次の認証ページへ渡す", () => {
      const params = new URLSearchParams(
        "redirect_url=" + encodeURIComponent("/lists/join?token=abc123")
      );

      const href = buildAuthHref("/signup", params);

      expect(href).toContain("/signup?");
      // 復元したときに元のパスへ戻れること（招待トークンが消えないこと）
      const restored = new URLSearchParams(href.split("?")[1]);
      expect(restored.get("redirect_url")).toBe("/lists/join?token=abc123");
    });

    it("returnTo と bookmark も引き継ぐ", () => {
      const params = new URLSearchParams("returnTo=/lists/xyz&bookmark=list-1");

      const href = buildAuthHref("/login", params);

      const restored = new URLSearchParams(href.split("?")[1]);
      expect(restored.get("returnTo")).toBe("/lists/xyz");
      expect(restored.get("bookmark")).toBe("list-1");
    });

    it("引き継ぎ対象外のパラメータは持ち込まない", () => {
      const params = new URLSearchParams(
        "google_error=1&redirect_url=%2Flists&utm_source=x"
      );

      const href = buildAuthHref("/signup", params);

      expect(href).not.toContain("google_error");
      expect(href).not.toContain("utm_source");
      expect(href).toContain("redirect_url");
    });

    it("引き継ぐものが無ければクエリを付けない", () => {
      expect(buildAuthHref("/signup", new URLSearchParams(""))).toBe("/signup");
      expect(buildAuthHref("/signup", null)).toBe("/signup");
    });

    it("外部URLへの誘導は引き継がない（オープンリダイレクト対策）", () => {
      const params = new URLSearchParams(
        "redirect_url=" + encodeURIComponent("https://evil.example.com/steal")
      );

      expect(buildAuthHref("/signup", params)).toBe("/signup");
    });

    it("プロトコル相対URL(//evil.com)も引き継がない", () => {
      const params = new URLSearchParams(
        "redirect_url=" + encodeURIComponent("//evil.example.com")
      );

      expect(buildAuthHref("/signup", params)).toBe("/signup");
    });

    it("引き継ぎ対象の定義に redirect_url / returnTo / bookmark を含む", () => {
      expect(AUTH_PASSTHROUGH_PARAMS).toEqual(
        expect.arrayContaining(["redirect_url", "returnTo", "bookmark"])
      );
    });
  });

  describe("resolvePostAuthRedirect", () => {
    it("redirect_url を最優先で使う", () => {
      const params = new URLSearchParams(
        "redirect_url=" +
          encodeURIComponent("/lists/join?token=abc") +
          "&returnTo=%2Flists%2Fother"
      );

      expect(resolvePostAuthRedirect(params)).toBe("/lists/join?token=abc");
    });

    it("redirect_url が無ければ returnTo を使う", () => {
      const params = new URLSearchParams("returnTo=%2Flists%2Fxyz");

      expect(resolvePostAuthRedirect(params)).toBe("/lists/xyz");
    });

    it("どちらも無ければ /lists に落とす", () => {
      expect(resolvePostAuthRedirect(new URLSearchParams(""))).toBe("/lists");
      expect(resolvePostAuthRedirect(null)).toBe("/lists");
    });

    it("外部URLが指定されても /lists に落とす（オープンリダイレクト対策）", () => {
      const params = new URLSearchParams(
        "redirect_url=" + encodeURIComponent("https://evil.example.com")
      );

      expect(resolvePostAuthRedirect(params)).toBe("/lists");
    });
  });
});
