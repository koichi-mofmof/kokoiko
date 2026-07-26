import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PlaceCard from "@/app/components/places/PlaceCard";
import { Place } from "@/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("PlaceCard", () => {
  const basePlace: Place = {
    id: "1",
    name: "テストスポット",
    address: "東京都新宿区",
    googleMapsUrl: "https://maps.google.com/?q=テストスポット",
    latitude: 35.6895,
    longitude: 139.6917,
    tags: [
      { id: "tag-1", name: "カフェ" },
      { id: "tag-2", name: "観光" },
    ],
    createdAt: new Date(),
    visited: "not_visited",
    createdBy: "user-1",
    listPlaceId: "abc-123",
  };

  it("名前・住所・タグ・未訪問ステータスが表示される", () => {
    render(<PlaceCard place={basePlace} listId="list-1" />);
    expect(screen.getByText("テストスポット")).toBeInTheDocument();
    expect(screen.getByText("東京都新宿区")).toBeInTheDocument();
    expect(screen.getByText("カフェ")).toBeInTheDocument();
    expect(screen.getByText("観光")).toBeInTheDocument();
    expect(screen.getAllByText("未訪問").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /詳細を見る/ })
    ).toBeInTheDocument();
  });

  it("コメントがある場合は本文が表示される", () => {
    render(
      <PlaceCard
        place={{ ...basePlace, comment: "白焼きが絶品" }}
        listId="list-1"
      />
    );
    expect(screen.getByText("白焼きが絶品")).toBeInTheDocument();
    expect(screen.getByTestId("place-comment")).toBeInTheDocument();
  });

  it("コメントがない場合はコメント要素を表示しない", () => {
    render(<PlaceCard place={basePlace} listId="list-1" />);
    expect(screen.queryByTestId("place-comment")).not.toBeInTheDocument();
  });

  it("訪問済みステータスが表示される", () => {
    render(
      <PlaceCard place={{ ...basePlace, visited: "visited" }} listId="list-1" />
    );
    expect(screen.getAllByText("訪問済み").length).toBeGreaterThan(0);
  });

  it("showVisited=false（閲覧者）では訪問ステータスを表示しない", () => {
    render(<PlaceCard place={basePlace} listId="list-1" showVisited={false} />);
    expect(screen.queryByText("未訪問")).not.toBeInTheDocument();
    expect(screen.queryByText("訪問済み")).not.toBeInTheDocument();
  });

  it("onClickが呼ばれる", () => {
    const onClick = jest.fn();
    render(<PlaceCard place={basePlace} listId="list-1" onClick={onClick} />);
    fireEvent.click(screen.getByText("テストスポット"));
    expect(onClick).toHaveBeenCalledWith(basePlace);
  });

  it("onCloseボタンが表示・動作する", () => {
    const onClose = jest.fn();
    render(<PlaceCard place={basePlace} listId="list-1" onClose={onClose} />);
    const closeBtn = screen.getByRole("button", { name: /閉じる/ });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("詳細ボタン押下でrouter.pushが呼ばれる（通常リスト）", () => {
    const push = jest.fn();
    jest
      .spyOn(require("next/navigation"), "useRouter")
      .mockReturnValue({ push });
    render(<PlaceCard place={basePlace} listId="list-1" />);
    fireEvent.click(screen.getByRole("button", { name: /詳細を見る/ }));
    expect(push).toHaveBeenCalledWith("/lists/list-1/place/1");
  });

  it("isSample時はサンプル遷移先になる", () => {
    const push = jest.fn();
    jest
      .spyOn(require("next/navigation"), "useRouter")
      .mockReturnValue({ push });
    render(<PlaceCard place={basePlace} listId="list-1" isSample />);
    fireEvent.click(screen.getByRole("button", { name: /詳細を見る/ }));
    expect(push).toHaveBeenCalledWith("/sample/list-1/place/1");
  });
});
