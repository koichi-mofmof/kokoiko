// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// TextEncoder/TextDecoderのポリフィル
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

// Web APIのポリフィル
global.Request = require("node-fetch").Request;
global.Response = require("node-fetch").Response;
global.Headers = require("node-fetch").Headers;
global.fetch = require("node-fetch");

// MSWのセットアップ
// import { server } from "./mocks/server";

// テスト前にMSWのサーバーを起動
// beforeAll(() => server.listen());

// 各テスト終了後にリクエストハンドラーをリセット
// afterEach(() => server.resetHandlers());

// すべてのテスト終了後にサーバーをクローズ
// afterAll(() => server.close());

// Next.jsのルーターをモック化
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
  revalidatePath: jest.fn(),
}));

// matchMediaのポリフィル
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // 非推奨
    removeListener: jest.fn(), // 非推奨
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
