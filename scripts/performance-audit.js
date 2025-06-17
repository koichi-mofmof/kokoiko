#!/usr/bin/env node

/**
 * パフォーマンス監査スクリプト
 * 画像ファイル、バンドルサイズ、依存関係を分析
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 ClippyMapパフォーマンス監査を開始します...\n");

// 1. 画像ファイルサイズチェック
function checkImageSizes() {
  console.log("📸 画像ファイルサイズを分析中...");

  const publicDir = path.join(process.cwd(), "public");
  const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
  const largeImages = [];

  function scanDirectory(dir, relativePath = "") {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const fullRelativePath = path.join(relativePath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath, fullRelativePath);
      } else if (imageExtensions.includes(path.extname(file).toLowerCase())) {
        const sizeKB = Math.round(stat.size / 1024);

        if (sizeKB > 100) {
          // 100KB以上の画像を警告
          largeImages.push({
            path: fullRelativePath,
            size: sizeKB,
            warning:
              sizeKB > 500 ? "CRITICAL" : sizeKB > 200 ? "WARNING" : "INFO",
          });
        }
      }
    });
  }

  scanDirectory(publicDir);

  if (largeImages.length > 0) {
    console.log("⚠️  大きな画像ファイルが検出されました:");
    largeImages.forEach((img) => {
      const icon =
        img.warning === "CRITICAL"
          ? "🔴"
          : img.warning === "WARNING"
          ? "🟡"
          : "🔵";
      console.log(`  ${icon} ${img.path}: ${img.size}KB`);
    });

    console.log("\n💡 改善提案:");
    console.log(
      "  - WebP形式への変換: npx sharp-cli --format webp --quality 80 [画像パス]"
    );
    console.log(
      "  - サイズ最適化: npx sharp-cli --width 800 --height 600 [画像パス]"
    );
  } else {
    console.log("✅ 画像ファイルサイズは最適化されています");
  }

  console.log("");
}

// 2. 依存関係サイズチェック
function checkDependencySizes() {
  console.log("📦 依存関係のバンドルサイズを分析中...");

  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const dependencies = packageJson.dependencies || {};

    const largeDeps = [
      {
        name: "framer-motion",
        size: "~100KB",
        suggestion: "必要な部分のみインポート",
      },
      { name: "leaflet", size: "~40KB", suggestion: "dynamic importを検討" },
      {
        name: "@radix-ui/*",
        size: "~10-30KB each",
        suggestion: "tree-shakingを確認",
      },
      { name: "react-hook-form", size: "~25KB", suggestion: "OK - 必要な機能" },
    ];

    console.log("📊 主要依存関係のサイズ分析:");
    largeDeps.forEach((dep) => {
      const isInstalled = Object.keys(dependencies).some((key) =>
        key.includes(dep.name.split("*")[0])
      );
      if (isInstalled) {
        console.log(`  📦 ${dep.name}: ${dep.size} - ${dep.suggestion}`);
      }
    });
  } catch (error) {
    console.log("⚠️  package.jsonの読み込みに失敗しました");
  }

  console.log("");
}

// 3. Next.js設定チェック
function checkNextConfig() {
  console.log("⚙️  Next.js設定を確認中...");

  try {
    const configPath = path.join(process.cwd(), "next.config.ts");
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, "utf8");

      const optimizations = [
        {
          check: "experimental.optimizePackageImports",
          found: configContent.includes("optimizePackageImports"),
        },
        { check: "images.formats", found: configContent.includes("formats") },
        {
          check: "images.deviceSizes",
          found: configContent.includes("deviceSizes"),
        },
        {
          check: "webpack optimization",
          found: configContent.includes("optimization"),
        },
        {
          check: "cache headers",
          found: configContent.includes("Cache-Control"),
        },
      ];

      optimizations.forEach((opt) => {
        const icon = opt.found ? "✅" : "❌";
        console.log(`  ${icon} ${opt.check}`);
      });
    } else {
      console.log("⚠️  next.config.tsが見つかりません");
    }
  } catch (error) {
    console.log("⚠️  Next.js設定の確認に失敗しました");
  }

  console.log("");
}

// 4. 推奨改善策
function showRecommendations() {
  console.log("💡 パフォーマンス改善の推奨事項:\n");

  console.log("🎯 短期的改善（即効性あり）:");
  console.log("  1. 大きな画像ファイルのWebP変換と圧縮");
  console.log("  2. 未使用の依存関係の削除");
  console.log("  3. framer-motionの部分インポート最適化");
  console.log("  4. 画像のlazy loading設定\n");

  console.log("🚀 中期的改善:");
  console.log("  1. Critical CSS のインライン化");
  console.log("  2. Service Worker によるキャッシュ戦略");
  console.log("  3. バンドル分割の最適化");
  console.log("  4. データベースクエリの最適化\n");

  console.log("📊 長期的改善:");
  console.log("  1. CDNによる静的アセット配信");
  console.log("  2. サーバーサイドキャッシュ戦略");
  console.log("  3. Progressive Web App (PWA) 対応");
  console.log("  4. 継続的パフォーマンス監視\n");
}

// 5. 具体的なコマンド提案
function showCommands() {
  console.log("🛠️  実行可能なコマンド:\n");

  console.log("# バンドルサイズ分析");
  console.log("npm run analyze\n");

  console.log("# 画像最適化（要実装）");
  console.log("npm run optimize:images\n");

  console.log("# ビルド時間測定");
  console.log("time npm run build\n");

  console.log("# Lighthouse監査");
  console.log(
    "npx lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html\n"
  );
}

// メイン実行
async function runAudit() {
  try {
    checkImageSizes();
    checkDependencySizes();
    checkNextConfig();
    showRecommendations();
    showCommands();

    console.log("✅ パフォーマンス監査が完了しました！");
    console.log(
      "詳細な分析は npm run analyze でバンドルアナライザーを実行してください。\n"
    );
  } catch (error) {
    console.error("❌ 監査中にエラーが発生しました:", error.message);
    process.exit(1);
  }
}

runAudit();
