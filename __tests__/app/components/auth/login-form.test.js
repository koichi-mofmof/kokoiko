import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { LoginForm } from "../../../../app/components/auth/login-form";

// サーバーアクションのモック
jest.mock("@/lib/actions/auth", () => ({
  loginWithCredentials: jest.fn(),
  loginWithGoogle: jest.fn(),
}));

// useActionState をモック
jest.mock("react", () => {
  const originalReact = jest.requireActual("react");
  return {
    ...originalReact,
    useActionState: jest.fn().mockImplementation((action, initialState) => {
      return [initialState || { errors: {} }, jest.fn()];
    }),
  };
});

// react-dom の useFormStatus をモック
jest.mock("react-dom", () => {
  const originalReactDOM = jest.requireActual("react-dom");
  return {
    ...originalReactDOM,
    useFormStatus: jest.fn().mockReturnValue({ pending: false }),
  };
});

// useI18n は翻訳キーをそのまま返す（文言変更に強くする）
jest.mock("@/hooks/use-i18n", () => ({
  __esModule: true,
  useI18n: () => ({ t: (key) => key, locale: "ja", setLocale: jest.fn() }),
}));

// next/navigation の useSearchParams をモック（クエリなし）
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));

// 認証同期フックのモック
jest.mock("@/hooks/use-auth-sync", () => ({
  markAuthCallbackPending: jest.fn(),
}));

// ブラウザ判定のモック（既定では WebView ではない＝Googleログイン表示）
jest.mock("@/lib/utils/browser-detection", () => ({
  isGoogleOAuthBlocked: jest.fn(() => false),
}));

// CSRF トークン取得のモック
jest.mock("@/lib/utils/csrf-client", () => ({
  getCSRFTokenFromCookie: jest.fn(() => "test-csrf-token"),
}));

// 子コンポーネントのモック（依存を軽くする）
jest.mock("../../../../app/components/auth/signup-form", () => ({
  GoogleLogoIcon: () => <svg data-testid="google-logo" />,
}));

jest.mock("../../../../app/components/auth/webview-warning", () => ({
  WebViewWarning: () => null,
}));

// Next.js の Link, Image をモック
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} {...props} />,
}));

// UI コンポーネントをモック
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, disabled, ...props }) => (
    <button disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ ...props }) => <input {...props} />,
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor, ...props }) => (
    <label htmlFor={htmlFor} {...props}>
      {children}
    </label>
  ),
}));

describe("ログインフォームコンポーネントテスト", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // useFormStatus の既定値を復元
    require("react-dom").useFormStatus.mockReturnValue({ pending: false });
    require("react").useActionState.mockImplementation((action, initialState) => [
      initialState || { errors: {} },
      jest.fn(),
    ]);
  });

  it("フォームの初期表示が正しいこと", () => {
    render(<LoginForm />);

    // ラベルは翻訳キーで描画される
    expect(screen.getByLabelText("auth.common.email")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.common.password")).toBeInTheDocument();

    // 通常ログインボタン / Google ログインボタン
    expect(
      screen.getByRole("button", { name: "auth.common.login" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /auth\.login\.google/ })
    ).toBeInTheDocument();

    // 新規登録リンク
    const signupLink = screen.getByText("auth.common.signup");
    expect(signupLink).toBeInTheDocument();
    expect(signupLink.closest("a")).toHaveAttribute("href", "/signup");
  });

  it("メールアドレスとパスワードの入力ができること", () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText("auth.common.email");
    const passwordInput = screen.getByLabelText("auth.common.password");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(emailInput.value).toBe("test@example.com");
    expect(passwordInput.value).toBe("password123");
  });

  it("フィールド単位のバリデーションエラーが表示されること", () => {
    const mockActionState = {
      message: null,
      errors: {
        email: ["有効なメールアドレスを入力してください。"],
        password: ["パスワードは8文字以上で入力してください。"],
      },
      success: false,
    };
    require("react").useActionState.mockImplementation(() => [
      mockActionState,
      jest.fn(),
    ]);

    render(<LoginForm />);

    expect(
      screen.getByText("有効なメールアドレスを入力してください。")
    ).toBeInTheDocument();
    expect(
      screen.getByText("パスワードは8文字以上で入力してください。")
    ).toBeInTheDocument();
  });

  it("送信処理中はボタンが無効化され pending 表示になること", () => {
    require("react-dom").useFormStatus.mockReturnValue({ pending: true });

    render(<LoginForm />);

    const submitButton = screen.getByRole("button", {
      name: "auth.login.submit.pending",
    });
    expect(submitButton).toBeDisabled();
  });

  it("一般的な認証エラー（general）が表示されること", () => {
    const mockActionState = {
      message: null,
      errors: {
        general: ["メールアドレスまたはパスワードが正しくありません。"],
      },
      success: false,
    };
    require("react").useActionState.mockImplementation(() => [
      mockActionState,
      jest.fn(),
    ]);

    render(<LoginForm />);

    expect(
      screen.getByText("メールアドレスまたはパスワードが正しくありません。")
    ).toBeInTheDocument();
  });

  it("messageKey 形式の一般エラーは翻訳キーで表示されること", () => {
    const mockActionState = {
      messageKey: "auth.login.error.invalidCredentials",
      errors: {},
      success: false,
    };
    require("react").useActionState.mockImplementation(() => [
      mockActionState,
      jest.fn(),
    ]);

    render(<LoginForm />);

    expect(
      screen.getByText("auth.login.error.invalidCredentials")
    ).toBeInTheDocument();
  });

  it("messageKey / generalKey / general が同時にあっても重複せず messageKey だけ表示すること", () => {
    const mockActionState = {
      messageKey: "auth.login.failed",
      errors: {
        generalKey: "auth.login.incorrectEmailOrPassword",
        general: ["メールアドレスまたはパスワードが正しくありません。"],
      },
      success: false,
    };
    require("react").useActionState.mockImplementation(() => [
      mockActionState,
      jest.fn(),
    ]);

    render(<LoginForm />);

    // messageKey が優先され、generalKey / general は表示されない（重複排除）
    expect(screen.getByText("auth.login.failed")).toBeInTheDocument();
    expect(
      screen.queryByText("auth.login.incorrectEmailOrPassword")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("メールアドレスまたはパスワードが正しくありません。")
    ).not.toBeInTheDocument();
  });

  it("messageKey が無く generalKey のみなら generalKey を1つ表示すること", () => {
    const mockActionState = {
      errors: {
        generalKey: "auth.login.incorrectEmailOrPassword",
        general: ["メールアドレスまたはパスワードが正しくありません。"],
      },
      success: false,
    };
    require("react").useActionState.mockImplementation(() => [
      mockActionState,
      jest.fn(),
    ]);

    render(<LoginForm />);

    // generalKey が優先され、general 配列（同義の生文言）は表示されない
    expect(
      screen.getByText("auth.login.incorrectEmailOrPassword")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("メールアドレスまたはパスワードが正しくありません。")
    ).not.toBeInTheDocument();
  });
});
