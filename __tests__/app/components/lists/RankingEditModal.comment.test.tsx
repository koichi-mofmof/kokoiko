import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RankingEditModal from "@/app/components/lists/RankingEditModal";
import "@testing-library/jest-dom";

jest.mock("@/lib/actions/rankings", () => ({
  saveRankingViewData: jest.fn(() => Promise.resolve({ success: true })),
}));
import { saveRankingViewData } from "@/lib/actions/rankings";

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
    { placeId: "p1", rank: 1, comment: "" },
    { placeId: "p2", rank: 2, comment: "" },
  ],
  places,
};

describe("RankingEditModal: コメント入力・編集", () => {
  it("コメント入力→保存でAPIが呼ばれる", async () => {
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="edit"
      />
    );
    // 1位のコメントトリガーを開く
    fireEvent.click(screen.getAllByText("コメントを書く")[0]);
    const textarea = screen.getByPlaceholderText("コメント（任意）");
    fireEvent.change(textarea, { target: { value: "最高のカフェ！" } });
    fireEvent.click(screen.getByText("ランキングを保存"));
    await waitFor(() => {
      expect(saveRankingViewData).toHaveBeenCalledWith(
        expect.objectContaining({
          rankedPlaces: expect.arrayContaining([
            expect.objectContaining({ comment: "最高のカフェ！" }),
          ]),
        })
      );
    });
  });

  it("長文・改行・特殊文字の入力が反映される", async () => {
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="edit"
      />
    );
    fireEvent.click(screen.getAllByText("コメントを書く")[0]);
    const textarea = screen.getByPlaceholderText("コメント（任意）");
    const longComment = "長文テスト\n改行テスト\n特殊文字: !@#￥%＆*()_+";
    fireEvent.change(textarea, { target: { value: longComment } });
    fireEvent.click(screen.getByText("ランキングを保存"));
    await waitFor(() => {
      expect(saveRankingViewData).toHaveBeenCalledWith(
        expect.objectContaining({
          rankedPlaces: expect.arrayContaining([
            expect.objectContaining({ comment: longComment }),
          ]),
        })
      );
    });
  });

  it("コメント編集→保存で内容が更新される", async () => {
    const listWithComment = {
      ...list,
      ranking: [
        { placeId: "p1", rank: 1, comment: "初期コメント" },
        { placeId: "p2", rank: 2, comment: "" },
      ],
    };
    render(
      <RankingEditModal
        list={listWithComment}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="edit"
      />
    );
    fireEvent.click(screen.getAllByText("コメントあり")[0]);
    const textarea = screen.getByPlaceholderText("コメント（任意）");
    fireEvent.change(textarea, { target: { value: "編集後コメント" } });
    fireEvent.click(screen.getByText("ランキングを保存"));
    await waitFor(() => {
      expect(saveRankingViewData).toHaveBeenCalledWith(
        expect.objectContaining({
          rankedPlaces: expect.arrayContaining([
            expect.objectContaining({ comment: "編集後コメント" }),
          ]),
        })
      );
    });
  });
});
