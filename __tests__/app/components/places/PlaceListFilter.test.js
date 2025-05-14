import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { mockPlaces } from "../../../../lib/mockData";

// フィルタリング・並び替え機能付きの場所リストコンポーネント
const PlaceListWithFilters = ({ places: initialPlaces }) => {
  const [filteredPlaces, setFilteredPlaces] = React.useState(initialPlaces);
  const [filters, setFilters] = React.useState({
    keyword: "",
    tag: "",
    visitStatus: "all", // "all", "visited", "notVisited"
  });
  const [sortBy, setSortBy] = React.useState("name"); // "name", "date", "address"

  // フィルター適用
  React.useEffect(() => {
    let result = [...initialPlaces];

    // キーワードフィルター
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      result = result.filter(
        (place) =>
          place.name.toLowerCase().includes(keyword) ||
          place.address.toLowerCase().includes(keyword) ||
          (place.notes && place.notes.toLowerCase().includes(keyword))
      );
    }

    // タグフィルター
    if (filters.tag) {
      result = result.filter((place) =>
        place.tags.some(
          (tag) => tag.toLowerCase() === filters.tag.toLowerCase()
        )
      );
    }

    // 訪問状況フィルター
    if (filters.visitStatus === "visited") {
      result = result.filter((place) => place.visited);
    } else if (filters.visitStatus === "notVisited") {
      result = result.filter((place) => !place.visited);
    }

    // 並び替え
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "address") {
        return a.address.localeCompare(b.address);
      } else if (sortBy === "date") {
        const dateA = a.visitPlanned ? new Date(a.visitPlanned) : new Date(0);
        const dateB = b.visitPlanned ? new Date(b.visitPlanned) : new Date(0);
        return dateB.getTime() - dateA.getTime(); // 新しい順
      }
      return 0;
    });

    setFilteredPlaces(result);
  }, [initialPlaces, filters, sortBy]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {/* キーワード検索 */}
        <input
          type="text"
          placeholder="キーワード検索"
          value={filters.keyword}
          onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          data-testid="keyword-filter"
          className="p-2 border rounded"
        />

        {/* タグフィルター */}
        <select
          value={filters.tag}
          onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
          data-testid="tag-filter"
          className="p-2 border rounded"
        >
          <option value="">タグを選択</option>
          <option value="観光">観光</option>
          <option value="食事">食事</option>
          <option value="宿泊">宿泊</option>
        </select>

        {/* 訪問状況フィルター */}
        <select
          value={filters.visitStatus}
          onChange={(e) =>
            setFilters({ ...filters, visitStatus: e.target.value })
          }
          data-testid="visit-status-filter"
          className="p-2 border rounded"
        >
          <option value="all">すべて</option>
          <option value="visited">訪問済み</option>
          <option value="notVisited">未訪問</option>
        </select>

        {/* 並び替え */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          data-testid="sort-by"
          className="p-2 border rounded"
        >
          <option value="name">名前順</option>
          <option value="address">住所順</option>
          <option value="date">日付順</option>
        </select>
      </div>

      {/* 結果表示 */}
      <div data-testid="result-count" className="mb-2 text-sm">
        {filteredPlaces.length}件の場所が見つかりました
      </div>

      {/* 場所リスト */}
      <ul>
        {filteredPlaces.map((place) => (
          <li
            key={place.id}
            data-testid={`place-item-${place.id}`}
            className="mb-2 p-2 border rounded"
          >
            <div className="font-medium">{place.name}</div>
            <div className="text-sm">{place.address}</div>
            {place.notes && (
              <div className="text-sm text-gray-600">{place.notes}</div>
            )}
            <div className="text-sm mt-1">
              {place.visited ? "訪問済み" : "未訪問"}
            </div>
            <div className="text-sm mt-1">{place.tags.join(", ")}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// テスト
describe("場所一覧のフィルタリングと並び替えテスト", () => {
  it("キーワードでフィルタリングできること", async () => {
    render(<PlaceListWithFilters places={mockPlaces} />);

    // 初期状態で全ての場所が表示されていることを確認
    expect(screen.getByTestId("result-count").textContent).toContain(
      `${mockPlaces.length}件の場所`
    );

    // 特定のキーワードでフィルタリング
    const keywordInput = screen.getByTestId("keyword-filter");
    fireEvent.change(keywordInput, { target: { value: "東京" } });

    // 「東京」を含む場所だけが表示されることを確認
    await waitFor(() => {
      const filteredCount = mockPlaces.filter(
        (place) =>
          place.name.includes("東京") ||
          place.address.includes("東京") ||
          (place.notes && place.notes.includes("東京"))
      ).length;

      expect(screen.getByTestId("result-count").textContent).toContain(
        `${filteredCount}件の場所`
      );
    });

    // フィルターをクリア
    fireEvent.change(keywordInput, { target: { value: "" } });

    // 全ての場所が再表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId("result-count").textContent).toContain(
        `${mockPlaces.length}件の場所`
      );
    });
  });

  it("タグでフィルタリングできること", async () => {
    render(<PlaceListWithFilters places={mockPlaces} />);

    // タグフィルターを適用
    const tagFilter = screen.getByTestId("tag-filter");
    fireEvent.change(tagFilter, { target: { value: "観光" } });

    // 「観光」タグを持つ場所だけが表示されることを確認
    await waitFor(() => {
      const filteredCount = mockPlaces.filter((place) =>
        place.tags.some((tag) => tag.toLowerCase() === "観光")
      ).length;

      expect(screen.getByTestId("result-count").textContent).toContain(
        `${filteredCount}件の場所`
      );
    });
  });

  it("訪問状況でフィルタリングできること", async () => {
    render(<PlaceListWithFilters places={mockPlaces} />);

    // 訪問済みフィルターを適用
    const visitStatusFilter = screen.getByTestId("visit-status-filter");
    fireEvent.change(visitStatusFilter, { target: { value: "visited" } });

    // 訪問済みの場所だけが表示されることを確認
    await waitFor(() => {
      const filteredCount = mockPlaces.filter((place) => place.visited).length;
      expect(screen.getByTestId("result-count").textContent).toContain(
        `${filteredCount}件の場所`
      );
    });

    // 未訪問フィルターを適用
    fireEvent.change(visitStatusFilter, { target: { value: "notVisited" } });

    // 未訪問の場所だけが表示されることを確認
    await waitFor(() => {
      const filteredCount = mockPlaces.filter((place) => !place.visited).length;
      expect(screen.getByTestId("result-count").textContent).toContain(
        `${filteredCount}件の場所`
      );
    });
  });

  it("並び替えが機能すること", async () => {
    render(<PlaceListWithFilters places={mockPlaces} />);

    // 名前順の並び替えを適用
    const sortBySelect = screen.getByTestId("sort-by");
    fireEvent.change(sortBySelect, { target: { value: "name" } });

    // 名前順にソートされた場所のリストを取得
    await waitFor(() => {
      const placeItems = screen.getAllByTestId(/^place-item-/);
      const displayedNames = placeItems.map(
        (item) => item.querySelector(".font-medium").textContent
      );

      // 名前順にソートした場合の期待値
      const sortedNames = [...mockPlaces]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((place) => place.name);

      // 表示順序が名前順ソートと一致することを確認
      expect(displayedNames).toEqual(sortedNames);
    });

    // 住所順の並び替えを適用
    fireEvent.change(sortBySelect, { target: { value: "address" } });

    // 住所順にソートされることを確認
    await waitFor(() => {
      const placeItems = screen.getAllByTestId(/^place-item-/);
      const displayedAddresses = placeItems.map(
        (item) => item.querySelectorAll("div")[1].textContent
      );

      // 住所順にソートした場合の期待値
      const sortedAddresses = [...mockPlaces]
        .sort((a, b) => a.address.localeCompare(b.address))
        .map((place) => place.address);

      expect(displayedAddresses).toEqual(sortedAddresses);
    });
  });

  it("複数のフィルターを組み合わせて使用できること", async () => {
    render(<PlaceListWithFilters places={mockPlaces} />);

    // キーワードとタグの両方でフィルタリング
    const keywordInput = screen.getByTestId("keyword-filter");
    const tagFilter = screen.getByTestId("tag-filter");

    fireEvent.change(keywordInput, { target: { value: "東京" } });
    fireEvent.change(tagFilter, { target: { value: "観光" } });

    // 条件を両方満たす場所だけが表示されることを確認
    await waitFor(() => {
      const filteredCount = mockPlaces.filter(
        (place) =>
          (place.name.includes("東京") ||
            place.address.includes("東京") ||
            (place.notes && place.notes.includes("東京"))) &&
          place.tags.some((tag) => tag.toLowerCase() === "観光")
      ).length;

      expect(screen.getByTestId("result-count").textContent).toContain(
        `${filteredCount}件の場所`
      );
    });
  });
});
