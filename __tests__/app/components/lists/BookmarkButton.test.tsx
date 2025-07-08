import { BookmarkButton } from "@/app/components/lists/BookmarkButton";
import * as listActions from "@/lib/actions/lists";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mocks
jest.mock("@/lib/actions/lists", () => ({
  bookmarkList: jest.fn(),
  unbookmarkList: jest.fn(),
}));
jest.mock("@/hooks/use-toast");
jest.mock("@/lib/supabase/client");
jest.mock("@/app/components/conversion/BookmarkSignupModal", () => ({
  BookmarkSignupModal: ({ isOpen, onClose, listId, listName }: any) =>
    isOpen ? (
      <div data-testid="bookmark-signup-modal">
        <div>Bookmark signup modal for list {listId}</div>
        {listName && <div>List name: {listName}</div>}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

// Mocking icons
jest.mock("lucide-react", () => ({
  ...jest.requireActual("lucide-react"),
  Bookmark: (props: any) => <div data-testid="icon-Bookmark" {...props} />,
  BookmarkCheck: (props: any) => (
    <div data-testid="icon-BookmarkSolid" {...props} />
  ),
}));

// SignupPromptModalのモック関数は上記のjest.mockで定義済み

const mockUser: User = {
  id: "user-123",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

describe("BookmarkButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトのSupabaseモック
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it("未ログイン時にクリックするとブックマーク専用サインアップモーダルが表示される", async () => {
    render(
      <BookmarkButton
        listId="list-123"
        initialIsBookmarked={false}
        listName="テストリスト"
      />
    );
    const button = await screen.findByRole("button", { name: "ブックマーク" });
    await userEvent.click(button);

    // ブックマーク専用サインアップモーダルが表示されることを確認
    expect(screen.getByTestId("bookmark-signup-modal")).toBeInTheDocument();
    expect(
      screen.getByText("Bookmark signup modal for list list-123")
    ).toBeInTheDocument();
    expect(screen.getByText("List name: テストリスト")).toBeInTheDocument();
  });

  it("ログイン済みで、未ブックマーク時にクリックするとbookmarkListが呼ばれる", async () => {
    const mockBookmarkList = listActions.bookmarkList as jest.Mock;
    mockBookmarkList.mockResolvedValue({ success: true });
    const mockSupabaseWithUser = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabaseWithUser);

    render(<BookmarkButton listId="list-123" initialIsBookmarked={false} />);

    const button = await screen.findByRole("button", { name: "ブックマーク" });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockBookmarkList).toHaveBeenCalledWith("list-123");
    });
    expect(
      await screen.findByRole("button", { name: "ブックマークを解除" })
    ).toBeInTheDocument();
  });

  it("ログイン済みで、ブックマーク済み時にクリックするとunbookmarkListが呼ばれる", async () => {
    const mockUnbookmarkList = listActions.unbookmarkList as jest.Mock;
    mockUnbookmarkList.mockResolvedValue({ success: true });
    const mockSupabaseWithUser = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabaseWithUser);

    render(<BookmarkButton listId="list-123" initialIsBookmarked={true} />);

    const button = await screen.findByRole("button", {
      name: "ブックマークを解除",
    });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockUnbookmarkList).toHaveBeenCalledWith("list-123");
    });
    expect(
      await screen.findByRole("button", { name: "ブックマーク" })
    ).toBeInTheDocument();
  });

  it("API呼び出しが失敗した場合、UIが元に戻る", async () => {
    const mockBookmarkList = listActions.bookmarkList as jest.Mock;
    mockBookmarkList.mockResolvedValue({
      success: false,
      error: "DB error",
    });

    const mockSupabaseWithUser = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabaseWithUser);

    render(<BookmarkButton listId="list-123" initialIsBookmarked={false} />);

    const button = await screen.findByRole("button", { name: "ブックマーク" });
    await userEvent.click(button);

    // API失敗時はUIが元に戻る（「ブックマーク」ボタンのまま）
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "ブックマーク" })
      ).toBeInTheDocument();
    });

    expect(mockBookmarkList).toHaveBeenCalledWith("list-123");
  });
});
