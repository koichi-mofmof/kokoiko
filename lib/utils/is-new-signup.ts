/**
 * 認証コールバックに来たユーザーが「新規登録」か「再ログイン」かを判定する。
 *
 * 以前は profiles の有無で判定していたが、DBトリガー handle_new_user が
 * auth.users の挿入と同時にプロファイルを作るため、新規登録でも常に
 * 「既存ユーザー」と判定され、GA4 上は全件 login として計上されていた。
 * そのため auth.users のタイムスタンプで判定する。
 */

/** 登録直後の初回サインインとみなす猶予（ミリ秒） */
const NEW_SIGNUP_WINDOW_MS = 60_000;

export function isNewSignup(
  user:
    | { created_at?: string | null; last_sign_in_at?: string | null }
    | null
    | undefined
): boolean {
  if (!user?.created_at) return false;

  const createdAt = new Date(user.created_at).getTime();
  if (Number.isNaN(createdAt)) return false;

  // 初回サインインでは last_sign_in_at がまだ無いことがある
  if (!user.last_sign_in_at) return true;

  const lastSignInAt = new Date(user.last_sign_in_at).getTime();
  if (Number.isNaN(lastSignInAt)) return false;

  // 登録とサインインが実質同時なら初回。再ログインは必ず大きく離れる。
  return lastSignInAt - createdAt < NEW_SIGNUP_WINDOW_MS;
}
