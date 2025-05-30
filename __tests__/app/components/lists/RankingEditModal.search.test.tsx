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

describe("RankingEditModal: 検索・フィルタ", () => {
  it("検索UIで部分一致フィルタが効く", () => {
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="create"
      />
    );
    const input = screen.getByPlaceholderText("地点名で検索");
    fireEvent.change(input, { target: { value: "B" } });
    expect(screen.getByText("Bカフェ")).toBeInTheDocument();
    expect(screen.queryByText("Aカフェ")).not.toBeInTheDocument();
    expect(screen.queryByText("Cカフェ")).not.toBeInTheDocument();
  });

  it("検索結果0件時にメッセージが表示される", () => {
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="create"
      />
    );
    const input = screen.getByPlaceholderText("地点名で検索");
    fireEvent.change(input, { target: { value: "Z" } });
    expect(screen.getByText("該当する地点がありません")).toBeInTheDocument();
  });
});
