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
  ranking: [],
  places,
};

describe("RankingEditModal: 最大件数制限", () => {
  it("ランキング件数上限時に追加ボタンがdisabledになる", () => {
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="create"
      />
    );
    // 件数を2に設定
    fireEvent.click(screen.getByLabelText("その他"));
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "2" } });
    // 2件追加
    fireEvent.click(screen.getAllByText("追加")[0]);
    fireEvent.click(screen.getAllByText("追加")[0]);
    // 追加ボタンがdisabled
    expect(screen.getAllByText("追加")[0]).toBeDisabled();
    // 警告表示
    expect(screen.getByText("最大件数に達しています。")).toBeInTheDocument();
  });
});
