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

const createClientMock = jest.fn();
jest.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

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

describe("RankingView 権限・認可テスト", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      require("@/lib/actions/rankings").fetchRankingViewData as jest.Mock
    ).mockResolvedValue({ rankings: ranking, places });
    (
      require("@/lib/mockData").getPlaceListDetails as jest.Mock
    ).mockResolvedValue({
      id: "sample-1",
      name: "サンプルリスト",
      places,
      ranking,
      ownerId: "user-1",
      sharedUserIds: [],
    });
  });

  it("未ログイン時は編集ボタンが表示されない（本番リスト）", async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    });
    render(<RankingView listId="list-1" />);
    await waitFor(() => {
      expect(screen.queryByText("ランキングを編集")).not.toBeInTheDocument();
    });
  });

  it("未ログイン時は編集ボタンが表示されない（サンプルリスト）", async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    });
    render(<RankingView listId="sample-1" />);
    await waitFor(() => {
      expect(screen.queryByText("ランキングを編集")).not.toBeInTheDocument();
    });
  });

  it("権限なしユーザーは編集ボタンが表示されない", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "other-user" } } }),
      },
    });
    render(<RankingView listId="list-1" />);
    await waitFor(() => {
      expect(screen.queryByText("ランキングを編集")).not.toBeInTheDocument();
    });
  });

  it("APIが権限エラーを返した場合はエラーメッセージが表示される", async () => {
    (
      require("@/lib/actions/rankings").fetchRankingViewData as jest.Mock
    ).mockResolvedValue({ error: "権限がありません" });
    render(<RankingView listId="list-1" />);
    await waitFor(() => {
      expect(screen.getByText("権限がありません")).toBeInTheDocument();
    });
  });
});
