import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateListModal } from "../../../../app/lists/_components/CreateListModal";
import "@testing-library/jest-dom";

// createList関数をモック
jest.mock("@/lib/actions/lists", () => ({
  createList: jest.fn(),
}));

// useRouterをモック
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// useToastをモック (修正)
const globallyMockedToastFn = jest.fn(); // このモック関数をファイルスコープで定義
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    // useToast() が呼ばれるたびに
    toast: globallyMockedToastFn, // 同じモック関数インスタンスを返す
  }),
}));

// UIコンポーネントをモック
jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    variant,
    className,
    disabled,
    type,
    "aria-label": ariaLabel,
    "aria-haspopup": ariaHaspopup,
    "aria-expanded": ariaExpanded,
  }) => (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      type={type}
      aria-label={ariaLabel}
      aria-haspopup={ariaHaspopup}
      aria-expanded={ariaExpanded}
      data-variant={variant}
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }) => (
    <div
      data-testid="dialog"
      data-open={open}
      onClick={(e) => onOpenChange && onOpenChange(!open)}
    >
      {children}
    </div>
  ),
  DialogContent: ({ children, className, onOpenAutoFocus }) => (
    <div
      data-testid="dialog-content"
      className={className}
      onClick={(e) => onOpenAutoFocus && onOpenAutoFocus(e)}
    >
      {children}
    </div>
  ),
  DialogHeader: ({ children }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children, asChild }) => (
    <div data-testid="dialog-trigger" data-aschild={asChild}>
      {children}
    </div>
  ),
  DialogFooter: ({ children }) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));

jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipProvider: ({ children }) => (
    <div data-testid="tooltip-provider">{children}</div>
  ),
  TooltipTrigger: ({ children, asChild }) => (
    <div data-testid="tooltip-trigger" data-aschild={asChild}>
      {children}
    </div>
  ),
}));

// ListFormComponentをモック
jest.mock("../../../../app/lists/_components/ListFormComponent", () => ({
  ListFormComponent: ({
    onSubmit,
    submitButtonText,
    isSubmitting,
    showCancelButton,
    onCancel,
    cancelButtonText,
  }) => {
    const handleSubmit = () => {
      onSubmit({
        name: "テストリスト",
        description: "テスト説明",
        isPublic: false,
      });
    };
    return (
      <div data-testid="list-form">
        <input data-testid="list-name-input" placeholder="リスト名" />
        <textarea data-testid="list-description-input" placeholder="説明" />
        <button
          data-testid="submit-button"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "処理中..." : submitButtonText}
        </button>
        {showCancelButton && (
          <button data-testid="cancel-button" onClick={onCancel}>
            {cancelButtonText}
          </button>
        )}
      </div>
    );
  },
}));

jest.mock("lucide-react", () => ({
  ListPlus: () => <div data-testid="list-plus-icon">ListPlusIcon</div>,
}));

describe("CreateListModalコンポーネントテスト", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("モーダルトリガーボタンが表示されること", () => {
    render(<CreateListModal />);
    const button = screen.getByTestId("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "新規リスト作成");
  });

  it("ボタンクリックでモーダルが表示されること", async () => {
    render(<CreateListModal />);

    // ダイアログトリガーを取得してクリック
    const dialogTrigger = screen.getByTestId("dialog-trigger");
    const button = screen.getByTestId("button");
    fireEvent.click(button);

    // モーダルが表示されることを確認
    const dialogTitle = screen.getByTestId("dialog-title");
    expect(dialogTitle).toHaveTextContent("新しいリストを作成");

    // フォームが表示されることを確認
    const listForm = screen.getByTestId("list-form");
    expect(listForm).toBeInTheDocument();
  });

  it("キャンセルボタンでモーダルが閉じること", async () => {
    const { createList } = require("@/lib/actions/lists");

    render(<CreateListModal />);

    // モーダルを開く
    const button = screen.getByTestId("button");
    fireEvent.click(button);

    // キャンセルボタンをクリック
    const cancelButton = screen.getByTestId("cancel-button");
    fireEvent.click(cancelButton);

    // createList関数が呼ばれないことを確認
    expect(createList).not.toHaveBeenCalled();
  });

  it("フォーム送信時にリスト作成アクションが呼ばれること", async () => {
    const { createList } = require("@/lib/actions/lists");
    createList.mockResolvedValue({ success: true, listId: "test-list-id" });

    render(<CreateListModal />);

    // モーダルを開く
    const button = screen.getByTestId("button");
    fireEvent.click(button);

    // 送信ボタンをクリック
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    // FormDataオブジェクトが作成され、createList関数が呼ばれることを確認
    await waitFor(() => {
      expect(createList).toHaveBeenCalled();
    });
  });

  it("エラー時にエラーメッセージが表示されること", async () => {
    const { createList } = require("@/lib/actions/lists");
    createList.mockResolvedValue({ success: false, error: "テストエラー" });

    render(<CreateListModal />);

    // モーダルを開く
    const button = screen.getByTestId("button");
    fireEvent.click(button);

    // 送信ボタンをクリック
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    // エラートーストが表示されることを確認
    await waitFor(() => {
      expect(globallyMockedToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "エラー",
          variant: "destructive",
          description: "テストエラー",
        })
      );
    });
  });
});
