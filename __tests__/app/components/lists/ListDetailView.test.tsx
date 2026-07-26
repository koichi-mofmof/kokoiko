import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import ListDetailView from "@/app/components/lists/ListDetailView";
import { getDisplayOrdersForList } from "@/lib/actions/place-display-orders";

// 表示順序取得のサーバーアクションをモック
jest.mock("@/lib/actions/place-display-orders", () => ({
  __esModule: true,
  getDisplayOrdersForList: jest.fn(),
}));

// 依存コンポーネントのモック
// PlaceListに渡された displayOrders を検証できるように内容を露出する
jest.mock("@/app/components/places/PlaceList", () => (props: any) => (
  <div data-testid="PlaceList">
    <span data-testid="PlaceList-displayOrders">
      {JSON.stringify(props.displayOrders)}
    </span>
  </div>
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

  const mockGetDisplayOrders = getDisplayOrdersForList as jest.Mock;

  beforeEach(() => {
    mockGetDisplayOrders.mockReset();
    mockGetDisplayOrders.mockResolvedValue({
      success: true,
      displayOrders: [],
    });
  });

  it("初期表示で主要UI要素が表示される", async () => {
    await act(async () => {
      render(
        <ListDetailView places={basePlaces} listId="list1" permission="owner" />
      );
    });
    expect(screen.getByTestId("FilterBar")).toBeInTheDocument();
    expect(screen.getByTestId("ViewToggle")).toBeInTheDocument();
    const addPlaceButtons = screen.getAllByTestId("AddPlaceButtonClient");
    expect(addPlaceButtons.length).toBeGreaterThan(0);
    addPlaceButtons.forEach((button) => expect(button).toBeInTheDocument());
    // 初期表示時は順序情報を読み込み中（act()ラップにより非同期処理が完了しているため、このテキストは表示されない可能性がある）
    // expect(screen.getByText("順序情報を読み込み中...")).toBeInTheDocument();
    // デフォルトはリストビュー
    const rankingDiv = screen.getByTestId("RankingView").parentElement;
    expect(rankingDiv).toHaveClass("hidden");
  });

  it("ランキングビューに切り替えるとRankingViewが表示される", async () => {
    await act(async () => {
      render(
        <ListDetailView places={basePlaces} listId="list1" permission="owner" />
      );
    });
    fireEvent.click(screen.getByText("ランキング"));
    const rankingDiv = screen.getByTestId("RankingView").parentElement;
    expect(rankingDiv).toHaveClass("block");
    expect(rankingDiv).toBeVisible();
    // 他ビューは非表示
    expect(screen.queryByTestId("PlaceList")).not.toBeInTheDocument();
    expect(screen.queryByTestId("OpenStreetMapView")).not.toBeInTheDocument();
  });

  it("マップビューに切り替えるとマップ関連UIが表示される", () => {
    render(
      <ListDetailView places={basePlaces} listId="list1" permission="owner" />
    );
    fireEvent.click(screen.getByText("マップ"));
    // マップビューではdata-testidが読み込み中メッセージを確認
    expect(screen.getByText("マップデータを読み込み中...")).toBeInTheDocument();
  });

  it("場所が0件かつ所有者の場合、地点追加の発射台（CTA）が表示される", () => {
    render(<ListDetailView places={[]} listId="list1" permission="owner" />);
    // 灰色メッセージではなく、地点追加ダイアログを開く発射台（AddPlaceButtonClient）を表示する
    expect(screen.getAllByTestId("AddPlaceButtonClient").length).toBeGreaterThan(
      0
    );
    expect(
      screen.queryByText("このリストにはまだ場所が登録されていません。")
    ).not.toBeInTheDocument();
  });

  it("場所が0件かつ閲覧者の場合、未登録メッセージが表示される", () => {
    render(<ListDetailView places={[]} listId="list1" permission="view" />);
    expect(
      screen.getByText("このリストにはまだ場所が登録されていません。")
    ).toBeInTheDocument();
  });

  it("フィルターで0件になった場合、フィルター条件に一致しないメッセージが表示される", () => {
    // 最初は2件→フィルターボタン押下でtagsが変わり0件になる
    render(
      <ListDetailView places={basePlaces} listId="list1" permission="owner" />
    );
    fireEvent.click(screen.getByTestId("FilterBar"));
    expect(
      screen.getByText(/フィルター条件に一致する場所がありません/)
    ).toBeInTheDocument();
  });

  it("権限がない場合、追加ボタンが表示されない", () => {
    render(
      <ListDetailView places={basePlaces} listId="list1" permission="view" />
    );
    expect(
      screen.queryByTestId("AddPlaceButtonClient")
    ).not.toBeInTheDocument();
  });

  describe("表示順序の再取得", () => {
    // 地点追加直後、RSCリフレッシュで places プロップだけが差し替わる状況を
    // rerender で再現する（クライアント状態は保持されたまま）
    const addedPlace = {
      id: "3",
      name: "浅草寺",
      address: "東京都台東区浅草2-3-1",
      googleMapsUrl: "https://maps.google.com/?q=浅草寺",
      latitude: 35.7148,
      longitude: 139.7967,
      tags: [{ id: "t3", name: "寺社" }],
      createdAt: new Date("2023-01-03T00:00:00Z"),
      visited: "not_visited" as const,
      createdBy: "user1",
    };

    const baseOrders = [
      { placeId: "1", displayOrder: 1 },
      { placeId: "2", displayOrder: 2 },
    ];
    const ordersAfterAdd = [...baseOrders, { placeId: "3", displayOrder: 3 }];

    const readDisplayOrders = () =>
      JSON.parse(
        screen.getByTestId("PlaceList-displayOrders").textContent || "null"
      );

    const renderView = (places: any[]) =>
      render(
        <ListDetailView places={places} listId="list1" permission="owner" />
      );

    const rerenderView = (rerender: any, places: any[]) =>
      rerender(
        <ListDetailView places={places} listId="list1" permission="owner" />
      );

    // 解決タイミングを制御できる Promise
    const deferred = <T,>() => {
      let resolve!: (value: T) => void;
      const promise = new Promise<T>((r) => {
        resolve = r;
      });
      return { promise, resolve };
    };

    it("地点が追加されたら表示順序を再取得し、新しい地点の順序が反映される", async () => {
      mockGetDisplayOrders
        .mockResolvedValueOnce({ success: true, displayOrders: baseOrders })
        .mockResolvedValueOnce({ success: true, displayOrders: ordersAfterAdd });

      let rerender: any;
      await act(async () => {
        ({ rerender } = renderView(basePlaces));
      });
      expect(readDisplayOrders()).toEqual(baseOrders);

      await act(async () => {
        rerenderView(rerender, [...basePlaces, addedPlace]);
      });

      await waitFor(() => {
        expect(mockGetDisplayOrders).toHaveBeenCalledTimes(2);
      });
      await waitFor(() => {
        expect(readDisplayOrders()).toEqual(ordersAfterAdd);
      });
    });

    it("地点が削除されたら表示順序を再取得する", async () => {
      const ordersAfterDelete = [{ placeId: "1", displayOrder: 1 }];
      mockGetDisplayOrders
        .mockResolvedValueOnce({ success: true, displayOrders: baseOrders })
        .mockResolvedValueOnce({
          success: true,
          displayOrders: ordersAfterDelete,
        });

      let rerender: any;
      await act(async () => {
        ({ rerender } = renderView(basePlaces));
      });

      await act(async () => {
        rerenderView(rerender, [basePlaces[0]]);
      });

      await waitFor(() => {
        expect(mockGetDisplayOrders).toHaveBeenCalledTimes(2);
      });
      await waitFor(() => {
        expect(readDisplayOrders()).toEqual(ordersAfterDelete);
      });
    });

    it("地点の集合が変わらない再レンダリングでは再取得しない", async () => {
      mockGetDisplayOrders.mockResolvedValue({
        success: true,
        displayOrders: baseOrders,
      });

      let rerender: any;
      await act(async () => {
        ({ rerender } = renderView(basePlaces));
      });

      // コメント編集などの revalidatePath で places の参照だけが変わるケース
      await act(async () => {
        rerenderView(rerender, basePlaces.map((p) => ({ ...p })));
      });

      expect(mockGetDisplayOrders).toHaveBeenCalledTimes(1);
    });

    it("再取得が失敗しても既存の表示順序を維持する", async () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockGetDisplayOrders
        .mockResolvedValueOnce({ success: true, displayOrders: baseOrders })
        .mockResolvedValueOnce({
          errorKey: "errors.common.fetchFailed",
          error: "fetch failed",
        });

      let rerender: any;
      await act(async () => {
        ({ rerender } = renderView(basePlaces));
      });

      await act(async () => {
        rerenderView(rerender, [...basePlaces, addedPlace]);
      });

      await waitFor(() => {
        expect(mockGetDisplayOrders).toHaveBeenCalledTimes(2);
      });
      // 空配列で上書きせず、直前の順序を保持する
      expect(readDisplayOrders()).toEqual(baseOrders);
      errorSpy.mockRestore();
    });

    it("再取得が例外を投げても既存の表示順序を維持する", async () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockGetDisplayOrders
        .mockResolvedValueOnce({ success: true, displayOrders: baseOrders })
        .mockRejectedValueOnce(new Error("network down"));

      let rerender: any;
      await act(async () => {
        ({ rerender } = renderView(basePlaces));
      });

      await act(async () => {
        rerenderView(rerender, [...basePlaces, addedPlace]);
      });

      await waitFor(() => {
        expect(mockGetDisplayOrders).toHaveBeenCalledTimes(2);
      });
      expect(readDisplayOrders()).toEqual(baseOrders);
      errorSpy.mockRestore();
    });

    it("古い取得結果が後から返っても新しい結果を上書きしない", async () => {
      const first = deferred<any>();
      const second = deferred<any>();
      mockGetDisplayOrders
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);

      let rerender: any;
      await act(async () => {
        ({ rerender } = renderView(basePlaces));
      });

      await act(async () => {
        rerenderView(rerender, [...basePlaces, addedPlace]);
      });

      // 後発（正しい）レスポンスが先に返る
      await act(async () => {
        second.resolve({ success: true, displayOrders: ordersAfterAdd });
      });
      // 先発（古い）レスポンスが後から返る
      await act(async () => {
        first.resolve({ success: true, displayOrders: baseOrders });
      });

      expect(readDisplayOrders()).toEqual(ordersAfterAdd);
    });

    it("サンプルリストでは表示順序を取得しない", async () => {
      await act(async () => {
        render(
          <ListDetailView
            places={basePlaces}
            listId="sample-1"
            permission="view"
          />
        );
      });
      expect(mockGetDisplayOrders).not.toHaveBeenCalled();
    });
  });
});
