import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import JoinListForm from "../../../../app/lists/join/JoinListForm";

const mockAutoJoinFromInvite = jest.fn();
jest.mock("@/app/lists/join/actions", () => ({
  autoJoinFromInvite: (...args: unknown[]) => mockAutoJoinFromInvite(...args),
}));

// 参加はアクセス権を変える操作なので、完全な再読み込みで着地させる
const mockLocationReplace = jest.fn();
beforeAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { replace: mockLocationReplace, href: "http://localhost/" },
  });
});
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: jest.fn() }) }));
jest.mock("@/components/ui/toaster", () => ({ Toaster: () => null }));

jest.mock("@/hooks/use-i18n", () => ({
  __esModule: true,
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (!params) return key;
      return Object.entries(params).reduce(
        (text, [k, v]) => text.replace(new RegExp(`{${k}}`, "g"), String(v)),
        `${key}:{${Object.keys(params).join("}{")}}`
      );
    },
    locale: "ja",
    setLocale: jest.fn(),
  }),
}));

const preview = {
  listName: "八王子会お店リスト",
  ownerName: "aki k",
  permission: "edit" as const,
  placeCount: 6,
  places: [
    { id: "p1", name: "喫茶ネグラ" },
    { id: "p2", name: "八王子ラーメン" },
    { id: "p3", name: "夢庵" },
  ],
};

describe("JoinListForm（ログイン済みの参加確認）", () => {
  beforeEach(() => jest.clearAllMocks());

  it("参加前にリストの中身が読める", () => {
    // 未ログインのプレビューと同じ情報が見えないと、情報量が逆転してしまう
    render(<JoinListForm token="tok" preview={preview} />);

    expect(screen.getByText("喫茶ネグラ")).toBeInTheDocument();
    expect(screen.getByText("八王子ラーメン")).toBeInTheDocument();
    expect(screen.getByText("夢庵")).toBeInTheDocument();
  });

  it("リスト名と招待者と残り件数を表示する", () => {
    render(<JoinListForm token="tok" preview={preview} />);

    expect(screen.getByText("八王子会お店リスト")).toBeInTheDocument();
    expect(screen.getByText(/aki k/)).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it("参加すると完全な再読み込みでリスト詳細へ着地する", async () => {
    // router 遷移だと参加前のRSCキャッシュが残り、地点や表示順が読み込まれない
    mockAutoJoinFromInvite.mockResolvedValue({
      success: true,
      listId: "list-1",
    });

    render(<JoinListForm token="tok" preview={preview} />);
    fireEvent.click(screen.getByRole("button", { name: "join.submit" }));

    await waitFor(() =>
      expect(mockLocationReplace).toHaveBeenCalledWith("/lists/list-1?joined=1")
    );
    expect(mockAutoJoinFromInvite).toHaveBeenCalledWith("tok");
  });

  it("参加に失敗したら遷移せずエラーを知らせる", async () => {
    mockAutoJoinFromInvite.mockResolvedValue({
      success: false,
      errorKey: "errors.common.linkExpired",
    });

    render(<JoinListForm token="tok" preview={preview} />);
    fireEvent.click(screen.getByRole("button", { name: "join.submit" }));

    await waitFor(() => expect(mockAutoJoinFromInvite).toHaveBeenCalled());
    expect(mockLocationReplace).not.toHaveBeenCalled();
  });

  it("付与される権限を示す", () => {
    render(<JoinListForm token="tok" preview={preview} />);

    expect(
      screen.getByText(/join.permission.editAndView/)
    ).toBeInTheDocument();
  });
});
