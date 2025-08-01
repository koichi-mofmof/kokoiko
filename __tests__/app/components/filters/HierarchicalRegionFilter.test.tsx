import HierarchicalRegionFilter, {
  HierarchicalFilter,
} from "@/app/components/filters/HierarchicalRegionFilter";
import {
  getAvailableCountries,
  getAvailableStates,
} from "@/lib/actions/hierarchical-filter-actions";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// モック設定
jest.mock("@/lib/actions/hierarchical-filter-actions");

const mockGetAvailableCountries = getAvailableCountries as jest.MockedFunction<
  typeof getAvailableCountries
>;
const mockGetAvailableStates = getAvailableStates as jest.MockedFunction<
  typeof getAvailableStates
>;

describe("HierarchicalRegionFilter", () => {
  const mockOnFilterChange = jest.fn();
  const listId = "test-list-id";

  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトのモック設定
    mockGetAvailableCountries.mockResolvedValue([
      { value: "JP", label: "日本", count: 6 },
      { value: "US", label: "アメリカ合衆国", count: 3 },
      { value: "FR", label: "フランス", count: 2 },
      { value: "AU", label: "オーストラリア", count: 1 },
      { value: "ES", label: "スペイン", count: 1 },
    ]);

    mockGetAvailableStates.mockResolvedValue([
      { value: "和歌山県", label: "和歌山県", count: 1 },
      { value: "大阪府", label: "大阪府", count: 1 },
      { value: "京都府", label: "京都府", count: 2 },
      { value: "埼玉県", label: "埼玉県", count: 2 },
    ]);
  });

  it("初期状態で国一覧が表示される", async () => {
    render(
      <HierarchicalRegionFilter
        listId={listId}
        onFilterChange={mockOnFilterChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("国・地域")).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    expect(mockGetAvailableCountries).toHaveBeenCalledWith(listId);
  });

  it("国を選択すると州/省一覧が表示される", async () => {
    render(
      <HierarchicalRegionFilter
        listId={listId}
        onFilterChange={mockOnFilterChange}
      />
    );

    // 国一覧が読み込まれるまで待機
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /日本/ })).toBeInTheDocument();
    });

    // 日本を選択
    const countrySelect = screen.getByRole("combobox");
    fireEvent.change(countrySelect, { target: { value: "JP" } });

    // onFilterChangeが呼ばれることを確認
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      country: "JP",
      states: [],
    });

    // 州/省一覧の取得が呼ばれることを確認
    await waitFor(() => {
      expect(mockGetAvailableStates).toHaveBeenCalledWith(listId, "JP");
    });

    // 都道府県ラベルが表示される
    await waitFor(() => {
      expect(screen.getByText("都道府県（複数選択可）")).toBeInTheDocument();
    });
  });

  it("州/省を選択するとフィルターが更新される", async () => {
    const initialFilter: HierarchicalFilter = { country: "JP" };

    render(
      <HierarchicalRegionFilter
        listId={listId}
        onFilterChange={mockOnFilterChange}
        initialFilter={initialFilter}
      />
    );

    // 州/省一覧が表示されるまで待機
    await waitFor(() => {
      expect(screen.getByText("都道府県（複数選択可）")).toBeInTheDocument();
    });

    // 大阪府のチェックボックスを選択
    const osakaCheckbox = screen.getByLabelText(/大阪府/);
    fireEvent.click(osakaCheckbox);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      country: "JP",
      states: ["大阪府"],
    });
  });

  it("フィルタークリアボタンが動作する", async () => {
    const initialFilter: HierarchicalFilter = {
      country: "JP",
      states: ["大阪府"],
    };

    render(
      <HierarchicalRegionFilter
        listId={listId}
        onFilterChange={mockOnFilterChange}
        initialFilter={initialFilter}
      />
    );

    // フィルター状態表示が表示されるまで待機
    await waitFor(() => {
      expect(screen.getByText("現在のフィルター")).toBeInTheDocument();
    });

    // クリアボタンをクリック
    const clearButton = screen.getByText("クリア");
    fireEvent.click(clearButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({});
  });

  it("地域ラベルが国コードに応じて変化する", async () => {
    render(
      <HierarchicalRegionFilter
        listId={listId}
        onFilterChange={mockOnFilterChange}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: /アメリカ/ })
      ).toBeInTheDocument();
    });

    // アメリカを選択
    const countrySelect = screen.getByRole("combobox");
    fireEvent.change(countrySelect, { target: { value: "US" } });

    await waitFor(() => {
      expect(screen.getByText("州（複数選択可）")).toBeInTheDocument();
    });
  });

  it("エラー状態が正しく表示される", async () => {
    // エラーログを抑制
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockGetAvailableCountries.mockRejectedValue(new Error("Network error"));

    render(
      <HierarchicalRegionFilter
        listId={listId}
        onFilterChange={mockOnFilterChange}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("国一覧の取得に失敗しました")
      ).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it("ローディング状態が表示される", async () => {
    // 長時間かかるPromiseを返すモック
    mockGetAvailableCountries.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    render(
      <HierarchicalRegionFilter
        listId={listId}
        onFilterChange={mockOnFilterChange}
      />
    );

    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  it("データがない場合のメッセージが表示される", async () => {
    mockGetAvailableCountries.mockResolvedValue([]);

    render(
      <HierarchicalRegionFilter
        listId={listId}
        onFilterChange={mockOnFilterChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("地域データがありません")).toBeInTheDocument();
    });
  });

  it("複数の州/省を選択できる", async () => {
    const initialFilter: HierarchicalFilter = { country: "JP" };

    render(
      <HierarchicalRegionFilter
        listId={listId}
        onFilterChange={mockOnFilterChange}
        initialFilter={initialFilter}
      />
    );

    // 州/省一覧が表示されるまで待機
    await waitFor(() => {
      expect(screen.getByText("都道府県（複数選択可）")).toBeInTheDocument();
    });

    // 大阪府を選択
    const osakaCheckbox = screen.getByLabelText(/大阪府/);
    fireEvent.click(osakaCheckbox);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      country: "JP",
      states: ["大阪府"],
    });

    // 京都府も選択
    const kyotoCheckbox = screen.getByLabelText(/京都府/);
    fireEvent.click(kyotoCheckbox);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      country: "JP",
      states: ["大阪府", "京都府"],
    });
  });

  it("フィルター説明文が正しく生成される", async () => {
    const initialFilter: HierarchicalFilter = {
      country: "JP",
      states: ["大阪府", "京都府"],
    };

    render(
      <HierarchicalRegionFilter
        listId={listId}
        onFilterChange={mockOnFilterChange}
        initialFilter={initialFilter}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("日本 > 大阪府, 京都府")).toBeInTheDocument();
    });
  });
});
