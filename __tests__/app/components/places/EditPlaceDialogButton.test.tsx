import EditPlaceDialogButton from "@/app/components/places/EditPlaceDialogButton";
import { Place } from "@/types";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

const toastMock = jest.fn();
const routerReplaceMock = jest.fn();
const routerPushMock = jest.fn();
const deleteListPlaceActionMock = jest.fn();
const trackDeletePlaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
    replace: routerReplaceMock,
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
}));
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));
jest.mock("@/hooks/use-subscription", () => ({
  useSubscription: () => ({ refreshSubscription: jest.fn() }),
}));
jest.mock("@/lib/actions/place-actions", () => ({
  deleteListPlaceAction: (...args: unknown[]) =>
    deleteListPlaceActionMock(...args),
}));
jest.mock("@/lib/analytics/events", () => ({
  trackPlaceEvents: { deletePlace: (...args: unknown[]) => trackDeletePlaceMock(...args) },
}));
// 編集ダイアログの中身は本テストの対象外
jest.mock("@/app/components/places/EditPlaceForm", () => () => (
  <div data-testid="EditPlaceForm" />
));

const mockPlace: Place = {
  id: "1",
  name: "テスト場所",
  address: "東京都",
  googleMapsUrl: "https://maps.google.com/?q=テスト場所",
  latitude: 35.6895,
  longitude: 139.6917,
  tags: [],
  createdAt: new Date(),
  visited: "not_visited",
  createdBy: "user-1",
  listPlaceId: "abc-123",
};

// jest.setup.js の alert-dialog モックは中身を常に描画するため、
// 確認ダイアログの「削除」ボタンは初期状態から DOM 上に存在する
const clickDeleteConfirm = () =>
  fireEvent.click(screen.getByRole("button", { name: "削除" }));

describe("EditPlaceDialogButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 成功時はサーバーアクション側の redirect で遷移するため、戻り値は無い
    deleteListPlaceActionMock.mockResolvedValue(undefined);
  });

  it("削除の確認ダイアログが表示される", () => {
    render(<EditPlaceDialogButton place={mockPlace} listId="list-1" />);
    expect(screen.getByText("削除の確認")).toBeInTheDocument();
    expect(screen.getByText(/テスト場所/)).toBeInTheDocument();
  });

  it("削除ボタン押下でサーバーアクションが呼ばれる", async () => {
    render(<EditPlaceDialogButton place={mockPlace} listId="list-1" />);
    clickDeleteConfirm();

    await waitFor(() => {
      expect(deleteListPlaceActionMock).toHaveBeenCalledTimes(1);
    });
    const formData = deleteListPlaceActionMock.mock.calls[0][0] as FormData;
    expect(formData.get("listPlaceId")).toBe("abc-123");
  });

  it("削除成功時に成功トーストを表示しない", async () => {
    render(<EditPlaceDialogButton place={mockPlace} listId="list-1" />);
    clickDeleteConfirm();

    await waitFor(() => {
      expect(deleteListPlaceActionMock).toHaveBeenCalled();
    });
    // 地点が消えること自体が結果として分かるため、成功トーストは出さない
    await waitFor(() => {
      expect(screen.queryByText("削除中...")).not.toBeInTheDocument();
    });
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("削除成功時はクライアント側で遷移しない（サーバーの redirect に任せる）", async () => {
    render(<EditPlaceDialogButton place={mockPlace} listId="list-1" />);
    clickDeleteConfirm();

    await waitFor(() => {
      expect(deleteListPlaceActionMock).toHaveBeenCalled();
    });
    expect(routerPushMock).not.toHaveBeenCalled();
    expect(routerReplaceMock).not.toHaveBeenCalled();
  });

  it("サーバーが redirect せず successKey を返した場合はフォールバック遷移する", async () => {
    deleteListPlaceActionMock.mockResolvedValue({
      successKey: "place.delete.success",
    });
    render(<EditPlaceDialogButton place={mockPlace} listId="list-1" />);
    clickDeleteConfirm();

    await waitFor(() => {
      expect(routerReplaceMock).toHaveBeenCalledWith("/lists/list-1");
    });
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("成功時の NEXT_REDIRECT をエラーとして表示しない", async () => {
    // サーバーアクションの redirect() はクライアントに NEXT_REDIRECT エラーとして伝わる。
    // これは削除成功時の正常な遷移なので、エラートーストを出してはいけない。
    const redirectError = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/lists/list-1;307;",
    });
    deleteListPlaceActionMock.mockRejectedValue(redirectError);

    render(<EditPlaceDialogButton place={mockPlace} listId="list-1" />);
    clickDeleteConfirm();

    // 遷移はルーター側で確定済みなので、握り潰して何も表示しない
    await waitFor(() => {
      expect(screen.queryByText("削除中...")).not.toBeInTheDocument();
    });
    expect(toastMock).not.toHaveBeenCalled();
    expect(routerReplaceMock).not.toHaveBeenCalled();
  });

  it("digest だけを持つ NEXT_REDIRECT もエラーとして表示しない", async () => {
    // message が digest 形式になる Next.js のバージョン差に備える
    const redirectError = Object.assign(new Error("NEXT_REDIRECT;replace;/x;307;"), {
      digest: "NEXT_REDIRECT;replace;/lists/list-1;307;",
    });
    deleteListPlaceActionMock.mockRejectedValue(redirectError);

    render(<EditPlaceDialogButton place={mockPlace} listId="list-1" />);
    clickDeleteConfirm();

    await waitFor(() => {
      expect(screen.queryByText("削除中...")).not.toBeInTheDocument();
    });
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("削除失敗時はエラートーストを表示する", async () => {
    deleteListPlaceActionMock.mockResolvedValue({
      errorKey: "place.errors.deleteFailed",
      error: "boom",
    });
    render(<EditPlaceDialogButton place={mockPlace} listId="list-1" />);
    clickDeleteConfirm();

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" })
      );
    });
    expect(routerReplaceMock).not.toHaveBeenCalled();
  });

  it("削除中はボタンがローディング・無効化される", async () => {
    let resolveDelete!: (value: unknown) => void;
    deleteListPlaceActionMock.mockReturnValue(
      new Promise((resolve) => {
        resolveDelete = resolve;
      })
    );
    render(<EditPlaceDialogButton place={mockPlace} listId="list-1" />);
    clickDeleteConfirm();

    expect(await screen.findByText("削除中...")).toBeInTheDocument();
    expect(screen.getByText("削除中...").closest("button")).toBeDisabled();

    resolveDelete(undefined);
    await waitFor(() => {
      expect(screen.queryByText("削除中...")).not.toBeInTheDocument();
    });
  });
});
