import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UserProfileView } from "@/app/components/users/UserProfileView";
import type { Database } from "@/types/supabase";
import type { ListForClient } from "@/lib/dal/lists";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// 依存コンポーネントとライブラリのモック
jest.mock(
  "next/image",
  () =>
    function Image({ src, alt }: { src: string; alt: string }) {
      return <img src={src} alt={alt} />;
    }
);

jest.mock("@/components/ui/placelist-grid", () => ({
  PlaceListGrid: ({ initialLists }: { initialLists: ListForClient[] }) => (
    <div data-testid="mock-placelist-grid">
      {initialLists.map((list) => (
        <div key={list.id}>{list.name}</div>
      ))}
    </div>
  ),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        getPublicUrl: jest.fn((path: string) => ({
          data: {
            publicUrl: `https://mock.supabase.co/storage/v1/object/public/profile_images/${path}`,
          },
        })),
      })),
    },
  })),
}));

describe("UserProfileView", () => {
  const mockProfile: Pick<
    Profile,
    "id" | "username" | "display_name" | "bio" | "avatar_url"
  > = {
    id: "user-123",
    username: "testuser",
    display_name: "テストユーザー",
    bio: "これはテスト用の自己紹介です。",
    avatar_url: "avatar.png",
  };

  const mockLists: ListForClient[] = [
    {
      id: "list-1",
      name: "B: すごいリスト",
      description: "description 1",
      updated_at: "2024-01-01T00:00:00Z",
      created_at: "2024-01-01T00:00:00Z",
      place_count: 10,
      is_public: true,
      created_by: "user-123",
      places: [],
      collaborators: [],
      permission: "owner",
    },
    {
      id: "list-2",
      name: "A: 最高のリスト",
      description: "description 2",
      updated_at: "2024-01-02T00:00:00Z",
      created_at: "2024-01-02T00:00:00Z",
      place_count: 5,
      is_public: true,
      created_by: "user-123",
      places: [],
      collaborators: [],
      permission: "owner",
    },
  ];

  const mockStats = {
    publicListCount: 2,
    totalPlaceCount: 15,
  };

  it("ユーザー情報、統計、リストが正しく表示される", () => {
    render(
      <UserProfileView
        profile={mockProfile}
        lists={mockLists}
        stats={mockStats}
      />
    );

    // ユーザー情報
    expect(screen.getByText("テストユーザー")).toBeInTheDocument();
    expect(
      screen.getByText("これはテスト用の自己紹介です。")
    ).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("alt", "テストユーザー");

    // 統計情報
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("公開リスト")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("総地点数")).toBeInTheDocument();

    // リスト
    expect(screen.getByTestId("mock-placelist-grid")).toBeInTheDocument();
    // デフォルトは更新日時順（降順）
    const listGrid = screen.getByTestId("mock-placelist-grid");
    const lists = within(listGrid).getAllByText(/リスト/);
    expect(lists[0]).toHaveTextContent("A: 最高のリスト");
    expect(lists[1]).toHaveTextContent("B: すごいリスト");
  });

  it("リストがない場合に空の状態が表示される", () => {
    render(
      <UserProfileView
        profile={mockProfile}
        lists={[]}
        stats={{ publicListCount: 0, totalPlaceCount: 0 }}
      />
    );

    expect(screen.getByText("まだ公開リストがありません")).toBeInTheDocument();
  });

  it("検索機能が正しく動作する", () => {
    render(
      <UserProfileView
        profile={mockProfile}
        lists={mockLists}
        stats={mockStats}
      />
    );

    const searchInput = screen.getByPlaceholderText("リストを検索...");
    fireEvent.change(searchInput, { target: { value: "最高" } });

    expect(screen.getByTestId("mock-placelist-grid")).toHaveTextContent(
      "A: 最高のリスト"
    );
    expect(screen.queryByText("B: すごいリスト")).not.toBeInTheDocument();
  });

  it("ソート機能が正しく動作する", () => {
    render(
      <UserProfileView
        profile={mockProfile}
        lists={mockLists}
        stats={mockStats}
      />
    );

    // デフォルトは更新日降順
    const listGrid = screen.getByTestId("mock-placelist-grid");
    let lists = within(listGrid).getAllByText(/リスト/);
    expect(lists[0]).toHaveTextContent("A: 最高のリスト");

    // 名前(昇順)でソート
    const sortSelect = screen.getByTestId("sort-select");
    fireEvent.change(sortSelect, { target: { value: "name" } });

    const sortOrderButton = screen.getByTestId("sort-order-button");
    // 現在 desc なので asc にするため1回クリック
    fireEvent.click(sortOrderButton);

    lists = within(listGrid).getAllByText(/リスト/);
    expect(lists[0]).toHaveTextContent("A: 最高のリスト");
  });
});
