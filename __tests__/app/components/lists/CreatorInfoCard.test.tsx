import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CreatorInfoCard } from "@/app/components/lists/CreatorInfoCard";
import type { Database } from "@/types/supabase";

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

describe("CreatorInfoCard", () => {
  const mockCreator: Pick<
    Profile,
    "id" | "username" | "display_name" | "bio" | "avatar_url"
  > = {
    id: "user-123",
    username: "testuser",
    display_name: "テストユーザー",
    bio: "これはテスト用の自己紹介です。",
    avatar_url: "avatar.png",
  };

  it("作成者情報が正しく表示される", () => {
    render(<CreatorInfoCard creator={mockCreator} />);

    // 表示名と自己紹介が表示される
    expect(screen.getByText("テストユーザー")).toBeInTheDocument();

    // ラベルが表示される
    expect(screen.getByText("このリストの作成者")).toBeInTheDocument();

    // アバター画像が表示される
    const avatar = screen.getByRole("img");
    expect(avatar).toHaveAttribute(
      "src",
      "https://mock.supabase.co/storage/v1/object/public/profile_images/avatar.png"
    );
    expect(avatar).toHaveAttribute("alt", "テストユーザー");

    // 「他のリストを見る」ボタンが正しいリンクを持つ
    const link = screen.getByRole("link", { name: "他のリストを見る" });
    expect(link).toHaveAttribute("href", "/users/user-123");
  });

  it("アバターがない場合、イニシャルが表示される", () => {
    const creatorWithoutAvatar = { ...mockCreator, avatar_url: null };
    render(<CreatorInfoCard creator={creatorWithoutAvatar} />);

    // イニシャルが表示される
    expect(screen.getByText("テ")).toBeInTheDocument();
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
