import { render, screen, fireEvent } from "@testing-library/react";
import { SignupPromptModal } from "@/app/components/conversion/SignupPromptModal";

// Google Analytics のモック
jest.mock("@/lib/analytics/events", () => ({
  trackConversionEvents: {
    promptShown: jest.fn(),
    promptClicked: jest.fn(),
    promptDismissed: jest.fn(),
  },
}));

// Next.js Link のモック
jest.mock("next/link", () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe("SignupPromptModal", () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    listId: "test-list-id",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常にレンダリングされること", () => {
    render(<SignupPromptModal {...defaultProps} />);

    // タイトルの一部をテスト（複数要素に分かれているため）
    expect(screen.getByText("みんなで育てる場所リスト")).toBeInTheDocument();
    // より柔軟なテキストマッチングを使用
    expect(screen.getByText(/作ってみませんか/)).toBeInTheDocument();
    expect(screen.getByText("今すぐ始める")).toBeInTheDocument();
  });

  it("閉じるボタンをクリックしたときにonCloseが呼ばれること", () => {
    render(<SignupPromptModal {...defaultProps} />);

    const closeButton = screen.getByLabelText("閉じる");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("CTAボタンをクリックしたときにonCloseが呼ばれること", () => {
    render(<SignupPromptModal {...defaultProps} />);

    const ctaButton = screen.getByText("今すぐ始める");
    fireEvent.click(ctaButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("ログインリンクをクリックしたときにonCloseが呼ばれること", () => {
    render(<SignupPromptModal {...defaultProps} />);

    const loginLink = screen.getByText("すでにアカウントをお持ちの方はこちら");
    fireEvent.click(loginLink);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("isOpenがfalseの場合、モーダルが表示されないこと", () => {
    render(<SignupPromptModal {...defaultProps} isOpen={false} />);

    expect(
      screen.queryByText("みんなで育てる場所リスト")
    ).not.toBeInTheDocument();
  });

  it("mobileバリアントでレンダリングされること", () => {
    render(<SignupPromptModal {...defaultProps} variant="mobile" />);

    expect(screen.getByText("みんなで育てる場所リスト")).toBeInTheDocument();
  });
});
