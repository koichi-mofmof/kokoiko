import { render, screen } from "@testing-library/react";
import { PublicListsSection } from "@/components/home/public-lists-section";
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

// Framer Motionのモック
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, whileInView, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const mockLists: PublicListForHome[] = [
  {
    id: "list-1",
    name: "テストリスト1",
    description: "これはテスト用のリストです",
    createdBy: "user-1",
    creatorUsername: "testuser1",
    creatorDisplayName: "テストユーザー1",
    creatorAvatarUrl: "https://example.com/avatar1.jpg",
    placeCount: 5,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "list-2",
    name: "テストリスト2",
    description: "これは2番目のテストリストです",
    createdBy: "user-2",
    creatorUsername: "testuser2",
    creatorDisplayName: "テストユーザー2",
    creatorAvatarUrl: null,
    placeCount: 3,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z",
  },
];

describe("PublicListsSection", () => {
  it("should render public lists section with title", () => {
    render(<PublicListsSection publicLists={mockLists} />);

    expect(screen.getByText("みんなが作った")).toBeInTheDocument();
    expect(screen.getByText("おすすめスポット")).toBeInTheDocument();
    expect(
      screen.getByText("実際のユーザーが作成したリストをご紹介")
    ).toBeInTheDocument();
  });

  it("should render all public lists", () => {
    render(<PublicListsSection publicLists={mockLists} />);

    expect(screen.getByText("テストリスト1")).toBeInTheDocument();
    expect(screen.getByText("テストリスト2")).toBeInTheDocument();
    expect(screen.getByText("これはテスト用のリストです")).toBeInTheDocument();
    expect(
      screen.getByText("これは2番目のテストリストです")
    ).toBeInTheDocument();
  });

  it("should display creator information", () => {
    render(<PublicListsSection publicLists={mockLists} />);

    expect(screen.getByText("テストユーザー1")).toBeInTheDocument();
    expect(screen.getByText("テストユーザー2")).toBeInTheDocument();
  });

  it("should display place counts", () => {
    render(<PublicListsSection publicLists={mockLists} />);

    expect(screen.getByText("5地点")).toBeInTheDocument();
    expect(screen.getByText("3地点")).toBeInTheDocument();
  });

  it("should render 'もっと見る' link", () => {
    render(<PublicListsSection publicLists={mockLists} />);

    const moreLink = screen.getByText("もっと見る");
    expect(moreLink).toBeInTheDocument();
    expect(moreLink.closest("a")).toHaveAttribute("href", "/public-lists");
  });

  it("should handle empty lists", () => {
    render(<PublicListsSection publicLists={[]} />);

    // 空のリストの場合は何も表示されない
    expect(
      screen.queryByTestId("public-lists-section")
    ).not.toBeInTheDocument();
  });

  it("should render list cards with correct links", () => {
    render(<PublicListsSection publicLists={mockLists} />);

    const listLinks = screen.getAllByRole("link");
    expect(listLinks).toHaveLength(3); // 2つのリスト + もっと見るリンク

    // リストのリンクが正しいURLを持っていることを確認
    const list1Link = listLinks.find((link) =>
      link.textContent?.includes("テストリスト1")
    );
    const list2Link = listLinks.find((link) =>
      link.textContent?.includes("テストリスト2")
    );

    expect(list1Link).toHaveAttribute("href", "/lists/list-1");
    expect(list2Link).toHaveAttribute("href", "/lists/list-2");
  });

  it("should handle lists without description", () => {
    const listsWithoutDescription = [
      {
        ...mockLists[0],
        description: null,
      },
    ];

    render(<PublicListsSection publicLists={listsWithoutDescription} />);

    expect(screen.getByText("テストリスト1")).toBeInTheDocument();
    expect(
      screen.queryByText("これはテスト用のリストです")
    ).not.toBeInTheDocument();
  });

  it("should handle lists without creator display name", () => {
    const listsWithoutDisplayName = [
      {
        ...mockLists[0],
        creatorDisplayName: null,
      },
    ];

    render(<PublicListsSection publicLists={listsWithoutDisplayName} />);

    expect(screen.getByText("testuser1")).toBeInTheDocument();
  });
});
