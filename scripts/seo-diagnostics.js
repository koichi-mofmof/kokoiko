#!/usr/bin/env node

/**
 * ClippyMap SEO診断スクリプト
 * インデックス問題の早期発見とサイトマップ検証
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const SITE_URL = "https://clippymap.com";
const CRITICAL_PAGES = [
  "/",
  "/help",
  "/privacy",
  "/terms",
  "/sample",
  "/sample/sample-sunny-day",
  "/sample/sample-osaka-trip",
  "/sample/sample-favorite-saunas",
  "/lists/05170806-cc08-4ed8-9c54-4f1f38f8e9f1",
];

/**
 * HTTPリクエストを送信する関数
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

/**
 * サイトマップの検証
 */
async function validateSitemap() {
  console.log("🗺️  サイトマップ検証開始...");

  try {
    const response = await makeRequest(`${SITE_URL}/sitemap.xml`);

    if (response.statusCode === 200) {
      console.log("✅ サイトマップが正常にアクセス可能");

      // XMLの基本構造をチェック
      if (
        response.body.includes("<urlset") &&
        response.body.includes("</urlset>")
      ) {
        console.log("✅ サイトマップのXML構造が正常");

        // URLエントリ数をカウント
        const urlMatches = response.body.match(/<url>/g);
        const urlCount = urlMatches ? urlMatches.length : 0;
        console.log(`📊 サイトマップ内のURL数: ${urlCount}`);

        if (urlCount < 5) {
          console.warn("⚠️  サイトマップのURL数が少ない可能性があります");
        }
      } else {
        console.error("❌ サイトマップのXML構造に問題があります");
      }
    } else {
      console.error(
        `❌ サイトマップにアクセスできません (${response.statusCode})`
      );
    }
  } catch (error) {
    console.error("❌ サイトマップ検証エラー:", error.message);
  }
}

/**
 * robots.txtの検証
 */
async function validateRobotsTxt() {
  console.log("🤖 robots.txt検証開始...");

  try {
    const response = await makeRequest(`${SITE_URL}/robots.txt`);

    if (response.statusCode === 200) {
      console.log("✅ robots.txtが正常にアクセス可能");

      // サイトマップの参照をチェック
      if (response.body.includes("Sitemap:")) {
        console.log("✅ robots.txtにサイトマップの記載があります");
      } else {
        console.warn("⚠️  robots.txtにサイトマップの記載がありません");
      }

      // 重要なディレクトリのdisallow設定をチェック
      if (response.body.includes("Disallow: /api/")) {
        console.log("✅ APIディレクトリが適切に除外されています");
      }
    } else {
      console.error(
        `❌ robots.txtにアクセスできません (${response.statusCode})`
      );
    }
  } catch (error) {
    console.error("❌ robots.txt検証エラー:", error.message);
  }
}

/**
 * 重要ページのアクセシビリティ検証
 */
async function validateCriticalPages() {
  console.log("📄 重要ページの検証開始...");

  const results = [];

  for (const page of CRITICAL_PAGES) {
    try {
      const response = await makeRequest(`${SITE_URL}${page}`);

      const result = {
        url: page,
        statusCode: response.statusCode,
        hasTitle: response.body.includes("<title>"),
        hasCanonical: response.body.includes('rel="canonical"'),
        hasMetaDescription: response.body.includes('name="description"'),
        hasRobotsTag:
          response.headers["x-robots-tag"] ||
          response.body.includes('name="robots"'),
        redirected: response.statusCode >= 300 && response.statusCode < 400,
      };

      results.push(result);

      if (result.statusCode === 200) {
        console.log(`✅ ${page} - 正常`);
      } else {
        console.warn(`⚠️  ${page} - ステータス: ${result.statusCode}`);
      }

      if (!result.hasCanonical) {
        console.warn(`⚠️  ${page} - canonicalタグが見つかりません`);
      }

      if (!result.hasMetaDescription) {
        console.warn(`⚠️  ${page} - meta descriptionが見つかりません`);
      }
    } catch (error) {
      console.error(`❌ ${page} - エラー:`, error.message);
    }

    // レート制限対策
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * 診断レポートの生成
 */
function generateReport(pageResults) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    summary: {
      totalPages: pageResults.length,
      accessiblePages: pageResults.filter((p) => p.statusCode === 200).length,
      pagesWithCanonical: pageResults.filter((p) => p.hasCanonical).length,
      pagesWithMetaDescription: pageResults.filter((p) => p.hasMetaDescription)
        .length,
    },
    pages: pageResults,
    recommendations: [],
  };

  // 推奨事項の生成
  if (report.summary.accessiblePages < report.summary.totalPages) {
    report.recommendations.push(
      "一部のページにアクセスできません。404エラーやリダイレクトを確認してください。"
    );
  }

  if (report.summary.pagesWithCanonical < report.summary.totalPages) {
    report.recommendations.push(
      "canonicalタグが不足しているページがあります。重複コンテンツ問題の原因となる可能性があります。"
    );
  }

  if (report.summary.pagesWithMetaDescription < report.summary.totalPages) {
    report.recommendations.push(
      "meta descriptionが不足しているページがあります。検索結果での表示品質に影響します。"
    );
  }

  // レポートファイルの保存
  const reportPath = path.join(__dirname, "../seo-diagnostic-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 診断レポートを保存しました: ${reportPath}`);

  return report;
}

/**
 * メイン実行関数
 */
async function runDiagnostics() {
  console.log("🔍 ClippyMap SEO診断を開始します...\n");

  await validateSitemap();
  console.log("");

  await validateRobotsTxt();
  console.log("");

  const pageResults = await validateCriticalPages();
  console.log("");

  const report = generateReport(pageResults);

  console.log("📈 診断結果サマリー:");
  console.log(
    `   アクセス可能ページ: ${report.summary.accessiblePages}/${report.summary.totalPages}`
  );
  console.log(
    `   canonicalタグあり: ${report.summary.pagesWithCanonical}/${report.summary.totalPages}`
  );
  console.log(
    `   meta descriptionあり: ${report.summary.pagesWithMetaDescription}/${report.summary.totalPages}`
  );

  if (report.recommendations.length > 0) {
    console.log("\n🔧 推奨事項:");
    report.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  console.log("\n✅ SEO診断完了");
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = { runDiagnostics };
