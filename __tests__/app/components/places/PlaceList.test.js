import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PlaceList from "../../../../app/components/places/PlaceList";
import "@testing-library/jest-dom";
import { mockPlaces } from "../../../../lib/mockData";

// next/router の useRouter をモック (トップレベルに移動)
const mockRouterPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));

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
  ChevronRight: () => (
    <span data-testid="chevron-right-icon">シェブロン右アイコン</span>
  ),
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
  beforeEach(() => {
    mockRouterPush.mockClear(); // 各テスト前にモックをクリア
  });

  it("場所のリストが正しく表示されること", () => {
    const testPlaces = mockPlaces.slice(0, 3);
    const listId = "test-list-id";

    render(<PlaceList places={testPlaces} listId={listId} />);

    testPlaces.forEach((place) => {
      expect(screen.getByText(place.name)).toBeInTheDocument();
      expect(screen.getByText(place.address)).toBeInTheDocument();
      if (place.notes) {
        expect(screen.getByText(place.notes)).toBeInTheDocument();
      }
      place.tags.forEach((tag) => {
        expect(screen.getByText(tag.name)).toBeInTheDocument();
      });
    });

    const visitedElements = screen.queryAllByText("訪問済み");
    const notVisitedElements = screen.queryAllByText("未訪問");
    expect(visitedElements.length).toBe(
      testPlaces.filter((p) => p.visited === "visited").length
    );
    expect(notVisitedElements.length).toBe(
      testPlaces.filter((p) => p.visited !== "visited").length
    );

    // "Googleマップで開く" のアサーションは削除
  });

  it("場所をクリックすると正しいパスに遷移すること", () => {
    const testPlaces = mockPlaces.slice(0, 3);
    const listId = "test-list-id";
    const isSample = false;

    render(
      <PlaceList places={testPlaces} listId={listId} isSample={isSample} />
    );

    const firstPlaceElement = screen.getByLabelText(
      `${testPlaces[0].name}の詳細を見る`
    );
    fireEvent.click(firstPlaceElement);

    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith(
      `/lists/${listId}/place/${testPlaces[0].id}`
    );
  });

  it("サンプルモードで場所をクリックすると正しいパスに遷移すること", () => {
    const testPlaces = mockPlaces.slice(0, 3);
    const listId = "sample-list-id";
    const isSample = true;

    render(
      <PlaceList places={testPlaces} listId={listId} isSample={isSample} />
    );

    const firstPlaceElement = screen.getByLabelText(
      `${testPlaces[0].name}の詳細を見る`
    );
    fireEvent.click(firstPlaceElement);

    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith(
      `/sample/${listId}/place/${testPlaces[0].id}`
    );
  });

  it("選択された場所が強調表示されること", () => {
    const testPlaces = mockPlaces.slice(0, 3);
    const listId = "test-list-id";
    const selectedPlaceId = testPlaces[1].id;

    const { container } = render(
      <PlaceList
        places={testPlaces}
        listId={listId}
        selectedPlaceId={selectedPlaceId}
      />
    );

    const placeElements = container.querySelectorAll("div[role='button']");

    placeElements.forEach((element) => {
      const ariaLabel = element.getAttribute("aria-label");
      if (ariaLabel && ariaLabel.includes(testPlaces[1].name)) {
        expect(element).toHaveClass("border-primary-300", "bg-primary-50");
      } else {
        expect(element).not.toHaveClass("border-primary-300");
        expect(element).not.toHaveClass("bg-primary-50");
      }
    });
  });

  it("場所が0件の場合は適切なメッセージが表示されること", () => {
    const listId = "test-list-id";
    render(<PlaceList places={[]} listId={listId} />);
    expect(screen.getByText("登録された場所がありません")).toBeInTheDocument();
  });
});
