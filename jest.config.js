const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // next.config.jsとテスト環境用の.envファイルが配置されたディレクトリをセット
  dir: "./",
});

// Jestのカスタム設定を設置する場所
const customJestConfig = {
  // テストファイルがあるディレクトリを指定
  testEnvironment: "jest-environment-jsdom",
  // 各テストの実行前に実行されるスクリプト
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  // モジュール名のエイリアス (tsconfig.jsonのpathsと合わせる)
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // ESMパッケージ（nanoid等）もtransform対象にする
  transformIgnorePatterns: ["/node_modules/(?!(nanoid)/)"],
  // TypeScript/ESM対応（必要に応じて）
  // transform: {
  //   "^.+\\.(ts|tsx)$": "ts-jest",
  // },
};

// createJestConfigを定義することによって、next/jestが提供する設定とマージして、Jestに渡すことができる
module.exports = createJestConfig(customJestConfig);
