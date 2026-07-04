import { render, screen, fireEvent } from "@testing-library/react";
import { BookmarkSignupModal } from "@/app/components/conversion/BookmarkSignupModal";
import { trackConversionEvents } from "@/lib/analytics/events";

// lib/analytics/events のモック
jest.mock("@/lib/analytics/events", () => ({
  trackConversionEvents: {
    promptShown: jest.fn(),
    promptClicked: jest.fn(),
    promptDismissed: jest.fn(),
  },
}));

// useI18n のモック: キー(+パラメータ値)をそのまま返し、文言の変更に強いテストにする
jest.mock("@/hooks/use-i18n", () => ({
  __esModule: true,
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) =>
      params && Object.keys(params).length
        ? `${key}|${Object.values(params).join(",")}`
        : key,
    locale: "ja",
    setLocale: jest.fn(),
  }),
}));

// Dialog 関連のモック
// 実コンポーネントは Dialog の onOpenChange / DialogContent の onInteractOutside で
// 閉じる処理を行うため、閉じる操作を発火できるボタンを用意する。
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog" style={{ display: open ? "block" : "none" }}>
      <button
        data-testid="mock-close-via-openchange"
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </div>
  ),
  DialogContent: ({ children, onInteractOutside, ...props }: any) => (
    <div data-testid="dialog-content" {...props}>
      {children}
      <button
        data-testid="mock-close-via-interact-outside"
        onClick={onInteractOutside}
      />
    </div>
  ),
  DialogTitle: ({ children, ...props }: any) => (
    <h2 {...props} role="heading" aria-level={2}>
      {children}
    </h2>
  ),
}));

// button のモック（Button は children と onClick をそのまま透過）
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

// next/link のモック（href 検証のため素朴な <a> に）
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// lucide-react のモック: Proxy で任意のアイコンを自動 stub 化し、
// 実装側のアイコン追加でテストが壊れないようにする。
jest.mock("lucide-react", () => {
  const React = require("react");
  return new Proxy(
    {},
    {
      get: (_target, iconName: string) => {
        if (iconName === "__esModule") return true;
        const Icon = ({ className, ...props }: any) =>
          React.createElement("div", {
            className,
            "data-testid": `icon-${String(iconName)}`,
            ...props,
          });
        Icon.displayName = String(iconName);
        return Icon;
      },
    }
  );
});

describe("BookmarkSignupModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    listId: "list-123",
    listName: "テストリスト",
  };

  const samplePlaces = [
    { id: "p1", name: "場所A", tags: [{ id: "t1", name: "カフェ" }] },
    { id: "p2", name: "場所B", tags: [] },
    { id: "p3", name: "場所C", tags: [] },
    { id: "p4", name: "場所D", tags: [] },
  ] as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("モーダルが開いている時、タイトル・価値訴求・CTA が表示される", () => {
    render(<BookmarkSignupModal {...defaultProps} />);

    // リスト名付きタイトル（prefixWithName にリスト名が渡る）
    expect(
      screen.getByText(/conversion\.bookmark\.title\.prefixWithName\|テストリスト/)
    ).toBeInTheDocument();
    // highlight と suffix は同一 span 内で連結されて描画される
    expect(
      screen.getByText(
        /conversion\.bookmark\.title\.highlightconversion\.bookmark\.title\.suffix/
      )
    ).toBeInTheDocument();

    // 価値訴求
    expect(
      screen.getByText("conversion.bookmark.value.pro1")
    ).toBeInTheDocument();
    expect(
      screen.getByText("conversion.bookmark.value.pro2")
    ).toBeInTheDocument();

    // 注釈・CTA
    expect(screen.getByText("conversion.bookmark.note")).toBeInTheDocument();
    expect(screen.getByText("conversion.bookmark.cta")).toBeInTheDocument();
    expect(
      screen.getByText("conversion.bookmark.alreadyHaveAccount")
    ).toBeInTheDocument();
  });

  it("リスト名が無い場合は汎用タイトルキーを表示する", () => {
    render(<BookmarkSignupModal {...defaultProps} listName={undefined} />);

    expect(
      screen.getByText("conversion.bookmark.title.prefixGeneric")
    ).toBeInTheDocument();
    // prefixWithName は使われない
    expect(
      screen.queryByText(/conversion\.bookmark\.title\.prefixWithName/)
    ).not.toBeInTheDocument();
  });

  it("開いた時に promptShown が listId 付きで送信される", () => {
    render(<BookmarkSignupModal {...defaultProps} />);
    expect(trackConversionEvents.promptShown).toHaveBeenCalledWith("list-123");
  });

  it("CTA クリックで promptClicked と onClose が呼ばれる", () => {
    const onClose = jest.fn();
    render(<BookmarkSignupModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText("conversion.bookmark.cta"));

    expect(trackConversionEvents.promptClicked).toHaveBeenCalledWith("list-123");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("モーダルを閉じると promptDismissed と onClose が呼ばれる", () => {
    const onClose = jest.fn();
    render(<BookmarkSignupModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByTestId("mock-close-via-openchange"));

    expect(trackConversionEvents.promptDismissed).toHaveBeenCalledWith(
      "list-123"
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("サインアップリンクが正しい href を持つ", () => {
    render(<BookmarkSignupModal {...defaultProps} />);

    const signupLink = screen
      .getByText("conversion.bookmark.cta")
      .closest("a");
    expect(signupLink).toHaveAttribute(
      "href",
      "/signup?bookmark=list-123&returnTo=/lists"
    );
  });

  it("ログインリンクが正しい href を持つ", () => {
    render(<BookmarkSignupModal {...defaultProps} />);

    const loginLink = screen.getByText(
      "conversion.bookmark.alreadyHaveAccount"
    );
    expect(loginLink).toHaveAttribute(
      "href",
      "/login?bookmark=list-123&returnTo=/lists"
    );
  });

  it("モーダルが閉じている時は dialog が非表示になる", () => {
    render(<BookmarkSignupModal {...defaultProps} isOpen={false} />);
    expect(screen.getByTestId("dialog")).toHaveStyle({ display: "none" });
  });

  it("places が無い場合はプレビューを表示しない", () => {
    render(<BookmarkSignupModal {...defaultProps} />);
    expect(
      screen.queryByText("conversion.bookmark.preview.title")
    ).not.toBeInTheDocument();
  });

  it("places がある場合は先頭3件のプレビューと残数を表示する", () => {
    render(<BookmarkSignupModal {...defaultProps} places={samplePlaces} />);

    expect(
      screen.getByText("conversion.bookmark.preview.title")
    ).toBeInTheDocument();
    expect(screen.getByText("場所A")).toBeInTheDocument();
    expect(screen.getByText("場所B")).toBeInTheDocument();
    expect(screen.getByText("場所C")).toBeInTheDocument();
    // 4件目はプレビュー対象外
    expect(screen.queryByText("場所D")).not.toBeInTheDocument();
    // 残数表示（4 - 3 = 1）
    expect(
      screen.getByText(/conversion\.bookmark\.preview\.more\|1/)
    ).toBeInTheDocument();
  });

  it("主要アイコンが表示される", () => {
    render(<BookmarkSignupModal {...defaultProps} places={samplePlaces} />);

    expect(screen.getByTestId("icon-Bookmark")).toBeInTheDocument();
    // 価値訴求の各項目に Check アイコン
    expect(screen.getAllByTestId("icon-Check").length).toBeGreaterThanOrEqual(2);
    // プレビュー各行に MapPin アイコン
    expect(screen.getAllByTestId("icon-MapPin").length).toBe(3);
  });
});
