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
  // カバレッジの設定
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!<rootDir>/out/**",
    "!<rootDir>/.next/**",
    "!<rootDir>/*.config.js",
    "!<rootDir>/coverage/**",
    "!<rootDir>/types/supabase.ts",
  ],
  coverageReporters: ["text", "lcov", "json", "html", "json-summary"],
  coverageDirectory: "<rootDir>/coverage",
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};

// createJestConfigを定義することによって、next/jestが提供する設定とマージして、Jestに渡すことができる
module.exports = createJestConfig(customJestConfig);
