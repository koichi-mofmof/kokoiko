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
  },
];

describe("MyListsコンポーネントの表示と初期状態に関するテスト", () => {
  it("リスト一覧が正しく表示され、初期ソートが更新日時の降順であること", () => {
    render(<MyLists initialLists={mockLists} />);

    // リストの数が正しいことを確認
    expect(screen.getByTestId("lists-count")).toHaveTextContent("3");

    // 検索入力フィールドが表示されていることを確認
    expect(screen.getByTestId("search-input")).toBeInTheDocument();

    // ソートセレクトが表示されていることを確認
    expect(screen.getByTestId("sort-select")).toBeInTheDocument();
    expect(screen.getByTestId("sort-select")).toHaveValue("updated_at");

    // ソート順ボタンが表示されていることを確認 (初期は降順ArrowDown)
    expect(screen.getByTestId("sort-order-button")).toBeInTheDocument();
    expect(screen.getByTestId("arrow-down-icon")).toBeInTheDocument();

    // デフォルトソート（更新日時の降順）の確認
    const listsData = JSON.parse(screen.getByTestId("lists-data").textContent);
    expect(listsData[0].id).toBe("list-2"); // list-2 (12/10), list-3 (12/05), list-1 (12/01)
    expect(listsData[1].id).toBe("list-3");
    expect(listsData[2].id).toBe("list-1");
  });
});

describe("MyListsコンポーネントのフィルタリング機能に関するテスト", () => {
  it("検索語による部分一致フィルタリングが正しく機能すること", async () => {
    render(<MyLists initialLists={mockLists} />);

    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "サンプル" } });

    await waitFor(() => {
      expect(screen.getByTestId("lists-count")).toHaveTextContent("1");
    });
    let listsData = JSON.parse(screen.getByTestId("lists-data").textContent);
    expect(listsData).toHaveLength(1);
    expect(listsData[0].name).toBe("サンプルリスト");

    fireEvent.change(searchInput, { target: { value: "テスト" } });
    await waitFor(() => {
      expect(screen.getByTestId("lists-count")).toHaveTextContent("2");
    });
    listsData = JSON.parse(screen.getByTestId("lists-data").textContent);
    expect(listsData).toHaveLength(2);
    // 検索結果はソート順にも依存するが、ここでは名前でフィルタされていることだけ確認
    const names = listsData.map((list) => list.name).sort();
    expect(names).toEqual(["テストリスト1", "テストリスト2"].sort());
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
});

describe("MyListsコンポーネントのソート機能に関するテスト", () => {
  it("ソートオプション（リスト名、登録地点数）の変更が正しく機能すること", async () => {
    render(<MyLists initialLists={mockLists} />);
    const sortSelect = screen.getByTestId("sort-select");

    // リスト名でソート (デフォルト降順)
    fireEvent.change(sortSelect, { target: { value: "name" } });
    await waitFor(() => {
      const listsData = JSON.parse(
        screen.getByTestId("lists-data").textContent
      );
      // 降順: テストリスト2, テストリスト1, サンプルリスト
      expect(listsData[0].name).toBe("テストリスト2");
      expect(listsData[1].name).toBe("テストリスト1");
      expect(listsData[2].name).toBe("サンプルリスト");
    });

    // 登録地点数でソート (デフォルト降順)
    fireEvent.change(sortSelect, { target: { value: "place_count" } });
    await waitFor(() => {
      const listsData = JSON.parse(
        screen.getByTestId("lists-data").textContent
      );
      // 降順: list-2 (5), list-1 (3), list-3 (1)
      expect(listsData[0].id).toBe("list-2");
      expect(listsData[1].id).toBe("list-1");
      expect(listsData[2].id).toBe("list-3");
    });

    // 更新日時でソート (デフォルト降順) に戻す
    fireEvent.change(sortSelect, { target: { value: "updated_at" } });
    await waitFor(() => {
      const listsData = JSON.parse(
        screen.getByTestId("lists-data").textContent
      );
      expect(listsData[0].id).toBe("list-2");
      expect(listsData[1].id).toBe("list-3");
      expect(listsData[2].id).toBe("list-1");
    });
  });

  it("ソート順（昇順/降順）の切り替えが正しく機能すること", async () => {
    render(<MyLists initialLists={mockLists} />);
    const sortOrderButton = screen.getByTestId("sort-order-button");

    // 初期状態は更新日時・降順: list-2, list-3, list-1
    let listsData = JSON.parse(screen.getByTestId("lists-data").textContent);
    expect(listsData[0].id).toBe("list-2");

    // 昇順に変更 (更新日時・昇順: list-1, list-3, list-2)
    fireEvent.click(sortOrderButton);
    await waitFor(() => {
      listsData = JSON.parse(screen.getByTestId("lists-data").textContent);
      expect(listsData[0].id).toBe("list-1");
      expect(listsData[1].id).toBe("list-3");
      expect(listsData[2].id).toBe("list-2");
      expect(screen.getByTestId("arrow-up-icon")).toBeInTheDocument();
    });

    // 再度クリックして降順に戻す (更新日時・降順: list-2, list-3, list-1)
    fireEvent.click(sortOrderButton);
    await waitFor(() => {
      listsData = JSON.parse(screen.getByTestId("lists-data").textContent);
      expect(listsData[0].id).toBe("list-2");
      expect(listsData[1].id).toBe("list-3");
      expect(listsData[2].id).toBe("list-1");
      expect(screen.getByTestId("arrow-down-icon")).toBeInTheDocument();
    });
  });
});
