import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { useSignupPrompt } from "@/hooks/use-signup-prompt";

// Supabaseクライアントのモック
const mockGetUser = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

// localStorage と sessionStorage のモック
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, "localStorage", { value: mockLocalStorage });
Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage });

describe("useSignupPrompt", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it("ログインユーザーには何も表示しない", async () => {
    // ログインユーザーをモック
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "test-user-id" } },
    });

    const { result } = renderHook(() => useSignupPrompt());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(true);
    });

    expect(result.current.shouldShowBanner).toBe(false);
  });

  it("非ログインユーザーにバナーを表示する", async () => {
    // 非ログインユーザーをモック
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
    });

    const { result } = renderHook(() => useSignupPrompt());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(false);
    });

    expect(result.current.shouldShowBanner).toBe(true);
  });

  it("セッション中にバナーが閉じられた場合は表示しない", async () => {
    // 非ログインユーザーをモック
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
    });

    // バナーが閉じられた状態をモック
    mockSessionStorage.getItem.mockReturnValue("true");

    const { result } = renderHook(() => useSignupPrompt());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(false);
    });

    expect(result.current.shouldShowBanner).toBe(false);
  });

  it("hideBanner関数でバナーを非表示にできる", async () => {
    // 非ログインユーザーをモック
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
    });

    const { result } = renderHook(() => useSignupPrompt());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(false);
    });

    expect(result.current.shouldShowBanner).toBe(true);

    // hideBanner を呼び出し
    act(() => {
      result.current.hideBanner();
    });

    expect(result.current.shouldShowBanner).toBe(false);
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      "clippy_banner_dismissed",
      "true"
    );
  });

  it("Supabase認証エラー時もエラーハンドリングされる", async () => {
    // Supabaseエラーをモック
    mockGetUser.mockRejectedValueOnce(new Error("認証エラー"));

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { result } = renderHook(() => useSignupPrompt());

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error initializing signup banner:",
        expect.any(Error)
      );
    });

    expect(result.current.isLoggedIn).toBe(null);
    expect(result.current.shouldShowBanner).toBe(false);

    consoleSpy.mockRestore();
  });
});
