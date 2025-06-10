import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ListCardActions } from "@/app/components/lists/ListCardActions";
import "@testing-library/jest-dom";

// deleteListアクションをモック
// const mockDeleteList = jest.fn(); // グローバルスコープのモック変数は削除

jest.mock("@/lib/actions/lists", () => ({
  ...jest.requireActual("@/lib/actions/lists"),
  deleteList: jest.fn(), // jest.fn()を直接モック実装として使用
}));

// next/navigationのモック
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    refresh: jest.fn(),
    push: jest.fn(),
  })),
}));

// Lucideアイコンをモック
jest.mock("lucide-react", () => ({
  Edit: () => <span data-testid="edit-icon">編集アイコン</span>,
  MoreHorizontal: () => <span data-testid="more-icon">詳細アイコン</span>,
  Trash2: () => <span data-testid="trash-icon">削除アイコン</span>,
  Share: () => <span data-testid="share-icon">共有アイコン</span>,
  UserPlus: () => <span data-testid="userplus-icon">ユーザー追加アイコン</span>,
}));

// toastをモック
const mockToast = jest.fn(); // これはグローバルでOK
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// ListCardActions が依存するダイアログコンポーネントのモック
jest.mock("@/app/components/lists/EditListDialog", () => ({
  EditListDialog: ({ isOpen, onClose, list, onSuccess }) =>
    isOpen ? (
      <div
        data-testid="edit-list-dialog"
        data-open={isOpen.toString()}
        data-list-id={list.id}
      >
        EditListDialog for {list.name}
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));
jest.mock("@/app/components/lists/DeleteListDialog", () => ({
  DeleteListDialog: ({ isOpen, onClose, listName, onConfirm }) =>
    isOpen ? (
      <div data-testid="delete-list-dialog">
        DeleteListDialog for {listName}
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>Confirm Delete</button>
      </div>
    ) : null,
}));
jest.mock("@/app/components/lists/ShareSettingsDialog", () => ({
  ShareSettingsDialog: ({ isOpen, onClose, list, onSuccess }) =>
    isOpen ? (
      <div data-testid="share-settings-dialog">
        ShareSettingsDialog for {list.name}
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save Settings</button>
      </div>
    ) : null,
}));
jest.mock("@/app/components/lists/ShareLinkIssuedDialog", () => ({
  ShareLinkIssuedDialog: ({ isOpen, onClose, shareUrl }) =>
    isOpen ? (
      <div data-testid="share-link-issued-dialog">
        ShareLinkIssuedDialog with URL: {shareUrl}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

// ShareSettingsDialog が依存するダイアログのモック
jest.mock("@/app/components/lists/DeleteShareLinkDialog", () => ({
  DeleteShareLinkDialog: ({ isOpen, onClose, onConfirm, linkName }) =>
    isOpen ? (
      <div data-testid="delete-share-link-dialog">
        DeleteShareLinkDialog for {linkName}
        <button onClick={onClose}>Close</button>
        <button onClick={onConfirm}>Confirm Delete Share Link</button>
      </div>
    ) : null,
}));
jest.mock("@/app/components/lists/EditShareLinkDialog", () => ({
  EditShareLinkDialog: ({
    isOpen,
    onClose,
    onSave,
    link,
    currentPermission,
    currentActive,
  }) =>
    isOpen ? (
      <div data-testid="edit-share-link-dialog">
        EditShareLinkDialog for token: {link?.token}
        <button onClick={onClose}>Close</button>
        <button onClick={onSave}>Save Share Link</button>
      </div>
    ) : null,
}));

// ListFormComponent のモックを追加
jest.mock("@/app/components/lists/ListFormComponent", () => ({
  ListFormComponent: ({ onSubmit, onCancel, submitButtonText }) => (
    <form
      data-testid="list-form-component"
      onSubmit={(e) => {
        e.preventDefault();
        // 簡単なフォームデータを作成して onSubmit を呼び出す
        const formData = new FormData();
        formData.append("name", "Mock Form Name");
        formData.append("description", "Mock Form Description");
        formData.append("isPublic", "false");
        onSubmit(formData); // ListFormData を期待するが、テストではFormDataで代用
      }}
    >
      <button type="submit">{submitButtonText || "送信"}</button>
      {onCancel && (
        <button type="button" onClick={onCancel}>
          キャンセル
        </button>
      )}
    </form>
  ),
}));

// DropdownMenu系コンポーネントのモック
jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({ children }) => (
    <div data-testid="dropdown-menu-trigger">{children}</div>
  ),
  DropdownMenuContent: ({ children, ...props }) => (
    <div data-testid="dropdown-menu-content" {...props}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick }) => (
    <div data-testid="dropdown-menu-item" onClick={onClick}>
      {children}
    </div>
  ),
  DropdownMenuSeparator: () => <div data-testid="dropdown-menu-separator" />,
}));

// window.matchMediaのモック
if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
  });
}

describe("ListCardActionsコンポーネントテスト", () => {
  // テスト用リストデータ
  const mockOwnedList = {
    id: "owned-list-id",
    name: "所有リスト",
    description: "説明",
    created_by: "test-user-id", // 現在のユーザーIDと同じ
    permission: "owner", // 所有者
  };

  const mockEditableList = {
    id: "editable-list-id",
    name: "編集可能リスト",
    description: "説明",
    created_by: "other-user-id", // 現在のユーザーIDと異なる
    permission: "edit", // "write" から "edit" に変更
  };

  const mockReadOnlyList = {
    id: "readonly-list-id",
    name: "読み取り専用リスト",
    description: "説明",
    created_by: "other-user-id",
    permission: "view", // "read" から "view" に修正
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("アクションボタンが表示されること", () => {
    render(<ListCardActions list={mockOwnedList} />);

    // アクションボタンが表示されていることを確認
    expect(
      screen.getByRole("button", { name: "リストアクション" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("more-icon")).toBeInTheDocument();
  });

  it("アクションボタンをクリックするとメニューが表示されること", () => {
    render(<ListCardActions list={mockOwnedList} />);

    // メニュートリガーをクリック
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));

    // メニューアイテムが表示されることを確認
    expect(screen.getByText("リストを編集")).toBeInTheDocument();
    expect(screen.getByText("共同編集者を招待")).toBeInTheDocument();
    expect(screen.getByText("リストを削除")).toBeInTheDocument();
  });

  it("所有リストの場合、編集と削除の両方のメニューが表示されること", () => {
    render(<ListCardActions list={mockOwnedList} />);

    // メニュートリガーをクリック
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));

    // 編集と削除の両方のメニューが表示されることを確認
    expect(screen.getByText("リストを編集")).toBeInTheDocument();
    expect(screen.getByText("リストを削除")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-menu-separator")).toBeInTheDocument();
  });

  it("編集可能なリストの場合、編集メニューのみ表示されること", () => {
    render(<ListCardActions list={mockEditableList} />);

    // メニュートリガーをクリック
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));

    // 編集メニューが表示されることを確認
    expect(screen.getByText("リストを編集")).toBeInTheDocument();
    expect(screen.getByText("共同編集者を招待")).toBeInTheDocument();

    // 削除メニューは表示されないことを確認
    expect(screen.queryByText("リストを削除")).toBeNull();
    expect(screen.queryByTestId("dropdown-menu-separator")).toBeNull();
  });

  it("読み取り専用リストの場合、アクションボタンが表示されないこと", () => {
    render(<ListCardActions list={mockReadOnlyList} />);

    // アクションボタンが表示されないことを確認
    expect(
      screen.queryByRole("button", { name: "リストアクション" })
    ).toBeNull();
  });

  it("編集メニューをクリックすると編集ダイアログが表示されること", async () => {
    render(<ListCardActions list={mockOwnedList} />);

    // メニュートリガーをクリック
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));

    // 編集メニューをクリック
    fireEvent.click(screen.getByText("リストを編集"));

    // 編集ダイアログが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId("edit-list-dialog")).toBeInTheDocument();
      expect(screen.getByTestId("edit-list-dialog")).toHaveAttribute(
        "data-open",
        "true"
      );
      expect(screen.getByTestId("edit-list-dialog")).toHaveAttribute(
        "data-list-id",
        mockOwnedList.id
      );
    });
  });

  it("削除メニューをクリックすると削除ダイアログが表示されること", async () => {
    render(<ListCardActions list={mockOwnedList} />);

    // メニュートリガーをクリック
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));

    // 削除メニューをクリック
    fireEvent.click(screen.getByText("リストを削除"));

    // 削除ダイアログが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId("delete-list-dialog")).toBeInTheDocument();
    });
  });

  it("編集ダイアログが閉じるとステートが更新されること", async () => {
    render(<ListCardActions list={mockOwnedList} />);

    // メニュートリガーをクリック
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));

    // 編集メニューをクリック
    fireEvent.click(screen.getByText("リストを編集"));

    // 編集ダイアログが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId("edit-list-dialog")).toBeInTheDocument();
    });

    // ダイアログをクリックして閉じる
    fireEvent.click(screen.getByText("Close"));

    // ダイアログが再表示されないことを確認
    expect(screen.queryByTestId("edit-list-dialog")).toBeNull();
  });

  it("削除ダイアログが閉じるとステートが更新されること", async () => {
    render(<ListCardActions list={mockOwnedList} />);

    // メニュートリガーをクリック
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));

    // 削除メニューをクリック
    fireEvent.click(screen.getByText("リストを削除"));

    // 削除ダイアログが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId("delete-list-dialog")).toBeInTheDocument();
    });

    // ダイアログをクリックして閉じる
    fireEvent.click(screen.getByText("Cancel"));

    // ダイアログが再表示されないことを確認
    expect(screen.queryByTestId("delete-list-dialog")).toBeNull();
  });

  it("所有リストが非所有リストに変化した場合のアクション表示をテストすること", () => {
    // 初回レンダリングで所有リストを表示
    const { rerender } = render(<ListCardActions list={mockOwnedList} />);

    // 所有リストの場合、アクションボタンが表示されることを確認
    expect(
      screen.getByRole("button", { name: "リストアクション" })
    ).toBeInTheDocument();

    // リストを編集可能リストに変更して再レンダリング
    rerender(<ListCardActions list={mockEditableList} />);

    // 編集権かつ非所有リストの場合、編集アクションのみ表示されることを確認
    expect(
      screen.getByRole("button", { name: "リストアクション" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));
    expect(screen.getByText("リストを編集")).toBeInTheDocument();
    expect(screen.queryByText("リストを削除")).toBeNull();

    // 読み取り専用リストに変更して再レンダリング
    rerender(<ListCardActions list={mockReadOnlyList} />);

    // 読み取り権限のみの場合、アクションボタンが表示されないことを確認
    expect(
      screen.queryByRole("button", { name: "リストアクション" })
    ).toBeNull();
  });

  it("編集ダイアログが正常に閉じることをテストすること", async () => {
    render(<ListCardActions list={mockOwnedList} />);

    // メニュートリガーをクリック
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));

    // 編集メニューをクリック
    fireEvent.click(screen.getByText("リストを編集"));

    // 編集ダイアログが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId("edit-list-dialog")).toBeInTheDocument();
      expect(screen.getByTestId("edit-list-dialog")).toHaveAttribute(
        "data-open",
        "true"
      );
    });

    // ダイアログをクリックして閉じる
    fireEvent.click(screen.getByText("Close"));

    // ダイアログが閉じることをテストする
    // EditListDialogのモックはクリック時にonCloseを呼び出すように設定されている
    await waitFor(() => {
      expect(screen.queryByTestId("edit-list-dialog")).toBeNull();
    });
  });

  // 追加: 削除成功時のテスト
  it("削除ダイアログで確認ボタンを押すとリストが削除され、成功toastが表示され、onSuccessが呼ばれること", async () => {
    const {
      deleteList: mockedDeleteListAction,
    } = require("@/lib/actions/lists"); // モックされた関数をインポート
    mockedDeleteListAction.mockResolvedValue({ success: true }); // mockResolvedValueの対象を修正

    const mockOnSuccess = jest.fn();
    render(<ListCardActions list={mockOwnedList} onSuccess={mockOnSuccess} />);

    // メニュートリガーをクリック
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));
    // 削除メニューをクリック
    fireEvent.click(screen.getByText("リストを削除"));

    // 削除ダイアログが表示されるのを待つ
    await waitFor(() => {
      expect(screen.getByTestId("delete-list-dialog")).toBeInTheDocument();
    });

    // 削除ダイアログ内の確認ボタンをクリック
    fireEvent.click(screen.getByText("Confirm Delete"));

    // deleteListが正しいIDで呼ばれたことを確認
    await waitFor(() => {
      expect(mockedDeleteListAction).toHaveBeenCalledWith(mockOwnedList.id); // 呼び出し確認の対象を修正
    });

    // 成功toastが表示されたことを確認
    expect(mockToast).toHaveBeenCalledWith({
      title: "削除完了",
      description: `リスト「${mockOwnedList.name}」を削除しました。`,
    });

    // onSuccessが呼ばれたことを確認
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);

    // ダイアログが閉じたことを確認 (実際にはDeleteListDialogのモックが消えるかどうかで判断)
    // 今回のモックでは isOpen で制御しているので、ListCardActions 側で isDeleteDialogOpen が false になることを期待
    // 直接の検証は難しいが、onSuccessが呼ばれれば副作用として閉じているとみなせる
    // より厳密には、DeleteListDialogのモックをsetIsDeleteDialogOpenを呼ぶように拡張する必要がある
  });

  // 追加: 削除失敗時のテスト
  it("削除ダイアログで確認ボタンを押し、削除が失敗した場合、エラーtoastが表示されること", async () => {
    const {
      deleteList: mockedDeleteListAction,
    } = require("@/lib/actions/lists"); // モックされた関数をインポート
    mockedDeleteListAction.mockResolvedValue({
      success: false,
      error: "テスト削除エラー",
    });
    const mockOnSuccess = jest.fn(); // 失敗時は呼ばれないはず

    render(<ListCardActions list={mockOwnedList} onSuccess={mockOnSuccess} />);

    // メニュートリガーをクリック
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));
    // 削除メニューをクリック
    fireEvent.click(screen.getByText("リストを削除"));

    await waitFor(() => {
      expect(screen.getByTestId("delete-list-dialog")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Confirm Delete"));

    await waitFor(() => {
      expect(mockedDeleteListAction).toHaveBeenCalledWith(mockOwnedList.id); // 呼び出し確認の対象を修正
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "削除失敗",
      description: "テスト削除エラー",
      variant: "destructive",
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
