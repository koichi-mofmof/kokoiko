import { render, screen, fireEvent } from "@testing-library/react";
import { SignupPromptBanner } from "@/app/components/conversion/SignupPromptBanner";
import { trackConversionEvents } from "@/lib/analytics/events";

// アナリティクスのモック
jest.mock("@/lib/analytics/events", () => ({
  trackConversionEvents: {
    bannerShown: jest.fn(),
    bannerCtaClicked: jest.fn(),
    bannerDetailClicked: jest.fn(),
    bannerDismissed: jest.fn(),
  },
}));

// Next.js Link のモック
jest.mock("next/link", () => {
  return ({ children, href, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  );
});

const mockTrackConversionEvents = trackConversionEvents as jest.Mocked<
  typeof trackConversionEvents
>;

describe("SignupPromptBanner", () => {
  const defaultProps = {
    listId: "test-list-id",
    onDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("バナーが正常にレンダリングされること", () => {
    render(<SignupPromptBanner {...defaultProps} />);

    expect(screen.getByText(/このリストを見ていて/)).toBeInTheDocument();
    expect(screen.getByText(/ClippyMapなら/)).toBeInTheDocument();
    expect(screen.getByText("今すぐ作ってみる")).toBeInTheDocument();
    expect(screen.getByText("詳細を見る")).toBeInTheDocument();
  });

  it("バナー表示時にbannerShownイベントが送信されること", () => {
    render(<SignupPromptBanner {...defaultProps} />);

    expect(mockTrackConversionEvents.bannerShown).toHaveBeenCalledWith(
      "test-list-id"
    );
  });

  it("CTAボタンクリック時にbannerCtaClickedイベントが送信されること", () => {
    render(<SignupPromptBanner {...defaultProps} />);

    const ctaButton = screen.getByText("今すぐ作ってみる");
    fireEvent.click(ctaButton);

    expect(mockTrackConversionEvents.bannerCtaClicked).toHaveBeenCalledWith(
      "test-list-id"
    );
  });

  it("詳細ボタンクリック時にbannerDetailClickedイベントが送信されること", () => {
    render(<SignupPromptBanner {...defaultProps} />);

    const detailButton = screen.getByText("詳細を見る");
    fireEvent.click(detailButton);

    expect(mockTrackConversionEvents.bannerDetailClicked).toHaveBeenCalledWith(
      "test-list-id"
    );
  });

  it("閉じるボタンクリック時にbannerDismissedイベントが送信されること", () => {
    render(<SignupPromptBanner {...defaultProps} />);

    const closeButton = screen.getByLabelText("バナーを閉じる");
    fireEvent.click(closeButton);

    expect(mockTrackConversionEvents.bannerDismissed).toHaveBeenCalledWith(
      "test-list-id"
    );
    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it("閉じるボタンクリック後にバナーが非表示になること", () => {
    render(<SignupPromptBanner {...defaultProps} />);

    const closeButton = screen.getByLabelText("バナーを閉じる");
    fireEvent.click(closeButton);

    expect(screen.queryByText(/このリストを見ていて/)).not.toBeInTheDocument();
  });
});
