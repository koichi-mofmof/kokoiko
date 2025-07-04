import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ListFormComponent } from "@/app/components/lists/ListFormComponent";

// UIコンポーネントをモック
jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    type,
    className,
    "data-testid": dataTestId,
  }) => {
    let testId = dataTestId;
    if (!testId && type === "submit") testId = "submit-button";
    if (!testId && variant === "outline") testId = "cancel-button";
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        type={type}
        className={className}
        data-variant={variant}
        data-testid={testId || "button"}
      >
        {children}
      </button>
    );
  },
}));

jest.mock("@/components/ui/dialog", () => ({
  DialogFooter: ({ children }) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ id, name, value, onChange, placeholder, required }) => (
    <input
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      data-testid={`input-${name}`}
    />
  ),
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ htmlFor, children, className }) => (
    <label
      htmlFor={htmlFor}
      className={className}
      data-testid={`label-${htmlFor}`}
    >
      {children}
    </label>
  ),
}));

jest.mock("@/components/ui/switch", () => ({
  Switch: ({ id, checked, onCheckedChange }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      data-testid={`switch-${id}`}
    />
  ),
}));

jest.mock("@/components/ui/textarea", () => ({
  Textarea: ({ id, name, value, onChange, placeholder, rows }) => (
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      data-testid={`textarea-${name}`}
    />
  ),
}));

// RadioGroupのchildrenを再帰的に走査してRadioGroupItemにchecked/onChangeを渡す
function mapRadioGroupChildren(children, value, onValueChange) {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    if (
      child.type &&
      (child.type.name === "RadioGroupItem" ||
        child.type.displayName === "RadioGroupItem")
    ) {
      return React.cloneElement(child, {
        checked: child.props.value === value,
        onChange: () => onValueChange(child.props.value),
        onClick: () => onValueChange(child.props.value),
      });
    }
    if (child.props && child.props.children) {
      return React.cloneElement(child, {
        children: mapRadioGroupChildren(
          child.props.children,
          value,
          onValueChange
        ),
      });
    }
    return child;
  });
}

jest.mock("@/components/ui/radio-group", () => ({
  RadioGroup: ({ value, onValueChange, children, className }) => (
    <div className={className} data-testid="radio-group">
      {mapRadioGroupChildren(children, value, onValueChange)}
    </div>
  ),
  RadioGroupItem: ({ id, value, checked, onChange }) => (
    <input
      type="radio"
      id={id}
      value={value}
      checked={checked}
      onChange={onChange}
      onClick={onChange}
      data-testid="radio-group-item"
    />
  ),
}));

describe("ListFormComponentテスト", () => {
  const mockSubmit = jest.fn();
  const mockCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("初期状態が正しく表示されること", () => {
    const initialData = {
      name: "テストリスト",
      description: "テスト説明",
      isPublic: true,
    };

    render(
      <ListFormComponent
        initialData={initialData}
        onSubmit={mockSubmit}
        submitButtonText="保存"
        isSubmitting={false}
      />
    );

    // 初期値が正しく設定されていることを確認
    expect(screen.getByTestId("input-name")).toHaveValue("テストリスト");
    expect(screen.getByTestId("textarea-description")).toHaveValue(
      "テスト説明"
    );
    // 公開ラジオを取得
    const radios = screen.getAllByTestId("radio-group-item");
    const privateRadio = radios.find((r) => r.id === "private");
    const publicRadio = radios.find((r) => r.id === "public");
    expect(publicRadio.checked).toBe(true);
    expect(privateRadio.checked).toBe(false);

    // ボタンのテキストが正しいことを確認
    expect(screen.getByTestId("submit-button")).toHaveTextContent("保存");
  });

  it("入力フィールドの変更が状態に反映されること", () => {
    render(
      <ListFormComponent
        onSubmit={mockSubmit}
        submitButtonText="保存"
        isSubmitting={false}
      />
    );

    // 入力フィールドを取得
    const nameInput = screen.getByTestId("input-name");
    const descriptionTextarea = screen.getByTestId("textarea-description");
    // 公開・非公開ラジオを取得
    const radios = screen.getAllByTestId("radio-group-item");
    const privateRadio = radios.find((r) => r.id === "private");
    const publicRadio = radios.find((r) => r.id === "public");

    // 入力を変更
    fireEvent.change(nameInput, { target: { value: "新しいリスト名" } });
    fireEvent.change(descriptionTextarea, { target: { value: "新しい説明" } });
    fireEvent.click(privateRadio);

    // 値が変更されていることを確認
    expect(nameInput).toHaveValue("新しいリスト名");
    expect(descriptionTextarea).toHaveValue("新しい説明");
    expect(privateRadio.checked).toBe(true);
    expect(publicRadio.checked).toBe(false);
  });

  it("初期データが変更された場合にフォームが更新されること", () => {
    const { rerender } = render(
      <ListFormComponent
        initialData={{ name: "リスト1", description: "説明1", isPublic: false }}
        onSubmit={mockSubmit}
        submitButtonText="保存"
        isSubmitting={false}
      />
    );

    // 初期値が正しく設定されていることを確認
    expect(screen.getByTestId("input-name")).toHaveValue("リスト1");
    expect(screen.getByTestId("textarea-description")).toHaveValue("説明1");
    // 公開・非公開ラジオを取得
    const radios = screen.getAllByTestId("radio-group-item");
    const privateRadio = radios.find((r) => r.id === "private");
    const publicRadio = radios.find((r) => r.id === "public");
    expect(privateRadio.checked).toBe(true);
    expect(publicRadio.checked).toBe(false);

    // initialDataを変更して再レンダリング
    rerender(
      <ListFormComponent
        initialData={{ name: "リスト2", description: "説明2", isPublic: true }}
        onSubmit={mockSubmit}
        submitButtonText="保存"
        isSubmitting={false}
      />
    );

    // 新しい初期値が反映されていることを確認
    expect(screen.getByTestId("input-name")).toHaveValue("リスト2");
    expect(screen.getByTestId("textarea-description")).toHaveValue("説明2");
    // 公開・非公開ラジオを取得
    const radios2 = screen.getAllByTestId("radio-group-item");
    const privateRadio2 = radios2.find((r) => r.id === "private");
    const publicRadio2 = radios2.find((r) => r.id === "public");
    expect(publicRadio2.checked).toBe(true);
    expect(privateRadio2.checked).toBe(false);
  });

  it("フォーム送信時にonSubmitコールバックが呼ばれること", async () => {
    render(
      <ListFormComponent
        onSubmit={mockSubmit}
        submitButtonText="保存"
        isSubmitting={false}
      />
    );

    // フォームの値を入力
    fireEvent.change(screen.getByTestId("input-name"), {
      target: { value: "テストリスト" },
    });
    fireEvent.change(screen.getByTestId("textarea-description"), {
      target: { value: "テスト説明" },
    });
    // 公開ラジオを明示的に選択
    fireEvent.click(screen.getByLabelText("公開"));

    // フォームを送信
    fireEvent.submit(screen.getByTestId("submit-button").closest("form"));

    // onSubmitが正しい値で呼ばれることを確認
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: "テストリスト",
        description: "テスト説明",
        isPublic: true,
      });
    });
  });

  it("送信中は送信ボタンが無効化されること", () => {
    render(
      <ListFormComponent
        onSubmit={mockSubmit}
        submitButtonText="保存"
        isSubmitting={true}
      />
    );

    // 送信ボタンが無効化されていることを確認
    expect(screen.getByTestId("submit-button")).toBeDisabled();
    expect(screen.getByTestId("submit-button")).toHaveTextContent("処理中...");
  });

  it("キャンセルボタンが表示され、クリックでonCancelが呼ばれること", () => {
    render(
      <ListFormComponent
        onSubmit={mockSubmit}
        submitButtonText="保存"
        isSubmitting={false}
        showCancelButton={true}
        onCancel={mockCancel}
        cancelButtonText="キャンセル"
      />
    );

    // キャンセルボタンを取得してクリック
    const cancelButton = screen.getAllByTestId("cancel-button")[0]; // 最初のボタンがキャンセルボタン
    fireEvent.click(cancelButton);

    // onCancelが呼ばれることを確認
    expect(mockCancel).toHaveBeenCalled();
  });
});
