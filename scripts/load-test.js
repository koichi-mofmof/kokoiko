#!/usr/bin/env node

/**
 * CPU負荷問題特定用の負荷テストスクリプト
 * CloudFlare Workers CPU時間制限エラーの原因を特定
 */

const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");

// 負荷テスト設定
const LOAD_TEST_CONFIG = {
  // テスト対象URL（環境変数から取得）
  BASE_URL: process.env.LOAD_TEST_URL || "http://localhost:3000",

  // ユーザーエージェント（CloudFlareが認識する負荷テスト用）
  USER_AGENT: "Artillery.io CPU-Load-Test/1.0",

  // テストパターン
  CONCURRENT_USERS: [1, 10, 30], // 段階的な負荷
  DURATION_PER_STAGE: 30, // 各段階の実行時間（秒）

  // CPU集約的なページの定義
  HEAVY_ENDPOINTS: [
    "/",
    "/lists/05170806-cc08-4ed8-9c54-4f1f38f8e9f1",
    "/lists/05170806-cc08-4ed8-9c54-4f1f38f8e9f1/place/ChIJ5Z11EmYhAWARHSrWHq4ip-k",
    "/sample/sample-sunny-day",
  ],

  // レスポンス時間しきい値
  THRESHOLDS: {
    ACCEPTABLE: 2000, // 2秒以内
    WARNING: 5000, // 5秒以内
    CRITICAL: 10000, // 10秒以内
    TIMEOUT: 30000, // 30秒でタイムアウト
  },
};

// 結果格納用
const testResults = {
  timestamp: new Date().toISOString(),
  environment: {
    nodeVersion: process.version,
    baseUrl: LOAD_TEST_CONFIG.BASE_URL,
    userAgent: LOAD_TEST_CONFIG.USER_AGENT,
  },
  stages: [],
  summary: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    timeoutRequests: 0,
    cpuTimeoutErrors: 0,
    averageResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Infinity,
  },
};

// HTTP リクエストの実行
async function makeRequest(url, timeout = LOAD_TEST_CONFIG.THRESHOLDS.TIMEOUT) {
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      headers: {
        "User-Agent": LOAD_TEST_CONFIG.USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    // レスポンスボディを読み込み（実際のCPU負荷をシミュレート）
    const responseText = await response.text();

    return {
      success: true,
      status: response.status,
      responseTime,
      responseSize: responseText.length,
      headers: Object.fromEntries(response.headers.entries()),
      isCpuTimeout:
        responseText.includes("Worker exceeded CPU time limit") ||
        response.headers.get("cf-ray") === null, // CloudFlareエラーの可能性
      isLoadTestMode: response.headers.get("X-Load-Test-Mode") === "true",
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    return {
      success: false,
      responseTime,
      error: error.name,
      message: error.message,
      isTimeout: error.name === "AbortError",
      isCpuTimeout: error.message.includes("CPU time limit"),
    };
  }
}

// 同時並行リクエストの実行
async function runConcurrentRequests(endpoint, concurrentUsers, duration) {
  console.log(
    `\n🚀 テスト開始: ${endpoint} | 同時ユーザー数: ${concurrentUsers} | 時間: ${duration}秒`
  );

  const requests = [];
  const startTime = Date.now();
  const endTime = startTime + duration * 1000;

  // 指定した同時ユーザー数でリクエストを並行実行
  for (let i = 0; i < concurrentUsers; i++) {
    requests.push(runUserSession(endpoint, endTime, i + 1));
  }

  const results = await Promise.all(requests);

  // 結果を統合
  const stageResult = {
    endpoint,
    concurrentUsers,
    duration,
    results: results.flat(),
    stats: calculateStats(results.flat()),
  };

  displayStageResults(stageResult);
  return stageResult;
}

// 単一ユーザーセッションの実行
async function runUserSession(endpoint, endTime, userId) {
  const sessionResults = [];
  let requestCount = 0;

  while (Date.now() < endTime) {
    requestCount++;
    const url = `${LOAD_TEST_CONFIG.BASE_URL}${endpoint}`;

    console.log(`👤 User${userId}-Req${requestCount}: ${endpoint}...`);

    const result = await makeRequest(url);
    result.userId = userId;
    result.requestId = requestCount;
    result.timestamp = new Date().toISOString();

    sessionResults.push(result);

    // 統計情報を更新
    updateGlobalStats(result);

    // CPU タイムアウトエラーの場合は即座に報告
    if (
      result.isCpuTimeout ||
      (result.error && result.message.includes("CPU"))
    ) {
      console.log(`🔴 CPU時間制限エラー検出: User${userId}-Req${requestCount}`);
      testResults.summary.cpuTimeoutErrors++;
    }

    // 短いインターバル（実際のユーザー行動をシミュレート）
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 2000 + 1000)
    );
  }

  return sessionResults;
}

// 統計情報の計算
function calculateStats(results) {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const timeouts = results.filter((r) => r.isTimeout);
  const cpuTimeouts = results.filter((r) => r.isCpuTimeout);

  const responseTimes = successful.map((r) => r.responseTime);

  return {
    totalRequests: results.length,
    successfulRequests: successful.length,
    failedRequests: failed.length,
    timeoutRequests: timeouts.length,
    cpuTimeoutRequests: cpuTimeouts.length,
    successRate: ((successful.length / results.length) * 100).toFixed(2),
    averageResponseTime:
      responseTimes.length > 0
        ? (
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          ).toFixed(2)
        : 0,
    minResponseTime:
      responseTimes.length > 0 ? Math.min(...responseTimes).toFixed(2) : 0,
    maxResponseTime:
      responseTimes.length > 0 ? Math.max(...responseTimes).toFixed(2) : 0,
    p95ResponseTime:
      responseTimes.length > 0 ? percentile(responseTimes, 95).toFixed(2) : 0,
    p99ResponseTime:
      responseTimes.length > 0 ? percentile(responseTimes, 99).toFixed(2) : 0,
  };
}

// パーセンタイル計算
function percentile(arr, p) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.ceil((sorted.length * p) / 100) - 1;
  return sorted[index];
}

// グローバル統計の更新
function updateGlobalStats(result) {
  testResults.summary.totalRequests++;

  if (result.success) {
    testResults.summary.successfulRequests++;
    testResults.summary.averageResponseTime =
      (testResults.summary.averageResponseTime *
        (testResults.summary.successfulRequests - 1) +
        result.responseTime) /
      testResults.summary.successfulRequests;
    testResults.summary.maxResponseTime = Math.max(
      testResults.summary.maxResponseTime,
      result.responseTime
    );
    testResults.summary.minResponseTime = Math.min(
      testResults.summary.minResponseTime,
      result.responseTime
    );
  } else {
    testResults.summary.failedRequests++;
    if (result.isTimeout) {
      testResults.summary.timeoutRequests++;
    }
  }
}

// ステージ結果の表示
function displayStageResults(stageResult) {
  const stats = stageResult.stats;

  console.log(
    `\n📊 ${stageResult.endpoint} | 同時ユーザー数: ${stageResult.concurrentUsers}`
  );
  console.log(
    `   成功率: ${stats.successRate}% (${stats.successfulRequests}/${stats.totalRequests})`
  );
  console.log(`   平均レスポンス時間: ${stats.averageResponseTime}ms`);
  console.log(
    `   レスポンス時間範囲: ${stats.minResponseTime}ms - ${stats.maxResponseTime}ms`
  );
  console.log(`   P95レスポンス時間: ${stats.p95ResponseTime}ms`);
  console.log(`   P99レスポンス時間: ${stats.p99ResponseTime}ms`);

  if (stats.cpuTimeoutRequests > 0) {
    console.log(`   🔴 CPU時間制限エラー: ${stats.cpuTimeoutRequests}回`);
  }

  if (stats.timeoutRequests > 0) {
    console.log(`   ⚠️  タイムアウト: ${stats.timeoutRequests}回`);
  }

  // パフォーマンス評価
  const avgTime = parseFloat(stats.averageResponseTime);
  let performance = "🟢 優秀";
  if (avgTime > LOAD_TEST_CONFIG.THRESHOLDS.CRITICAL) {
    performance = "🔴 危険";
  } else if (avgTime > LOAD_TEST_CONFIG.THRESHOLDS.WARNING) {
    performance = "🟡 要改善";
  } else if (avgTime > LOAD_TEST_CONFIG.THRESHOLDS.ACCEPTABLE) {
    performance = "🟠 注意";
  }

  console.log(`   パフォーマンス評価: ${performance}`);
}

// レポート生成
function generateReport() {
  const reportPath = path.join(process.cwd(), "load-test-report.json");
  const htmlReportPath = path.join(process.cwd(), "load-test-report.html");

  // JSON レポート
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));

  // HTML レポート
  const htmlReport = generateHtmlReport();
  fs.writeFileSync(htmlReportPath, htmlReport);

  console.log(`\n📄 レポートが生成されました:`);
  console.log(`   JSON: ${reportPath}`);
  console.log(`   HTML: ${htmlReportPath}`);
}

// HTML レポート生成
function generateHtmlReport() {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ClippyMap 負荷テストレポート</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stage { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .error { color: #d32f2f; font-weight: bold; }
        .warning { color: #f57c00; font-weight: bold; }
        .success { color: #388e3c; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>🚀 ClippyMap 負荷テストレポート</h1>
    
    <div class="summary">
        <h2>📊 全体サマリー</h2>
        <p><strong>実行日時:</strong> ${testResults.timestamp}</p>
        <p><strong>ベースURL:</strong> ${testResults.environment.baseUrl}</p>
        <p><strong>総リクエスト数:</strong> ${
          testResults.summary.totalRequests
        }</p>
        <p><strong>成功リクエスト:</strong> <span class="success">${
          testResults.summary.successfulRequests
        }</span></p>
        <p><strong>失敗リクエスト:</strong> <span class="error">${
          testResults.summary.failedRequests
        }</span></p>
        <p><strong>CPU時間制限エラー:</strong> <span class="error">${
          testResults.summary.cpuTimeoutErrors
        }</span></p>
        <p><strong>平均レスポンス時間:</strong> ${testResults.summary.averageResponseTime.toFixed(
          2
        )}ms</p>
    </div>
    
    <h2>📈 ステージ別結果</h2>
    ${testResults.stages
      .map(
        (stage) => `
        <div class="stage">
            <h3>${stage.endpoint} (同時ユーザー数: ${
          stage.concurrentUsers
        })</h3>
            <table>
                <tr><th>指標</th><th>値</th></tr>
                <tr><td>成功率</td><td class="${
                  stage.stats.successRate < 95 ? "error" : "success"
                }">${stage.stats.successRate}%</td></tr>
                <tr><td>平均レスポンス時間</td><td>${
                  stage.stats.averageResponseTime
                }ms</td></tr>
                <tr><td>P95レスポンス時間</td><td>${
                  stage.stats.p95ResponseTime
                }ms</td></tr>
                <tr><td>P99レスポンス時間</td><td>${
                  stage.stats.p99ResponseTime
                }ms</td></tr>
                <tr><td>CPU時間制限エラー</td><td class="${
                  stage.stats.cpuTimeoutRequests > 0 ? "error" : "success"
                }">${stage.stats.cpuTimeoutRequests}</td></tr>
            </table>
        </div>
    `
      )
      .join("")}
    
    <h2>💡 推奨改善事項</h2>
    <div class="summary">
        ${
          testResults.summary.cpuTimeoutErrors > 0
            ? '<p class="error">🔴 <strong>緊急:</strong> CPU時間制限エラーが発生しています。CPU制限の引き上げまたはコード最適化が必要です。</p>'
            : ""
        }
        ${
          testResults.summary.averageResponseTime > 5000
            ? '<p class="warning">🟡 平均レスポンス時間が5秒を超えています。パフォーマンス最適化を検討してください。</p>'
            : ""
        }
        ${
          testResults.summary.failedRequests /
            testResults.summary.totalRequests >
          0.05
            ? '<p class="error">🔴 失敗率が5%を超えています。システムの安定性を確認してください。</p>'
            : ""
        }
    </div>
    
    <script>
        console.log('負荷テスト結果:', ${JSON.stringify(testResults)});
    </script>
</body>
</html>
  `;
}

// メイン実行関数
async function runLoadTest() {
  console.log("🚀 CPU負荷問題特定用負荷テストを開始します...\n");

  try {
    // 環境チェック
    console.log("🔍 環境確認:");
    console.log(`   ベースURL: ${LOAD_TEST_CONFIG.BASE_URL}`);
    console.log(`   ユーザーエージェント: ${LOAD_TEST_CONFIG.USER_AGENT}`);
    console.log(
      `   テスト対象エンドポイント: ${LOAD_TEST_CONFIG.HEAVY_ENDPOINTS.length}個\n`
    );

    // 各エンドポイントで段階的負荷テスト
    for (const endpoint of LOAD_TEST_CONFIG.HEAVY_ENDPOINTS) {
      console.log(`\n🎯 エンドポイント: ${endpoint}`);

      for (const concurrentUsers of LOAD_TEST_CONFIG.CONCURRENT_USERS) {
        const stageResult = await runConcurrentRequests(
          endpoint,
          concurrentUsers,
          LOAD_TEST_CONFIG.DURATION_PER_STAGE
        );

        testResults.stages.push(stageResult);

        // CPU時間制限エラーが多発する場合は早期終了
        if (stageResult.stats.cpuTimeoutRequests > concurrentUsers * 0.5) {
          console.log(
            `\n⚠️  ${endpoint}でCPU時間制限エラーが多発しています。次の同時ユーザー数テストをスキップします。`
          );
          break;
        }

        // 短いインターバル
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    // 最終レポート生成
    console.log("\n" + "=".repeat(60));
    console.log("📊 最終結果サマリー");
    console.log("=".repeat(60));
    console.log(
      `総実行時間: ${(Date.now() - Date.parse(testResults.timestamp)) / 1000}秒`
    );
    console.log(`総リクエスト数: ${testResults.summary.totalRequests}`);
    console.log(
      `成功率: ${(
        (testResults.summary.successfulRequests /
          testResults.summary.totalRequests) *
        100
      ).toFixed(2)}%`
    );
    console.log(
      `平均レスポンス時間: ${testResults.summary.averageResponseTime.toFixed(
        2
      )}ms`
    );
    console.log(`CPU時間制限エラー: ${testResults.summary.cpuTimeoutErrors}回`);

    if (testResults.summary.cpuTimeoutErrors > 0) {
      console.log("\n🔴 重要: CPU時間制限エラーが検出されました！");
      console.log("対策:");
      console.log("  1. wrangler.toml でCPU制限を引き上げ: cpu_ms = 300000");
      console.log("  2. lib/cloudflare/performance-optimization.ts の設定確認");
      console.log("  3. 重いデータベースクエリの最適化");
      console.log("  4. フォールバック機能の活用");
    }

    generateReport();

    console.log("\n✅ 負荷テストが完了しました！");
  } catch (error) {
    console.error("\n❌ 負荷テスト中にエラーが発生しました:", error);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  runLoadTest();
}

module.exports = {
  runLoadTest,
  makeRequest,
  LOAD_TEST_CONFIG,
};
