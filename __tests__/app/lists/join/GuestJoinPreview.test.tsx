import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import GuestJoinPreview from "../../../../app/lists/join/GuestJoinPreview";

// 本物の t と同じく {name} 形式の補間を行う（翻訳文そのものには依存しない）
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

const TOKEN = "abc123";
// auto=1 付きで戻し、着地後にクライアント側から参加処理を実行する
const JOIN_PATH = `/lists/join?token=${TOKEN}&auto=1`;

const preview = {
  listName: "八王子会お店リスト",
  ownerName: "aki k",
  placeCount: 6,
  places: [
    { id: "p1", name: "喫茶ネグラ" },
    { id: "p2", name: "八王子ラーメン" },
    { id: "p3", name: "夢庵" },
  ],
};

describe("GuestJoinPreview（未ログインでも中身が見える）", () => {
  it("リスト名と作成者を表示する", () => {
    render(<GuestJoinPreview token={TOKEN} preview={preview} />);

    expect(screen.getByText("八王子会お店リスト")).toBeInTheDocument();
    expect(screen.getByText(/aki k/)).toBeInTheDocument();
  });

  it("登録前に地点の中身が読める", () => {
    render(<GuestJoinPreview token={TOKEN} preview={preview} />);

    expect(screen.getByText("喫茶ネグラ")).toBeInTheDocument();
    expect(screen.getByText("八王子ラーメン")).toBeInTheDocument();
    expect(screen.getByText("夢庵")).toBeInTheDocument();
  });

  it("表示しきれない残り件数を伝える", () => {
    render(<GuestJoinPreview token={TOKEN} preview={preview} />);

    // 全6件のうち3件表示 → 残り3件
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it("参加ボタンは新規登録へ送り、招待先を redirect_url で保持する", () => {
    render(<GuestJoinPreview token={TOKEN} preview={preview} />);

    const cta = screen.getByRole("link", { name: "join.guest.cta" });
    const href = cta.getAttribute("href")!;

    expect(href.startsWith("/signup?")).toBe(true);
    const query = new URLSearchParams(href.split("?")[1]);
    expect(query.get("redirect_url")).toBe(JOIN_PATH);
  });

  it("既存ユーザー向けのログイン導線も招待先を保持する", () => {
    render(<GuestJoinPreview token={TOKEN} preview={preview} />);

    const loginLink = screen.getByRole("link", {
      name: "auth.common.login",
    });
    const href = loginLink.getAttribute("href")!;

    expect(href.startsWith("/login?")).toBe(true);
    const query = new URLSearchParams(href.split("?")[1]);
    expect(query.get("redirect_url")).toBe(JOIN_PATH);
  });

  it("地点が0件でも登録導線は出す", () => {
    render(
      <GuestJoinPreview
        token={TOKEN}
        preview={{ ...preview, placeCount: 0, places: [] }}
      />
    );

    expect(
      screen.getByRole("link", { name: "join.guest.cta" })
    ).toBeInTheDocument();
  });
});
