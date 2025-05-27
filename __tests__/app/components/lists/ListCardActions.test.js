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

// React hooks をモック
// jest.mock("react", () => {
//   const originalReact = jest.requireActual("react");
//   return {
//     ...originalReact,
//     useState: jest.fn((initial) => [initial, jest.fn()]),
//     useRef: jest.fn(() => ({ current: null })),
//   };
// });

// EditListDialogとDeleteListDialogをモック
jest.mock("@/app/components/lists/EditListDialog", () => {
  return {
    EditListDialog: ({ isOpen, onClose, list, onSuccess }) => {
      const [open, setOpen] = React.useState(isOpen);
      React.useEffect(() => {
        setOpen(isOpen);
      }, [isOpen]);
      if (!open) return null;
      return (
        <div
          data-testid="edit-list-dialog"
          data-open={open}
          data-list-id={list.id}
          onClick={() => {
            setOpen(false);
            onClose && onClose();
          }}
        >
          EditListDialog
          <button>Close Dialog In Mock</button>
        </div>
      );
    },
  };
});

jest.mock("@/app/components/lists/DeleteListDialog", () => {
  return {
    DeleteListDialog: ({ isOpen, onClose, listId, listName, onConfirm }) => {
      const [open, setOpen] = React.useState(isOpen);
      if (!open) return null;
      return (
        <div data-testid="delete-list-dialog">
          <button
            data-testid="confirm-delete-button-in-mock"
            onClick={() => {
              onConfirm && onConfirm();
            }}
          >
            Confirm Delete In Mock
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onClose && onClose();
            }}
          >
            Close Dialog In Mock
          </button>
          DeleteListDialog
        </div>
      );
    },
  };
});

// UIコンポーネントをモック
jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    size,
    variant,
    className,
    "aria-label": ariaLabel,
  }) => (
    <button
      data-testid="action-button"
      onClick={onClick}
      data-size={size}
      data-variant={variant}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuContent: ({ children, align, className, onClick }) => (
    <div
      data-testid="dropdown-menu-content"
      data-align={align}
      className={className}
      onClick={onClick}
    >
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick, className }) => {
    const testId = children.toString().includes("削除")
      ? "delete-menu-item"
      : "edit-menu-item";

    return (
      <button data-testid={testId} onClick={onClick} className={className}>
        {children}
      </button>
    );
  },
  DropdownMenuSeparator: () => <div data-testid="dropdown-menu-separator" />,
  DropdownMenuTrigger: ({ children, asChild }) => (
    <div
      data-testid="dropdown-menu-trigger"
      data-as-child={asChild}
      onClick={(e) => e.preventDefault()}
    >
      {children}
    </div>
  ),
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
}));

// toastをモック
const mockToast = jest.fn(); // これはグローバルでOK
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

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
    permission: "read", // 読み取り権限のみ
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
    expect(screen.getByTestId("action-button")).toBeInTheDocument();
    expect(screen.getByTestId("more-icon")).toBeInTheDocument();
  });

  it("アクションボタンをクリックするとメニューが表示されること", () => {
    render(<ListCardActions list={mockOwnedList} />);

    // メニュートリガーをクリック
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));

    // メニューアイテムが表示されることを確認
    expect(screen.getByTestId("edit-menu-item")).toBeInTheDocument();
    expect(screen.getByTestId("delete-menu-item")).toBeInTheDocument();
  });

  it("所有リストの場合、編集と削除の両方のメニューが表示されること", () => {
    render(<ListCardActions list={mockOwnedList} />);

    // メニュートリガーをクリック
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));

    // 編集と削除の両方のメニューが表示されることを確認
    expect(screen.getByTestId("edit-menu-item")).toBeInTheDocument();
    expect(screen.getByTestId("delete-menu-item")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-menu-separator")).toBeInTheDocument();
  });

  it("編集可能なリストの場合、編集メニューのみ表示されること", () => {
    render(<ListCardActions list={mockEditableList} />);

    // メニュートリガーをクリック
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));

    // 編集メニューが表示されることを確認
    expect(screen.getByTestId("edit-menu-item")).toBeInTheDocument();

    // 削除メニューは表示されないことを確認
    expect(screen.queryByTestId("delete-menu-item")).toBeNull();
    expect(screen.queryByTestId("dropdown-menu-separator")).toBeNull();
  });

  it("読み取り専用リストの場合、アクションボタンが表示されないこと", () => {
    render(<ListCardActions list={mockReadOnlyList} />);

    // アクションボタンが表示されないことを確認
    expect(
      screen.queryByRole("button", { name: "リストアクション" })
    ).toBeNull();
    expect(screen.queryByTestId("action-button")).toBeNull();
  });

  it("編集メニューをクリックすると編集ダイアログが表示されること", async () => {
    render(<ListCardActions list={mockOwnedList} />);

    // メニュートリガーをクリック
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));

    // 編集メニューをクリック
    fireEvent.click(screen.getByTestId("edit-menu-item"));

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
    fireEvent.click(screen.getByTestId("delete-menu-item"));

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
    fireEvent.click(screen.getByTestId("edit-menu-item"));

    // 編集ダイアログが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId("edit-list-dialog")).toBeInTheDocument();
    });

    // ダイアログをクリックして閉じる
    fireEvent.click(screen.getByTestId("edit-list-dialog"));

    // ダイアログが再表示されないことを確認
    expect(screen.queryByTestId("edit-list-dialog")).toBeNull();
  });

  it("削除ダイアログが閉じるとステートが更新されること", async () => {
    render(<ListCardActions list={mockOwnedList} />);

    // メニュートリガーをクリック
    fireEvent.click(screen.getByRole("button", { name: "リストアクション" }));

    // 削除メニューをクリック
    fireEvent.click(screen.getByTestId("delete-menu-item"));

    // 削除ダイアログが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId("delete-list-dialog")).toBeInTheDocument();
    });

    // ダイアログをクリックして閉じる
    fireEvent.click(screen.getByText("Close Dialog In Mock"));

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
    expect(screen.getByTestId("edit-menu-item")).toBeInTheDocument();
    expect(screen.queryByTestId("delete-menu-item")).toBeNull();

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
    fireEvent.click(screen.getByTestId("edit-menu-item"));

    // 編集ダイアログが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId("edit-list-dialog")).toBeInTheDocument();
      expect(screen.getByTestId("edit-list-dialog")).toHaveAttribute(
        "data-open",
        "true"
      );
    });

    // ダイアログをクリックして閉じる
    fireEvent.click(screen.getByTestId("edit-list-dialog"));

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
    fireEvent.click(screen.getByTestId("delete-menu-item"));

    // 削除ダイアログが表示されるのを待つ
    await waitFor(() => {
      expect(screen.getByTestId("delete-list-dialog")).toBeInTheDocument();
    });

    // 削除ダイアログ内の確認ボタンをクリック
    fireEvent.click(screen.getByTestId("confirm-delete-button-in-mock"));

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
    fireEvent.click(screen.getByTestId("delete-menu-item"));

    await waitFor(() => {
      expect(screen.getByTestId("delete-list-dialog")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("confirm-delete-button-in-mock"));

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
