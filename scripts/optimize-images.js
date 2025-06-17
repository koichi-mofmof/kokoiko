#!/usr/bin/env node

/**
 * 画像最適化スクリプト（Windows対応版）
 * 大きな画像ファイルを自動的にWebP形式に変換し、サイズを最適化
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🖼️  画像最適化を開始します...\n");

// Sharp CLI が必要
function checkSharpCli() {
  try {
    execSync("npx sharp-cli --version", { stdio: "ignore" });
    return true;
  } catch (error) {
    console.log("📦 Sharp CLI をインストール中...");
    try {
      execSync("npm install sharp-cli", { stdio: "inherit" });
      return true;
    } catch (installError) {
      console.error("❌ Sharp CLI のインストールに失敗しました");
      console.log("手動でインストールしてください: npm install sharp-cli");
      return false;
    }
  }
}

// 画像最適化設定
const OPTIMIZATION_RULES = {
  screenshots: {
    // リサイズしない（縦横比完全保持）
    quality: 85,
    format: "webp",
  },
  ogp: {
    // リサイズしない（縦横比完全保持）
    quality: 80,
    format: "webp",
  },
  icons: {
    // アイコンはそのまま（SVGは最適化済み）
    quality: 90,
    format: "webp",
  },
  general: {
    // リサイズしない（縦横比完全保持）
    quality: 80,
    format: "webp",
  },
};

function getOptimizationRule(filePath) {
  if (filePath.includes("screenshots")) return OPTIMIZATION_RULES.screenshots;
  if (filePath.includes("ogp-image")) return OPTIMIZATION_RULES.ogp;
  if (filePath.includes("icon") || filePath.includes("favicon"))
    return OPTIMIZATION_RULES.icons;
  return OPTIMIZATION_RULES.general;
}

function optimizeImage(inputPath, outputPath, rule) {
  try {
    // Windows対応：パスを正規化
    const normalizedInputPath = path.normalize(inputPath);
    const normalizedOutputPath = path.normalize(outputPath);

    // sharp-cliでフォーマット変換と圧縮のみ（リサイズなし）
    let command = `npx sharp-cli`;
    command += ` -i "${normalizedInputPath}"`;
    command += ` -o "${normalizedOutputPath}"`;
    command += ` -f ${rule.format}`;
    command += ` -q ${rule.quality}`;

    // リサイズは行わない（縦横比を完全に保持）
    console.log(`  🔄 実行中: ${path.basename(inputPath)} (縦横比保持)`);
    console.log(`     コマンド: ${command}`);

    execSync(command, { stdio: "pipe" });

    // ファイルサイズ比較
    const originalSize = Math.round(fs.statSync(inputPath).size / 1024);
    const optimizedSize = Math.round(fs.statSync(outputPath).size / 1024);
    const savedPercent = Math.round(
      ((originalSize - optimizedSize) / originalSize) * 100
    );

    console.log(
      `  ✅ ${path.basename(
        inputPath
      )}: ${originalSize}KB → ${optimizedSize}KB (${savedPercent}% 削減, 縦横比保持)`
    );

    return { originalSize, optimizedSize, savedPercent };
  } catch (error) {
    console.error(`  ❌ ${path.basename(inputPath)}: 最適化に失敗`);
    console.error(`     エラー: ${error.message}`);
    return null;
  }
}

function findLargeImages() {
  const publicDir = path.join(process.cwd(), "public");
  const imageExtensions = [".png", ".jpg", ".jpeg", ".gif"];
  const largeImages = [];

  function scanDirectory(dir, relativePath = "") {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const fullRelativePath = path.join(relativePath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath, fullRelativePath);
      } else if (imageExtensions.includes(path.extname(file).toLowerCase())) {
        const sizeKB = Math.round(stat.size / 1024);

        if (sizeKB > 50) {
          // 50KB以上の画像を最適化対象
          largeImages.push({
            inputPath: filePath,
            relativePath: fullRelativePath,
            size: sizeKB,
          });
        }
      }
    });
  }

  scanDirectory(publicDir);
  return largeImages;
}

// 単体テスト用の関数
async function testOptimization() {
  if (!checkSharpCli()) {
    process.exit(1);
  }

  console.log("🧪 sharp-cliのテストを実行中...\n");

  // テスト用の小さなファイルで動作確認
  const testFiles = findLargeImages().slice(0, 1); // 最初の1つだけテスト

  if (testFiles.length === 0) {
    console.log("⚠️  テスト対象の画像ファイルがありません");
    return false;
  }

  const testFile = testFiles[0];
  const testOutputDir = path.join(process.cwd(), "public", "test-optimized");

  if (!fs.existsSync(testOutputDir)) {
    fs.mkdirSync(testOutputDir, { recursive: true });
  }

  const rule = getOptimizationRule(testFile.relativePath);
  const outputFileName =
    path.basename(testFile.inputPath, path.extname(testFile.inputPath)) +
    ".webp";
  const outputPath = path.join(testOutputDir, outputFileName);

  console.log(
    `📁 テストファイル: ${testFile.relativePath} (${testFile.size}KB)`
  );

  const result = optimizeImage(testFile.inputPath, outputPath, rule);

  if (result) {
    console.log("✅ テスト成功！");
    // テストファイルを削除
    try {
      fs.unlinkSync(outputPath);
      fs.rmdirSync(testOutputDir);
    } catch (e) {}
    return true;
  } else {
    console.log("❌ テスト失敗");
    return false;
  }
}

async function optimizeImages() {
  if (!checkSharpCli()) {
    process.exit(1);
  }

  // まずテストを実行
  const testPassed = await testOptimization();
  if (!testPassed) {
    console.log("\n💡 代替手法を試してください:");
    console.log(
      "  1. 手動でSharp CLIを使用: npx sharp-cli input.png --format webp --quality 80 --output output.webp"
    );
    console.log("  2. オンラインツールを使用: https://squoosh.app/");
    console.log("  3. 他の画像最適化ツールを使用: imagemin-cli など");
    return;
  }

  const largeImages = findLargeImages();

  if (largeImages.length === 0) {
    console.log("✅ 最適化が必要な画像はありませんでした");
    return;
  }

  console.log(`\n📊 ${largeImages.length} 個の画像を最適化します...\n`);

  // 最適化後の画像用ディレクトリを作成
  const optimizedDir = path.join(process.cwd(), "public", "optimized");
  if (!fs.existsSync(optimizedDir)) {
    fs.mkdirSync(optimizedDir, { recursive: true });
  }

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let successCount = 0;

  for (const image of largeImages) {
    const rule = getOptimizationRule(image.relativePath);
    const ext =
      rule.format === "webp" ? ".webp" : path.extname(image.inputPath);
    const outputFileName =
      path.basename(image.inputPath, path.extname(image.inputPath)) + ext;
    const outputPath = path.join(optimizedDir, outputFileName);

    const result = optimizeImage(image.inputPath, outputPath, rule);

    if (result) {
      totalOriginalSize += result.originalSize;
      totalOptimizedSize += result.optimizedSize;
      successCount++;
    }
  }

  console.log("\n📊 最適化結果:");
  console.log(`  ✅ 成功: ${successCount}/${largeImages.length} ファイル`);

  if (totalOriginalSize > 0) {
    console.log(
      `  💾 合計削減: ${totalOriginalSize}KB → ${totalOptimizedSize}KB`
    );
    console.log(
      `  📉 削減率: ${Math.round(
        ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100
      )}%`
    );
  }

  if (successCount === 0) {
    console.log("\n🔧 トラブルシューティング:");
    console.log("  1. sharp-cliの再インストール: npm install sharp-cli");
    console.log(
      "  2. Nodeモジュールのクリア: rm -rf node_modules && npm install"
    );
    console.log("  3. 手動での最適化を試行");
  } else {
    console.log("\n💡 次のステップ:");
    console.log("  1. public/optimized/ フォルダ内の画像を確認");
    console.log("  2. 問題なければ元の画像と置き換え");
    console.log("  3. コンポーネント内の画像パスを更新（必要に応じて）");
    console.log("  4. WebP対応のためのフォールバック設定を確認");
  }
}

// SVG最適化（SVGO使用）
async function optimizeSvgs() {
  console.log("\n🎨 SVGファイルを最適化中...");

  try {
    // SVGO がインストールされているかチェック
    execSync("npx svgo --version", { stdio: "ignore" });
  } catch (error) {
    console.log("📦 SVGO をインストール中...");
    try {
      execSync("npm install svgo", { stdio: "inherit" });
    } catch (installError) {
      console.log("⚠️  SVGO のインストールをスキップします");
      return;
    }
  }

  try {
    execSync("npx svgo --folder public --recursive --precision=2", {
      stdio: "pipe",
    });
    console.log("  ✅ SVGファイルが最適化されました");
  } catch (error) {
    console.log("  ⚠️  SVG最適化中にエラーが発生しました:", error.message);
  }
}

// メイン実行
async function main() {
  try {
    await optimizeImages();
    await optimizeSvgs();

    console.log("\n🎉 画像最適化が完了しました！");
    console.log(
      "変更をコミットする前に、Webサイトの表示を確認してください。\n"
    );
  } catch (error) {
    console.error("❌ エラーが発生しました:", error.message);
    process.exit(1);
  }
}

main();
