/**
 * 階層フィルターアクション
 * 国・州/省/都道府県の動的フィルタリング機能を提供
 */

"use server";

import { createClient } from "@/lib/supabase/server";

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface HierarchicalFilterOptions {
  countries: FilterOption[];
  states: FilterOption[];
}

// 地域選択肢のキャッシュ（5分間有効）
const regionCache = new Map<string, { data: FilterOption[]; expiry: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分

/**
 * キャッシュ機能付きの地域選択肢取得
 * @param cacheKey キャッシュキー
 * @param fetchFunction データ取得関数
 * @returns フィルター選択肢
 */
async function getCachedRegionOptions(
  cacheKey: string,
  fetchFunction: () => Promise<FilterOption[]>
): Promise<FilterOption[]> {
  const cached = regionCache.get(cacheKey);
  const now = Date.now();

  // キャッシュが有効な場合は返す
  if (cached && cached.expiry > now) {
    return cached.data;
  }

  // データを新たに取得
  const options = await fetchFunction();

  // キャッシュに保存
  regionCache.set(cacheKey, {
    data: options,
    expiry: now + CACHE_DURATION,
  });

  return options;
}

/**
 * 指定されたリストで利用可能な国一覧を取得
 * @param listId リストID
 * @returns 国のフィルター選択肢（使用頻度順）
 */
export async function getAvailableCountries(
  listId: string
): Promise<FilterOption[]> {
  const cacheKey = `countries:${listId}`;

  return getCachedRegionOptions(cacheKey, async () => {
    const supabase = await createClient();

    // まずリストに含まれる地点IDを取得
    const { data: listPlaces, error: listError } = await supabase
      .from("list_places")
      .select("place_id")
      .eq("list_id", listId);

    if (listError) {
      console.error("Error fetching list places:", listError);
      throw listError;
    }

    if (!listPlaces || listPlaces.length === 0) {
      return [];
    }

    const placeIds = listPlaces.map((lp) => lp.place_id);

    // リストに含まれる地点の国情報を取得
    const { data, error } = await supabase
      .from("places")
      .select("country_code, country_name")
      .in("id", placeIds)
      .not("country_code", "is", null);

    if (error) {
      console.error("Error fetching countries:", error);
      throw error;
    }

    // 国ごとの地点数をカウント（null値をフィルター）
    const countryMap = new Map<string, { name: string; count: number }>();

    data.forEach((place) => {
      if (place.country_code && place.country_name) {
        const existing = countryMap.get(place.country_code);
        countryMap.set(place.country_code, {
          name: place.country_name,
          count: (existing?.count || 0) + 1,
        });
      }
    });

    // フィルター選択肢として整形（使用頻度順）
    return Array.from(countryMap.entries())
      .map(([code, info]) => ({
        value: code,
        label: info.name,
        count: info.count,
      }))
      .sort((a, b) => {
        // 使用頻度 → アルファベット順
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.label.localeCompare(b.label);
      });
  });
}

/**
 * 指定された国・リストで利用可能な州/省一覧を取得
 * @param listId リストID
 * @param countryCode 国コード
 * @returns 州/省のフィルター選択肢（使用頻度順）
 */
export async function getAvailableStates(
  listId: string,
  countryCode: string
): Promise<FilterOption[]> {
  const cacheKey = `states:${listId}:${countryCode}`;

  return getCachedRegionOptions(cacheKey, async () => {
    const supabase = await createClient();

    // まずリストに含まれる地点IDを取得
    const { data: listPlaces, error: listError } = await supabase
      .from("list_places")
      .select("place_id")
      .eq("list_id", listId);

    if (listError) {
      console.error("Error fetching list places:", listError);
      throw listError;
    }

    if (!listPlaces || listPlaces.length === 0) {
      return [];
    }

    const placeIds = listPlaces.map((lp) => lp.place_id);

    // 指定された国のリスト内地点の州/省情報を取得
    const { data, error } = await supabase
      .from("places")
      .select("admin_area_level_1")
      .eq("country_code", countryCode)
      .in("id", placeIds)
      .not("admin_area_level_1", "is", null);

    if (error) {
      console.error("Error fetching states:", error);
      throw error;
    }

    // 州/省ごとの地点数をカウント
    const stateMap = new Map<string, number>();

    data.forEach((place) => {
      if (place.admin_area_level_1) {
        stateMap.set(
          place.admin_area_level_1,
          (stateMap.get(place.admin_area_level_1) || 0) + 1
        );
      }
    });

    // フィルター選択肢として整形（使用頻度順）
    return Array.from(stateMap.entries())
      .map(([state, count]) => ({
        value: state,
        label: state,
        count,
      }))
      .sort((a, b) => {
        // 使用頻度 → アルファベット順
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.label.localeCompare(b.label);
      });
  });
}

/**
 * 階層フィルターの全選択肢を取得
 * @param listId リストID
 * @param selectedCountry 選択された国コード（オプション）
 * @returns 階層フィルターの選択肢
 */
export async function getHierarchicalFilterOptions(
  listId: string,
  selectedCountry?: string
): Promise<HierarchicalFilterOptions> {
  const countries = await getAvailableCountries(listId);

  const states = selectedCountry
    ? await getAvailableStates(listId, selectedCountry)
    : [];

  return {
    countries,
    states,
  };
}

/**
 * 地域階層マスターテーブルから全ての利用可能な国を取得
 * @returns 全ての国のフィルター選択肢
 */
export async function getAllAvailableCountries(): Promise<FilterOption[]> {
  const cacheKey = "all_countries";

  return getCachedRegionOptions(cacheKey, async () => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("region_hierarchy")
      .select("country_code, country_name, usage_count")
      .not("country_code", "is", null);

    if (error) {
      console.error("Error fetching all countries:", error);
      throw error;
    }

    // 国ごとの使用頻度を集計（null値をフィルター）
    const countryMap = new Map<string, { name: string; count: number }>();

    data.forEach((region) => {
      if (region.country_code && region.country_name) {
        const existing = countryMap.get(region.country_code);
        countryMap.set(region.country_code, {
          name: region.country_name,
          count: (existing?.count || 0) + (region.usage_count || 0),
        });
      }
    });

    return Array.from(countryMap.entries())
      .map(([code, info]) => ({
        value: code,
        label: info.name,
        count: info.count,
      }))
      .sort((a, b) => {
        // 使用頻度 → アルファベット順
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.label.localeCompare(b.label);
      });
  });
}

/**
 * 指定された国の全ての利用可能な州/省を取得
 * @param countryCode 国コード
 * @returns 州/省のフィルター選択肢
 */
export async function getAllAvailableStates(
  countryCode: string
): Promise<FilterOption[]> {
  const cacheKey = `all_states:${countryCode}`;

  return getCachedRegionOptions(cacheKey, async () => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("region_hierarchy")
      .select("admin_area_level_1, usage_count")
      .eq("country_code", countryCode)
      .not("admin_area_level_1", "is", null);

    if (error) {
      console.error("Error fetching all states:", error);
      throw error;
    }

    return data
      .map((region) => ({
        value: region.admin_area_level_1!,
        label: region.admin_area_level_1!,
        count: region.usage_count || 0,
      }))
      .sort((a, b) => {
        // 使用頻度 → アルファベット順
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.label.localeCompare(b.label);
      });
  });
}

/**
 * キャッシュをクリア（開発・テスト用）
 */
export async function clearRegionCache(): Promise<void> {
  regionCache.clear();
}

/**
 * 特定のキャッシュエントリを削除
 * @param pattern 削除するキーのパターン
 */
export async function invalidateRegionCache(pattern: string): Promise<void> {
  const keysToDelete = Array.from(regionCache.keys()).filter((key) =>
    key.includes(pattern)
  );

  keysToDelete.forEach((key) => regionCache.delete(key));
}

/**
 * 地域階層マスターテーブルの使用頻度を更新
 * @param countryCode 国コード
 * @param countryName 国名
 * @param adminAreaLevel1 州/省名（オプション）
 */
export async function updateRegionUsage(
  countryCode: string,
  countryName: string,
  adminAreaLevel1?: string
): Promise<void> {
  const supabase = await createClient();

  try {
    // 使用頻度を更新（upsert）
    const { error } = await supabase.from("region_hierarchy").upsert(
      {
        country_code: countryCode,
        country_name: countryName,
        admin_area_level_1: adminAreaLevel1,
        admin_area_level_1_type: determineAdminAreaType(countryCode),
        usage_count: 1, // PostgreSQLのON CONFLICTでインクリメント
      },
      {
        onConflict: "country_code,admin_area_level_1",
        ignoreDuplicates: false,
      }
    );

    if (error) {
      console.error("Error updating region usage:", error);
    }

    // 関連するキャッシュを無効化
    await invalidateRegionCache(countryCode);
  } catch (error) {
    console.error("Error in updateRegionUsage:", error);
  }
}

/**
 * 国コードに基づいて行政区分タイプを決定
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
    JP: "prefecture",
    US: "state",
    CA: "province",
    AU: "state",
    CN: "province",
    DE: "state",
    FR: "region",
    IT: "region",
    ES: "region",
    GB: "region",
    IN: "state",
    BR: "state",
    RU: "region",
    MX: "state",
    AR: "province",
  };

  return typeMap[countryCode] || "region";
}
