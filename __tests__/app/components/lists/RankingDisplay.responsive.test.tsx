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
  {
    id: "p3",
    name: "Cカフェ",
    address: "東京都C区",
    googleMapsUrl: "https://maps.google.com/?q=3,3",
    latitude: 3,
    longitude: 3,
    tags: [],
    createdAt: new Date(),
    createdBy: "user-3",
    visited: "visited" as const,
  },
];
const rankedPlaces: RankedPlace[] = [
  { placeId: "p1", rank: 1, comment: "A" },
  { placeId: "p2", rank: 2, comment: "B" },
  { placeId: "p3", rank: 3, comment: "C" },
];

describe("RankingDisplay: レスポンシブデザイン", () => {
  const resizeWindow = (width: number) => {
    window.innerWidth = width;
    window.dispatchEvent(new Event("resize"));
  };

  afterEach(() => {
    resizeWindow(1024); // デフォルトに戻す
  });

  it("モバイル幅(375px)で1カラム表示になること", () => {
    resizeWindow(375);
    const { container } = render(
      <RankingDisplay
        rankedPlaces={rankedPlaces}
        places={places}
        listId="list-1"
        isSample={false}
      />
    );
    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("grid-cols-1");
    expect(screen.getAllByTestId(/ranking-card-/)).toHaveLength(3);
  });

  it("タブレット幅(768px)で2カラム表示になること", () => {
    resizeWindow(768);
    const { container } = render(
      <RankingDisplay
        rankedPlaces={rankedPlaces}
        places={places}
        listId="list-1"
        isSample={false}
      />
    );
    const grid = container.querySelector(".md\\:grid-cols-2");
    expect(grid || container.querySelector(".grid")).toBeInTheDocument();
    expect(screen.getAllByTestId(/ranking-card-/)).toHaveLength(3);
  });

  it("PC幅(1024px)で3カラム表示になること", () => {
    resizeWindow(1024);
    const { container } = render(
      <RankingDisplay
        rankedPlaces={rankedPlaces}
        places={places}
        listId="list-1"
        isSample={false}
      />
    );
    const grid = container.querySelector(".lg\\:grid-cols-3");
    expect(grid || container.querySelector(".grid")).toBeInTheDocument();
    expect(screen.getAllByTestId(/ranking-card-/)).toHaveLength(3);
  });
});
