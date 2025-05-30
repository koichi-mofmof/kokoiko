import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import RankingView from "@/app/components/lists/RankingView";
import "@testing-library/jest-dom";

jest.mock("@/app/components/lists/RankingDisplay", () => (props: any) => (
  <div data-testid="ranking-display">RankingDisplayMock</div>
));

jest.mock("@/lib/actions/rankings", () => ({
  fetchRankingViewData: jest.fn(),
}));
jest.mock("@/lib/mockData", () => ({ getPlaceListDetails: jest.fn() }));

import { fetchRankingViewData } from "@/lib/actions/rankings";
import { getPlaceListDetails } from "@/lib/mockData";

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
];
const ranking = [{ placeId: "p1", rank: 1, comment: "Aコメント" }];

describe("RankingView", () => {
  beforeEach(() => {
    (fetchRankingViewData as jest.Mock).mockResolvedValue({
      rankings: [],
      places: [],
    });
    (getPlaceListDetails as jest.Mock).mockResolvedValue({
      id: "sample-1",
      name: "サンプルリスト",
      places: [],
      ranking: [],
      ownerId: "user-1",
      sharedUserIds: [],
    });
  });

  it("ローディング中は読み込み中...が表示される", () => {
    render(<RankingView listId="list-1" />);
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  it("サンプルリスト時はgetPlaceListDetailsが呼ばれRankingDisplayが表示される", async () => {
    (getPlaceListDetails as jest.Mock).mockResolvedValue({
      id: "sample-1",
      name: "サンプルリスト",
      places,
      ranking,
      ownerId: "user-1",
      sharedUserIds: [],
    });
    render(<RankingView listId="sample-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("ranking-display")).toBeInTheDocument();
    });
  });

  it("本番リスト時はfetchRankingViewDataが呼ばれRankingDisplayが表示される", async () => {
    (fetchRankingViewData as jest.Mock).mockResolvedValue({
      rankings: ranking,
      places,
    });
    render(<RankingView listId="list-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("ranking-display")).toBeInTheDocument();
    });
  });

  it("エラー時はエラーメッセージが表示される", async () => {
    (fetchRankingViewData as jest.Mock).mockResolvedValue({
      error: "取得失敗",
    });
    render(<RankingView listId="list-1" />);
    await waitFor(() => {
      expect(screen.getByText("取得失敗")).toBeInTheDocument();
    });
  });
});
