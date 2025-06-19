/**
 * ブラウザ環境とWebViewの検知
 */

/**
 * WebViewかどうかを判定する関数
 */
export function isWebView(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent;

  // LINEアプリ内ブラウザの検知
  if (userAgent.includes("Line/")) {
    return true;
  }

  // iOS Safari（標準ブラウザ）を除外
  if (
    /iPhone.*Safari/i.test(userAgent) &&
    /Version\/[\d\.]+.*Mobile.*Safari/i.test(userAgent) &&
    !userAgent.includes("CriOS") &&
    !userAgent.includes("FxiOS")
  ) {
    return false;
  }

  // その他の一般的なWebView/アプリ内ブラウザの検知
  const webViewPatterns = [
    /wv\)/i, // Android WebView
    /Instagram/i,
    /FBAN|FBAV/i, // Facebook アプリ
    /Twitter/i, // Twitter アプリ
    /WhatsApp/i,
    /Snapchat/i,
    /TikTok/i,
    /WeChat/i,
    /MicroMessenger/i,
    /SamsungBrowser/i,
  ];

  return webViewPatterns.some((pattern) => pattern.test(userAgent));
}

/**
 * LINEアプリ内ブラウザかどうかを判定する関数
 */
export function isLineApp(): boolean {
  if (typeof window === "undefined") return false;
  return window.navigator.userAgent.includes("Line/");
}

/**
 * Google OAuth認証がブロックされる可能性があるかを判定
 */
export function isGoogleOAuthBlocked(): boolean {
  return isWebView();
}

/**
 * 外部ブラウザで開くためのアドバイスメッセージを取得
 */
export function getExternalBrowserAdvice(): string {
  if (isLineApp()) {
    return "右下のメニューから「ブラウザで開く」を選択し、標準ブラウザで開いてください";
  }

  if (isWebView()) {
    return "アプリ内ブラウザではなく、Safari/Chrome等の標準ブラウザで開いてください";
  }

  return "標準ブラウザで開いてください";
}
