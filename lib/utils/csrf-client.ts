"use client";

/**
 * 複数の方法でCSRFトークン取得を試行
 */
function getCookieValue(name: string): string | null {
  // 方法1: 標準的なdocument.cookie解析
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split("=");
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }

  // 方法2: 正規表現を使用した検索
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) {
    return decodeURIComponent(match[2]);
  }

  // 方法3: より柔軟な検索
  const cookieString = document.cookie;
  const nameEQ = name + "=";
  const ca = cookieString.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }

  return null;
}

/**
 * クライアントサイドでCSRFトークンをCookieから取得
 */
export function getCSRFTokenFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  // CSRFトークンを取得
  const token = getCookieValue("clippymap_csrf_token");
  return token;
}
