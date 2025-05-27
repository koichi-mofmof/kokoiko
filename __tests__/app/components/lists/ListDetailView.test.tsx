import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ListDetailView from "@/app/components/lists/ListDetailView";

// 依存コンポーネントのモック
jest.mock("@/app/components/places/PlaceList", () => () => (
  <div data-testid="PlaceList">PlaceList</div>
));
jest.mock("@/components/ui/FilterBar", () => (props: any) => (
  <button
    data-testid="FilterBar"
    onClick={() =>
      props.onFilterChange &&
      props.onFilterChange({ tags: ["タグ1"], prefecture: [] })
    }
  >
    フィルター
  </button>
));
jest.mock("@/components/ui/ViewToggle", () => (props: any) => (
  <div data-testid="ViewToggle">
    <button onClick={() => props.onViewChange && props.onViewChange("list")}>
      リスト
    </button>
    <button onClick={() => props.onViewChange && props.onViewChange("map")}>
      マップ
    </button>
    <button onClick={() => props.onViewChange && props.onViewChange("ranking")}>
      ランキング
    </button>
  </div>
));
jest.mock("@/app/components/places/AddPlaceButtonClient", () => () => (
  <button data-testid="AddPlaceButtonClient">追加</button>
));
jest.mock("@/app/components/lists/RankingView", () => () => (
  <div data-testid="RankingView" />
));
jest.mock("next/dynamic", () => (importFn: any, opts: any) => {
  // OpenStreetMapViewのdynamic import用
  const Comp = () => <div data-testid="OpenStreetMapView">Map</div>;
  Comp.displayName = "DynamicOpenStreetMapView";
  return Comp;
});

describe("ListDetailView", () => {
  const basePlaces = [
    {
      id: "1",
      name: "東京タワー",
      address: "東京都港区芝公園4-2-8",
      googleMapsUrl: "https://maps.google.com/?q=東京タワー",
      latitude: 35.6586,
      longitude: 139.7454,
      tags: [{ id: "t1", name: "観光" }],
      createdAt: new Date("2023-01-01T00:00:00Z"),
      visited: "visited" as const,
      createdBy: "user1",
    },
    {
      id: "2",
      name: "スカイツリー",
      address: "東京都墨田区押上1-1-2",
      googleMapsUrl: "https://maps.google.com/?q=スカイツリー",
      latitude: 35.7101,
      longitude: 139.8107,
      tags: [{ id: "t2", name: "展望台" }],
      createdAt: new Date("2023-01-02T00:00:00Z"),
      visited: "not_visited" as const,
      createdBy: "user2",
    },
  ];

  it("初期表示で主要UI要素が表示される", () => {
    render(<ListDetailView places={basePlaces} listId="list1" />);
    expect(screen.getByTestId("FilterBar")).toBeInTheDocument();
    expect(screen.getByTestId("ViewToggle")).toBeInTheDocument();
    expect(screen.getByTestId("AddPlaceButtonClient")).toBeInTheDocument();
    expect(screen.getByTestId("PlaceList")).toBeInTheDocument();
    // デフォルトはリストビュー
    const rankingDiv = screen.getByTestId("RankingView").parentElement;
    expect(rankingDiv).toHaveClass("hidden");
    expect(screen.queryByTestId("OpenStreetMapView")).not.toBeInTheDocument();
  });

  it("ランキングビューに切り替えるとRankingViewが表示される", () => {
    render(<ListDetailView places={basePlaces} listId="list1" />);
    fireEvent.click(screen.getByText("ランキング"));
    const rankingDiv = screen.getByTestId("RankingView").parentElement;
    expect(rankingDiv).toHaveClass("block");
    expect(rankingDiv).toBeVisible();
    // 他ビューは非表示
    expect(screen.queryByTestId("PlaceList")).not.toBeInTheDocument();
    expect(screen.queryByTestId("OpenStreetMapView")).not.toBeInTheDocument();
  });

  it("マップビューに切り替えるとOpenStreetMapViewが表示される", () => {
    render(<ListDetailView places={basePlaces} listId="list1" />);
    fireEvent.click(screen.getByText("マップ"));
    expect(screen.getByTestId("OpenStreetMapView")).toBeInTheDocument();
  });

  it("場所が0件の場合、未登録メッセージが表示される", () => {
    render(<ListDetailView places={[]} listId="list1" />);
    expect(
      screen.getByText(/このリストにはまだ場所が登録されていません/)
    ).toBeInTheDocument();
  });

  it("フィルターで0件になった場合、フィルター条件に一致しないメッセージが表示される", () => {
    // 最初は2件→フィルターボタン押下でtagsが変わり0件になる
    render(<ListDetailView places={basePlaces} listId="list1" />);
    fireEvent.click(screen.getByTestId("FilterBar"));
    expect(
      screen.getByText(/フィルター条件に一致する場所がありません/)
    ).toBeInTheDocument();
  });

  it("isSample=trueの場合、追加ボタンが表示されない", () => {
    render(<ListDetailView places={basePlaces} listId="list1" isSample />);
    expect(
      screen.queryByTestId("AddPlaceButtonClient")
    ).not.toBeInTheDocument();
  });
});
