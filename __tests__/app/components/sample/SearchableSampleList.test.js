import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchableSampleList } from "../../../../app/sample/_components/SearchableSampleList";
import "@testing-library/jest-dom";

// 必要なコンポーネントをモック
jest.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, className }) => (
    <div className={className} data-testid="avatar">
      {children}
    </div>
  ),
  AvatarImage: ({ src, alt }) => (
    <img src={src} alt={alt} data-testid="avatar-image" />
  ),
  AvatarFallback: ({ children, className }) => (
    <div className={className} data-testid="avatar-fallback">
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, className }) => (
    <span className={className} data-testid="badge">
      {children}
    </span>
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children, className }) => (
    <div className={className} data-testid="card-content">
      {children}
    </div>
  ),
  CardDescription: ({ children, className }) => (
    <p className={className} data-testid="card-description">
      {children}
    </p>
  ),
  CardTitle: ({ children, className }) => (
    <h3 className={className} data-testid="card-title">
      {children}
    </h3>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ className, placeholder, value, onChange }) => (
    <input
      className={className}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      data-testid="search-input"
    />
  ),
}));

jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipProvider: ({ children }) => (
    <div data-testid="tooltip-provider">{children}</div>
  ),
  TooltipTrigger: ({ children, asChild }) => (
    <div
      data-testid="tooltip-trigger"
      data-aschild={asChild ? "true" : "false"}
    >
      {children}
    </div>
  ),
}));

jest.mock("lucide-react", () => ({
  Image: () => <div data-testid="image-icon">ImageIcon</div>,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, fill, className, sizes }) => (
    <img
      src={src}
      alt={alt}
      className={className}
      data-testid="next-image"
      style={fill ? { objectFit: "cover" } : {}}
    />
  ),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, className }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// テスト用のモックデータ
const mockCollaborator1 = {
  id: "user-1",
  name: "テストユーザー1",
  email: "test1@example.com",
  avatarUrl: "https://example.com/avatar1.jpg",
};

const mockCollaborator2 = {
  id: "user-2",
  name: "テストユーザー2",
  email: "test2@example.com",
  avatarUrl: "https://example.com/avatar2.jpg",
};

const mockPlaces = [
  {
    id: "place-1",
    name: "テスト場所1",
    address: "東京都渋谷区1-1",
    googleMapsUrl: "https://maps.app.goo.gl/1",
    latitude: 35.6812,
    longitude: 139.7671,
    notes: "メモ1",
    tags: ["タグ1", "タグ2"],
    createdAt: new Date("2023-01-01"),
    visited: true,
    createdBy: "user-1",
    imageUrl: "https://example.com/image1.jpg",
  },
  {
    id: "place-2",
    name: "テスト場所2",
    address: "東京都新宿区2-2",
    googleMapsUrl: "https://maps.app.goo.gl/2",
    latitude: 35.6938,
    longitude: 139.7034,
    notes: "メモ2",
    tags: ["タグ3", "タグ4"],
    createdAt: new Date("2023-02-01"),
    visited: false,
    createdBy: "user-2",
  },
];

const mockSampleLists = [
  {
    id: "list-1",
    name: "東京の観光スポット",
    description: "東京の人気観光スポットのコレクション",
    places: mockPlaces.slice(0, 1),
    collaborators: [mockCollaborator1],
  },
  {
    id: "list-2",
    name: "京都の寺院",
    description: "京都の有名な寺院リスト",
    places: mockPlaces,
    collaborators: [mockCollaborator1, mockCollaborator2],
  },
  {
    id: "list-3",
    name: "大阪グルメ",
    description: "大阪の美味しいお店",
    places: mockPlaces.slice(1),
    collaborators: [],
  },
];

describe("SearchableSampleListコンポーネントテスト", () => {
  it("検索入力フィールドが表示されること", () => {
    render(<SearchableSampleList initialSampleLists={mockSampleLists} />);

    const searchInput = screen.getByTestId("search-input");
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute("placeholder", "リスト名で検索...");
  });

  it("すべてのリストが初期表示されること", () => {
    render(<SearchableSampleList initialSampleLists={mockSampleLists} />);

    // 各リストの名前が表示されていることを確認
    expect(screen.getByText("東京の観光スポット")).toBeInTheDocument();
    expect(screen.getByText("京都の寺院")).toBeInTheDocument();
    expect(screen.getByText("大阪グルメ")).toBeInTheDocument();

    // 説明も表示されていることを確認
    expect(
      screen.getByText("東京の人気観光スポットのコレクション")
    ).toBeInTheDocument();
    expect(screen.getByText("京都の有名な寺院リスト")).toBeInTheDocument();
    expect(screen.getByText("大阪の美味しいお店")).toBeInTheDocument();

    // 件数バッジが表示されていることを確認
    expect(screen.getAllByTestId("badge")[0]).toHaveTextContent("1件");
    expect(screen.getAllByTestId("badge")[1]).toHaveTextContent("2件");
    expect(screen.getAllByTestId("badge")[2]).toHaveTextContent("1件");
  });

  it("検索でリストがフィルタリングされること", () => {
    render(<SearchableSampleList initialSampleLists={mockSampleLists} />);

    // 「東京」で検索
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "東京" } });

    // 「東京」を含むリストのみ表示されることを確認
    expect(screen.getByText("東京の観光スポット")).toBeInTheDocument();

    // 他のリストは表示されないことを確認
    expect(screen.queryByText("京都の寺院")).not.toBeInTheDocument();
    expect(screen.queryByText("大阪グルメ")).not.toBeInTheDocument();
  });

  it("検索結果が0件の場合メッセージが表示されること", () => {
    render(<SearchableSampleList initialSampleLists={mockSampleLists} />);

    // 存在しないキーワードで検索
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, {
      target: { value: "存在しないキーワード" },
    });

    // 「該当するリストは見つかりませんでした」メッセージが表示されることを確認
    expect(
      screen.getByText("該当するリストは見つかりませんでした。")
    ).toBeInTheDocument();
  });

  it("検索をクリアするとすべてのリストが再表示されること", () => {
    render(<SearchableSampleList initialSampleLists={mockSampleLists} />);

    // まず検索でフィルタリング
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "東京" } });

    // 「東京」のリストだけ表示されることを確認
    expect(screen.getByText("東京の観光スポット")).toBeInTheDocument();
    expect(screen.queryByText("京都の寺院")).not.toBeInTheDocument();
    expect(screen.queryByText("大阪グルメ")).not.toBeInTheDocument();

    // 検索をクリア
    fireEvent.change(searchInput, { target: { value: "" } });

    // すべてのリストが再表示されることを確認
    expect(screen.getByText("東京の観光スポット")).toBeInTheDocument();
    expect(screen.getByText("京都の寺院")).toBeInTheDocument();
    expect(screen.getByText("大阪グルメ")).toBeInTheDocument();
  });
});
