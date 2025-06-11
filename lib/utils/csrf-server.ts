import { cookies } from "next/headers";

// CSRFトークンの名前
const CSRF_TOKEN_NAME = "clippymap_csrf_token";

/**
 * CSRFトークンをCookieから取得（Server Actions用）
 */
export async function getCSRFTokenServer(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_TOKEN_NAME)?.value || null;
}

/**
 * CSRFトークンを検証（Server Actions用）
 */
export async function verifyCSRFTokenServer(
  submittedToken: string
): Promise<boolean> {
  const cookieToken = await getCSRFTokenServer();

  if (!cookieToken || !submittedToken) {
    console.error("CSRF verification failed: Missing tokens");
    return false;
  }

  // タイミング攻撃を防ぐための定数時間比較
  const result = timingSafeCompare(cookieToken, submittedToken);

  if (!result) {
    console.error("CSRF verification failed: Token mismatch");
  }

  return result;
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
