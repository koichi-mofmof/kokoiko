import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// テスト用のモックデータを定義
const mockPlaces = [
  {
    id: "place-1",
    name: "東京スカイツリー",
    address: "東京都墨田区押上1-1-2",
    memo: "東京の新しいランドマーク",
    tags: ["観光", "展望台"],
    location: { lat: 35.7101, lng: 139.8107 },
  },
  {
    id: "place-2",
    name: "浅草寺",
    address: "東京都台東区浅草2-3-1",
    memo: "東京最古の寺院",
    tags: ["観光", "寺院", "歴史"],
    location: { lat: 35.7148, lng: 139.7967 },
  },
  {
    id: "place-3",
    name: "東京タワー",
    address: "東京都港区芝公園4丁目2-8",
    memo: "クラシックな展望台",
    tags: ["観光", "展望台", "ランドマーク"],
    location: { lat: 35.6586, lng: 139.7454 },
  },
];

// フィルターバーコンポーネントをモック
jest.mock("@/app/components/ui/FilterBar", () => ({
  FilterBar: ({ onFilterChange }) => (
    <div data-testid="filter-bar">
      <input
        data-testid="filter-input"
        placeholder="キーワードで検索"
        onChange={(e) => onFilterChange({ keyword: e.target.value })}
      />
      <select
        data-testid="filter-tag"
        onChange={(e) => onFilterChange({ tag: e.target.value })}
      >
        <option value="">タグを選択</option>
        <option value="観光">観光</option>
        <option value="展望台">展望台</option>
        <option value="寺院">寺院</option>
      </select>
    </div>
  ),
}));

// ビュー切替コンポーネントをモック
jest.mock("@/app/components/ui/ViewToggle", () => ({
  ViewToggle: ({ onViewChange, currentView }) => (
    <div data-testid="view-toggle">
      <button
        data-testid="list-view-button"
        className={currentView === "list" ? "active" : ""}
        onClick={() => onViewChange("list")}
      >
        リスト
      </button>
      <button
        data-testid="map-view-button"
        className={currentView === "map" ? "active" : ""}
        onClick={() => onViewChange("map")}
      >
        マップ
      </button>
    </div>
  ),
}));

// マップビューコンポーネントをモック
jest.mock("@/app/components/map/MapView", () => ({
  __esModule: true,
  default: ({ places }) => (
    <div data-testid="map-view">
      <div>地図表示 - {places.length}件の場所</div>
      <ul>
        {places.map((place) => (
          <li key={place.id} data-testid={`map-marker-${place.id}`}>
            {place.name}
          </li>
        ))}
      </ul>
    </div>
  ),
}));

// 場所リストコンポーネントをモック
jest.mock("@/app/components/places/PlaceList", () => ({
  __esModule: true,
  default: ({ places }) => (
    <div data-testid="place-list">
      <div>{places.length}件の場所</div>
      <ul>
        {places.map((place) => (
          <li key={place.id} data-testid={`place-item-${place.id}`}>
            {place.name}
          </li>
        ))}
      </ul>
    </div>
  ),
}));

// モックのサンプル詳細ビューコンポーネント
const MockListDetailView = ({ places }) => {
  const [filteredPlaces, setFilteredPlaces] = React.useState(places);
  const [currentView, setCurrentView] = React.useState("list");

  const handleFilterChange = ({ keyword, tag }) => {
    let filtered = [...places];

    if (keyword) {
      filtered = filtered.filter(
        (place) =>
          place.name.includes(keyword) ||
          place.address.includes(keyword) ||
          place.memo?.includes(keyword)
      );
    }

    if (tag) {
      filtered = filtered.filter((place) => place.tags?.includes(tag));
    }

    setFilteredPlaces(filtered);
  };

  return (
    <div>
      <div className="flex justify-between">
        <div data-testid="filter-bar">
          <input
            data-testid="filter-input"
            placeholder="キーワードで検索"
            onChange={(e) => handleFilterChange({ keyword: e.target.value })}
          />
          <select
            data-testid="filter-tag"
            onChange={(e) => handleFilterChange({ tag: e.target.value })}
          >
            <option value="">タグを選択</option>
            <option value="観光">観光</option>
            <option value="展望台">展望台</option>
            <option value="寺院">寺院</option>
          </select>
        </div>
        <div data-testid="view-toggle">
          <button
            data-testid="list-view-button"
            className={currentView === "list" ? "active" : ""}
            onClick={() => setCurrentView("list")}
          >
            リスト
          </button>
          <button
            data-testid="map-view-button"
            className={currentView === "map" ? "active" : ""}
            onClick={() => setCurrentView("map")}
          >
            マップ
          </button>
        </div>
      </div>

      {currentView === "list" ? (
        <div data-testid="list-view-container">
          <div data-testid="place-list">
            <div>{filteredPlaces.length}件の場所</div>
            <ul>
              {filteredPlaces.map((place) => (
                <li key={place.id} data-testid={`place-item-${place.id}`}>
                  {place.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div data-testid="map-view-container">
          <div data-testid="map-view">
            <div>地図表示 - {filteredPlaces.length}件の場所</div>
            <ul>
              {filteredPlaces.map((place) => (
                <li key={place.id} data-testid={`map-marker-${place.id}`}>
                  {place.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// サンプル画面のフィルター・マップ表示テスト
describe("サンプル画面フィルター・マップ切替フローテスト", () => {
  it("フィルター適用で表示が絞り込まれること", async () => {
    render(<MockListDetailView places={mockPlaces} />);

    // 初期状態では全ての場所が表示されている
    expect(screen.getByText("3件の場所")).toBeInTheDocument();

    // キーワードフィルターを適用
    const filterInput = screen.getByTestId("filter-input");
    fireEvent.change(filterInput, { target: { value: "東京タワー" } });

    // 結果が絞り込まれる
    await waitFor(() => {
      expect(screen.getByText("1件の場所")).toBeInTheDocument();
      expect(screen.getByTestId("place-item-place-3")).toBeInTheDocument();
    });

    // フィルターをクリア
    fireEvent.change(filterInput, { target: { value: "" } });

    // 全ての場所が再表示される
    await waitFor(() => {
      expect(screen.getByText("3件の場所")).toBeInTheDocument();
    });

    // タグフィルターを適用
    const tagFilter = screen.getByTestId("filter-tag");
    fireEvent.change(tagFilter, { target: { value: "展望台" } });

    // 展望台タグを持つ場所だけ表示される
    await waitFor(() => {
      expect(screen.getByText("2件の場所")).toBeInTheDocument();
      expect(screen.getByTestId("place-item-place-1")).toBeInTheDocument();
      expect(screen.getByTestId("place-item-place-3")).toBeInTheDocument();
    });
  });

  it("表示モードをリストからマップに切り替えられること", async () => {
    render(<MockListDetailView places={mockPlaces} />);

    // 初期表示はリスト表示
    expect(screen.getByTestId("list-view-container")).toBeInTheDocument();
    expect(screen.queryByTestId("map-view-container")).not.toBeInTheDocument();

    // マップ表示に切り替え
    const mapViewButton = screen.getByTestId("map-view-button");
    fireEvent.click(mapViewButton);

    // マップ表示に切り替わる
    await waitFor(() => {
      expect(
        screen.queryByTestId("list-view-container")
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("map-view-container")).toBeInTheDocument();
      expect(screen.getByText("地図表示 - 3件の場所")).toBeInTheDocument();
    });

    // リスト表示に戻す
    const listViewButton = screen.getByTestId("list-view-button");
    fireEvent.click(listViewButton);

    // リスト表示に戻る
    await waitFor(() => {
      expect(screen.getByTestId("list-view-container")).toBeInTheDocument();
      expect(
        screen.queryByTestId("map-view-container")
      ).not.toBeInTheDocument();
    });
  });

  it("フィルター適用後もビュー切替が機能すること", async () => {
    render(<MockListDetailView places={mockPlaces} />);

    // タグフィルターを適用
    const tagFilter = screen.getByTestId("filter-tag");
    fireEvent.change(tagFilter, { target: { value: "寺院" } });

    // フィルター結果が表示される（リスト表示）
    await waitFor(() => {
      expect(screen.getByText("1件の場所")).toBeInTheDocument();
      expect(screen.getByTestId("place-item-place-2")).toBeInTheDocument();
    });

    // マップ表示に切り替え
    const mapViewButton = screen.getByTestId("map-view-button");
    fireEvent.click(mapViewButton);

    // フィルター結果がマップ表示で表示される
    await waitFor(() => {
      expect(screen.getByTestId("map-view-container")).toBeInTheDocument();
      expect(screen.getByText("地図表示 - 1件の場所")).toBeInTheDocument();
      expect(screen.getByTestId("map-marker-place-2")).toBeInTheDocument();
    });
  });
});
