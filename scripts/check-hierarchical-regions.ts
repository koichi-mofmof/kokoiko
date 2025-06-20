#!/usr/bin/env tsx

/**
 * 階層地域情報のデータ整合性チェックスクリプト
 *
 * 使用方法:
 * npm run check-regions
 */

import { createClient } from "@supabase/supabase-js";

// 環境変数の確認
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ 必要な環境変数が設定されていません:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Supabaseクライアント（Service Role Key使用）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// チェック結果の型
interface CheckResult {
  category: string;
  status: "pass" | "warning" | "error";
  message: string;
  count?: number;
  details?: string[];
}

/**
 * 基本統計情報を取得
 */
async function getBasicStats(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  try {
    // 全地点数
    const { count: totalPlaces, error: totalError } = await supabase
      .from("places")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      results.push({
        category: "基本統計",
        status: "error",
        message: `地点数の取得に失敗: ${totalError.message}`,
      });
    } else {
      results.push({
        category: "基本統計",
        status: "pass",
        message: "総地点数",
        count: totalPlaces || 0,
      });
    }

    // 階層地域情報がある地点数
    const { count: withHierarchy, error: hierarchyError } = await supabase
      .from("places")
      .select("*", { count: "exact", head: true })
      .not("country_code", "is", null)
      .not("country_name", "is", null);

    if (hierarchyError) {
      results.push({
        category: "基本統計",
        status: "error",
        message: `階層地域情報ありの地点数取得に失敗: ${hierarchyError.message}`,
      });
    } else {
      const percentage = totalPlaces
        ? (((withHierarchy || 0) / totalPlaces) * 100).toFixed(1)
        : "0.0";
      results.push({
        category: "基本統計",
        status: "pass",
        message: `階層地域情報あり (${percentage}%)`,
        count: withHierarchy || 0,
      });
    }

    // 階層地域情報がない地点数
    const missingCount = (totalPlaces || 0) - (withHierarchy || 0);
    if (missingCount > 0) {
      results.push({
        category: "基本統計",
        status: "warning",
        message: "階層地域情報なし",
        count: missingCount,
      });
    }
  } catch (error) {
    results.push({
      category: "基本統計",
      status: "error",
      message: `統計情報取得中にエラー: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    });
  }

  return results;
}

/**
 * 階層地域情報の妥当性をチェック
 */
async function checkHierarchicalRegionValidity(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  try {
    // country_codeがあるがcountry_nameがない地点
    const { data: missingCountryName, error: error1 } = await supabase
      .from("places")
      .select("id, name, country_code")
      .not("country_code", "is", null)
      .is("country_name", null);

    if (error1) {
      results.push({
        category: "データ妥当性",
        status: "error",
        message: `country_nameチェックに失敗: ${error1.message}`,
      });
    } else if (missingCountryName && missingCountryName.length > 0) {
      results.push({
        category: "データ妥当性",
        status: "error",
        message: "country_codeはあるがcountry_nameがない地点",
        count: missingCountryName.length,
        details: missingCountryName
          .slice(0, 5)
          .map((p) => `${p.name} (${p.id})`),
      });
    }

    // country_nameがあるがcountry_codeがない地点
    const { data: missingCountryCode, error: error2 } = await supabase
      .from("places")
      .select("id, name, country_name")
      .not("country_name", "is", null)
      .is("country_code", null);

    if (error2) {
      results.push({
        category: "データ妥当性",
        status: "error",
        message: `country_codeチェックに失敗: ${error2.message}`,
      });
    } else if (missingCountryCode && missingCountryCode.length > 0) {
      results.push({
        category: "データ妥当性",
        status: "error",
        message: "country_nameはあるがcountry_codeがない地点",
        count: missingCountryCode.length,
        details: missingCountryCode
          .slice(0, 5)
          .map((p) => `${p.name} (${p.id})`),
      });
    }

    // 無効なcountry_codeフォーマット（ISO 3166-1 alpha-2でない）
    const { data: invalidCountryCode, error: error3 } = await supabase
      .from("places")
      .select("id, name, country_code")
      .not("country_code", "is", null)
      .not("country_code", "like", "__"); // 2文字でない

    if (error3) {
      results.push({
        category: "データ妥当性",
        status: "error",
        message: `country_codeフォーマットチェックに失敗: ${error3.message}`,
      });
    } else if (invalidCountryCode && invalidCountryCode.length > 0) {
      results.push({
        category: "データ妥当性",
        status: "error",
        message: "無効なcountry_codeフォーマット",
        count: invalidCountryCode.length,
        details: invalidCountryCode
          .slice(0, 5)
          .map((p) => `${p.name}: ${p.country_code} (${p.id})`),
      });
    }
  } catch (error) {
    results.push({
      category: "データ妥当性",
      status: "error",
      message: `妥当性チェック中にエラー: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    });
  }

  return results;
}

/**
 * region_hierarchyマスターテーブルをチェック
 */
async function checkRegionHierarchyTable(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  try {
    // region_hierarchyテーブルの総レコード数
    const { count: totalRegions, error: totalError } = await supabase
      .from("region_hierarchy")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      results.push({
        category: "マスターテーブル",
        status: "error",
        message: `region_hierarchyテーブルアクセスに失敗: ${totalError.message}`,
      });
    } else {
      results.push({
        category: "マスターテーブル",
        status: "pass",
        message: "region_hierarchy総レコード数",
        count: totalRegions || 0,
      });
    }

    // 使用頻度が0のレコード
    const { count: unusedRegions, error: unusedError } = await supabase
      .from("region_hierarchy")
      .select("*", { count: "exact", head: true })
      .eq("usage_count", 0);

    if (unusedError) {
      results.push({
        category: "マスターテーブル",
        status: "error",
        message: `使用頻度チェックに失敗: ${unusedError.message}`,
      });
    } else if (unusedRegions && unusedRegions > 0) {
      results.push({
        category: "マスターテーブル",
        status: "warning",
        message: "使用頻度が0のレコード",
        count: unusedRegions,
      });
    }

    // 重複レコードのチェック（簡略化）
    const { data: allRegions, error: duplicateError } = await supabase
      .from("region_hierarchy")
      .select("country_code, admin_area_level_1")
      .not("admin_area_level_1", "is", null);

    if (duplicateError) {
      results.push({
        category: "マスターテーブル",
        status: "error",
        message: `重複チェックに失敗: ${duplicateError.message}`,
      });
    } else if (allRegions && allRegions.length > 0) {
      // JavaScript側で重複チェック
      const seen = new Set<string>();
      const duplicates: string[] = [];

      for (const region of allRegions) {
        const key = `${region.country_code}-${region.admin_area_level_1}`;
        if (seen.has(key)) {
          duplicates.push(key);
        } else {
          seen.add(key);
        }
      }

      if (duplicates.length > 0) {
        results.push({
          category: "マスターテーブル",
          status: "error",
          message: "重複レコードが検出されました",
          count: duplicates.length,
          details: duplicates.slice(0, 5),
        });
      }
    }
  } catch (error) {
    results.push({
      category: "マスターテーブル",
      status: "error",
      message: `マスターテーブルチェック中にエラー: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    });
  }

  return results;
}

/**
 * 国別統計を取得
 */
async function getCountryStats(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  try {
    // 国別の地点数を集計（Supabaseでは直接GROUP BYを使えないため、別の方法を使用）
    const { data: allPlaces, error } = await supabase
      .from("places")
      .select("country_code, country_name")
      .not("country_code", "is", null)
      .not("country_name", "is", null);

    if (error) {
      results.push({
        category: "国別統計",
        status: "error",
        message: `国別統計取得に失敗: ${error.message}`,
      });
    } else if (allPlaces && allPlaces.length > 0) {
      // JavaScript側で集計
      const countryMap = new Map<string, { name: string; count: number }>();

      for (const place of allPlaces) {
        const key = place.country_code;
        const existing = countryMap.get(key);
        countryMap.set(key, {
          name: place.country_name,
          count: (existing?.count || 0) + 1,
        });
      }

      const countryStats = Array.from(countryMap.entries())
        .map(([code, info]) => ({
          country_code: code,
          country_name: info.name,
          count: info.count,
        }))
        .sort((a, b) => b.count - a.count);

      const topCountries = countryStats.slice(0, 10);
      results.push({
        category: "国別統計",
        status: "pass",
        message: `登録国数: ${countryStats.length}`,
        details: topCountries.map(
          (stat) =>
            `${stat.country_name} (${stat.country_code}): ${stat.count}件`
        ),
      });
    }
  } catch (error) {
    results.push({
      category: "国別統計",
      status: "error",
      message: `国別統計取得中にエラー: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    });
  }

  return results;
}

/**
 * 結果を表示
 */
function displayResults(results: CheckResult[]) {
  console.log("\n📊 階層地域情報データ整合性チェック結果\n");

  const categories = [...new Set(results.map((r) => r.category))];

  for (const category of categories) {
    console.log(`\n🔍 ${category}`);
    console.log("─".repeat(50));

    const categoryResults = results.filter((r) => r.category === category);

    for (const result of categoryResults) {
      const icon =
        result.status === "pass"
          ? "✅"
          : result.status === "warning"
          ? "⚠️"
          : "❌";
      const countText = result.count !== undefined ? ` (${result.count})` : "";
      console.log(`${icon} ${result.message}${countText}`);

      if (result.details && result.details.length > 0) {
        result.details.forEach((detail) => {
          console.log(`   └─ ${detail}`);
        });
        if (result.count && result.count > result.details.length) {
          console.log(
            `   └─ ... and ${result.count - result.details.length} more`
          );
        }
      }
    }
  }

  // サマリー
  const totalChecks = results.length;
  const passCount = results.filter((r) => r.status === "pass").length;
  const warningCount = results.filter((r) => r.status === "warning").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  console.log("\n📈 サマリー");
  console.log("─".repeat(50));
  console.log(`✅ 正常: ${passCount}/${totalChecks}`);
  console.log(`⚠️  警告: ${warningCount}/${totalChecks}`);
  console.log(`❌ エラー: ${errorCount}/${totalChecks}`);

  if (errorCount > 0) {
    console.log("\n⚠️  エラーが検出されました。データの修正が必要です。");
    process.exit(1);
  } else if (warningCount > 0) {
    console.log("\n⚠️  警告があります。確認をお勧めします。");
  } else {
    console.log("\n✅ すべてのチェックが正常に完了しました！");
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log("🚀 階層地域情報データ整合性チェックを開始します");

  const allResults: CheckResult[] = [];

  // 各チェックを実行
  console.log("\n📊 基本統計情報を取得中...");
  const basicStats = await getBasicStats();
  allResults.push(...basicStats);

  console.log("🔍 階層地域情報の妥当性をチェック中...");
  const validityChecks = await checkHierarchicalRegionValidity();
  allResults.push(...validityChecks);

  console.log("📋 region_hierarchyマスターテーブルをチェック中...");
  const masterTableChecks = await checkRegionHierarchyTable();
  allResults.push(...masterTableChecks);

  console.log("🌍 国別統計を取得中...");
  const countryStats = await getCountryStats();
  allResults.push(...countryStats);

  // 結果を表示
  displayResults(allResults);
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error);
}
