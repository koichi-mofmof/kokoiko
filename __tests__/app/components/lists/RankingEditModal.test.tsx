import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RankingEditModal from "@/app/components/lists/RankingEditModal";
import "@testing-library/jest-dom";

jest.mock("@/lib/actions/rankings", () => ({ saveRankingViewData: jest.fn() }));
import { saveRankingViewData } from "@/lib/actions/rankings";

const places = [
  {
    id: "p1",
    name: "Aカフェ",
    address: "東京都A区",
    googleMapsUrl: "https://maps.google.com/?q=1,1",
    latitude: 1,
    longitude: 1,
    tags: [],
    createdAt: new Date(),
    createdBy: "user-1",
    visited: "visited" as const,
  },
  {
    id: "p2",
    name: "Bカフェ",
    address: "東京都B区",
    googleMapsUrl: "https://maps.google.com/?q=2,2",
    latitude: 2,
    longitude: 2,
    tags: [],
    createdAt: new Date(),
    createdBy: "user-2",
    visited: "not_visited" as const,
  },
];

const list = {
  id: "list-1",
  name: "テストリスト",
  description: "説明",
  ownerId: "user-1",
  sharedUserIds: [],
  rankingTitle: "",
  rankingDescription: "",
  ranking: [],
  places,
};

describe("RankingEditModal", () => {
  beforeEach(() => {
    (saveRankingViewData as jest.Mock).mockResolvedValue({ success: true });
  });

  it("モーダルが開いているときタイトル・件数選択・ランキング対象選択UIが表示される", () => {
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="create"
      />
    );
    expect(
      screen.getByRole("heading", { name: "ランキングを作成" })
    ).toBeInTheDocument();
    expect(screen.getByText("ランキング件数を選択")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("地点名で検索")).toBeInTheDocument();
  });

  it("ランキング対象を追加し、コメント入力・保存ボタンでAPIが呼ばれる", async () => {
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="create"
      />
    );
    // 追加ボタンでAカフェをランキング対象に
    const addBtns = screen.getAllByText("追加");
    fireEvent.click(addBtns[0]);
    // コメント欄を開く
    fireEvent.click(screen.getByText("コメントを書く"));
    fireEvent.change(screen.getAllByPlaceholderText("コメント（任意）")[0], {
      target: { value: "テストコメント" },
    });
    // 保存ボタン押下
    fireEvent.click(screen.getByRole("button", { name: "ランキングを作成" }));
    await waitFor(() => {
      expect(saveRankingViewData).toHaveBeenCalled();
    });
  });

  it("APIエラー時はalertが表示される", async () => {
    (saveRankingViewData as jest.Mock).mockResolvedValue({ error: "保存失敗" });
    window.alert = jest.fn();
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="create"
      />
    );
    const addBtns = screen.getAllByText("追加");
    fireEvent.click(addBtns[0]);
    fireEvent.click(screen.getByRole("button", { name: "ランキングを作成" }));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("保存に失敗")
      );
    });
  });
});
