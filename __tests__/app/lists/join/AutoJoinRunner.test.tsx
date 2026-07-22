import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import AutoJoinRunner from "../../../../app/lists/join/AutoJoinRunner";

const mockAutoJoinFromInvite = jest.fn();
jest.mock("@/app/lists/join/actions", () => ({
  autoJoinFromInvite: (...args: unknown[]) => mockAutoJoinFromInvite(...args),
}));

// 参加はアクセス権を変える操作なので、クライアント側のRSCキャッシュを捨てて
// 完全な再読み込みで着地させる（router.replace だと参加前の状態が残る）
const mockReplace = jest.fn();
beforeAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { replace: mockReplace, href: "http://localhost/", search: "" },
  });
});

jest.mock("@/hooks/use-i18n", () => ({
  __esModule: true,
  useI18n: () => ({ t: (key: string) => key, locale: "ja", setLocale: jest.fn() }),
}));

describe("AutoJoinRunner（着地後の自動参加）", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAutoJoinFromInvite.mockResolvedValue({
      success: true,
      listId: "list-1",
    });
  });

  it("参加に成功したらリスト詳細へ置き換え遷移する", async () => {
    render(<AutoJoinRunner token="tok" />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/lists/list-1?joined=1")
    );
    expect(mockAutoJoinFromInvite).toHaveBeenCalledWith("tok");
  });

  it("参加に失敗したら確認画面へ戻す（トークンは保持する）", async () => {
    mockAutoJoinFromInvite.mockResolvedValue({
      success: false,
      errorKey: "errors.common.linkExpired",
    });

    render(<AutoJoinRunner token="tok" />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/lists/join?token=tok")
    );
  });

  it("再レンダーされても参加処理を二重に実行しない", async () => {
    // current_uses を二重加算しないためのガード（React StrictMode 対策）
    const { rerender } = render(<AutoJoinRunner token="tok" />);
    rerender(<AutoJoinRunner token="tok" />);
    rerender(<AutoJoinRunner token="tok" />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(mockAutoJoinFromInvite).toHaveBeenCalledTimes(1);
  });

  it("実行中に再マウントされても参加処理を二重に実行しない", async () => {
    // useAuthSync が router.refresh() を呼ぶため、着地直後に再マウントされうる。
    // current_uses の二重加算を防ぐ。
    let resolveJoin!: (v: unknown) => void;
    mockAutoJoinFromInvite.mockReturnValue(
      new Promise((resolve) => {
        resolveJoin = resolve;
      })
    );

    const first = render(<AutoJoinRunner token="tok" />);
    await waitFor(() => expect(mockAutoJoinFromInvite).toHaveBeenCalled());
    first.unmount();
    render(<AutoJoinRunner token="tok" />);

    resolveJoin({ success: true, listId: "list-1" });

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(mockAutoJoinFromInvite).toHaveBeenCalledTimes(1);
  });

  it("完了後に開き直したら再試行できる（リロードで復帰できること）", async () => {
    // 永続的なガードを置くと、失敗時にF5しても「参加中」から抜けられなくなる
    const first = render(<AutoJoinRunner token="tok" />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    first.unmount();
    jest.clearAllMocks();

    render(<AutoJoinRunner token="tok" />);

    await waitFor(() => expect(mockAutoJoinFromInvite).toHaveBeenCalledTimes(1));
  });

  it("参加処理が例外を投げても「参加中」で止まらない", async () => {
    mockAutoJoinFromInvite.mockRejectedValue(new Error("network down"));

    render(<AutoJoinRunner token="tok" />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/lists/join?token=tok")
    );
  });

  it("別の招待トークンなら実行される", async () => {
    const first = render(<AutoJoinRunner token="tok" />);
    await waitFor(() => expect(mockAutoJoinFromInvite).toHaveBeenCalled());
    first.unmount();

    render(<AutoJoinRunner token="another-token" />);

    await waitFor(() =>
      expect(mockAutoJoinFromInvite).toHaveBeenCalledWith("another-token")
    );
  });

  it("処理中であることを画面に示す", () => {
    render(<AutoJoinRunner token="tok" />);

    expect(screen.getByText("join.submitting")).toBeInTheDocument();
  });
});
