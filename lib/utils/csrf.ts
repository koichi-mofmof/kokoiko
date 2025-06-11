import { cookies } from "next/headers";

// CSRFトークンの名前
const CSRF_TOKEN_NAME = "clippymap_csrf_token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * CSRFトークンを生成（Edge Runtime対応）
 */
export function generateCSRFToken(): string {
  // Edge RuntimeではWeb Crypto APIを使用
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint8Array(CSRF_TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }

  // Fallback for other environments
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < CSRF_TOKEN_LENGTH * 2; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * CSRFトークンをCookieに設定
 */
export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();

  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24時間
    path: "/",
  });

  return token;
}

/**
 * CSRFトークンをCookieから取得
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_TOKEN_NAME)?.value || null;
}

/**
 * CSRFトークンを検証
 */
export async function verifyCSRFToken(
  submittedToken: string
): Promise<boolean> {
  const cookieToken = await getCSRFToken();

  if (!cookieToken || !submittedToken) {
    return false;
  }

  // タイミング攻撃を防ぐための定数時間比較
  return timingSafeCompare(cookieToken, submittedToken);
}

/**
 * タイミング攻撃を防ぐための定数時間比較
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * CSRFトークンをクリア
 */
export async function clearCSRFToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_TOKEN_NAME);
}
