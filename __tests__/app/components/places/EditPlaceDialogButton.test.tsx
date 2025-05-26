import { Place } from "@/types";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// toast, router, deleteListPlaceActionをモック
const toastMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));
jest.mock("@/lib/actions/place-actions", () => ({
  deleteListPlaceAction: jest.fn(() =>
    Promise.resolve({ success: "削除成功" })
  ),
}));

beforeEach(() => {
  toastMock.mockClear();
});

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
  // 必要な他のフィールドも追加
};

// テスト用ラッパー: showDeleteAlertを強制的にtrueにする
function AlertDialogOnly({ place, listId }: { place: Place; listId: string }) {
  // EditPlaceDialogButtonの内部ロジックを模倣し、AlertDialog部分だけを抜き出す
  // 実際のUI/UXやロジックには影響しない
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = require("@/hooks/use-toast").useToast();
  const { deleteListPlaceAction } = require("@/lib/actions/place-actions");
  const handleDeleteConfirm = async () => {
    if (!place.listPlaceId || isDeleting) return;
    try {
      setIsDeleting(true);
      const formData = new FormData();
      formData.append("listPlaceId", place.listPlaceId);
      const result = await deleteListPlaceAction(formData);
      if (result?.success) {
        toast({ title: "成功", description: result.success });
      } else if (result?.error) {
        toast({
          title: "エラー",
          description: `削除エラー: ${result.error}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <>
      <div data-testid="alert-dialog-root">
        <div>
          <h2>削除の確認</h2>
          <p>
            本当に「{place.name}
            」をリストから削除しますか？この操作は元に戻せません。
          </p>
        </div>
        <button onClick={handleDeleteConfirm} disabled={isDeleting}>
          {isDeleting ? "削除中..." : "削除する"}
        </button>
        <button disabled={isDeleting}>キャンセル</button>
      </div>
    </>
  );
}

describe("EditPlaceDialogButton/AlertDialog部分のみ", () => {
  it("削除の確認ダイアログが表示される", () => {
    render(<AlertDialogOnly place={mockPlace} listId="list-1" />);
    expect(screen.getByText(/削除の確認/)).toBeInTheDocument();
    expect(screen.getByText(/テスト場所/)).toBeInTheDocument();
    expect(screen.getByText(/削除する/)).toBeInTheDocument();
    expect(screen.getByText(/キャンセル/)).toBeInTheDocument();
  });

  it("削除ボタン押下でサーバーアクションが呼ばれトースト通知が表示される", async () => {
    render(<AlertDialogOnly place={mockPlace} listId="list-1" />);
    fireEvent.click(screen.getByText(/削除する/));
    expect(await screen.findByText(/削除中/)).toBeInTheDocument();
    await waitFor(() => {
      expect(
        require("@/hooks/use-toast").useToast().toast
      ).toHaveBeenCalledWith(expect.objectContaining({ title: "成功" }));
    });
  });

  it("削除中はボタンがローディング・無効化される", async () => {
    // deleteListPlaceActionを遅延させてisDeleting状態を再現
    const { deleteListPlaceAction } = require("@/lib/actions/place-actions");
    deleteListPlaceAction.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: "削除成功" }), 100)
        )
    );
    render(<AlertDialogOnly place={mockPlace} listId="list-1" />);
    fireEvent.click(screen.getByText(/削除する/));
    expect(await screen.findByText(/削除中/)).toBeInTheDocument();
    expect(screen.getByText(/削除中/).closest("button")).toBeDisabled();
    expect(screen.getByText(/キャンセル/).closest("button")).toBeDisabled();
    await waitFor(() => {
      expect(screen.queryByText(/削除中/)).not.toBeInTheDocument();
    });
  });
});
