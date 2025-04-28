import { PREFECTURE_ORDER } from "@/lib/constants/geography";

/**
 * 都道府県名の配列を地理的な順序（北から南）でソートします。
 * PREFECTURE_ORDER に含まれない要素は末尾に配置されます。
 * @param prefectures ソート対象の都道府県名の配列
 * @returns ソートされた新しい配列
 */
export const sortPrefectures = (prefectures: string[]): string[] => {
  return prefectures
    .slice() // 元の配列を変更しない
    .sort((a, b) => {
      const indexA = PREFECTURE_ORDER.indexOf(a);
      const indexB = PREFECTURE_ORDER.indexOf(b);

      if (indexA === -1 && indexB === -1) return a.localeCompare(b, "ja");
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
};
