/**
 * リスト詳細ページの meta description を、リストの中身から組み立てる。
 *
 * 以前は「10件の場所が登録されています」という固定文だったため、
 * 検索結果でリストの中身が全く伝わらなかった。実際の地点名と地域を入れて
 * クリックの判断材料になる説明文にする。
 */

const MAX_LENGTH = 155;

/** 語尾を壊さないように省略する */
export function truncate(text: string, max: number = MAX_LENGTH): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function buildListMetaDescription({
  t,
  listDescription,
  placesCount,
  samplePlaceNames,
  primaryRegion,
}: {
  t: (key: string, params?: Record<string, string | number>) => string;
  listDescription: string | null;
  placesCount: number;
  samplePlaceNames: string[];
  primaryRegion: string | null;
}): string {
  // 作成者が書いた説明文が最優先の素材
  const authored = listDescription?.trim() || "";

  // 地点が1件も無いリストは従来どおり件数のみ
  if (placesCount === 0 || samplePlaceNames.length === 0) {
    const fallback = t("listsDetail.placesCount", { n: placesCount });
    return truncate(authored ? `${authored} - ${fallback}` : fallback);
  }

  const places = samplePlaceNames.join(t("meta.list.separator"));

  // 全件を列挙できている場合に「など/and more」と書くと事実と食い違う
  // （例: 2件のリストで「A, B and more — 2 spots」）。文面を出し分ける。
  const hasMore = placesCount > samplePlaceNames.length;
  const key = primaryRegion
    ? hasMore
      ? "meta.list.desc.withRegion"
      : "meta.list.desc.withRegionExact"
    : hasMore
    ? "meta.list.desc.noRegion"
    : "meta.list.desc.noRegionExact";

  const body = t(key, {
    places,
    region: primaryRegion ?? "",
    n: placesCount,
  });

  return truncate(authored ? `${authored} ${body}` : body);
}
