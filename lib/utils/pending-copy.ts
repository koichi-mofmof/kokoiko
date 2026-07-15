/**
 * 「体験先行」コピー導線のための、未ログイン時のコピー意図の一時保存ユーティリティ。
 *
 * ゲストが公開リストで地点を選び、リスト名まで入力して「保存」を押した時点の内容を
 * 保存してからサインアップへ送り、登録後に同じリスト詳細ページで復元して
 * ワンタップでコピーを完遂させる（保有効果 → 登録直後に"ご褒美"）。
 *
 * OAuth はいったんサイト外へ遷移するため、タブ依存の sessionStorage ではなく
 * localStorage を用い、TTL とワンショット消費（読み出し時に即削除）で残留を防ぐ。
 */

const STORAGE_KEY = "kokoiko:pendingCopy";
const TTL_MS = 30 * 60 * 1000; // 30分

export interface PendingCopyIntent {
  sourceListId: string;
  /** TemplateCopyModal の選択集合（place.id）。コピー処理にそのまま渡せる形で保存する。 */
  placeIds: string[];
  target: {
    type: "new";
    name: string;
    description?: string;
    isPublic: boolean;
  };
  /** 保存時刻（TTL 判定用）。保存時に付与するため入力では受け取らない。 */
  ts?: number;
}

/** コピー意図を保存する（登録導線へ送る直前に呼ぶ）。 */
export function savePendingCopyIntent(
  intent: Omit<PendingCopyIntent, "ts">
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PendingCopyIntent = { ...intent, ts: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ストレージ不可（プライベートブラウズ等）の場合は黙ってあきらめる
  }
}

/**
 * 保存済みのコピー意図を「削除せずに」取り出す（非破壊）。
 * - TTL を超過していれば null
 * - 現在のリストと sourceListId が一致しなければ null（別リスト/別タブ対策）
 *
 * 復元フローでは、再マウント・StrictModeの二重実行・router.refresh 等に耐えるため
 * ここでは削除せず、モーダルを閉じた/完了した時点で clearPendingCopyIntent() を呼ぶ。
 */
/**
 * 保存済みのコピー意図を「削除せずに・リスト非限定で」取り出す（非破壊）。
 * TTL・データ妥当性のみ検証する。着地ページに依存しない誘導（保険）で使う。
 */
export function peekAnyPendingCopyIntent(): PendingCopyIntent | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingCopyIntent;
    if (!parsed || typeof parsed.sourceListId !== "string") return null;
    if (typeof parsed.ts !== "number" || Date.now() - parsed.ts > TTL_MS) {
      return null;
    }
    if (!Array.isArray(parsed.placeIds) || parsed.placeIds.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function peekPendingCopyIntent(
  sourceListId: string
): PendingCopyIntent | null {
  const intent = peekAnyPendingCopyIntent();
  if (!intent || intent.sourceListId !== sourceListId) return null;
  return intent;
}

/** 保存済みのコピー意図を削除する。 */
export function clearPendingCopyIntent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * 保存済みのコピー意図を取り出して即削除する（ワンショット）。
 * peek + clear の複合。
 */
export function consumePendingCopyIntent(
  sourceListId: string
): PendingCopyIntent | null {
  const intent = peekPendingCopyIntent(sourceListId);
  clearPendingCopyIntent();
  return intent;
}
