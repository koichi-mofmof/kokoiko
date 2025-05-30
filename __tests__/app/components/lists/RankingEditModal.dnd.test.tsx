import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RankingEditModal from "@/app/components/lists/RankingEditModal";
import "@testing-library/jest-dom";

const places = [
  {
    id: "p1",
    name: "Aカフェ",
    address: "東京都A区",
    googleMapsUrl: "",
    latitude: 1,
    longitude: 1,
    tags: [],
    createdAt: new Date(),
    createdBy: "u1",
    visited: "visited" as const,
  },
  {
    id: "p2",
    name: "Bカフェ",
    address: "東京都B区",
    googleMapsUrl: "",
    latitude: 2,
    longitude: 2,
    tags: [],
    createdAt: new Date(),
    createdBy: "u2",
    visited: "not_visited" as const,
  },
  {
    id: "p3",
    name: "Cカフェ",
    address: "東京都C区",
    googleMapsUrl: "",
    latitude: 3,
    longitude: 3,
    tags: [],
    createdAt: new Date(),
    createdBy: "u3",
    visited: "visited" as const,
  },
];
const list = {
  id: "list-1",
  name: "テストリスト",
  description: "",
  ownerId: "u1",
  sharedUserIds: [],
  rankingTitle: "",
  rankingDescription: "",
  ranking: [
    { placeId: "p1", rank: 1, comment: "A" },
    { placeId: "p2", rank: 2, comment: "B" },
    { placeId: "p3", rank: 3, comment: "C" },
  ],
  places,
};

describe("RankingEditModal: D&D操作", () => {
  it("ドラッグ&ドロップで順位が入れ替わること", () => {
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="edit"
      />
    );
    fireEvent.click(screen.getByTestId("move-up-1")); // 2位の上ボタン
    expect(screen.getByTestId("ranking-item-0").textContent).toContain(
      "Bカフェ"
    );
  });

  it("下ボタンで順位が下がること", () => {
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="edit"
      />
    );
    fireEvent.click(screen.getByTestId("move-down-0")); // 1位の下ボタン
    expect(screen.getByTestId("ranking-item-1").textContent).toContain(
      "Aカフェ"
    );
  });

  it("ドラッグハンドルにa11y属性が付与されていること", () => {
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="edit"
      />
    );
    const handles = screen.getAllByLabelText("ドラッグで並び替え");
    expect(handles.length).toBeGreaterThan(0);
    handles.forEach((h) => {
      expect(h).toHaveAttribute("tabindex");
      expect(h).toHaveAttribute("aria-label", "ドラッグで並び替え");
    });
  });
});
