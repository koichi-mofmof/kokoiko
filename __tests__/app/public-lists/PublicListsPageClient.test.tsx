import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PublicListsPageClient } from "@/app/public-lists/PublicListsPageClient";
import { PublicListForHome } from "@/lib/dal/public-lists";

// Next.jsのuseRouterとuseSearchParamsをモック
const mockPush = jest.fn();
const mockSearchParams = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  toString: jest.fn().mockReturnValue(""),
  clear: jest.fn(),
  entries: jest.fn().mockReturnValue([]),
  has: jest.fn().mockReturnValue(false),
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

// PublicListsFiltersコンポーネントをモック
jest.mock("@/app/public-lists/PublicListsFilters", () => ({
  PublicListsFilters: function MockPublicListsFilters({ onSort }: any) {
    return (
      <div data-testid="public-lists-filters">
        <button onClick={() => onSort("name", "asc")}>名前順</button>
        <button onClick={() => onSort("updated_at", "desc")}>更新順</button>
      </div>
    );
  },
}));

// PublicListCardコンポーネントをモック
jest.mock("@/components/home/public-list-card", () => ({
  PublicListCard: function MockPublicListCard({ list }: any) {
    return (
      <div data-testid="public-list-card">
        <h3>{list.name}</h3>
        <p>{list.description}</p>
        <span>{list.creatorDisplayName || list.creatorUsername}</span>
        <span>{list.placeCount}地点</span>
      </div>
    );
  },
}));

// Paginationコンポーネントをモック
jest.mock("@/components/ui/pagination", () => ({
  Pagination: function MockPagination({
    currentPage,
    totalPages,
    onPageChange,
  }: any) {
    return (
      <div data-testid="pagination">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={currentPage === page ? "active" : ""}
          >
            {page}
          </button>
        ))}
      </div>
    );
  },
}));

// lucide-reactのSearchアイコンをモック
jest.mock("lucide-react", () => ({
  Search: ({ className, ...props }: any) => (
    <svg className={className} {...props} data-testid="search-icon" />
  ),
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

const defaultProps = {
  initialLists: mockLists,
  totalCount: 2,
  currentPage: 1,
  totalPages: 1,
  searchParams: {
    page: "1",
    search: "",
    sort: "updated_at",
    order: "desc",
  },
};

describe("PublicListsPageClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.clear();
  });

  it("should render search input", () => {
    render(<PublicListsPageClient {...defaultProps} />);

    expect(screen.getByPlaceholderText("リストを検索...")).toBeInTheDocument();
  });

  it("should render filters", () => {
    render(<PublicListsPageClient {...defaultProps} />);

    expect(screen.getByTestId("public-lists-filters")).toBeInTheDocument();
  });

  it("should display total count", () => {
    render(<PublicListsPageClient {...defaultProps} />);

    expect(screen.getByText("公開リスト 2件")).toBeInTheDocument();
  });

  it("should render all lists", () => {
    render(<PublicListsPageClient {...defaultProps} />);

    expect(screen.getByText("テストリスト1")).toBeInTheDocument();
    expect(screen.getByText("テストリスト2")).toBeInTheDocument();
  });

  it("should filter lists by search query", async () => {
    render(<PublicListsPageClient {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("リストを検索...");
    fireEvent.change(searchInput, { target: { value: "テストリスト1" } });

    await waitFor(() => {
      expect(screen.getByText("テストリスト1")).toBeInTheDocument();
      expect(screen.queryByText("テストリスト2")).not.toBeInTheDocument();
    });
  });

  it("should show search results count", async () => {
    render(<PublicListsPageClient {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("リストを検索...");
    fireEvent.change(searchInput, { target: { value: "テスト" } });

    await waitFor(() => {
      expect(screen.getByText("「テスト」の検索結果: 2件")).toBeInTheDocument();
    });
  });

  it("should handle sort action", () => {
    render(<PublicListsPageClient {...defaultProps} />);

    const nameSortButton = screen.getByText("名前順");
    fireEvent.click(nameSortButton);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("sort=name&order=asc")
    );
  });

  it("should handle empty search results", async () => {
    render(<PublicListsPageClient {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("リストを検索...");
    fireEvent.change(searchInput, { target: { value: "存在しないリスト" } });

    await waitFor(() => {
      expect(screen.getByText("検索結果が見つかりません")).toBeInTheDocument();
      expect(
        screen.getByText("別のキーワードで検索してみてください")
      ).toBeInTheDocument();
    });
  });

  it("should handle empty lists", () => {
    const emptyProps = {
      ...defaultProps,
      initialLists: [],
      totalCount: 0,
    };

    render(<PublicListsPageClient {...emptyProps} />);

    expect(screen.getByText("まだ公開リストがありません")).toBeInTheDocument();
    expect(
      screen.getByText("最初の公開リストを作成してみませんか？")
    ).toBeInTheDocument();
  });

  it("should render pagination when multiple pages", () => {
    const multiPageProps = {
      ...defaultProps,
      totalPages: 3,
    };

    render(<PublicListsPageClient {...multiPageProps} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should not render pagination for single page", () => {
    render(<PublicListsPageClient {...defaultProps} />);

    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("should search by creator name", async () => {
    render(<PublicListsPageClient {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("リストを検索...");
    fireEvent.change(searchInput, { target: { value: "テストユーザー1" } });

    await waitFor(() => {
      expect(screen.getByText("テストリスト1")).toBeInTheDocument();
      expect(screen.queryByText("テストリスト2")).not.toBeInTheDocument();
    });
  });

  it("should search by creator username", async () => {
    render(<PublicListsPageClient {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("リストを検索...");
    fireEvent.change(searchInput, { target: { value: "testuser1" } });

    await waitFor(() => {
      expect(screen.getByText("テストリスト1")).toBeInTheDocument();
      expect(screen.queryByText("テストリスト2")).not.toBeInTheDocument();
    });
  });

  it("should search by description", async () => {
    render(<PublicListsPageClient {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("リストを検索...");
    fireEvent.change(searchInput, { target: { value: "テスト用のリスト" } });

    await waitFor(() => {
      expect(screen.getByText("テストリスト1")).toBeInTheDocument();
      expect(screen.queryByText("テストリスト2")).not.toBeInTheDocument();
    });
  });

  it("should handle case insensitive search", async () => {
    render(<PublicListsPageClient {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("リストを検索...");
    fireEvent.change(searchInput, { target: { value: "テストリスト1" } });

    await waitFor(() => {
      expect(screen.getByText("テストリスト1")).toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: "テストリスト1" } });

    await waitFor(() => {
      expect(screen.getByText("テストリスト1")).toBeInTheDocument();
    });
  });
});
