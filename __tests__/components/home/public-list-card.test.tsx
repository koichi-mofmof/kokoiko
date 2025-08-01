import { render, screen } from "@testing-library/react";
import { PublicListCard } from "@/components/home/public-list-card";
import { PublicListForHome } from "@/lib/dal/public-lists";

// Next.jsのLinkコンポーネントをモック
jest.mock("next/link", () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// date-fnsのモック
jest.mock("date-fns", () => ({
  formatDistanceToNow: jest.fn(() => "2日前"),
}));

const mockList: PublicListForHome = {
  id: "list-1",
  name: "テストリスト",
  description: "これはテスト用のリストです",
  createdBy: "user-1",
  creatorUsername: "testuser",
  creatorDisplayName: "テストユーザー",
  creatorAvatarUrl: "https://example.com/avatar.jpg",
  placeCount: 5,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
};

describe("PublicListCard", () => {
  it("should render list card with all information", () => {
    render(<PublicListCard list={mockList} />);

    expect(screen.getByText("テストリスト")).toBeInTheDocument();
    expect(screen.getByText("これはテスト用のリストです")).toBeInTheDocument();
    expect(screen.getByText("テストユーザー")).toBeInTheDocument();
    expect(screen.getByText("5地点")).toBeInTheDocument();
    expect(screen.getByText("2日前に更新")).toBeInTheDocument();
  });

  it("should render link with correct href", () => {
    render(<PublicListCard list={mockList} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/lists/list-1");
  });

  it("should handle list without description", () => {
    const listWithoutDescription = {
      ...mockList,
      description: null,
    };

    render(<PublicListCard list={listWithoutDescription} />);

    expect(screen.getByText("テストリスト")).toBeInTheDocument();
    expect(
      screen.queryByText("これはテスト用のリストです")
    ).not.toBeInTheDocument();
  });

  it("should handle list without creator display name", () => {
    const listWithoutDisplayName = {
      ...mockList,
      creatorDisplayName: null,
    };

    render(<PublicListCard list={listWithoutDisplayName} />);

    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(screen.queryByText("テストユーザー")).not.toBeInTheDocument();
  });

  it("should handle list without avatar", () => {
    const listWithoutAvatar = {
      ...mockList,
      creatorAvatarUrl: null,
    };

    render(<PublicListCard list={listWithoutAvatar} />);

    expect(screen.getByText("テストユーザー")).toBeInTheDocument();
    // AvatarFallbackが表示されることを確認
    expect(screen.getByText("テ")).toBeInTheDocument(); // "テストユーザー"の最初の文字
  });

  it("should display avatar image when available", () => {
    render(<PublicListCard list={mockList} />);

    const avatarImage = screen.getByAltText("avatar");
    expect(avatarImage).toBeInTheDocument();
    expect(avatarImage).toHaveAttribute(
      "src",
      "https://example.com/avatar.jpg"
    );
  });

  it("should handle zero place count", () => {
    const listWithZeroPlaces = {
      ...mockList,
      placeCount: 0,
    };

    render(<PublicListCard list={listWithZeroPlaces} />);

    expect(screen.getByText("0地点")).toBeInTheDocument();
  });

  it("should have correct data-testid", () => {
    render(<PublicListCard list={mockList} />);

    const card = screen.getByTestId("public-list-card");
    expect(card).toBeInTheDocument();
  });

  it("should have creator info with data-testid", () => {
    render(<PublicListCard list={mockList} />);

    const creatorInfo = screen.getByTestId("creator-info");
    expect(creatorInfo).toBeInTheDocument();
  });

  it("should handle long list names", () => {
    const listWithLongName = {
      ...mockList,
      name: "これは非常に長いリスト名で、表示時に切り詰められる可能性があります",
    };

    render(<PublicListCard list={listWithLongName} />);

    expect(
      screen.getByText(
        "これは非常に長いリスト名で、表示時に切り詰められる可能性があります"
      )
    ).toBeInTheDocument();
  });

  it("should handle long descriptions", () => {
    const listWithLongDescription = {
      ...mockList,
      description:
        "これは非常に長い説明文で、表示時に切り詰められる可能性があります。複数行にわたる長いテキストが含まれています。",
    };

    render(<PublicListCard list={listWithLongDescription} />);

    expect(
      screen.getByText(
        "これは非常に長い説明文で、表示時に切り詰められる可能性があります。複数行にわたる長いテキストが含まれています。"
      )
    ).toBeInTheDocument();
  });
});
