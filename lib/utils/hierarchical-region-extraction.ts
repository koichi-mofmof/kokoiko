/**
 * 階層地域抽出ユーティリティ
 * Google Maps Places API (New) の addressComponents から階層地域情報を抽出
 */

interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
  languageCode: string;
}

export interface HierarchicalRegion {
  countryCode: string;
  countryName: string;
  adminAreaLevel1?: string;
  adminAreaLevel1Type: "prefecture" | "state" | "province" | "region";
  hierarchy: {
    level1: string; // 国名
    level2?: string; // 州/省/都道府県
  };
}

/**
 * Google Maps Places API の addressComponents から階層地域情報を抽出
 * @param addressComponents Places API から取得した住所コンポーネント
 * @returns 階層地域情報
 */
export function extractHierarchicalRegion(
  addressComponents: AddressComponent[]
): HierarchicalRegion {
  const country = addressComponents.find((c) => c.types.includes("country"));
  const adminLevel1 = addressComponents.find((c) =>
    c.types.includes("administrative_area_level_1")
  );

  const countryCode = country?.shortText || "";
  const countryName = country?.longText || "";
  const adminAreaLevel1 = adminLevel1?.longText;

  // 第1行政区分のタイプを決定
  const adminAreaLevel1Type = determineAdminAreaType(countryCode);

  // 階層構造を構築
  const hierarchy = buildHierarchy(countryName, adminAreaLevel1);

  return {
    countryCode,
    countryName,
    adminAreaLevel1,
    adminAreaLevel1Type,
    hierarchy,
  };
}

/**
 * 国コードに基づいて第1行政区分のタイプを決定
 * @param countryCode ISO 3166-1 国コード
 * @returns 行政区分タイプ
 */
function determineAdminAreaType(
  countryCode: string
): "prefecture" | "state" | "province" | "region" {
  const typeMap: Record<
    string,
    "prefecture" | "state" | "province" | "region"
  > = {
    JP: "prefecture", // 日本: 都道府県
    US: "state", // アメリカ: 州
    CA: "province", // カナダ: 州・準州
    AU: "state", // オーストラリア: 州・特別地域
    CN: "province", // 中国: 省・直轄市
    DE: "state", // ドイツ: 州
    FR: "region", // フランス: 地域圏
    IT: "region", // イタリア: 州
    ES: "region", // スペイン: 自治州
    GB: "region", // イギリス: 地域
    IN: "state", // インド: 州
    BR: "state", // ブラジル: 州
    RU: "region", // ロシア: 地域
    MX: "state", // メキシコ: 州
    AR: "province", // アルゼンチン: 州
  };

  return typeMap[countryCode] || "region";
}

/**
 * 階層構造を構築
 * @param countryName 国名
 * @param adminAreaLevel1 第1行政区分名
 * @returns 階層構造
 */
function buildHierarchy(
  countryName: string,
  adminAreaLevel1?: string
): { level1: string; level2?: string } {
  const hierarchy: { level1: string; level2?: string } = {
    level1: countryName,
  };

  // レベル2の決定
  if (adminAreaLevel1) {
    hierarchy.level2 = adminAreaLevel1;
  }

  return hierarchy;
}

/**
 * 階層地域情報の妥当性をチェック
 * @param region 階層地域情報
 * @returns 妥当性チェック結果
 */
export function validateHierarchicalRegion(region: HierarchicalRegion): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 必須フィールドのチェック
  if (!region.countryCode) {
    errors.push("countryCode is required");
  }
  if (!region.countryName) {
    errors.push("countryName is required");
  }
  if (!region.hierarchy.level1) {
    errors.push("hierarchy.level1 (country name) is required");
  }

  // 国コードの形式チェック（ISO 3166-1 alpha-2）
  if (region.countryCode && !/^[A-Z]{2}$/.test(region.countryCode)) {
    errors.push("countryCode must be a valid ISO 3166-1 alpha-2 code");
  }

  // 階層の一貫性チェック
  if (region.hierarchy.level1 !== region.countryName) {
    errors.push("hierarchy.level1 must match countryName");
  }
  if (
    region.adminAreaLevel1 &&
    region.hierarchy.level2 !== region.adminAreaLevel1
  ) {
    errors.push("hierarchy.level2 must match adminAreaLevel1");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * エラーハンドリング付きの階層地域抽出
 * @param addressComponents Places API から取得した住所コンポーネント
 * @returns 階層地域情報またはnull（エラー時）
 */
export function extractHierarchicalRegionSafe(
  addressComponents: AddressComponent[]
): HierarchicalRegion | null {
  try {
    if (!addressComponents || addressComponents.length === 0) {
      console.warn("No address components provided");
      return null;
    }

    const region = extractHierarchicalRegion(addressComponents);
    const validation = validateHierarchicalRegion(region);

    if (!validation.isValid) {
      console.warn("Invalid hierarchical region:", validation.errors);
      return null;
    }

    return region;
  } catch (error) {
    console.error("Error extracting hierarchical region:", error);
    return null;
  }
}

/**
 * 地域タイプの日本語ラベルを取得
 * @param type 地域タイプ
 * @returns 日本語ラベル
 */
export function getAdminAreaTypeLabel(
  type: "prefecture" | "state" | "province" | "region"
): string {
  const labels: Record<string, string> = {
    prefecture: "都道府県",
    state: "州",
    province: "省・準州",
    region: "地域",
  };
  return labels[type] || "地域";
}

/**
 * 国コードから地域タイプの日本語ラベルを取得
 * @param countryCode ISO 3166-1 国コード
 * @returns 日本語ラベル
 */
export function getStateLabel(countryCode: string): string {
  const type = determineAdminAreaType(countryCode);

  const specificLabels: Record<string, string> = {
    JP: "都道府県",
    US: "州",
    CA: "州・準州",
    AU: "州・特別地域",
    CN: "省・直轄市",
    DE: "州",
    FR: "地域圏",
    IT: "州",
    ES: "自治州",
    GB: "地域",
    IN: "州",
    BR: "州",
    RU: "地域",
    MX: "州",
    AR: "州",
  };

  return specificLabels[countryCode] || getAdminAreaTypeLabel(type);
}
