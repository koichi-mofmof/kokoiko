import { fireEvent, render, screen } from "@testing-library/react";
import { SignupPromptModal } from "@/app/components/conversion/SignupPromptModal";

// Google Analytics のモック
jest.mock("@/lib/analytics/events", () => ({
  trackConversionEvents: {
    promptShown: jest.fn(),
    promptClicked: jest.fn(),
    promptDismissed: jest.fn(),
  },
}));

// Next.js router のモック
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Math.randomをモックしてA/Bテストの結果を制御
let mockMathRandom = jest.spyOn(Math, "random");

describe("SignupPromptModal", () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    listId: "test-list-id",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Math.randomもリセット
    mockMathRandom.mockRestore();
    mockMathRandom = jest.spyOn(Math, "random");
  });

  afterEach(() => {
    mockMathRandom.mockRestore();
  });

  describe("A/Bテスト - 感情的デザイン（emotional）", () => {
    beforeEach(() => {
      // Math.randomを0.3に固定（0.3 < 0.5 → emotional バリアントを選択）
      mockMathRandom.mockReturnValue(0.3);
    });

    it("感情的デザインが正常にレンダリングされること", () => {
      render(<SignupPromptModal {...defaultProps} />);

      expect(screen.getByText(/恋人や友達と/)).toBeInTheDocument();
      expect(screen.getByText(/みんなで育てる場所リスト/)).toBeInTheDocument();
      expect(screen.getByText(/作ってみませんか/)).toBeInTheDocument();
      expect(
        screen.getByText("旅行プランをリアルタイムで共同編集")
      ).toBeInTheDocument();
      expect(
        screen.getByText("女子会で行きたいお店をピックアップ")
      ).toBeInTheDocument();
      expect(
        screen.getByText("共通の趣味の仲間とスポットを共有")
      ).toBeInTheDocument();
      expect(screen.getByText("今すぐ始める")).toBeInTheDocument();
    });
  });

  describe("A/Bテスト - 対比型デザイン（comparison）", () => {
    beforeEach(() => {
      // Math.randomを0.7に固定（0.7 >= 0.5 → comparison バリアントを選択）
      mockMathRandom.mockReturnValue(0.7);
    });

    it("対比型デザインが正常にレンダリングされること", () => {
      render(<SignupPromptModal {...defaultProps} />);

      expect(screen.getByText(/このリストを見ていて/)).toBeInTheDocument();
      expect(screen.getByText(/「自分も作ってみたい」/)).toBeInTheDocument();
      expect(screen.getByText(/と思いませんか？/)).toBeInTheDocument();
      expect(
        screen.getByText(
          /ClippyMapなら、「行きたい場所リスト」が簡単に作れます/
        )
      ).toBeInTheDocument();
      expect(screen.getByText("よくあるお悩み")).toBeInTheDocument();
      expect(screen.getByText("ClippyMapなら...")).toBeInTheDocument();
      expect(screen.getByText("今すぐ作ってみる（無料）")).toBeInTheDocument();
    });

    it("対比型の内容が表示されること", () => {
      // 新しいpropsオブジェクトを作成してコンポーネントの状態をリセット
      const freshProps = {
        isOpen: true,
        onClose: mockOnClose,
        listId: "test-list-comparison",
      };

      render(<SignupPromptModal {...freshProps} />);

      // Before側（2項目、アイコン中心デザイン）
      expect(
        screen.getByText("行きたい場所の情報が様々なアプリにバラバラ")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "友達に「今度ここ行こう!」と送ったリンクがLINEに埋もれる"
        )
      ).toBeInTheDocument();

      // After側（2項目、アイコン中心デザイン）
      expect(
        screen.getByText("URLひとつで行きたい場所をまとめて管理")
      ).toBeInTheDocument();
      expect(screen.getByText("友達と一緒にリストを編集")).toBeInTheDocument();
    });
  });

  describe("共通機能", () => {
    beforeEach(() => {
      // デフォルトでcomparison バリアントを使用
      mockMathRandom.mockReturnValue(0.7);
    });

    it("閉じるボタンをクリックしたときにonCloseが呼ばれること", () => {
      render(<SignupPromptModal {...defaultProps} />);

      const closeButton = screen.getByLabelText("閉じる");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("CTAボタンをクリックしたときにonCloseが呼ばれること - emotional", () => {
      mockMathRandom.mockReturnValue(0.3); // emotional バリアント
      render(<SignupPromptModal {...defaultProps} />);

      const ctaButton = screen.getByText("今すぐ始める");
      fireEvent.click(ctaButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("CTAボタンをクリックしたときにonCloseが呼ばれること - comparison", () => {
      mockMathRandom.mockReturnValue(0.7); // comparison バリアント
      render(<SignupPromptModal {...defaultProps} />);

      const ctaButton = screen.getByText("今すぐ作ってみる（無料）");
      fireEvent.click(ctaButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("ログインリンクをクリックしたときにonCloseが呼ばれること - emotional", () => {
      mockMathRandom.mockReturnValue(0.3); // emotional バリアント
      render(<SignupPromptModal {...defaultProps} />);

      const loginLink =
        screen.getByText("すでにアカウントをお持ちの方はこちら");
      fireEvent.click(loginLink);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("ログインリンクをクリックしたときにonCloseが呼ばれること - comparison", () => {
      mockMathRandom.mockReturnValue(0.7); // comparison バリアント
      render(<SignupPromptModal {...defaultProps} />);

      const loginLink = screen.getByText("既にアカウントをお持ちの方はこちら");
      fireEvent.click(loginLink);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("isOpenがfalseの場合、モーダルが表示されないこと", () => {
      render(<SignupPromptModal {...defaultProps} isOpen={false} />);

      expect(
        screen.queryByText(/このリストを見ていて/)
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/恋人や友達と/)).not.toBeInTheDocument();
    });

    it("モバイル版で正しいクラスが適用されること - emotional", () => {
      mockMathRandom.mockReturnValue(0.3); // emotional バリアント
      const { container } = render(
        <SignupPromptModal {...defaultProps} variant="mobile" />
      );

      const modal = container.querySelector('[role="dialog"]');
      expect(modal).toHaveClass("w-[90%]", "max-w-[340px]");
    });

    it("モバイル版で正しいクラスが適用されること - comparison", () => {
      mockMathRandom.mockReturnValue(0.7); // comparison バリアント
      const { container } = render(
        <SignupPromptModal {...defaultProps} variant="mobile" />
      );

      const modal = container.querySelector('[role="dialog"]');
      expect(modal).toHaveClass("w-[85%]", "max-w-[360px]");
    });
  });

  describe("A/Bテストのバリアント決定", () => {
    it("Math.random() < 0.5の場合はemotionalバリアントが選択される", () => {
      mockMathRandom.mockReturnValue(0.2);
      render(<SignupPromptModal {...defaultProps} />);

      // emotionalバリアントの特徴的なテキストが表示される
      expect(screen.getByText(/恋人や友達と/)).toBeInTheDocument();
      expect(screen.getByText("今すぐ始める")).toBeInTheDocument();
    });

    it("Math.random() >= 0.5の場合はcomparisonバリアントが選択される", () => {
      mockMathRandom.mockReturnValue(0.8);
      render(<SignupPromptModal {...defaultProps} />);

      // comparisonバリアントの特徴的なテキストが表示される
      expect(screen.getByText(/このリストを見ていて/)).toBeInTheDocument();
      expect(screen.getByText("今すぐ作ってみる（無料）")).toBeInTheDocument();
    });
  });
});
