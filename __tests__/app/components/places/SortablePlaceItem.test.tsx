import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortablePlaceItem } from "@/app/components/places/SortablePlaceItem";
import { Place } from "@/types";

// モック関数を作成
const mockPush = jest.fn();

// モックの設定
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockPlace: Place = {
  id: "test-place-1",
  name: "東京タワー",
  address: "東京都港区芝公園4-2-8",
  googleMapsUrl: "https://maps.google.com/?q=東京タワー",
  latitude: 35.6586,
  longitude: 139.7454,
  tags: [{ id: "tag1", name: "観光" }],
  createdAt: new Date("2023-01-01T00:00:00Z"),
  visited: "visited" as const,
  createdBy: "user1",
  createdByUser: {
    id: "user1",
    name: "テストユーザー",
    avatarUrl: "https://example.com/avatar.jpg",
  },
};

// DnD対応のWrapper
const DndWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DndContext>
    <SortableContext
      items={["test-place-1"]}
      strategy={verticalListSortingStrategy}
    >
      {children}
    </SortableContext>
  </DndContext>
);

describe("SortablePlaceItem", () => {
  const defaultProps = {
    place: mockPlace,
    displayOrder: 1,
    listId: "test-list",
    selectedPlaceId: undefined,
    isSample: false,
    isDragDisabled: false,
  };

  beforeEach(() => {
    mockPush.mockClear();
  });

  it("場所の情報が正しく表示される", () => {
    render(
      <DndWrapper>
        <SortablePlaceItem {...defaultProps} />
      </DndWrapper>
    );

    expect(screen.getByText("東京タワー")).toBeInTheDocument();
    expect(screen.getByText("東京都港区芝公園4-2-8")).toBeInTheDocument();
    expect(screen.getByText("観光")).toBeInTheDocument();
    expect(screen.getByText("訪問済み")).toBeInTheDocument();
  });

  it("表示順序番号が正しく表示される", () => {
    render(
      <DndWrapper>
        <SortablePlaceItem {...defaultProps} displayOrder={5} />
      </DndWrapper>
    );

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("ドラッグハンドルが表示される（ドラッグ無効でない場合）", () => {
    render(
      <DndWrapper>
        <SortablePlaceItem {...defaultProps} />
      </DndWrapper>
    );

    const dragHandle = screen.getByTestId("drag-handle");
    expect(dragHandle).toBeInTheDocument();
  });

  it("ドラッグハンドルが非表示になる（ドラッグ無効の場合）", () => {
    render(
      <DndWrapper>
        <SortablePlaceItem {...defaultProps} isDragDisabled={true} />
      </DndWrapper>
    );

    expect(screen.queryByTestId("drag-handle")).not.toBeInTheDocument();
  });

  it("選択状態のスタイルが適用される", () => {
    render(
      <DndWrapper>
        <SortablePlaceItem {...defaultProps} selectedPlaceId="test-place-1" />
      </DndWrapper>
    );

    const card = screen.getByLabelText("東京タワーの詳細を見る");
    expect(card).toHaveClass("border-primary-300", "bg-primary-50");
  });

  it("クリックイベントが正しく動作する", () => {
    render(
      <DndWrapper>
        <SortablePlaceItem {...defaultProps} />
      </DndWrapper>
    );

    const card = screen.getByLabelText("東京タワーの詳細を見る");
    fireEvent.click(card);

    expect(mockPush).toHaveBeenCalledWith(
      "/lists/test-list/place/test-place-1"
    );
  });

  it("サンプルリスト用のURLが生成される", () => {
    render(
      <DndWrapper>
        <SortablePlaceItem {...defaultProps} isSample={true} />
      </DndWrapper>
    );

    const card = screen.getByLabelText("東京タワーの詳細を見る");
    fireEvent.click(card);

    expect(mockPush).toHaveBeenCalledWith(
      "/sample/test-list/place/test-place-1"
    );
  });

  it("キーボード操作（Enter/Space）で場所詳細に移動する", () => {
    render(
      <DndWrapper>
        <SortablePlaceItem {...defaultProps} />
      </DndWrapper>
    );

    const card = screen.getByLabelText("東京タワーの詳細を見る");

    // Enterキー
    fireEvent.keyDown(card, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith(
      "/lists/test-list/place/test-place-1"
    );

    // Spaceキー
    fireEvent.keyDown(card, { key: " " });
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  // エラーケースとエッジケースのテスト
  describe("エラーケース・エッジケース", () => {
    it("表示順序が0の場合は順序番号が表示されない", () => {
      render(
        <DndWrapper>
          <SortablePlaceItem {...defaultProps} displayOrder={0} />
        </DndWrapper>
      );

      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });

    it("大きな表示順序番号でも正常に表示される", () => {
      render(
        <DndWrapper>
          <SortablePlaceItem {...defaultProps} displayOrder={999} />
        </DndWrapper>
      );

      expect(screen.getByText("999")).toBeInTheDocument();
    });

    it("サンプルリストでは順序番号が表示されない", () => {
      render(
        <DndWrapper>
          <SortablePlaceItem
            {...defaultProps}
            displayOrder={5}
            isSample={true}
          />
        </DndWrapper>
      );

      expect(screen.queryByText("5")).not.toBeInTheDocument();
    });

    it("場所情報が不完全でもエラーなく表示される", () => {
      const incompletePlace = {
        ...mockPlace,
        createdByUser: undefined,
        tags: [],
      };

      render(
        <DndWrapper>
          <SortablePlaceItem {...defaultProps} place={incompletePlace} />
        </DndWrapper>
      );

      expect(screen.getByText("東京タワー")).toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument(); // アバターなし
    });

    it("長い場所名でもレイアウトが崩れない", () => {
      const longNamePlace = {
        ...mockPlace,
        name: "非常に長い場所の名前でUIレイアウトのテストを行うための場所".repeat(
          3
        ),
      };

      render(
        <DndWrapper>
          <SortablePlaceItem {...defaultProps} place={longNamePlace} />
        </DndWrapper>
      );

      expect(screen.getByText(longNamePlace.name)).toBeInTheDocument();
    });

    it("無効なキーでは場所詳細に移動しない", () => {
      render(
        <DndWrapper>
          <SortablePlaceItem {...defaultProps} />
        </DndWrapper>
      );

      const card = screen.getByLabelText("東京タワーの詳細を見る");

      // 無効なキー
      fireEvent.keyDown(card, { key: "Escape" });
      fireEvent.keyDown(card, { key: "a" });
      fireEvent.keyDown(card, { key: "F1" });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("アクセシビリティ", () => {
    it("aria-labelが動的に設定される", () => {
      const place = {
        ...mockPlace,
        name: "カスタム場所名",
      };

      render(
        <DndWrapper>
          <SortablePlaceItem {...defaultProps} place={place} />
        </DndWrapper>
      );

      expect(
        screen.getByLabelText("カスタム場所名の詳細を見る")
      ).toBeInTheDocument();
    });

    it("ドラッグ無効時はドラッグ関連のaria属性が設定されない", () => {
      render(
        <DndWrapper>
          <SortablePlaceItem {...defaultProps} isDragDisabled={true} />
        </DndWrapper>
      );

      // ドラッグハンドルが存在しないことを確認
      expect(screen.queryByTestId("drag-handle")).not.toBeInTheDocument();
    });

    it("フォーカス可能な要素が正しく設定される", () => {
      render(
        <DndWrapper>
          <SortablePlaceItem {...defaultProps} />
        </DndWrapper>
      );

      const card = screen.getByLabelText("東京タワーの詳細を見る");
      expect(card).toHaveAttribute("tabindex", "0");
    });
  });

  describe("パフォーマンス", () => {
    it("多数のタグでもレンダリングパフォーマンスが保たれる", () => {
      const manyTagsPlace = {
        ...mockPlace,
        tags: Array.from({ length: 20 }, (_, i) => ({
          id: `tag-${i}`,
          name: `タグ${i}`,
        })),
      };

      const startTime = performance.now();
      render(
        <DndWrapper>
          <SortablePlaceItem {...defaultProps} place={manyTagsPlace} />
        </DndWrapper>
      );
      const endTime = performance.now();

      // レンダリング時間が妥当な範囲内であることを確認
      expect(endTime - startTime).toBeLessThan(100); // 100ms以下

      // 全てのタグが表示されることを確認
      expect(screen.getByText("タグ0")).toBeInTheDocument();
      expect(screen.getByText("タグ19")).toBeInTheDocument();
    });
  });

  describe("統合テスト", () => {
    it("コンポーネントの全ての機能が連携して動作する", () => {
      render(
        <DndWrapper>
          <SortablePlaceItem
            {...defaultProps}
            displayOrder={42}
            selectedPlaceId="test-place-1"
            isDragDisabled={false}
          />
        </DndWrapper>
      );

      // 表示順序
      expect(screen.getByText("42")).toBeInTheDocument();

      // 選択状態
      const card = screen.getByLabelText("東京タワーの詳細を見る");
      expect(card).toHaveClass("border-primary-300", "bg-primary-50");

      // ドラッグハンドル
      expect(screen.getByTestId("drag-handle")).toBeInTheDocument();

      // ナビゲーション
      fireEvent.click(card);
      expect(mockPush).toHaveBeenCalledWith(
        "/lists/test-list/place/test-place-1"
      );
    });
  });
});
