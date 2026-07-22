/**
 * 初回プロフィール設定の直後にどこへ送るかを決める。
 *
 * 表示名だけ入れて放流しないよう、通常は最初のリスト作成導線（/lists?firstList=1）へ導く。
 * ただし招待リンク経由の登録は既に目的のリストに着地しているため、
 * そこから引き剥がすと「招待されたリストに辿り着けない」という本末転倒が起きる。
 *
 * @returns 遷移先パス。null の場合は遷移せずその場に留まる。
 */
export function resolvePostProfileSetupDestination(
  pathname: string | null | undefined
): string | null {
  const FIRST_LIST_FUNNEL = "/lists?firstList=1";

  if (!pathname) return FIRST_LIST_FUNNEL;

  // /lists 配下の個別ページ（リスト詳細・地点詳細・参加確認）は、既に見るべきものがある
  if (pathname.startsWith("/lists/")) return null;

  return FIRST_LIST_FUNNEL;
}
