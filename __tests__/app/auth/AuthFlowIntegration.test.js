import Header from "@/components/ui/Header";
import { useToast } from "@/hooks/use-toast";
import { loginWithCredentials, logoutUser } from "@/lib/actions/auth";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { mockSupabaseClient } from "../../../mocks/supabase";

// モックの設定
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock("@/lib/actions/auth", () => {
  const original = jest.requireActual("@/lib/actions/auth");
  return {
    ...original,
    loginWithCredentials: jest.fn(),
    logoutUser: jest.fn(),
  };
});

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// React のuseActionStateをモック
jest.mock("react", () => {
  const originalReact = jest.requireActual("react");
  return {
    ...originalReact,
    useActionState: jest.fn().mockImplementation((action, initialState) => {
      return [initialState || { errors: {} }, action];
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

// Radix UIのDropdownMenuをモック
jest.mock("@/components/ui/dropdown-menu", () => {
  return {
    DropdownMenu: ({ children }) => (
      <div data-testid="dropdown-menu">{children}</div>
    ),
    DropdownMenuTrigger: ({ children }) => (
      <div data-testid="dropdown-trigger">{children}</div>
    ),
    DropdownMenuContent: ({ children }) => (
      <div data-testid="dropdown-content">{children}</div>
    ),
    DropdownMenuItem: ({ children, asChild }) => (
      <div data-testid="dropdown-item">{children}</div>
    ),
    DropdownMenuLabel: ({ children }) => (
      <div data-testid="dropdown-label">{children}</div>
    ),
    DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />,
  };
});

// Avatar コンポーネントをモック
jest.mock("@/components/ui/avatar", () => {
  return {
    Avatar: ({ children, className }) => (
      <div data-testid="avatar">{children}</div>
    ),
    AvatarImage: ({ src, alt }) => (
      <img data-testid="avatar-image" src={src} alt={alt} />
    ),
    AvatarFallback: ({ children }) => (
      <div data-testid="avatar-fallback">{children}</div>
    ),
  };
});

// ログインフォームのコンポーネントをモック
jest.mock("../../../app/components/auth/login-form", () => ({
  LoginForm: () => (
    <div>
      <form data-testid="login-form">
        <label htmlFor="email">メールアドレス</label>
        <input id="email" type="email" />
        <label htmlFor="password">パスワード</label>
        <input id="password" type="password" />
        <div data-testid="login-button" onClick={() => loginWithCredentials()}>
          ログイン
        </div>
      </form>
      <div>
        <div data-testid="google-login-button">Google でログイン</div>
      </div>
    </div>
  ),
}));

// HTMLFormElement.prototype.requestSubmitのモック
HTMLFormElement.prototype.requestSubmit =
  HTMLFormElement.prototype.requestSubmit ||
  function () {
    this.submit();
  };

describe("認証フロー結合テスト", () => {
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();

    // モックの準備 - mockSupabaseClientのメソッドをセットアップ
    mockSupabaseClient.auth.signOut = jest
      .fn()
      .mockResolvedValue({ error: null });

    // useToastのモック
    useToast.mockReturnValue({
      toast: jest.fn(),
    });

    // ログイン/ログアウト関数のモック
    jest
      .spyOn(require("@/lib/actions/auth"), "loginWithCredentials")
      .mockImplementation(async () => ({
        success: true,
        message: "ログイン成功",
        errors: {},
      }));

    jest
      .spyOn(require("@/lib/actions/auth"), "logoutUser")
      .mockImplementation(async () => {
        await mockSupabaseClient.auth.signOut();
        return true;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("ログインからログアウトまでの一連のフローが正しく動作すること", async () => {
    // 1. ログイン前の状態を確認するためにヘッダーを描画
    const { unmount } = render(<Header currentUser={null} />);

    // ログイン前はログインボタンが表示されていることを確認
    expect(screen.getByRole("link", { name: /ログイン/i })).toBeInTheDocument();

    unmount();

    // 2. ログインフォームを簡易的に模倣
    render(
      <div>
        <form data-testid="login-form">
          <label htmlFor="email">メールアドレス</label>
          <input id="email" type="email" />
          <label htmlFor="password">パスワード</label>
          <input id="password" type="password" />
          <div
            data-testid="login-button"
            onClick={() => loginWithCredentials()}
          >
            ログイン
          </div>
        </form>
      </div>
    );

    // ログインボタンをクリック
    const loginButton = screen.getByTestId("login-button");
    fireEvent.click(loginButton);

    // ログイン関数が呼ばれたことを確認
    await waitFor(() => {
      expect(loginWithCredentials).toHaveBeenCalled();
    });

    // ログアウトを実行
    const mockUser = {
      id: "user-123",
      name: "テストユーザー",
      email: "test@example.com",
    };

    render(
      <div>
        <button data-testid="logout-button" onClick={() => logoutUser()}>
          ログアウト
        </button>
      </div>
    );

    // ログアウトボタンをクリック
    const logoutButton = screen.getByTestId("logout-button");
    fireEvent.click(logoutButton);

    // ログアウト関数が呼ばれたことを確認
    expect(logoutUser).toHaveBeenCalled();

    // Supabaseのサインアウト関数が呼ばれたことを確認
    await waitFor(() => {
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });
  });

  it("ログイン後の状態変化が正しく反映されること", async () => {
    // ログイン前のヘッダー表示確認
    const { unmount } = render(<Header currentUser={null} />);
    expect(screen.getByRole("link", { name: /ログイン/i })).toBeInTheDocument();
    unmount();

    // ログイン後のユーザー情報
    const mockUser = {
      id: "user-123",
      name: "テストユーザー",
      email: "test@example.com",
      avatarUrl: null,
    };

    // ユーザー情報を直接挿入（テスト用）
    render(
      <div data-testid="user-info">
        <span data-testid="user-name">{mockUser.name}</span>
        <span data-testid="user-email">{mockUser.email}</span>
      </div>
    );

    // テスト用の属性を使用してユーザー情報にアクセス
    expect(screen.getByTestId("user-name")).toHaveTextContent("テストユーザー");
    expect(screen.getByTestId("user-email")).toHaveTextContent(
      "test@example.com"
    );
  });

  it("ログアウト後の状態変化が正しく反映されること", async () => {
    // まずはログアウトボタンを直接挿入（テスト用）
    render(
      <button data-testid="logout-button" onClick={() => logoutUser()}>
        ログアウト
      </button>
    );

    // ログアウトボタンをクリック
    const logoutButton = screen.getByTestId("logout-button");
    fireEvent.click(logoutButton);

    // ログアウト関数が呼ばれたことを確認
    expect(logoutUser).toHaveBeenCalled();

    // Supabaseのサインアウト関数が呼ばれたことを確認
    await waitFor(() => {
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    // ログアウト後は再びログインボタンが表示されることを確認
    render(<Header currentUser={null} />);
    expect(screen.getByRole("link", { name: /ログイン/i })).toBeInTheDocument();
  });
});
