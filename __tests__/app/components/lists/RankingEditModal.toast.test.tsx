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

describe("RankingEditModal: トースト通知・ユーザーフィードバック", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("保存失敗時にalertが表示される", async () => {
    // エラーログを抑制
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (saveRankingViewData as jest.Mock).mockResolvedValue({
      success: false,
      error: "保存失敗",
    });
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="edit"
      />
    );
    fireEvent.click(screen.getByText("ランキングを保存"));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining("保存失敗")
      );
    });
    alertSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("APIエラー時にalertが表示される", async () => {
    // エラーログを抑制
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (saveRankingViewData as jest.Mock).mockRejectedValue(
      new Error("APIエラー")
    );
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    render(
      <RankingEditModal
        list={list}
        isOpen={true}
        onOpenChange={() => {}}
        onRankingUpdate={() => {}}
        mode="edit"
      />
    );
    fireEvent.click(screen.getByText("ランキングを保存"));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining("予期せぬエラー")
      );
    });
    alertSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
