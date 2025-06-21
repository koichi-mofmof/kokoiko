import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import AddPlaceForm from "@/app/components/places/AddPlaceForm";

// Server Actions, useToastをモック
jest.mock("@/lib/actions/google-maps-actions", () => ({
  searchPlaces: jest.fn(() => ({ predictions: [] })),
  getPlaceDetails: jest.fn(() => ({ placeDetails: undefined })),
}));
jest.mock("@/lib/actions/place-actions", () => ({
  registerPlaceToListAction: jest.fn(() => ({
    success: true,
    message: "登録成功",
  })),
}));

// getListTagsのモック
jest.mock("@/lib/dal/lists", () => ({
  getListTags: jest.fn().mockResolvedValue([]),
}));

const toastMock = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

describe("AddPlaceForm", () => {
  const baseProps = {
    listId: "test-list-1",
    onPlaceRegistered: jest.fn(),
    onResetRequest: jest.fn(),
  };

  it("初期表示で検索欄・ボタンが表示される", async () => {
    await act(async () => {
      render(<AddPlaceForm {...baseProps} />);
    });

    expect(screen.getByText("場所を検索")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例: 東京タワー")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /検索/ })).toBeInTheDocument();
  });

  // add_details画面やUI遷移・バリデーション等のテストはJest単体では困難なためE2Eで担保すること
});
