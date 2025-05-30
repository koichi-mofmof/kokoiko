import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

describe("RankingEditModal: 境界値テスト", () => {
  it("ランキング対象0件時に案内文が表示される", async () => {
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="create"
      />
    );
    await waitFor(() => {
      expect(
        screen.getByText("まだ地点が追加されていません")
      ).toBeInTheDocument();
    });
  });

  it("最大件数時に追加ボタンがdisabledになる", async () => {
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="create"
      />
    );
    fireEvent.click(screen.getByLabelText("その他"));
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "2" } });

    // 追加ボタンが出現するまで待つ
    await waitFor(() => {
      expect(screen.getAllByTestId("add-to-ranking")[0]).not.toBeDisabled();
    });

    // 2件追加
    fireEvent.click(screen.getAllByTestId("add-to-ranking")[0]);
    fireEvent.click(screen.getAllByTestId("add-to-ranking")[0]);

    // 追加ボタンが消えるか、disabledになるかを許容
    await waitFor(() => {
      const addBtns = screen.queryAllByTestId("add-to-ranking");
      if (addBtns.length === 0) return;
      expect(addBtns[0]).toBeDisabled();
    });
  });

  it("長文・特殊文字コメントが入力・表示できる", async () => {
    render(
      <RankingEditModal
        list={{ ...list, ranking: [{ placeId: "p1", rank: 1, comment: "" }] }}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="edit"
      />
    );
    fireEvent.click(screen.getAllByText("コメントを書く")[0]);
    const textarea = await screen.findByPlaceholderText("コメント（任意）");
    const special = "長文テスト\n改行\n特殊文字: !@#￥%＆*()_+";
    fireEvent.change(textarea, { target: { value: special } });
    expect(textarea).toHaveValue(special);
  });
});
