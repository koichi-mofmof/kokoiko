import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RankingCard from "@/app/components/lists/RankingCard";
import { RankedPlace, Place } from "@/types";
import "@testing-library/jest-dom";

const basePlace: Place = {
  id: "place-1",
  name: "テストカフェ",
  address: "東京都渋谷区1-2-3",
  googleMapsUrl: "https://maps.google.com/?q=35.123,139.456",
  latitude: 35.123,
  longitude: 139.456,
  tags: [],
  createdAt: new Date(),
  createdBy: "user-1",
  visited: "visited",
};

const baseRankedPlace: RankedPlace = {
  placeId: "place-1",
  rank: 1,
  comment: "最高のカフェ！",
};

describe("RankingCard", () => {
  it("TOP3のスタイルで正しく表示される", () => {
    render(
      <RankingCard
        rankedPlace={baseRankedPlace}
        place={basePlace}
        listId="list-1"
      />
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("テストカフェ")).toBeInTheDocument();
    expect(screen.getByText("最高のカフェ！")).toBeInTheDocument();
    expect(screen.getByLabelText("詳細を見る")).toBeInTheDocument();
    // aria-label
    expect(
      screen.getByRole("article", { hidden: true }) ||
        screen.getByLabelText(/1位/)
    ).toBeTruthy();
  });

  it("4位以降のスタイルで正しく表示される", () => {
    render(
      <RankingCard
        rankedPlace={{ ...baseRankedPlace, rank: 4 }}
        place={basePlace}
        listId="list-1"
      />
    );
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("テストカフェ")).toBeInTheDocument();
  });

  it("詳細ボタン押下でrouter.pushが呼ばれる（モック）", () => {
    const pushMock = jest.fn();
    jest
      .spyOn(require("next/navigation"), "useRouter")
      .mockReturnValue({ push: pushMock });
    render(
      <RankingCard
        rankedPlace={baseRankedPlace}
        place={basePlace}
        listId="list-1"
      />
    );
    fireEvent.click(screen.getByLabelText("詳細を見る"));
    expect(pushMock).toHaveBeenCalledWith("/lists/list-1/place/place-1");
  });

  it("アクセシビリティ属性が付与されている", () => {
    render(
      <RankingCard
        rankedPlace={baseRankedPlace}
        place={basePlace}
        listId="list-1"
      />
    );
    const card = screen.getByLabelText(/1位: テストカフェ/);
    expect(card).toHaveAttribute("tabindex");
  });

  it("コメントがない場合でもエラーなく表示される", () => {
    render(
      <RankingCard
        rankedPlace={{ ...baseRankedPlace, comment: undefined }}
        place={basePlace}
        listId="list-1"
      />
    );
    expect(screen.getByText("テストカフェ")).toBeInTheDocument();
  });
});
