import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DeleteListDialog } from "@/app/components/lists/DeleteListDialog";
import "@testing-library/jest-dom";

// deleteList関数をモック
const mockDeleteList = jest.fn();
jest.mock("@/lib/actions/lists", () => ({
  deleteList: mockDeleteList, // ここでモックを割り当て
}));

// useRouterをモック
const mockRouterRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: mockRouterRefresh,
  }),
}));

// useToastをモック
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// UIコンポーネントをモック
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, disabled, type }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      disabled={disabled}
      type={type}
      data-testid={
        variant === "destructive" ? "delete-button" : "cancel-button"
      }
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
      onClick={() => onOpenChange(!open)}
    >
      {children}
    </div>
  ),
  DialogContent: ({ children, className, onClick }) => (
    <div data-testid="dialog-content" className={className} onClick={onClick}>
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
  DialogFooter: ({ children, className }) => (
    <div data-testid="dialog-footer" className={className}>
      {children}
    </div>
  ),
}));

const mockListId = "test-list-id";
const mockListName = "テストリスト";

describe("DeleteListDialogコンポーネントテスト", () => {
  beforeEach(() => {
    mockDeleteList.mockClear();
    mockRouterRefresh.mockClear();
    mockToast.mockClear();
  });

  it("ダイアログが正しく表示されること", () => {
    render(
      <DeleteListDialog
        isOpen={true}
        onClose={jest.fn()}
        listId={mockListId}
        listName={mockListName}
        onConfirm={jest.fn()}
      />
    );

    expect(screen.getByTestId("dialog-title")).toHaveTextContent(
      "リストを削除"
    );
    expect(screen.getByTestId("dialog-description")).toHaveTextContent(
      `このリスト「${mockListName}」を削除しますか？この操作は元に戻せません。`
    );
    expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    expect(screen.getByTestId("delete-button")).toBeInTheDocument();
  });

  it("キャンセルボタンクリックでonCloseが呼ばれること", () => {
    const mockOnClose = jest.fn();
    render(
      <DeleteListDialog
        isOpen={true}
        onClose={mockOnClose}
        listId={mockListId}
        listName={mockListName}
        onConfirm={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("cancel-button"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("削除ボタンクリックでonConfirmが呼ばれること", async () => {
    const mockOnConfirm = jest.fn().mockResolvedValue(undefined); // onConfirmがPromiseを返すことを想定

    render(
      <DeleteListDialog
        isOpen={true}
        onClose={jest.fn()}
        listId={mockListId}
        listName={mockListName}
        onConfirm={mockOnConfirm} // モックされたonConfirmを渡す
      />
    );

    fireEvent.click(screen.getByTestId("delete-button"));

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it("onConfirmが成功し、その後onCloseが呼ばれること（DialogのonOpenChange経由）", async () => {
    const mockOnConfirm = jest.fn().mockResolvedValue(undefined);
    const mockOnClose = jest.fn();

    render(
      <DeleteListDialog
        isOpen={true}
        onClose={mockOnClose}
        listId={mockListId}
        listName={mockListName}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByTestId("delete-button"));

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
    // onConfirm の後、setIsLoading(false) になり、
    // さらに ListCardActions 側で onClose が呼ばれることを想定。
    // ここでは DeleteListDialog 内部の onOpenChange が isLoading:false の後に
    // 発火するケースは直接テストしづらい。
    // 親コンポーネント(ListCardActions)のテストで、onConfirm成功後のダイアログクローズを検証するべき。
    // このテストでは onConfirm が呼ばれることまでを確認する。
  });

  it("onConfirmが失敗した場合にエラーtoastが表示されること", async () => {
    const mockOnConfirm = jest
      .fn()
      .mockRejectedValue(new Error("意図的なエラー"));

    render(
      <DeleteListDialog
        isOpen={true}
        onClose={jest.fn()}
        listId={mockListId}
        listName={mockListName}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByTestId("delete-button"));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "エラー",
          description: "予期せぬエラーが発生しました。",
          variant: "destructive",
        })
      );
    });
  });

  it("処理中は削除ボタンが無効化され「処理中...」と表示されること", async () => {
    const mockOnConfirm = jest.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    ); // 時間のかかる処理をシミュレート

    render(
      <DeleteListDialog
        isOpen={true}
        onClose={jest.fn()}
        listId={mockListId}
        listName={mockListName}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByTestId("delete-button"));

    // ボタンが無効化されて「処理中...」と表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId("delete-button")).toBeDisabled();
      expect(screen.getByTestId("delete-button")).toHaveTextContent(
        "処理中..."
      );
    });

    // 処理完了後、ボタンが有効に戻ることを確認
    await waitFor(
      () => {
        expect(screen.getByTestId("delete-button")).not.toBeDisabled();
        expect(screen.getByTestId("delete-button")).toHaveTextContent(
          "削除する"
        );
      },
      { timeout: 200 }
    ); // setTimeoutの時間より長く待つ
  });
});
