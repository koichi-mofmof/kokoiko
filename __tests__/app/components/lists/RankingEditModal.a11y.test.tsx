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
];
const list = {
  id: "list-1",
  name: "テストリスト",
  description: "",
  ownerId: "u1",
  sharedUserIds: [],
  rankingTitle: "",
  rankingDescription: "",
  ranking: [{ placeId: "p1", rank: 1, comment: "" }],
  places,
};

describe("RankingEditModal: モーダルa11y・UI制御", () => {
  it("Escキーで閉じる", () => {
    const handleOpenChange = jest.fn();
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={handleOpenChange}
        onRankingUpdate={() => {}}
        mode="edit"
      />
    );
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it("キャンセルボタンで閉じる", () => {
    const handleOpenChange = jest.fn();
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={handleOpenChange}
        onRankingUpdate={() => {}}
        mode="edit"
      />
    );
    fireEvent.click(screen.getByText("キャンセル"));
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it("保存ボタン多重押下防止", () => {
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="edit"
      />
    );
    const saveBtn = screen.getByText("ランキングを保存");
    fireEvent.click(saveBtn);
    expect(saveBtn).toBeDisabled();
  });
});
