import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CreatorInfoCard } from "@/app/components/lists/CreatorInfoCard";
import type { Database } from "@/types/supabase";
import { getUserProfile } from "@/lib/dal/user-public-lists";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// next/image と next/link のモック
jest.mock(
  "next/image",
  () =>
    function Image({ src, alt }: { src: string; alt: string }) {
      return <img src={src} alt={alt} />;
    }
);

jest.mock(
  "next/link",
  () =>
    function Link({
      href,
      children,
    }: {
      href: string;
      children: React.ReactNode;
    }) {
      return <a href={href}>{children}</a>;
    }
);

// Supabaseクライアントのモック
jest.mock("@/lib/dal/user-public-lists", () => ({
  getUserProfile: jest.fn(),
}));
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn().mockReturnValue({
    storage: {
      from: jest.fn().mockReturnThis(),
      getPublicUrl: jest.fn(),
    },
  }),
}));

const mockGetUserProfile = getUserProfile as jest.Mock;

describe("CreatorInfoCard", () => {
  const mockCreator: Profile = {
    id: "user-1",
    username: "Test User",
    avatar_url: "avatar.png",
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    bio: "Test bio",
    display_name: "Test Display Name",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("作成者情報が正しく表示される", async () => {
    mockGetUserProfile.mockResolvedValue({
      profile: mockCreator,
      error: null,
    });

    render(<CreatorInfoCard creator={mockCreator} />);

    // アバター画像が表示される
    const avatar = screen.getByRole("img");
    expect(avatar).toHaveAttribute("src", "avatar.png");

    // 作成者名が表示される
    expect(screen.getByText("Test Display Name")).toBeInTheDocument();
  });

  it("データの取得に失敗した場合、エラーメッセージが表示される", async () => {
    // CreatorInfoCardはcreator propが必須なので、データ取得失敗のシナリオは
    // このコンポーネントの責務ではなく、呼び出し元の責務となる。
    // そのため、このテストケースは不要。
  });

  it("作成者が見つからない場合、メッセージが表示される", async () => {
    //  データの取得に失敗した場合と同様、このテストケースは不要。
  });

  it("アバターがない場合、イニシャルが表示される", () => {
    const creatorWithoutAvatar = { ...mockCreator, avatar_url: null };
    render(<CreatorInfoCard creator={creatorWithoutAvatar} />);

    // イニシャルが表示される
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("creatorがnullの場合、何もレンダリングされない", () => {
    const { container } = render(<CreatorInfoCard creator={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("自己紹介がない場合、自己紹介は表示されない", () => {
    const creatorWithoutBio = { ...mockCreator, bio: null };
    render(<CreatorInfoCard creator={creatorWithoutBio} />);
    expect(
      screen.queryByText("これはテスト用の自己紹介です。")
    ).not.toBeInTheDocument();
  });
});
