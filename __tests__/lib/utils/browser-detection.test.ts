import {
  getExternalBrowserAdviceKey,
  isGoogleOAuthBlocked,
  isLineApp,
  isWebView,
} from "@/lib/utils/browser-detection";

// UserAgentのモック
const mockUserAgent = (userAgent: string) => {
  Object.defineProperty(window.navigator, "userAgent", {
    writable: true,
    value: userAgent,
  });
};

describe("browser-detection", () => {
  beforeEach(() => {
    // 各テスト前にUserAgentをリセット
    mockUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    );
  });

  describe("isWebView", () => {
    it("標準ブラウザでfalseを返す", () => {
      mockUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );
      expect(isWebView()).toBe(false);
    });

    it("LINEアプリ内ブラウザでtrueを返す", () => {
      mockUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Line/11.10.1"
      );
      expect(isWebView()).toBe(true);
    });

    it("Android WebViewでtrueを返す", () => {
      mockUserAgent(
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.120 Mobile Safari/537.36; wv)"
      );
      expect(isWebView()).toBe(true);
    });

    it("Instagramアプリ内ブラウザでtrueを返す", () => {
      mockUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 191.0.0.31.124"
      );
      expect(isWebView()).toBe(true);
    });

    it("Facebookアプリ内ブラウザでtrueを返す", () => {
      mockUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/323.0.0.51.120;]"
      );
      expect(isWebView()).toBe(true);
    });
  });

  describe("isLineApp", () => {
    it("LINEアプリでtrueを返す", () => {
      mockUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Line/11.10.1"
      );
      expect(isLineApp()).toBe(true);
    });

    it("標準ブラウザでfalseを返す", () => {
      mockUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1"
      );
      expect(isLineApp()).toBe(false);
    });
  });

  describe("isGoogleOAuthBlocked", () => {
    it("WebViewでtrueを返す", () => {
      mockUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Line/11.10.1"
      );
      expect(isGoogleOAuthBlocked()).toBe(true);
    });

    it("標準ブラウザでfalseを返す", () => {
      mockUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1"
      );
      expect(isGoogleOAuthBlocked()).toBe(false);
    });
  });

  describe("getExternalBrowserAdviceKey", () => {
    it("LINEアプリの場合適切なキーを返す", () => {
      mockUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Line/11.10.1"
      );
      const key = getExternalBrowserAdviceKey();
      expect(key).toBe("auth.webview.advice.lineOpen");
    });

    it("他のWebViewの場合一般的なキーを返す", () => {
      mockUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 191.0.0.31.124"
      );
      const key = getExternalBrowserAdviceKey();
      expect(key).toBe("auth.webview.advice.openInStandard");
    });

    it("標準ブラウザの場合一般的なキーを返す", () => {
      mockUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1"
      );
      const key = getExternalBrowserAdviceKey();
      expect(key).toBe("auth.webview.advice.openStandardGeneric");
    });
  });
});
