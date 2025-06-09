import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AddPlaceButtonClient from "@/app/components/places/AddPlaceButtonClient";
import { MockSubscriptionProvider } from "../../../mocks/MockSubscriptionProvider";

// AddPlaceFormをモック
jest.mock(
  "@/app/components/places/AddPlaceForm",
  () =>
    function MockAddPlaceForm(props: any) {
      return (
        <div data-testid="mock-add-place-form">
          AddPlaceFormMock
          <button onClick={() => props.onPlaceRegistered?.()}>登録完了</button>
          <button onClick={() => props.onResetRequest?.()}>リセット</button>
          <span data-testid="list-id">{props.listId}</span>
        </div>
      );
    }
);

// ヘルパー関数
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<MockSubscriptionProvider>{ui}</MockSubscriptionProvider>);
};

describe("AddPlaceButtonClient", () => {
  const listId = "test-list-1";

  it("スマホ・PC両方の追加ボタンが表示される", () => {
    renderWithProviders(<AddPlaceButtonClient listId={listId} />);
    expect(
      screen.getByRole("button", { name: /場所を追加 \(スマートフォン\)/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /場所を追加 \(PC\)/ })
    ).toBeInTheDocument();
  });

  it("PCボタン押下でダイアログが開き、AddPlaceFormが表示される", () => {
    renderWithProviders(<AddPlaceButtonClient listId={listId} />);
    fireEvent.click(screen.getByRole("button", { name: /場所を追加 \(PC\)/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("新しい場所をリストに追加")).toBeInTheDocument();
    expect(screen.getByTestId("mock-add-place-form")).toBeInTheDocument();
    expect(screen.getByTestId("list-id")).toHaveTextContent(listId);
  });

  it("スマホボタン押下でもダイアログが開く", () => {
    renderWithProviders(<AddPlaceButtonClient listId={listId} />);
    fireEvent.click(
      screen.getByRole("button", { name: /場所を追加 \(スマートフォン\)/ })
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("AddPlaceFormのonPlaceRegisteredでダイアログが閉じる", () => {
    renderWithProviders(<AddPlaceButtonClient listId={listId} />);
    fireEvent.click(screen.getByRole("button", { name: /場所を追加 \(PC\)/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByText("登録完了"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ダイアログがrole=dialogかつタイトルが正しく表示される", () => {
    renderWithProviders(<AddPlaceButtonClient listId={listId} />);
    fireEvent.click(screen.getByRole("button", { name: /場所を追加 \(PC\)/ }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("新しい場所をリストに追加")).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-labelledby");
  });
});
