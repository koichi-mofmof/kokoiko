import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditListDialog } from "@/app/components/lists/EditListDialog";
import "@testing-library/jest-dom";

// updateList関数をモック
jest.mock("@/lib/actions/lists", () => ({
  updateList: jest.fn(),
}));

// toastをモック
jest.mock("@/hooks/use-toast", () => ({
  toast: jest.fn(),
}));

// UIコンポーネントをモック
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }) => (
    <div
      data-testid="dialog"
      data-open={open}
      onClick={() => onOpenChange && onOpenChange(false)}
    >
      {children}
    </div>
  ),
  DialogContent: ({ children, className, onClick, onOpenAutoFocus }) => (
    <div
      data-testid="dialog-content"
      className={className}
      onClick={onClick}
      data-onfocus={onOpenAutoFocus ? "true" : "false"}
    >
      {children}
    </div>
  ),
  DialogHeader: ({ children }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }) => (
    <p data-testid="dialog-description">{children}</p>
  ),
}));

// ListFormComponentをモック
jest.mock("@/app/components/lists/ListFormComponent", () => ({
  ListFormComponent: ({
    initialData,
    onSubmit,
    submitButtonText,
    isSubmitting,
    showCancelButton,
    onCancel,
    cancelButtonText,
  }) => (
    <div data-testid="list-form-component">
      <div data-testid="form-initial-data">{JSON.stringify(initialData)}</div>
      <button
        data-testid="submit-button"
        onClick={() =>
          onSubmit &&
          onSubmit({
            name: "テストリスト (更新)",
            description: "テスト説明 (更新)",
            isPublic: true,
          })
        }
        disabled={isSubmitting}
      >
        {submitButtonText || "送信"}
      </button>
      {showCancelButton && (
        <button data-testid="cancel-button" onClick={onCancel}>
          {cancelButtonText || "キャンセル"}
        </button>
      )}
    </div>
  ),
}));

describe("EditListDialogコンポーネントテスト", () => {
  const mockList = {
    id: "test-list-id",
    name: "テストリスト",
    description: "テスト説明",
    is_public: false,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-02T00:00:00Z",
    created_by: "test-user-id",
  };

  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ダイアログが正しく表示されること", () => {
    render(
      <EditListDialog
        isOpen={true}
        onClose={mockOnClose}
        list={mockList}
        onSuccess={mockOnSuccess}
      />
    );

    // ダイアログが表示されていることを確認
    expect(screen.getByTestId("dialog")).toHaveAttribute("data-open", "true");

    // タイトルと説明が正しいことを確認
    expect(screen.getByTestId("dialog-title")).toHaveTextContent(
      "リストを編集"
    );
    expect(screen.getByTestId("dialog-description")).toHaveTextContent(
      "リストの情報を更新してください"
    );

    // フォームが適切な初期データで表示されていることを確認
    const initialDataJson = JSON.parse(
      screen.getByTestId("form-initial-data").textContent
    );
    expect(initialDataJson).toEqual({
      name: "テストリスト",
      description: "テスト説明",
      isPublic: false,
    });
  });

  it("キャンセルボタンでダイアログが閉じること", () => {
    render(
      <EditListDialog
        isOpen={true}
        onClose={mockOnClose}
        list={mockList}
        onSuccess={mockOnSuccess}
      />
    );

    // キャンセルボタンをクリック
    fireEvent.click(screen.getByTestId("cancel-button"));

    // onCloseが呼ばれることを確認
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("フォーム送信時にリスト更新アクションが呼ばれること", async () => {
    const { updateList } = require("@/lib/actions/lists");
    updateList.mockResolvedValue({
      success: true,
      list: { ...mockList, name: "テストリスト (更新)" },
    });

    render(
      <EditListDialog
        isOpen={true}
        onClose={mockOnClose}
        list={mockList}
        onSuccess={mockOnSuccess}
      />
    );

    // 送信ボタンをクリック
    fireEvent.click(screen.getByTestId("submit-button"));

    // updateList関数が正しいパラメータで呼ばれることを確認
    await waitFor(() => {
      expect(updateList).toHaveBeenCalledWith({
        id: "test-list-id",
        name: "テストリスト (更新)",
        description: "テスト説明 (更新)",
        isPublic: true,
      });
    });

    // 成功時にonSuccessとonCloseが呼ばれることを確認
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("更新エラー時にエラーメッセージが表示されること", async () => {
    const { updateList } = require("@/lib/actions/lists");
    updateList.mockResolvedValue({ success: false, error: "更新エラー" });

    const { toast } = require("@/hooks/use-toast");

    render(
      <EditListDialog
        isOpen={true}
        onClose={mockOnClose}
        list={mockList}
        onSuccess={mockOnSuccess}
      />
    );

    // 送信ボタンをクリック
    fireEvent.click(screen.getByTestId("submit-button"));

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "エラー",
          description: "更新エラー",
          variant: "destructive",
        })
      );
    });

    // 失敗時にonSuccessとonCloseが呼ばれないことを確認
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("予期せぬエラー時にエラーメッセージが表示されること", async () => {
    const { updateList } = require("@/lib/actions/lists");
    updateList.mockRejectedValue(new Error("予期せぬエラー"));

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { toast } = require("@/hooks/use-toast");

    render(
      <EditListDialog
        isOpen={true}
        onClose={mockOnClose}
        list={mockList}
        onSuccess={mockOnSuccess}
      />
    );

    // 送信ボタンをクリック
    fireEvent.click(screen.getByTestId("submit-button"));

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "エラー",
          description: "予期せぬエラーが発生しました。",
          variant: "destructive",
        })
      );
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it("ダイアログ外のクリックで閉じること", () => {
    render(
      <EditListDialog
        isOpen={true}
        onClose={mockOnClose}
        list={mockList}
        onSuccess={mockOnSuccess}
      />
    );

    // ダイアログ領域をクリック
    fireEvent.click(screen.getByTestId("dialog"));

    // onCloseが呼ばれることを確認
    expect(mockOnClose).toHaveBeenCalled();
  });
});
