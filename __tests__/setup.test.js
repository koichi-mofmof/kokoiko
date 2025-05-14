import "@testing-library/jest-dom";

describe("テスト環境のセットアップ", () => {
  it("Jestが正しく動作することを確認", () => {
    expect(1 + 1).toBe(2);
  });

  it("マッチャーが正しく動作することを確認", () => {
    expect(true).toBe(true);
    expect({ name: "テスト" }).toEqual({ name: "テスト" });
    expect([1, 2, 3]).toHaveLength(3);
  });

  it("DOM関連のマッチャーが正しく動作することを確認", () => {
    document.body.innerHTML = `
      <div>
        <button data-testid="test-button">テストボタン</button>
      </div>
    `;

    const button = document.querySelector('[data-testid="test-button"]');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("テストボタン");
  });
});
