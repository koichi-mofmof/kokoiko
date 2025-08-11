import { PublicListsPageClient } from "@/app/public-lists/PublicListsPageClient";
import { PublicListForHome } from "@/lib/dal/public-lists";
import { render, screen } from "@testing-library/react";

jest.mock("@/hooks/use-i18n", () => ({
  __esModule: true,
  useI18n: () => ({ t: (k: string, p?: any) => k, locale: "en" }),
}));

describe("PublicListsPageClient (currency-agnostic render)", () => {
  const mockLists: PublicListForHome[] = [
    {
      id: "id-1",
      name: "List 1",
      description: "Desc",
      createdBy: "u1",
      creatorUsername: "user1",
      creatorDisplayName: "User 1",
      creatorAvatarUrl: null,
      placeCount: 3,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    },
  ];

  it("renders without crashing and shows total count text key", () => {
    render(
      <PublicListsPageClient
        initialLists={mockLists}
        totalCount={1}
        currentPage={1}
        totalPages={1}
        searchParams={{ page: "1" }}
      />
    );
    expect(screen.getByText("publicLists.result.total")).toBeInTheDocument();
  });
});
