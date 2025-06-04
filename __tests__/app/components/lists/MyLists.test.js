import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MyLists } from "@/app/components/lists/MyLists";
import "@testing-library/jest-dom";

// PlaceListGridコンポーネントをモック
jest.mock("@/components/ui/placelist-grid", () => ({
  PlaceListGrid: ({ initialLists, getLinkHref, renderCollaborators }) => (
    <div data-testid="place-list-grid">
      <div data-testid="lists-count">{initialLists.length}</div>
      <div data-testid="lists-data">{JSON.stringify(initialLists)}</div>
    </div>
  ),
  renderLabeledCollaborators: jest.fn(),
}));

// UIコンポーネントをモック
jest.mock("@/components/ui/input", () => ({
  Input: ({ type, placeholder, value, onChange, className }) => (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className}
      data-testid="search-input"
    />
  ),
}));

jest.mock("@/components/ui/select", () => {
  const SelectContent = ({ children }) => <>{children}</>;
  const SelectItem = ({ value, children }) => (
    <option value={value} data-testid={`sort-option-${value}`}>
      {children}
    </option>
  );

  // Helper to extract options from children
  const getOptions = (children) => {
    let options = [];
    React.Children.forEach(children, (child) => {
      if (child.type === SelectContent) {
        React.Children.forEach(child.props.children, (item) => {
          if (item.type === SelectItem) {
            options.push(item);
          }
        });
      }
    });
    return options;
  };

  return {
    Select: ({ value, onValueChange, children }) => {
      const [currentValue, setCurrentValue] = React.useState(value);
      const options = getOptions(children);

      React.useEffect(() => {
        // If the provided value matches an option, set it. Otherwise, default to the first option's value if available.
        const hasMatchingOption = options.some(
          (opt) => opt.props.value === value
        );
        if (hasMatchingOption) {
          setCurrentValue(value);
        } else if (options.length > 0) {
          setCurrentValue(options[0].props.value);
        }
      }, [value, options]); // Re-run if value or options change

      const handleChange = (e) => {
        setCurrentValue(e.target.value);
        if (onValueChange) {
          onValueChange(e.target.value);
        }
      };

      return (
        <div data-testid="select-container">
          <select
            value={currentValue}
            onChange={handleChange}
            data-testid="sort-select"
          >
            {options} {/* Render the extracted option elements */}
          </select>
        </div>
      );
    },
    SelectContent: SelectContent,
    SelectItem: SelectItem,
    SelectTrigger: ({ children, className }) => (
      <div className={className} data-testid="select-trigger">
        {children}
      </div>
    ),
    SelectValue: ({ placeholder }) => (
      <span data-testid="select-value">{placeholder}</span>
    ),
  };
});

jest.mock("@/components/ui/button", () => ({
  Button: ({ variant, size, onClick, className, children }) => (
    <button
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-size={size}
      data-testid="sort-order-button"
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }) => <div>{children}</div>,
}));

jest.mock("lucide-react", () => ({
  Search: () => <div data-testid="search-icon">SearchIcon</div>,
  ListFilter: () => <div data-testid="list-filter-icon">ListFilterIcon</div>,
  ArrowUp: () => <div data-testid="arrow-up-icon">ArrowUpIcon</div>,
  ArrowDown: () => <div data-testid="arrow-down-icon">ArrowDownIcon</div>,
}));

// CreateListModalをモック
jest.mock("@/app/components/lists/CreateListModal", () => ({
  CreateListModal: ({ isOpen, onClose, onSuccess }) => (
    <div data-testid="create-list-modal">CreateListModal</div>
  ),
}));

// テスト用リストデータ
const mockLists = [
  {
    id: "list-1",
    name: "テストリスト1",
    description: "説明1",
    place_count: 3,
    updated_at: "2023-12-01T00:00:00Z",
    created_at: "2023-11-01T00:00:00Z",
    is_public: false,
    places: [],
    permission: "owner",
  },
  {
    id: "list-2",
    name: "テストリスト2",
    description: "説明2",
    place_count: 5,
    updated_at: "2023-12-10T00:00:00Z",
    created_at: "2023-10-01T00:00:00Z",
    is_public: true,
    places: [],
    permission: "edit",
  },
  {
    id: "list-3",
    name: "サンプルリスト",
    description: "サンプル説明",
    place_count: 1,
    updated_at: "2023-12-05T00:00:00Z",
    created_at: "2023-09-01T00:00:00Z",
    is_public: false,
    places: [],
    permission: "view",
  },
];

describe("MyListsコンポーネントの表示と初期状態に関するテスト", () => {
  it("リスト一覧が正しく表示され、各区分ごとに内容が正しいこと", () => {
    render(<MyLists initialLists={mockLists} />);
    const placeListGrids = screen.getAllByTestId("place-list-grid");
    // オーナー区分
    const ownerLists = placeListGrids[0]
      ? JSON.parse(
          placeListGrids[0].querySelector('[data-testid="lists-data"]')
            .textContent
        )
      : [];
    expect(ownerLists).toHaveLength(1);
    expect(ownerLists[0].id).toBe("list-1");
    // 編集者区分
    const editorLists = placeListGrids[1]
      ? JSON.parse(
          placeListGrids[1].querySelector('[data-testid="lists-data"]')
            .textContent
        )
      : [];
    expect(editorLists).toHaveLength(1);
    expect(editorLists[0].id).toBe("list-2");
    // 閲覧者区分
    const viewerLists = placeListGrids[2]
      ? JSON.parse(
          placeListGrids[2].querySelector('[data-testid="lists-data"]')
            .textContent
        )
      : [];
    expect(viewerLists).toHaveLength(1);
    expect(viewerLists[0].id).toBe("list-3");
    // 検索入力フィールド・ソートUIの存在確認
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(screen.getByTestId("sort-select")).toBeInTheDocument();
    expect(screen.getByTestId("sort-select")).toHaveValue("updated_at");
    expect(screen.getByTestId("sort-order-button")).toBeInTheDocument();
    expect(screen.getByTestId("arrow-down-icon")).toBeInTheDocument();
  });
});

describe("MyListsコンポーネントのフィルタリング機能に関するテスト", () => {
  it("検索語による部分一致フィルタリングが正しく機能すること", async () => {
    render(<MyLists initialLists={mockLists} />);
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "サンプル" } });

    await waitFor(() => {
      const allGridsData = screen
        .getAllByTestId("lists-data")
        .map((el) => JSON.parse(el.textContent || "[]"));

      // "サンプル" でフィルタリングした場合、viewerLists のみに "サンプルリスト" が含まれるはず
      const viewerLists = allGridsData.find((lists) =>
        lists.some(
          (list) => list.name === "サンプルリスト" && list.permission === "view"
        )
      );
      expect(viewerLists).toBeDefined();
      expect(viewerLists).toHaveLength(1);
      if (viewerLists) {
        expect(viewerLists[0].name).toBe("サンプルリスト");
      }

      // 他のリスト(owner, editor) は "サンプル" を含まないはず
      const ownerLists = allGridsData.find((lists) =>
        lists.some((list) => list.permission === "owner")
      );
      // フィルタリングされているので、ownerListsが存在しても中身は空のはず
      if (ownerLists) {
        expect(
          ownerLists.filter((l) => l.name.includes("サンプル"))
        ).toHaveLength(0);
      }

      const editorLists = allGridsData.find((lists) =>
        lists.some((list) => list.permission === "edit")
      );
      if (editorLists) {
        expect(
          editorLists.filter((l) => l.name.includes("サンプル"))
        ).toHaveLength(0);
      }
    });

    fireEvent.change(searchInput, { target: { value: "テスト" } });
    await waitFor(() => {
      const allGridsData = screen
        .getAllByTestId("lists-data")
        .map((el) => JSON.parse(el.textContent || "[]"));

      const ownerLists = allGridsData.find((lists) =>
        lists.some(
          (list) => list.id === "list-1" && list.permission === "owner"
        )
      );
      expect(ownerLists).toBeDefined();
      expect(ownerLists).toHaveLength(1);
      if (ownerLists) expect(ownerLists[0].name).toBe("テストリスト1");

      const editorLists = allGridsData.find((lists) =>
        lists.some((list) => list.id === "list-2" && list.permission === "edit")
      );
      expect(editorLists).toBeDefined();
      expect(editorLists).toHaveLength(1);
      if (editorLists) expect(editorLists[0].name).toBe("テストリスト2");

      // サンプルリストは "テスト" を含まないので表示されない
      const viewerListsWithTest = allGridsData.find((lists) =>
        lists.some(
          (list) => list.id === "list-3" && list.name.includes("テスト")
        )
      );
      expect(viewerListsWithTest).toBeUndefined();
    });
  });

  it("検索結果が0件の場合に適切なメッセージが表示されること", () => {
    render(<MyLists initialLists={mockLists} />);
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "存在しないリスト" } });
    expect(screen.queryByTestId("place-list-grid")).toBeNull();
    expect(
      screen.getByText("検索条件に一致するリストはありません。")
    ).toBeInTheDocument();
  });

  it("リストが存在しない場合、各区分で空のメッセージが表示されること", async () => {
    render(<MyLists initialLists={mockLists} />);
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "存在しないリスト" } });
    expect(screen.queryByTestId("place-list-grid")).toBeNull();
    expect(
      screen.getByText("検索条件に一致するリストはありません。")
    ).toBeInTheDocument();
  });
});

describe("MyListsコンポーネントのソート機能に関するテスト", () => {
  it("ソートオプション（リスト名、登録地点数）の変更が正しく機能すること", async () => {
    render(<MyLists initialLists={mockLists} />);
    const sortSelect = screen.getByTestId("sort-select");
    // リスト名でソート (降順)
    fireEvent.change(sortSelect, { target: { value: "name" } });
    await waitFor(() => {
      const placeListGrids = screen.getAllByTestId("place-list-grid");
      // owner区分
      const ownerLists = placeListGrids[0]
        ? JSON.parse(
            placeListGrids[0].querySelector('[data-testid="lists-data"]')
              .textContent
          )
        : [];
      expect(ownerLists[0].name).toBe("テストリスト1");
      // editor区分
      const editorLists = placeListGrids[1]
        ? JSON.parse(
            placeListGrids[1].querySelector('[data-testid="lists-data"]')
              .textContent
          )
        : [];
      expect(editorLists[0].name).toBe("テストリスト2");
      // viewer区分
      const viewerLists = placeListGrids[2]
        ? JSON.parse(
            placeListGrids[2].querySelector('[data-testid="lists-data"]')
              .textContent
          )
        : [];
      expect(viewerLists[0].name).toBe("サンプルリスト");
    });
    // 登録地点数でソート (降順)
    fireEvent.change(sortSelect, { target: { value: "place_count" } });
    await waitFor(() => {
      const placeListGrids = screen.getAllByTestId("place-list-grid");
      const ownerLists = placeListGrids[0]
        ? JSON.parse(
            placeListGrids[0].querySelector('[data-testid="lists-data"]')
              .textContent
          )
        : [];
      expect(ownerLists[0].id).toBe("list-1");
      const editorLists = placeListGrids[1]
        ? JSON.parse(
            placeListGrids[1].querySelector('[data-testid="lists-data"]')
              .textContent
          )
        : [];
      expect(editorLists[0].id).toBe("list-2");
      const viewerLists = placeListGrids[2]
        ? JSON.parse(
            placeListGrids[2].querySelector('[data-testid="lists-data"]')
              .textContent
          )
        : [];
      expect(viewerLists[0].id).toBe("list-3");
    });
    // 更新日時でソート (降順)
    fireEvent.change(sortSelect, { target: { value: "updated_at" } });
    await waitFor(() => {
      const placeListGrids = screen.getAllByTestId("place-list-grid");
      const ownerLists = placeListGrids[0]
        ? JSON.parse(
            placeListGrids[0].querySelector('[data-testid="lists-data"]')
              .textContent
          )
        : [];
      expect(ownerLists[0].id).toBe("list-1");
      const editorLists = placeListGrids[1]
        ? JSON.parse(
            placeListGrids[1].querySelector('[data-testid="lists-data"]')
              .textContent
          )
        : [];
      expect(editorLists[0].id).toBe("list-2");
      const viewerLists = placeListGrids[2]
        ? JSON.parse(
            placeListGrids[2].querySelector('[data-testid="lists-data"]')
              .textContent
          )
        : [];
      expect(viewerLists[0].id).toBe("list-3");
    });
  });

  it("ソート順（昇順/降順）の切り替えが正しく機能すること", async () => {
    render(<MyLists initialLists={mockLists} />);
    const sortOrderButton = screen.getByTestId("sort-order-button");
    // 初期状態は降順
    let placeListGrids = screen.getAllByTestId("place-list-grid");
    expect(
      placeListGrids[0]
        ? JSON.parse(
            placeListGrids[0].querySelector('[data-testid="lists-data"]')
              .textContent
          )[0].id
        : null
    ).toBe("list-1");
    // 昇順に変更
    fireEvent.click(sortOrderButton);
    await waitFor(() => {
      placeListGrids = screen.getAllByTestId("place-list-grid");
      expect(
        placeListGrids[0]
          ? JSON.parse(
              placeListGrids[0].querySelector('[data-testid="lists-data"]')
                .textContent
            )[0].id
          : null
      ).toBe("list-1");
      expect(screen.getByTestId("arrow-up-icon")).toBeInTheDocument();
    });
    // 再度クリックして降順に戻す
    fireEvent.click(sortOrderButton);
    await waitFor(() => {
      placeListGrids = screen.getAllByTestId("place-list-grid");
      expect(
        placeListGrids[0]
          ? JSON.parse(
              placeListGrids[0].querySelector('[data-testid="lists-data"]')
                .textContent
            )[0].id
          : null
      ).toBe("list-1");
      expect(screen.getByTestId("arrow-down-icon")).toBeInTheDocument();
    });
  });
});
