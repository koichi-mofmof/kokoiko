/**
 * 地点コメントに関する純粋ユーティリティ（Supabase等に依存しない）。
 * テスト容易性のため DAL 本体から切り出している。
 */

export interface ListPlaceCommentRow {
  list_place_id: string;
  user_id: string;
  comment: string;
  created_at: string;
}

export interface PickedComment {
  /** コメントの実著者（＝バブルのアバター帰属先）。追加者とは限らない。 */
  userId: string;
  comment: string;
}

/**
 * 指定の list_place に対してカードで主役化する1件のコメントを選ぶ。
 * 該当が無い（全て空白/不在）の場合は undefined。
 *
 * 選択規則：
 * 1. その地点の追加者(adderUserId)の最古の非空コメントを優先。
 * 2. 追加者が未記入なら、他ユーザー(コラボレーター)の最古の非空コメントにフォールバック。
 *
 * (list_place_id, user_id) に一意制約は無く同一人物が複数コメントし得るため、
 * created_at 昇順で「最初のひとこと」を決定的に採用する。
 * 返り値に著者IDを含め、DAL側でアバター等を正しい著者に紐付けられるようにする。
 */
export function pickPlaceComment(
  listPlaceId: string,
  adderUserId: string,
  comments: ListPlaceCommentRow[]
): PickedComment | undefined {
  const forPlace = comments
    .filter((c) => c.list_place_id === listPlaceId)
    .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));

  // 1) 追加者の最古の非空コメントを優先
  for (const c of forPlace) {
    if (c.user_id !== adderUserId) continue;
    const text = c.comment?.trim();
    if (text) return { userId: c.user_id, comment: text };
  }
  // 2) フォールバック：誰かの最古の非空コメント
  for (const c of forPlace) {
    const text = c.comment?.trim();
    if (text) return { userId: c.user_id, comment: text };
  }
  return undefined;
}
