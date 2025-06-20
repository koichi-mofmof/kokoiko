#!/usr/bin/env tsx

/**
 * 既存地点データの階層地域情報補完スクリプト
 *
 * 使用方法:
 * npm run backfill-regions [--dry-run] [--batch-size=100] [--delay=100]
 */

import { createClient } from "@supabase/supabase-js";
import { extractHierarchicalRegionSafe } from "../lib/utils/hierarchical-region-extraction";

// 環境変数の確認
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_MAPS_API_KEY) {
  console.error("❌ 必要な環境変数が設定されていません:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  console.error("- SUPABASE_SERVICE_ROLE_KEY");
  console.error("- GOOGLE_MAPS_API_KEY");
  process.exit(1);
}

// Supabaseクライアント（Service Role Key使用）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 設定
interface BackfillConfig {
  batchSize: number;
  delayMs: number;
  dryRun: boolean;
  maxRetries: number;
}

const defaultConfig: BackfillConfig = {
  batchSize: 50, // 50件ずつ処理（レート制限を考慮）
  delayMs: 110, // 110ms間隔（1秒間に約9リクエスト）
  dryRun: false, // 実際にデータを更新するか
  maxRetries: 3, // 失敗時の最大再試行回数
};

// 統計情報
interface BackfillStats {
  totalPlaces: number;
  processedPlaces: number;
  updatedPlaces: number;
  skippedPlaces: number;
  errorPlaces: number;
  startTime: Date;
  endTime?: Date;
}

// 地点データの型
interface PlaceRecord {
  id: string;
  google_place_id: string;
  name: string;
  address?: string;
  country_code?: string;
  country_name?: string;
  admin_area_level_1?: string;
  region_hierarchy?: any;
}

// Google Places API の AddressComponent 型
interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
  languageCode: string;
}

/**
 * Google Places API から地点詳細を取得
 */
async function fetchPlaceDetails(googlePlaceId: string): Promise<{
  addressComponents?: AddressComponent[];
  error?: string;
}> {
  const fields = "addressComponents";
  const url = `https://places.googleapis.com/v1/places/${googlePlaceId}?languageCode=ja&regionCode=JP`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY!,
        "X-Goog-FieldMask": fields,
      },
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      return {
        error: `API Error: ${response.status} - ${
          errorData.error?.message || "Unknown error"
        }`,
      };
    }

    const data = (await response.json()) as any;
    return { addressComponents: data.addressComponents };
  } catch (error) {
    return {
      error: `Network Error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * 地点データの階層地域情報を更新
 */
async function updatePlaceHierarchicalRegion(
  placeId: string,
  hierarchicalRegion: any,
  config: BackfillConfig
): Promise<boolean> {
  if (config.dryRun) {
    console.log(`  🔍 [DRY RUN] Would update place ${placeId} with:`, {
      countryCode: hierarchicalRegion.countryCode,
      countryName: hierarchicalRegion.countryName,
      adminAreaLevel1: hierarchicalRegion.adminAreaLevel1,
    });
    return true;
  }

  try {
    const { error } = await supabase
      .from("places")
      .update({
        country_code: hierarchicalRegion.countryCode,
        country_name: hierarchicalRegion.countryName,
        admin_area_level_1: hierarchicalRegion.adminAreaLevel1,
        region_hierarchy: hierarchicalRegion.hierarchy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", placeId);

    if (error) {
      console.error(`  ❌ Failed to update place ${placeId}:`, error.message);
      return false;
    }

    // region_hierarchy マスターテーブルも更新
    if (hierarchicalRegion.countryCode && hierarchicalRegion.countryName) {
      await supabase
        .from("region_hierarchy")
        .upsert({
          country_code: hierarchicalRegion.countryCode,
          country_name: hierarchicalRegion.countryName,
          admin_area_level_1: hierarchicalRegion.adminAreaLevel1,
          admin_area_level_1_type: hierarchicalRegion.adminAreaLevel1Type,
          usage_count: 1,
        })
        .select()
        .single();
    }

    return true;
  } catch (error) {
    console.error(`  ❌ Database error for place ${placeId}:`, error);
    return false;
  }
}

/**
 * 単一地点の処理
 */
async function processPlace(
  place: PlaceRecord,
  config: BackfillConfig,
  retryCount = 0
): Promise<{ success: boolean; updated: boolean; skipped: boolean }> {
  // 既に階層地域情報がある場合はスキップ
  if (place.country_code && place.country_name) {
    console.log(
      `  ⏭️  Skipping ${place.name} (${place.id}) - already has hierarchical region data`
    );
    return { success: true, updated: false, skipped: true };
  }

  // Google Place ID がない場合はスキップ
  if (!place.google_place_id) {
    console.log(
      `  ⏭️  Skipping ${place.name} (${place.id}) - no Google Place ID`
    );
    return { success: true, updated: false, skipped: true };
  }

  console.log(`  🔄 Processing: ${place.name} (${place.id})`);

  try {
    // Google Places API から住所コンポーネントを取得
    const { addressComponents, error } = await fetchPlaceDetails(
      place.google_place_id
    );

    if (error) {
      console.error(`  ❌ API Error for ${place.name}:`, error);

      // 再試行
      if (retryCount < config.maxRetries) {
        console.log(
          `  🔄 Retrying (${retryCount + 1}/${config.maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, config.delayMs * 2)); // 遅延を2倍に
        return await processPlace(place, config, retryCount + 1);
      }

      return { success: false, updated: false, skipped: false };
    }

    if (!addressComponents || addressComponents.length === 0) {
      console.log(`  ⚠️  No address components for ${place.name}`);
      return { success: true, updated: false, skipped: true };
    }

    // 階層地域情報を抽出
    const hierarchicalRegion = extractHierarchicalRegionSafe(addressComponents);

    if (!hierarchicalRegion) {
      console.log(
        `  ⚠️  Failed to extract hierarchical region for ${place.name}`
      );
      return { success: true, updated: false, skipped: true };
    }

    // データベースを更新
    const updateSuccess = await updatePlaceHierarchicalRegion(
      place.id,
      hierarchicalRegion,
      config
    );

    if (updateSuccess) {
      console.log(
        `  ✅ Updated ${place.name}: ${hierarchicalRegion.countryName} > ${
          hierarchicalRegion.adminAreaLevel1 || "N/A"
        }`
      );
      return { success: true, updated: true, skipped: false };
    } else {
      return { success: false, updated: false, skipped: false };
    }
  } catch (error) {
    console.error(`  ❌ Unexpected error for ${place.name}:`, error);
    return { success: false, updated: false, skipped: false };
  }
}

/**
 * 進捗表示
 */
function displayProgress(stats: BackfillStats) {
  const elapsed = stats.endTime
    ? stats.endTime.getTime() - stats.startTime.getTime()
    : Date.now() - stats.startTime.getTime();

  const elapsedMinutes = Math.floor(elapsed / 60000);
  const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);

  const progress =
    stats.totalPlaces > 0
      ? ((stats.processedPlaces / stats.totalPlaces) * 100).toFixed(1)
      : "0.0";

  console.log(
    `\n📊 Progress: ${stats.processedPlaces}/${stats.totalPlaces} (${progress}%)`
  );
  console.log(`✅ Updated: ${stats.updatedPlaces}`);
  console.log(`⏭️  Skipped: ${stats.skippedPlaces}`);
  console.log(`❌ Errors: ${stats.errorPlaces}`);
  console.log(`⏱️  Elapsed: ${elapsedMinutes}m ${elapsedSeconds}s`);
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  const config: BackfillConfig = { ...defaultConfig };

  // コマンドライン引数の解析
  for (const arg of args) {
    if (arg === "--dry-run") {
      config.dryRun = true;
    } else if (arg.startsWith("--batch-size=")) {
      config.batchSize = parseInt(arg.split("=")[1]) || defaultConfig.batchSize;
    } else if (arg.startsWith("--delay=")) {
      config.delayMs = parseInt(arg.split("=")[1]) || defaultConfig.delayMs;
    }
  }

  console.log("🚀 階層地域情報補完スクリプトを開始します");
  console.log(`📋 設定:`);
  console.log(`   - Batch Size: ${config.batchSize}`);
  console.log(`   - Delay: ${config.delayMs}ms`);
  console.log(`   - Dry Run: ${config.dryRun ? "Yes" : "No"}`);
  console.log(`   - Max Retries: ${config.maxRetries}`);

  const stats: BackfillStats = {
    totalPlaces: 0,
    processedPlaces: 0,
    updatedPlaces: 0,
    skippedPlaces: 0,
    errorPlaces: 0,
    startTime: new Date(),
  };

  try {
    // 補完が必要な地点データを取得
    console.log("\n📊 補完が必要な地点データを取得中...");

    const { data: places, error } = await supabase
      .from("places")
      .select(
        "id, google_place_id, name, address, country_code, country_name, admin_area_level_1, region_hierarchy"
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Failed to fetch places:", error.message);
      process.exit(1);
    }

    if (!places || places.length === 0) {
      console.log("✅ 補完が必要な地点データが見つかりませんでした。");
      process.exit(0);
    }

    stats.totalPlaces = places.length;
    console.log(`📍 取得した地点数: ${stats.totalPlaces}`);

    // バッチ処理
    for (let i = 0; i < places.length; i += config.batchSize) {
      const batch = places.slice(i, i + config.batchSize);
      console.log(
        `\n🔄 Batch ${Math.floor(i / config.batchSize) + 1}/${Math.ceil(
          places.length / config.batchSize
        )} (${batch.length} places)`
      );

      for (const place of batch) {
        const result = await processPlace(place, config);

        stats.processedPlaces++;
        if (result.updated) stats.updatedPlaces++;
        if (result.skipped) stats.skippedPlaces++;
        if (!result.success) stats.errorPlaces++;

        // レート制限対応
        if (i + 1 < places.length) {
          await new Promise((resolve) => setTimeout(resolve, config.delayMs));
        }
      }

      // バッチ間の進捗表示
      displayProgress(stats);
    }

    stats.endTime = new Date();

    console.log("\n🎉 階層地域情報補完スクリプトが完了しました！");
    displayProgress(stats);

    // 最終的な統計情報
    console.log("\n📈 最終結果:");
    if (config.dryRun) {
      console.log(
        "🔍 DRY RUN モードで実行されました。実際のデータは更新されていません。"
      );
    } else {
      console.log("💾 データベースが更新されました。");
    }
  } catch (error) {
    console.error("❌ 予期せぬエラーが発生しました:", error);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error);
}
