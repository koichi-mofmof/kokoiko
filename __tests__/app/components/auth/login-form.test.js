import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { LoginForm } from "../../../../app/components/auth/login-form";

// モックの作成
jest.mock("@/lib/actions/auth", () => ({
  loginWithCredentials: jest.fn(),
  loginWithGoogle: jest.fn(),
}));

// useActionStateをモック
jest.mock("react", () => {
  const originalReact = jest.requireActual("react");

  return {
    ...originalReact,
    useActionState: jest.fn().mockImplementation((action, initialState) => {
      return [initialState || { errors: {} }, jest.fn()];
    }),
  };
});

// react-domのuseFormStatusをモック
jest.mock("react-dom", () => {
  const originalReactDOM = jest.requireActual("react-dom");

  return {
    ...originalReactDOM,
    useFormStatus: jest.fn().mockReturnValue({ pending: false }),
  };
});

// アイコンコンポーネントをモック
jest.mock("lucide-react", () => ({
  Eye: () => <div data-testid="eye-icon">Eye Icon</div>,
  EyeOff: () => <div data-testid="eye-off-icon">Eye Off Icon</div>,
  Loader2: () => <div data-testid="loader-icon">Loader Icon</div>,
}));

// Next.jsのLink, Imageコンポーネントをモック
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

// UIコンポーネントをモック
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

// ログインフォームのテストをスキップ
describe.skip("ログインフォームコンポーネントテスト", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("フォームの初期表示が正しいこと", () => {
    render(<LoginForm />);

    // 基本的な要素が存在することを確認
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ログイン/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Google でログイン/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/アカウントをお持ちでない場合/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/新規登録/i)).toBeInTheDocument();
  });

  it("メールアドレスとパスワードの入力ができること", () => {
    render(<LoginForm />);

    // 入力フィールドを取得
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/パスワード/i);

    // 値を入力
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    // 入力値が反映されていることを確認
    expect(emailInput.value).toBe("test@example.com");
    expect(passwordInput.value).toBe("password123");
  });

  it("バリデーションエラーが正しく表示されること", () => {
    // エラーがある状態の初期値でレンダリング
    const mockActionState = {
      message: null,
      errors: {
        email: ["有効なメールアドレスを入力してください。"],
        password: ["パスワードは8文字以上で入力してください。"],
      },
      success: false,
    };

    // useActionStateのモックを上書き
    require("react").useActionState.mockImplementationOnce(() => [
      mockActionState,
      jest.fn(),
    ]);

    render(<LoginForm />);

    // エラーメッセージが表示されていることを確認
    expect(
      screen.getByText("有効なメールアドレスを入力してください。")
    ).toBeInTheDocument();
    expect(
      screen.getByText("パスワードは8文字以上で入力してください。")
    ).toBeInTheDocument();
  });

  it("ログイン処理中はボタンが無効化されること", () => {
    // ログイン処理中の状態をモック
    require("react-dom").useFormStatus.mockReturnValue({ pending: true });

    render(<LoginForm />);

    // ログインボタンが無効化されていることを確認
    const loginButton = screen.getByRole("button", { name: /ログイン中/i });
    expect(loginButton).toBeDisabled();

    // テキストが「ログイン中...」に変わっていることを確認
    expect(loginButton).toHaveTextContent("ログイン中...");
  });

  it("Google認証処理中はGoogleボタンが無効化されること", () => {
    // 最初にデフォルトモックを設定
    require("react-dom").useFormStatus.mockReturnValue({ pending: false });

    // Google認証ボタンのみpendingをtrueに設定
    require("react-dom")
      .useFormStatus.mockReturnValueOnce({ pending: false }) // 通常ログインボタン用
      .mockReturnValueOnce({ pending: true }); // Googleログインボタン用

    render(<LoginForm />);

    // Googleログインボタンが無効化されていることを確認
    const googleButton = screen.getByRole("button", { name: /処理中/i });
    expect(googleButton).toBeDisabled();

    // テキストが「処理中...」に変わっていることを確認
    expect(googleButton).toHaveTextContent("処理中...");
  });

  it("一般的なエラーメッセージが表示されること", () => {
    // 一般的なエラーがある状態の初期値でレンダリング
    const mockActionState = {
      message: null,
      errors: {
        general: ["メールアドレスまたはパスワードが正しくありません。"],
      },
      success: false,
    };

    // useActionStateのモックを上書き
    require("react").useActionState.mockImplementationOnce(() => [
      mockActionState,
      jest.fn(),
    ]);

    render(<LoginForm />);

    // 一般的なエラーメッセージが表示されていることを確認
    expect(
      screen.getByText("メールアドレスまたはパスワードが正しくありません。")
    ).toBeInTheDocument();
  });
});
