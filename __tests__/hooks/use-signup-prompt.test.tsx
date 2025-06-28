import { renderHook, act, waitFor } from "@testing-library/react";
import { useSignupPrompt } from "@/hooks/use-signup-prompt";

// Supabase client のモック
const mockGetUser = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

// Window オブジェクトのモック
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

describe("useSignupPrompt", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // localStorage と sessionStorage のモック
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });

    Object.defineProperty(window, "sessionStorage", {
      value: mockSessionStorage,
      writable: true,
    });

    // crypto.randomUUID のモック
    Object.defineProperty(window, "crypto", {
      value: {
        randomUUID: () => "mock-uuid-12345",
      },
      writable: true,
    });

    // Document のモック
    Object.defineProperty(document, "addEventListener", {
      value: jest.fn(),
      writable: true,
    });

    Object.defineProperty(document, "removeEventListener", {
      value: jest.fn(),
      writable: true,
    });

    Object.defineProperty(document, "hidden", {
      value: false,
      writable: true,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("ログインユーザーにはポップアップを表示しない", async () => {
    // ログインユーザーをモック
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const { result } = renderHook(() => useSignupPrompt());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(true);
    });

    expect(result.current.shouldShow).toBe(false);
  });

  it("非ログインユーザーに10秒後にポップアップを表示する", async () => {
    // 非ログインユーザーをモック
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
    });

    // localStorage と sessionStorage の初期状態
    mockLocalStorage.getItem.mockReturnValue(null);
    mockSessionStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useSignupPrompt());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(false);
    });

    // 最初は表示されない
    expect(result.current.shouldShow).toBe(false);

    // 10秒経過
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(result.current.shouldShow).toBe(true);
  });

  it("セッション内で既に表示済みの場合は表示しない", async () => {
    // 非ログインユーザーをモック
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
    });

    // 既に表示済みのセッション
    mockSessionStorage.getItem.mockReturnValue("session-123");
    mockLocalStorage.getItem.mockReturnValue("session-123");

    const { result } = renderHook(() => useSignupPrompt());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(false);
    });

    // 10秒経過しても表示されない
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(result.current.shouldShow).toBe(false);
  });

  it("24時間以内に表示済みの場合は表示しない", async () => {
    // 非ログインユーザーをモック
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
    });

    // 1時間前に表示済み
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === "clippy_signup_prompt_dismissed") {
        return oneHourAgo;
      }
      return null;
    });
    mockSessionStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useSignupPrompt());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(false);
    });

    // 10秒経過しても表示されない
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(result.current.shouldShow).toBe(false);
  });

  it("hidePrompt関数でポップアップを非表示にできる", async () => {
    // 非ログインユーザーをモック
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
    });

    mockLocalStorage.getItem.mockReturnValue(null);
    mockSessionStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useSignupPrompt());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(false);
    });

    // 10秒経過でポップアップ表示
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(result.current.shouldShow).toBe(true);

    // hidePrompt を呼び出し
    act(() => {
      result.current.hidePrompt();
    });

    expect(result.current.shouldShow).toBe(false);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "clippy_signup_prompt_shown",
      "mock-uuid-12345"
    );
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "clippy_signup_prompt_dismissed",
      expect.any(String)
    );
  });
});
