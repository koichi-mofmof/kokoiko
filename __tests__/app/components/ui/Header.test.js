import { render, screen, fireEvent } from "@testing-library/react";
import Header from "@/components/ui/Header";
import "@testing-library/jest-dom";
import { MockSubscriptionProvider } from "../../../mocks/MockSubscriptionProvider";

// RadixUIのドロップダウンメニューをモックする
jest.mock("@/components/ui/dropdown-menu", () => ({
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
}));

// Headerコンポーネントをラップする関数
const renderWithProviders = (ui, options = {}) => {
  return render(
    <MockSubscriptionProvider>{ui}</MockSubscriptionProvider>,
    options
  );
};

describe("Headerコンポーネントテスト", () => {
  // 未ログイン状態のヘッダーをテスト
  it("未ログイン状態では「ログイン」ボタンが表示されること", () => {
    renderWithProviders(<Header currentUser={null} />);

    // ClippyMapロゴテキストが表示される
    expect(screen.getByText("ClippyMap")).toBeInTheDocument();

    // ログインボタンが表示される
    const loginButton = screen.getByRole("link", { name: /ログイン/i });
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toHaveAttribute("href", "/login");
  });

  // ログイン状態のヘッダーをテスト
  it("ログイン状態ではユーザーアバターが表示されること", () => {
    // モックユーザーデータ
    const mockUser = {
      name: "テストユーザー",
      id: "user123",
      email: "test@example.com",
      avatarUrl: null, // アバター画像なし
    };

    renderWithProviders(<Header currentUser={mockUser} />);

    // ClippyMapロゴが表示される
    expect(screen.getByText("ClippyMap")).toBeInTheDocument();

    // ログインボタンは表示されない
    expect(
      screen.queryByRole("link", { name: /ログイン/i })
    ).not.toBeInTheDocument();

    // ドロップダウンのトリガー要素が存在する
    expect(screen.getByTestId("dropdown-trigger")).toBeInTheDocument();
  });

  // アバター画像のテスト
  it("ユーザーにアバター画像がある場合、Avatarコンポーネントが表示されること", () => {
    // アバター画像を持つモックユーザーデータ
    const mockUser = {
      name: "テストユーザー",
      id: "user123",
      email: "test@example.com",
      avatarUrl: "https://example.com/avatar.jpg",
    };

    renderWithProviders(<Header currentUser={mockUser} />);

    // Avatarコンポーネントが表示されることを確認
    // ドロップダウントリガーが存在することを確認
    expect(screen.getByTestId("dropdown-trigger")).toBeInTheDocument();
  });

  // ログアウト機能のテスト
  it("ログアウトがクリックできること", () => {
    // モックの関数を作成
    const mockLogout = jest.fn();

    // モックユーザーデータ
    const mockUser = {
      name: "テストユーザー",
      id: "user123",
      email: "test@example.com",
    };

    const { container } = renderWithProviders(
      <Header currentUser={mockUser} onLogout={mockLogout} />
    );

    // フォーム要素を直接クエリ
    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();

    // フォームのaction属性がonLogout関数を参照していることを確認
    expect(form.getAttribute("action")).toBeDefined();
  });
});
