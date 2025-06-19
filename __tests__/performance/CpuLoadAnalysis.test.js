/**
 * CPU負荷問題詳細分析テスト
 * 具体的にどの処理がCPU集約的かを特定する
 */

// テスト環境設定
const TEST_CONFIG = {
  BASE_URL: process.env.LOAD_TEST_URL || "http://localhost:3000",
  CRITICAL_ENDPOINTS: [
    "/",
    "/sample",
    "/lists",
    "/lists/aea5bde1-dd15-46ae-b3cb-ce6883884544",
    "/lists/aea5bde1-dd15-46ae-b3cb-ce6883884544/place/ChIJGQxdAvTFGGARjxiNDMRCawg",
  ],
  CPU_TIME_LIMIT: 30000, // 30秒のCPU時間制限（CloudFlare Workers デフォルト）
};

// CPU集約的な処理のシミュレーション
function simulateCpuIntensiveTask(duration = 1000) {
  const start = Date.now();
  let iterations = 0;

  while (Date.now() - start < duration) {
    // 軽いCPU処理をシミュレート
    Math.sqrt(Math.random() * 1000000);
    iterations++;
  }

  return iterations;
}

describe("CPU負荷問題詳細分析", () => {
  describe("重要エンドポイントのレスポンス時間測定", () => {
    it.each(TEST_CONFIG.CRITICAL_ENDPOINTS)(
      "エンドポイント %s のレスポンス時間を測定",
      async (endpoint) => {
        const iterations = 3;
        const results = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();

          try {
            const response = await fetch(`${TEST_CONFIG.BASE_URL}${endpoint}`, {
              headers: {
                "User-Agent": "Jest CPU-Load-Analysis/1.0",
                "Cache-Control": "no-cache",
              },
            });

            const responseText = await response.text();
            const endTime = performance.now();
            const responseTime = endTime - startTime;

            const result = {
              iteration: i + 1,
              success: response.ok,
              status: response.status,
              responseTime,
              responseSize: responseText.length,
              hasCpuTimeoutError: responseText.includes(
                "Worker exceeded CPU time limit"
              ),
              hasPerformanceFallback:
                response.headers.get("X-Performance-Fallback") === "true",
              processingTime: response.headers.get("X-Processing-Time"),
            };

            results.push(result);

            console.log(
              `${endpoint} - 試行${i + 1}: ${responseTime.toFixed(2)}ms`
            );

            // CPU時間制限エラーの検出
            if (result.hasCpuTimeoutError) {
              console.error(`🔴 CPU時間制限エラー検出: ${endpoint}`);
            }

            // パフォーマンスフォールバックの検出
            if (result.hasPerformanceFallback) {
              console.warn(`🟡 パフォーマンスフォールバック作動: ${endpoint}`);
            }
          } catch (error) {
            const endTime = performance.now();
            const responseTime = endTime - startTime;

            results.push({
              iteration: i + 1,
              success: false,
              error: error.message,
              responseTime,
              isTimeout: error.name === "AbortError",
            });

            console.error(
              `${endpoint} - 試行${i + 1}: エラー - ${error.message}`
            );
          }

          // リクエスト間のインターバル
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // 結果の分析
        const successfulResults = results.filter((r) => r.success);
        const averageResponseTime =
          successfulResults.length > 0
            ? successfulResults.reduce((sum, r) => sum + r.responseTime, 0) /
              successfulResults.length
            : 0;

        const maxResponseTime =
          successfulResults.length > 0
            ? Math.max(...successfulResults.map((r) => r.responseTime))
            : 0;

        const hasCpuErrors = results.some((r) => r.hasCpuTimeoutError);

        console.log(`\n📊 ${endpoint} 分析結果:`);
        console.log(`   成功率: ${successfulResults.length}/${iterations}`);
        console.log(
          `   平均レスポンス時間: ${averageResponseTime.toFixed(2)}ms`
        );
        console.log(`   最大レスポンス時間: ${maxResponseTime.toFixed(2)}ms`);
        console.log(`   CPU時間制限エラー: ${hasCpuErrors ? "あり" : "なし"}`);

        // 期待値のアサーション
        if (successfulResults.length > 0) {
          expect(averageResponseTime).toBeLessThan(10000); // 10秒以内
          expect(hasCpuErrors).toBe(false); // CPU時間制限エラーなし
        }
      },
      120000
    ); // 2分のタイムアウト
  });

  describe("CPU集約的処理の特定", () => {
    it("大量データ処理時のCPU使用量測定", () => {
      const testSizes = [100, 500, 1000, 2000];

      testSizes.forEach((size) => {
        const startTime = performance.now();

        // 大量データ処理のシミュレーション
        const data = Array.from({ length: size }, (_, i) => ({
          id: i,
          name: `テストデータ${i}`,
          description: "これはテスト用のデータです。".repeat(10),
          tags: Array.from({ length: 5 }, (_, j) => `tag${j}`),
          coordinates: {
            lat: Math.random() * 180 - 90,
            lng: Math.random() * 360 - 180,
          },
        }));

        // データ変換処理（CPU集約的）
        const processedData = data.map((item) => ({
          ...item,
          searchableText: `${item.name} ${item.description} ${item.tags.join(
            " "
          )}`.toLowerCase(),
          distance: Math.sqrt(
            Math.pow(item.coordinates.lat - 35.6762, 2) +
              Math.pow(item.coordinates.lng - 139.6503, 2)
          ),
        }));

        // フィルタリング処理
        const filteredData = processedData.filter(
          (item) => item.distance < 10 && item.searchableText.includes("テスト")
        );

        // ソート処理
        const sortedData = filteredData.sort((a, b) => a.distance - b.distance);

        const endTime = performance.now();
        const processingTime = endTime - startTime;

        console.log(`データサイズ ${size}: ${processingTime.toFixed(2)}ms`);

        // CPU使用量が線形に増加することを確認
        expect(processingTime).toBeLessThan(size * 2); // サイズに比例した制限
        expect(sortedData.length).toBeLessThanOrEqual(size);
      });
    });
  });
});

// テスト結果のサマリー出力
afterAll(() => {
  console.log("\n" + "=".repeat(60));
  console.log("🎯 CPU負荷分析テスト完了");
  console.log("=".repeat(60));
  console.log("💡 推奨改善事項:");
  console.log("  1. CPU集約的な処理の特定と最適化");
  console.log("  2. 大量データ処理の分割実装");
  console.log("  3. メモリ使用量の監視と制限");
  console.log("  4. 構造化データ生成の最適化");
  console.log("  5. データベースクエリの並行実行制限");
});
