import React from "react";
import { render, screen } from "@testing-library/react";
import RankingDisplay from "@/app/components/lists/RankingDisplay";
import { RankedPlace, Place } from "@/types";
import "@testing-library/jest-dom";

jest.mock("@/app/components/lists/RankingCard", () => (props: any) => (
  <div data-testid={`ranking-card-${props.rankedPlace.rank}`}>
    {props.place.name}
  </div>
));

const places: Place[] = [
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
    visited: "visited",
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
    visited: "not_visited",
  },
];

const rankedPlaces: RankedPlace[] = [
  { placeId: "p2", rank: 2, comment: "Bコメント" },
  { placeId: "p1", rank: 1, comment: "Aコメント" },
];

describe("RankingDisplay", () => {
  it("rank順にRankingCardが並ぶ", () => {
    render(
      <RankingDisplay
        rankedPlaces={rankedPlaces}
        places={places}
        listId="list-1"
        isSample={false}
      />
    );
    const cards = screen.getAllByTestId(/ranking-card-/);
    expect(cards[0]).toHaveTextContent("Aカフェ"); // rank:1
    expect(cards[1]).toHaveTextContent("Bカフェ"); // rank:2
  });

  it("placeが見つからない場合は警告を出しnullを返す", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const brokenRanked = [
      ...rankedPlaces,
      { placeId: "notfound", rank: 3, comment: "?" },
    ];
    render(
      <RankingDisplay
        rankedPlaces={brokenRanked}
        places={places}
        listId="list-1"
        isSample={false}
      />
    );
    expect(warnSpy).toHaveBeenCalledWith(
      "Place with id notfound not found in places list."
    );
    warnSpy.mockRestore();
  });

  it("isSample=trueでも正常に表示される", () => {
    render(
      <RankingDisplay
        rankedPlaces={rankedPlaces}
        places={places}
        listId="sample-1"
        isSample={true}
      />
    );
    expect(screen.getAllByTestId(/ranking-card-/).length).toBe(2);
  });
});
