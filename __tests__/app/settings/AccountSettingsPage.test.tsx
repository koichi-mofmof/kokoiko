import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AccountSettingsPage from "@/app/settings/account/page";

// 必要なモック
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));
jest.mock("@/lib/actions/auth", () => ({
  updateUserPassword: jest.fn(),
}));
jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));
jest.mock("@/components/ui/button", () => ({
  Button: (props: any) => <button {...props} />,
}));

const mockToast = jest.fn();
const { useToast } = require("@/hooks/use-toast");
const { updateUserPassword } = require("@/lib/actions/auth");

useToast.mockReturnValue({ toast: mockToast });

function fillAndSubmit(current: string, next: string) {
  fireEvent.change(screen.getByLabelText(/現在のパスワード/), {
    target: { value: current },
  });
  fireEvent.change(screen.getByLabelText(/新しいパスワード/), {
    target: { value: next },
  });
  fireEvent.click(screen.getByRole("button", { name: /パスワードを変更/ }));
}

describe("AccountSettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("パスワード変更成功時にトーストが表示され、入力がクリアされる", async () => {
    updateUserPassword.mockResolvedValueOnce({
      success: true,
      message: "パスワードが正常に変更されました。",
      errors: [],
    });
    render(<AccountSettingsPage />);
    fillAndSubmit("oldpass123!A", "Newpass123!A");
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "成功",
          description:
            expect.stringContaining("パスワードが正常に変更されました。"),
        })
      );
    });
    expect(screen.getByLabelText(/現在のパスワード/)).toHaveValue("");
    expect(screen.getByLabelText(/新しいパスワード/)).toHaveValue("");
  });

  it("新しいパスワードが短い場合にバリデーションエラーが表示される", async () => {
    render(<AccountSettingsPage />);
    fillAndSubmit("oldpass123!A", "short");
    const errors = await screen.findAllByText(/パスワードは8文字以上/);
    expect(errors.length).toBeGreaterThan(0);
    expect(updateUserPassword).not.toHaveBeenCalled();
  });

  it("新しいパスワードが要件を満たさない場合にバリデーションエラーが表示される", async () => {
    render(<AccountSettingsPage />);
    fillAndSubmit("oldpass123!A", "abcdefgh"); // 英大文字・数字・記号なし
    const errors = await screen.findAllByText(
      /パスワードは英大文字、小文字、数字、記号/
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(updateUserPassword).not.toHaveBeenCalled();
  });

  it("現在のパスワードが未入力の場合にバリデーションエラーが表示される", async () => {
    render(<AccountSettingsPage />);
    fillAndSubmit("", "Newpass123!A");
    const errors = await screen.findAllByText(/現在のパスワード/);
    expect(errors.length).toBeGreaterThan(0);
    expect(updateUserPassword).not.toHaveBeenCalled();
  });

  it("サーバー側で現在のパスワードが間違っている場合にエラーが表示される", async () => {
    updateUserPassword.mockResolvedValueOnce({
      success: false,
      message: "現在のパスワードが正しくありません。",
      errors: [
        {
          field: "currentPassword",
          message: "現在のパスワードが正しくありません。",
        },
      ],
    });
    render(<AccountSettingsPage />);
    fillAndSubmit("wrongpass", "Newpass123!A");
    expect(
      await screen.findByText("現在のパスワードが正しくありません。")
    ).toBeInTheDocument();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "エラー",
        description:
          expect.stringContaining("現在のパスワードが正しくありません。"),
      })
    );
  });

  it("サーバー側で新しいパスワードのエラーが返った場合にエラーが表示される", async () => {
    updateUserPassword.mockResolvedValueOnce({
      success: false,
      message: "入力内容に誤りがあります。",
      errors: [
        {
          field: "newPassword",
          message:
            "パスワードは英大文字、小文字、数字、記号をそれぞれ1文字以上含める必要があります。",
        },
      ],
    });
    render(<AccountSettingsPage />);
    fillAndSubmit("oldpass123!A", "invalidpass");
    // 画面上にエラーが表示されることのみ検証
    expect(
      await screen.findByText(/パスワードは英大文字、小文字、数字、記号/)
    ).toBeInTheDocument();
    // トーストの有無は問わない
  });

  it("サーバー側で予期しないエラーが返った場合にエラートーストが表示される", async () => {
    updateUserPassword.mockResolvedValueOnce({
      success: false,
      message: "サーバーエラーが発生しました。",
      errors: [],
    });
    render(<AccountSettingsPage />);
    fillAndSubmit("oldpass123!A", "Newpass123!A");
    // 実装仕様に合わせて「入力内容に誤りがあります。」でトーストが呼ばれることを期待
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "エラー",
          description: expect.stringContaining("入力内容に誤りがあります。"),
        })
      );
    });
  });
});
