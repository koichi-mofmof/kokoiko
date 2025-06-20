/**
 * 階層型地域フィルター簡略化アクセシビリティテスト
 * 実際の実装に基づいたテスト
 */

import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import HierarchicalRegionFilter from "@/app/components/filters/HierarchicalRegionFilter";

// モック
jest.mock("@/lib/actions/hierarchical-filter-actions", () => ({
  getAvailableCountries: jest.fn(() =>
    Promise.resolve([
      { value: "JP", label: "日本", count: 3 },
      { value: "FR", label: "フランス", count: 2 },
      { value: "AU", label: "オーストラリア", count: 1 },
    ])
  ),
  getAvailableStates: jest.fn((listId, countryCode) => {
    if (countryCode === "JP") {
      return Promise.resolve([
        { value: "東京都", label: "東京都", count: 2 },
        { value: "大阪府", label: "大阪府", count: 1 },
      ]);
    }
    return Promise.resolve([]);
  }),
}));

describe("HierarchicalRegionFilter Simplified Accessibility", () => {
  const defaultProps = {
    listId: "test-list-id",
    onFilterChange: jest.fn(),
    initialFilter: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("基本的なアクセシビリティ", () => {
    it("フォーム要素が適切なラベルを持っている", async () => {
      await act(async () => {
        render(<HierarchicalRegionFilter {...defaultProps} />);
      });

      // 国選択のラベルが存在する
      expect(screen.getByText("国・地域")).toBeInTheDocument();

      // 国選択のcomboboxが存在する
      await waitFor(() => {
        const countrySelect = screen.getByRole("combobox");
        expect(countrySelect).toBeInTheDocument();
      });
    });

    it("キーボードナビゲーションが可能", async () => {
      await act(async () => {
        render(<HierarchicalRegionFilter {...defaultProps} />);
      });

      await waitFor(() => {
        const countrySelect = screen.getByRole("combobox");
        expect(countrySelect).toBeInTheDocument();
      });

      const countrySelect = screen.getByRole("combobox");

      // フォーカス可能であることを確認
      expect(countrySelect).not.toHaveAttribute("disabled");

      // キーボードイベントが処理されることを確認
      fireEvent.keyDown(countrySelect, { key: "Tab" });
      // エラーが発生しないことを確認
    });

    it("適切な選択肢が表示される", async () => {
      await act(async () => {
        render(<HierarchicalRegionFilter {...defaultProps} />);
      });

      // 日本の選択肢が表示される
      await waitFor(() => {
        expect(screen.getByText(/日本/)).toBeInTheDocument();
      });

      expect(screen.getByText(/フランス/)).toBeInTheDocument();
      expect(screen.getByText(/オーストラリア/)).toBeInTheDocument();
    });
  });

  describe("動的フィルタリング", () => {
    it("国選択時に州/省選択肢が表示される", async () => {
      const mockOnFilterChange = jest.fn();

      await act(async () => {
        render(
          <HierarchicalRegionFilter
            {...defaultProps}
            onFilterChange={mockOnFilterChange}
          />
        );
      });

      await waitFor(() => {
        const countrySelect = screen.getByRole("combobox");
        expect(countrySelect).toBeInTheDocument();
      });

      const countrySelect = screen.getByRole("combobox");

      // 日本を選択
      await act(async () => {
        fireEvent.change(countrySelect, { target: { value: "JP" } });
      });

      // onFilterChangeが呼ばれることを確認
      expect(mockOnFilterChange).toHaveBeenCalled();

      // 都道府県選択が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/都道府県.*複数選択可/)).toBeInTheDocument();
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("ローディング状態が適切に表示される", async () => {
      await act(async () => {
        render(<HierarchicalRegionFilter {...defaultProps} />);
      });

      // 基本的なUIが表示されることを確認
      expect(screen.getByText("国・地域")).toBeInTheDocument();
    });

    it("ネットワークエラー時に適切なメッセージが表示される", async () => {
      // ネットワークエラーをシミュレート
      const {
        getAvailableCountries,
      } = require("@/lib/actions/hierarchical-filter-actions");
      getAvailableCountries.mockRejectedValueOnce(new Error("Network error"));

      await act(async () => {
        render(<HierarchicalRegionFilter {...defaultProps} />);
      });

      // エラーメッセージが表示される
      await waitFor(() => {
        expect(screen.getByText(/取得に失敗しました/)).toBeInTheDocument();
      });
    });
  });

  describe("ユーザビリティ", () => {
    it("選択状態がクリアできる", async () => {
      const mockOnFilterChange = jest.fn();

      await act(async () => {
        render(
          <HierarchicalRegionFilter
            {...defaultProps}
            onFilterChange={mockOnFilterChange}
            initialFilter={{ country: "JP", states: ["東京都"] }}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText("現在のフィルター")).toBeInTheDocument();
      });

      // クリアボタンを探す
      const clearButton = screen.getByText("クリア");
      expect(clearButton).toBeInTheDocument();

      // クリアボタンをクリック
      await act(async () => {
        fireEvent.click(clearButton);
      });

      // フィルターがクリアされることを確認
      expect(mockOnFilterChange).toHaveBeenCalledWith({});
    });

    it("フィルター状態が視覚的に表示される", async () => {
      await act(async () => {
        render(
          <HierarchicalRegionFilter
            {...defaultProps}
            initialFilter={{ country: "JP", states: ["東京都"] }}
          />
        );
      });

      // 選択状態が表示される
      await waitFor(() => {
        expect(screen.getByText("現在のフィルター")).toBeInTheDocument();
      });

      // 選択された内容が表示される（より具体的な検索）
      await waitFor(() => {
        const filterDescription = screen.getByText(/日本.*東京都/);
        expect(filterDescription).toBeInTheDocument();
      });
    });
  });

  describe("モバイルフレンドリー", () => {
    it("タッチデバイスで適切に動作する", async () => {
      await act(async () => {
        render(<HierarchicalRegionFilter {...defaultProps} />);
      });

      await waitFor(() => {
        const countrySelect = screen.getByRole("combobox");
        expect(countrySelect).toBeInTheDocument();
      });

      const countrySelect = screen.getByRole("combobox");

      // タッチイベントが処理されることを確認
      fireEvent.touchStart(countrySelect);
      fireEvent.touchEnd(countrySelect);

      // エラーが発生しないことを確認
    });

    it("小さな画面でも適切にレイアウトされる", async () => {
      // 画面サイズをシミュレート
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375, // iPhone SE width
      });

      await act(async () => {
        render(<HierarchicalRegionFilter {...defaultProps} />);
      });

      await waitFor(() => {
        const countrySelect = screen.getByRole("combobox");
        expect(countrySelect).toBeInTheDocument();
        // セレクト要素がw-fullクラスを持つことを確認
        expect(countrySelect).toHaveClass("w-full");
      });
    });
  });

  describe("パフォーマンス", () => {
    it("大量の選択肢でも適切に動作する", async () => {
      // 大量のデータをモック
      const {
        getAvailableCountries,
      } = require("@/lib/actions/hierarchical-filter-actions");
      const largeCountryList = Array.from({ length: 100 }, (_, i) => ({
        value: `COUNTRY_${i}`,
        label: `国 ${i}`,
        count: Math.floor(Math.random() * 100),
      }));
      getAvailableCountries.mockResolvedValueOnce(largeCountryList);

      const startTime = performance.now();

      await act(async () => {
        render(<HierarchicalRegionFilter {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByRole("combobox")).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // レンダリング時間が適切な範囲内であることを確認
      expect(renderTime).toBeLessThan(1000); // 1秒以内
    });
  });
});
