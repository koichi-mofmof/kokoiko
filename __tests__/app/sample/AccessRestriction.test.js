import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import SampleLayout from "../../../app/sample/layout";

// サンプル画面（非認証ユーザー向け）のレイアウトテスト
describe("サンプル画面アクセス制限テスト", () => {
  it("非ログイン状態でサンプル画面にアクセスすると、ログイン促進メッセージが表示されること", () => {
    // サンプルレイアウトをレンダリング
    render(
      <SampleLayout>
        <div data-testid="sample-content">サンプルコンテンツ</div>
      </SampleLayout>
    );

    // ログイン促進Alertが表示されることを確認
    expect(
      screen.getByText("サンプルデータを表示しています")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/自分の場所を登録・管理するには/i)
    ).toBeInTheDocument();

    // ログインリンクが表示されていることを確認
    const loginLink = screen.getByText("ログイン");
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");

    // 子コンポーネントも表示されていることを確認
    expect(screen.getByTestId("sample-content")).toBeInTheDocument();
  });
});
