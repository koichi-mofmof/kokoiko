import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import RankingView from "@/app/components/lists/RankingView";
import "@testing-library/jest-dom";

jest.mock("@/lib/actions/rankings", () => ({
  fetchRankingViewData: jest.fn(),
}));
jest.mock("@/lib/mockData", () => ({ getPlaceListDetails: jest.fn() }));
import { fetchRankingViewData } from "@/lib/actions/rankings";
import { getPlaceListDetails } from "@/lib/mockData";

describe("RankingView: ローディング・スケルトン表示", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("データ取得中に読み込み中が表示される", async () => {
    (fetchRankingViewData as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );
    render(<RankingView listId="list-1" />);
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  it("エラー時にエラーメッセージが表示される", async () => {
    (fetchRankingViewData as jest.Mock).mockResolvedValue({
      error: "取得失敗",
    });
    render(<RankingView listId="list-1" />);
    await waitFor(() => {
      expect(screen.getByText("取得失敗")).toBeInTheDocument();
    });
  });
});
