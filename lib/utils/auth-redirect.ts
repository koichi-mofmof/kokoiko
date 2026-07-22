/**
 * ログイン/新規登録ページ間を移動しても、遷移元の文脈（招待トークン等）を失わないための共通処理。
 *
 * 招待リンク /lists/join?token=X は未ログイン時に /login?redirect_url=... へ送られるが、
 * そこから「新規登録」へ移った時点でクエリが落ちると、登録完了後に招待先へ戻れなくなる。
 * 引き継ぎ対象をここに一元化し、login/signup 双方で同じ規約を使う。
 */

export const AUTH_PASSTHROUGH_PARAMS = [
  "redirect_url",
  "returnTo",
  "bookmark",
] as const;

/** 遷移先として扱ってよいのは自サイト内の絶対パスのみ（オープンリダイレクト対策） */
export function isSafeInternalPath(
  value: string | null | undefined
): value is string {
  if (!value) return false;
  // "//evil.com" はプロトコル相対URLとして外部へ飛ぶため除外する
  return value.startsWith("/") && !value.startsWith("//");
}

/** 遷移先を検証し、外部URLなら fallback に落とす */
export function sanitizeInternalPath(
  value: string | null | undefined,
  fallback = "/lists"
): string {
  return isSafeInternalPath(value) ? value : fallback;
}

/** bookmark はパスではなくIDなのでパス検証の対象外 */
function isPathParam(name: string): boolean {
  return name === "redirect_url" || name === "returnTo";
}

/**
 * 認証ページへのリンク先を、引き継ぐべきクエリを保ったまま組み立てる。
 */
export function buildAuthHref(
  basePath: string,
  params: URLSearchParams | null | undefined
): string {
  if (!params) return basePath;

  const next = new URLSearchParams();
  for (const name of AUTH_PASSTHROUGH_PARAMS) {
    const value = params.get(name);
    if (!value) continue;
    if (isPathParam(name) && !isSafeInternalPath(value)) continue;
    next.set(name, value);
  }

  const query = next.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * 認証成功後に戻すべきパスを決める。redirect_url > returnTo > /lists の優先順。
 */
export function resolvePostAuthRedirect(
  params: URLSearchParams | null | undefined
): string {
  if (!params) return "/lists";

  for (const name of ["redirect_url", "returnTo"] as const) {
    const value = params.get(name);
    if (isSafeInternalPath(value)) return value;
  }
  return "/lists";
}
