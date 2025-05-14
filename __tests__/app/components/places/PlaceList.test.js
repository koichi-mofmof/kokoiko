import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PlaceList from "../../../../app/components/places/PlaceList";
import "@testing-library/jest-dom";
import { mockPlaces } from "../../../../lib/mockData";

// アイコンコンポーネントをモック
jest.mock("lucide-react", () => ({
  Calendar: () => <span data-testid="calendar-icon">カレンダーアイコン</span>,
  Check: () => <span data-testid="check-icon">チェックアイコン</span>,
  Circle: () => <span data-testid="circle-icon">サークルアイコン</span>,
  ExternalLink: () => (
    <span data-testid="external-link-icon">外部リンクアイコン</span>
  ),
  MapPin: () => <span data-testid="map-pin-icon">地図ピンアイコン</span>,
  Tag: () => <span data-testid="tag-icon">タグアイコン</span>,
}));

// Next.jsのLinkコンポーネントをモック
jest.mock("next/link", () => {
  return ({ children, href, ...rest }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("PlaceListコンポーネントテスト", () => {
  const mockOnPlaceSelect = jest.fn();

  beforeEach(() => {
    mockOnPlaceSelect.mockClear();
  });

  it("場所のリストが正しく表示されること", () => {
    // テスト用のサンプルデータ（最初の3件のみ使用）
    const testPlaces = mockPlaces.slice(0, 3);

    render(<PlaceList places={testPlaces} onPlaceSelect={mockOnPlaceSelect} />);

    // 各場所の名前が表示されていることを確認
    testPlaces.forEach((place) => {
      expect(screen.getByText(place.name)).toBeInTheDocument();
      expect(screen.getByText(place.address)).toBeInTheDocument();

      // メモがある場合はメモも表示されていることを確認
      if (place.notes) {
        expect(screen.getByText(place.notes)).toBeInTheDocument();
      }

      // タグが表示されていることを確認
      place.tags.forEach((tag) => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });

      // 訪問ステータスが表示されていることを確認
      // if (place.visited) {
      //   expect(screen.getByText("訪問済み")).toBeInTheDocument();
      // } else {
      //   expect(screen.getByText("未訪問")).toBeInTheDocument();
      // }
    });

    // 訪問ステータスが表示されていることを確認（複数要素対応）
    const visitedElements = screen.queryAllByText("訪問済み");
    const notVisitedElements = screen.queryAllByText("未訪問");

    // テストプレースデータの訪問状態に応じた要素数を確認
    expect(visitedElements.length).toBe(
      testPlaces.filter((p) => p.visited).length
    );
    expect(notVisitedElements.length).toBe(
      testPlaces.filter((p) => !p.visited).length
    );

    // Googleマップへのリンクが各場所分存在することを確認
    const googleMapsLinks = screen.getAllByText("Googleマップで開く");
    expect(googleMapsLinks).toHaveLength(testPlaces.length);
  });

  it("場所をクリックすると選択イベントが発火すること", () => {
    const testPlaces = mockPlaces.slice(0, 3);

    render(<PlaceList places={testPlaces} onPlaceSelect={mockOnPlaceSelect} />);

    // 最初の場所をクリック
    fireEvent.click(screen.getByText(testPlaces[0].name));

    // onPlaceSelectが正しいプレースデータで呼ばれることを確認
    expect(mockOnPlaceSelect).toHaveBeenCalledTimes(1);
    expect(mockOnPlaceSelect).toHaveBeenCalledWith(testPlaces[0]);
  });

  it("選択された場所が強調表示されること", () => {
    const testPlaces = mockPlaces.slice(0, 3);
    const selectedPlaceId = testPlaces[1].id;

    const { container } = render(
      <PlaceList
        places={testPlaces}
        onPlaceSelect={mockOnPlaceSelect}
        selectedPlaceId={selectedPlaceId}
      />
    );

    // 選択された場所のコンテナが特別なクラスを持つことを確認
    // 注意: データ属性や特定のセレクタを使用するのが理想的ですが、
    // 現在のコンポーネント実装ではクラス名に基づいて判断します
    const placeElements = container.querySelectorAll(".border");

    // 各要素のクラスを確認
    let foundSelected = false;
    placeElements.forEach((element) => {
      if (element.textContent.includes(testPlaces[1].name)) {
        expect(element.className).toContain("border-primary-300");
        foundSelected = true;
      } else {
        expect(element.className).toContain("border-neutral-200");
      }
    });

    expect(foundSelected).toBe(true);
  });

  it("場所が0件の場合は適切なメッセージが表示されること", () => {
    render(<PlaceList places={[]} onPlaceSelect={mockOnPlaceSelect} />);

    expect(screen.getByText("登録された場所がありません")).toBeInTheDocument();
  });
});
