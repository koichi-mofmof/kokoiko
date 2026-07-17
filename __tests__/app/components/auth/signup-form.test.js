import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SignupForm } from "../../../../app/components/auth/signup-form";

// サーバーアクションのモック
jest.mock("@/lib/actions/auth", () => ({
  signupWithCredentials: jest.fn(),
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

// GAイベントのモック（成功時 useEffect で発火する）
const mockSignup = jest.fn();
jest.mock("@/lib/analytics/events", () => ({
  trackUserEvents: { signup: (...args) => mockSignup(...args) },
}));

// ブラウザ判定のモック（既定では WebView ではない）
jest.mock("@/lib/utils/browser-detection", () => ({
  isGoogleOAuthBlocked: jest.fn(() => false),
}));

// CSRF トークン取得のモック
jest.mock("@/lib/utils/csrf-client", () => ({
  getCSRFTokenFromCookie: jest.fn(() => "test-csrf-token"),
}));

jest.mock("../../../../app/components/auth/webview-warning", () => ({
  WebViewWarning: () => null,
}));

// Next.js の Link をモック
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// UI コンポーネントをモック
jest.mock("@/components/ui/button", () => ({
  // asChild は DOM に渡さない（React の unknown prop 警告を避ける）
  Button: ({ children, disabled, asChild, ...props }) => (
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
jest.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({ ...props }) => <input type="checkbox" {...props} />,
}));

const setActionState = (state) =>
  require("react").useActionState.mockImplementation(() => [state, jest.fn()]);

describe("サインアップフォームコンポーネントテスト", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require("react-dom").useFormStatus.mockReturnValue({ pending: false });
    setActionState({ errors: {} });
  });

  it("messageKey が confirmationSent のとき確認メール送信画面を表示し sign_up を計測すること", () => {
    setActionState({
      message: "確認メールを送信しました。",
      messageKey: "auth.email.confirmationSent",
      errors: {},
      success: true,
    });

    render(<SignupForm />);

    expect(screen.getByText("auth.signup.success.title")).toBeInTheDocument();
    expect(
      screen.getByText("auth.signup.success.loginLink")
    ).toBeInTheDocument();
    expect(mockSignup).toHaveBeenCalledWith("email");
  });

  it("message に「確認メール」文字列があっても messageKey が無ければ成功画面を出さない（文字列マッチ廃止）", () => {
    setActionState({
      message: "確認メールを送信しました。",
      messageKey: undefined,
      errors: {},
      success: true,
    });

    render(<SignupForm />);

    expect(
      screen.queryByText("auth.signup.success.title")
    ).not.toBeInTheDocument();
    expect(mockSignup).not.toHaveBeenCalled();
    // 通常のフォーム（メール入力欄）が表示される
    expect(screen.getByLabelText("auth.common.email")).toBeInTheDocument();
  });

  it("messageKey / generalKey / general が同時にあっても messageKey だけ表示すること（重複排除）", () => {
    setActionState({
      messageKey: "auth.signup.failed",
      errors: {
        generalKey: "auth.signup.retryLater",
        general: ["ユーザー登録に失敗しました。時間をおいて再度お試しください。"],
      },
      success: false,
    });

    render(<SignupForm />);

    expect(screen.getByText("auth.signup.failed")).toBeInTheDocument();
    expect(
      screen.queryByText("auth.signup.retryLater")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "ユーザー登録に失敗しました。時間をおいて再度お試しください。"
      )
    ).not.toBeInTheDocument();
  });

  it("パスワードのフィールドエラーは翻訳キーで表示されること", () => {
    setActionState({
      errors: { password: ["validation.auth.password.ruleStrong"] },
      success: false,
    });

    render(<SignupForm />);

    expect(
      screen.getByText("validation.auth.password.ruleStrong")
    ).toBeInTheDocument();
  });
});
