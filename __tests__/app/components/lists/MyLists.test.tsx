import { MyLists } from "@/app/components/lists/MyLists";
import { ListForClient } from "@/lib/dal/lists";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// Accordionコンポーネントを、Contextを使った堅牢なモックに置き換える
jest.mock("@/components/ui/accordion", () => {
  const React = require("react");
  const original = jest.requireActual("@/components/ui/accordion");
  const AccordionContext = React.createContext({
    openItems: [],
    toggleItem: () => {},
  });

  const ItemContext = React.createContext("");

  const Accordion = ({
    children,
    defaultValue,
  }: {
    children: React.ReactNode;
    defaultValue: string[];
  }) => {
    const [openItems, setOpenItems] = React.useState(defaultValue || []);
    const toggleItem = (value: string) => {
      setOpenItems((current: string[]) =>
        current.includes(value)
          ? current.filter((item: string) => item !== value)
          : [...current, value]
      );
    };
    return (
      <AccordionContext.Provider value={{ openItems, toggleItem }}>
        <div>{children}</div>
      </AccordionContext.Provider>
    );
  };

  const AccordionItem = ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <ItemContext.Provider value={value}>
      <div>{children}</div>
    </ItemContext.Provider>
  );

  const AccordionTrigger = ({ children }: { children: React.ReactNode }) => {
    const { toggleItem } = React.useContext(AccordionContext);
    const value = React.useContext(ItemContext);
    return <button onClick={() => toggleItem(value)}>{children}</button>;
  };

  const AccordionContent = ({ children }: { children: React.ReactNode }) => {
    const { openItems } = React.useContext(AccordionContext);
    const value = React.useContext(ItemContext);
    return openItems.includes(value) ? <div>{children}</div> : null;
  };

  return {
    ...original,
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
  };
});

// PlaceListGridは表示の責務を持つだけなのでモック化
jest.mock("@/components/ui/placelist-grid", () => ({
  __esModule: true,
  PlaceListGrid: ({ initialLists }: { initialLists: ListForClient[] }) => (
    <div data-testid="placelist-grid">
      {initialLists.map((list) => (
        <div key={list.id}>{list.name}</div>
      ))}
    </div>
  ),
  renderLabeledCollaborators: () => <div>Collaborators</div>,
}));

jest.mock("@/app/components/lists/CreateListModal", () => ({
  __esModule: true,
  CreateListModal: () => <button>Create List</button>,
}));

const mockMyList: ListForClient = {
  id: "my-list-1",
  name: "My List",
  permission: "owner",
  is_public: false,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  created_by: "user-1",
  description: "",
  place_count: 0,
  collaborators: [],
  places: [],
  isBookmarked: false,
} as ListForClient;

const mockSharedList: ListForClient = {
  id: "shared-list-1",
  name: "Shared List",
  permission: "edit",
  is_public: false,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  created_by: "user-2",
  description: "",
  place_count: 0,
  collaborators: [],
  places: [],
  isBookmarked: false,
} as ListForClient;

const mockBookmarkedList: ListForClient = {
  id: "bookmarked-list-1",
  name: "My Bookmarked List",
  permission: null,
  is_public: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  created_by: "user-3",
  description: "",
  place_count: 0,
  collaborators: [],
  places: [],
  isBookmarked: true,
} as ListForClient;

const mockLists = [mockMyList, mockSharedList, mockBookmarkedList];

describe("MyLists", () => {
  it("初期表示ではデフォルトで開いているカテゴリのリストが表示される", () => {
    render(<MyLists initialLists={mockLists} />);
    // MyListsコンポーネントはデフォルトでリストを開くため、表示されているはず
    expect(screen.getByText("My List")).toBeInTheDocument();
    expect(screen.getByText("Shared List")).toBeInTheDocument();
    // ブックマークしたリストは別のタブなので表示されない
    expect(screen.queryByText("My Bookmarked List")).not.toBeInTheDocument();
  });

  it("アコーディオンを閉じるとリストが非表示になる", async () => {
    render(<MyLists initialLists={mockLists} />);
    // 最初は表示されている
    expect(screen.getByText("My List")).toBeInTheDocument();

    // トリガーをRoleで取得してクリックする
    const trigger = screen.getByRole("button", {
      name: /自分が作成したリスト/,
    });
    await userEvent.click(trigger);

    // 非表示になることを確認
    await waitFor(() => {
      expect(screen.queryByText("My List")).not.toBeInTheDocument();
    });
  });

  it("ブックマークタブをクリックするとブックマークしたリストが表示される", async () => {
    render(<MyLists initialLists={mockLists} />);
    await userEvent.click(screen.getByRole("tab", { name: "ブックマーク" }));
    expect(await screen.findByText("My Bookmarked List")).toBeInTheDocument();
    expect(screen.queryByText("My List")).not.toBeInTheDocument();
  });

  it("各カテゴリのリストが0件の場合にメッセージが表示される", async () => {
    render(<MyLists initialLists={[]} />);
    expect(
      screen.getByText("まだリストは作成されていません。")
    ).toBeInTheDocument();

    const bookmarkTab = screen.getByRole("tab", { name: "ブックマーク" });
    await userEvent.click(bookmarkTab);
    expect(
      screen.getByText("ブックマークしたリストはありません。")
    ).toBeInTheDocument();
  });
});
