import { render, screen, fireEvent } from "@testing-library/react";
import { BookmarkSignupModal } from "@/app/components/conversion/BookmarkSignupModal";

// lib/analytics/eventsのモック
jest.mock("@/lib/analytics/events", () => ({
  trackConversionEvents: {
    promptShown: jest.fn(),
    promptClicked: jest.fn(),
    promptDismissed: jest.fn(),
  },
}));

// Dialog関連のモック
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog" style={{ display: open ? "block" : "none" }}>
      {children}
    </div>
  ),
  DialogContent: ({ children, onInteractOutside, ...props }: any) => (
    <div data-testid="dialog-content" {...props}>
      {children}
      <button
        data-testid="mock-internal-close-dialog-btn"
        onClick={onInteractOutside}
        style={{ display: "none" }}
      />
    </div>
  ),
  DialogTitle: ({ children, ...props }: any) => (
    <h2 {...props} role="heading" aria-level="2" id="dialog-title">
      {children}
    </h2>
  ),
}));

// lucide-reactのモック
jest.mock("lucide-react", () => ({
  Bookmark: ({ className, ...props }: any) => (
    <div className={className} data-testid="icon-bookmark" {...props} />
  ),
  Share2: ({ className, ...props }: any) => (
    <div className={className} data-testid="icon-share2" {...props} />
  ),
  X: ({ className, ...props }: any) => (
    <div className={className} data-testid="icon-x" {...props} />
  ),
}));

describe("BookmarkSignupModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    listId: "list-123",
    listName: "テストリスト",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("モーダルが開いている時、正しい内容が表示される", () => {
    render(<BookmarkSignupModal {...defaultProps} />);

    // タイトルの確認（複数要素に分割されているため正規表現を使用）
    expect(screen.getByText(/テストリスト/)).toBeInTheDocument();
    expect(screen.getByText("ブックマーク")).toBeInTheDocument();
    expect(screen.getByText(/しませんか？/)).toBeInTheDocument();

    // 価値提案の確認
    expect(
      screen.getByText("気になるリストをいつでも見返せる")
    ).toBeInTheDocument();
    expect(
      screen.getByText("保存したリストを友達とも簡単シェア")
    ).toBeInTheDocument();

    // 簡単さアピールの確認
    expect(
      screen.getByText("登録は30秒で完了 • 無料で使える • いつでも退会OK")
    ).toBeInTheDocument();

    // CTAボタンの確認
    expect(
      screen.getByText("無料で始めてブックマーク保存")
    ).toBeInTheDocument();
    expect(
      screen.getByText("すでにアカウントをお持ちの方はこちら")
    ).toBeInTheDocument();
  });

  it("リスト名が提供されていない場合、汎用的なタイトルが表示される", () => {
    const propsWithoutListName = {
      ...defaultProps,
      listName: undefined,
    };

    render(<BookmarkSignupModal {...propsWithoutListName} />);

    expect(screen.getByText(/このリストを/)).toBeInTheDocument();
    expect(screen.getByText("ブックマーク")).toBeInTheDocument();
    expect(screen.getByText(/しませんか？/)).toBeInTheDocument();
  });

  it("閉じるボタンをクリックするとonCloseが呼ばれる", () => {
    const mockOnClose = jest.fn();
    render(<BookmarkSignupModal {...defaultProps} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText("閉じる");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("サインアップリンクが正しいhrefを持つ", () => {
    render(<BookmarkSignupModal {...defaultProps} />);

    const signupLink = screen
      .getByText("無料で始めてブックマーク保存")
      .closest("a");
    expect(signupLink).toHaveAttribute(
      "href",
      "/signup?bookmark=list-123&returnTo=/lists"
    );
  });

  it("ログインリンクが正しいhrefを持つ", () => {
    render(<BookmarkSignupModal {...defaultProps} />);

    const loginLink = screen.getByText("すでにアカウントをお持ちの方はこちら");
    expect(loginLink).toHaveAttribute(
      "href",
      "/login?bookmark=list-123&returnTo=/lists"
    );
  });

  it("モーダルが閉じている時は何も表示されない", () => {
    render(<BookmarkSignupModal {...defaultProps} isOpen={false} />);

    const dialog = screen.getByTestId("dialog");
    expect(dialog).toHaveStyle({ display: "none" });
  });

  it("アイコンが正しく表示される", () => {
    render(<BookmarkSignupModal {...defaultProps} />);

    // 複数のbookmarkアイコンが存在するためgetAllByTestIdを使用
    expect(screen.getAllByTestId("icon-bookmark")).toHaveLength(2);
    expect(screen.getByTestId("icon-share2")).toBeInTheDocument();
    expect(screen.getByTestId("icon-x")).toBeInTheDocument();
  });
});
