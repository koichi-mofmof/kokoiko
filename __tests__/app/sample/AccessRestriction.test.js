import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import SampleLayout from "../../../app/sample/layout";
import { createClient } from "@/lib/supabase/server";

// Mock Supabase client
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

// サンプル画面（非認証ユーザー向け）のレイアウトテスト
describe("サンプル画面アクセス制限テスト", () => {
  beforeEach(() => {
    // Reset mocks before each test
    createClient.mockClear();
  });

  it("非ログイン状態でサンプル画面にアクセスすると、ログイン促進メッセージが表示されること", async () => {
    // Mock the getUser function to return a non-logged-in user
    createClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    // サンプルレイアウトをレンダリング
    // 非同期サーバーコンポーネントは直接呼び出して解決してからrenderに渡す
    const ResolvedLayout = await SampleLayout({
      children: <div data-testid="sample-content">サンプルコンテンツ</div>,
    });
    render(ResolvedLayout);

    // ログイン促進Alertが表示されることを確認
    expect(
      screen.getByText(/サンプルデータを表示しています/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/自分の場所を登録・管理する場合は/i)
    ).toBeInTheDocument();

    // ログインリンクが表示されていることを確認
    const loginLink = screen.getByText("ログイン");
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");

    // 子コンポーネントも表示されていることを確認
    expect(screen.getByTestId("sample-content")).toBeInTheDocument();
  });
});
