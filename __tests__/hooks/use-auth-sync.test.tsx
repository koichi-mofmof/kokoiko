import { renderHook } from "@testing-library/react";
import { markAuthCallbackPending, useAuthSync } from "@/hooks/use-auth-sync";
import { trackAuthEventFromParam } from "@/lib/analytics/events";

jest.mock("@/lib/analytics/events", () => ({
  trackAuthEventFromParam: jest.fn(),
}));

// useRouter は jest.setup.js でモック済み（refresh は未定義なので補完する）
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

const mockTrack = trackAuthEventFromParam as jest.Mock;

describe("markAuthCallbackPending", () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  it("sessionStorage に待機フラグを立てる", () => {
    markAuthCallbackPending();
    expect(sessionStorage.getItem("auth_callback_pending")).toBe("true");
  });
});

describe("useAuthSync の GA イベント発火", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    // URL をリセット
    window.history.replaceState({}, "", "/");
    delete (window as any).gtag;
  });

  it("auth_event パラメータと gtag があればイベントを発火しパラメータを除去する", () => {
    jest.useFakeTimers();
    (window as any).gtag = jest.fn();
    window.history.replaceState({}, "", "/?auth_event=login_google");

    renderHook(() => useAuthSync());

    // fireWhenReady は同期的に実行され gtag があれば即発火
    expect(mockTrack).toHaveBeenCalledWith("login_google");
    expect(new URL(window.location.href).searchParams.has("auth_event")).toBe(
      false
    );
  });

  it("auth_event が無ければイベントを発火しない", () => {
    jest.useFakeTimers();
    (window as any).gtag = jest.fn();
    window.history.replaceState({}, "", "/");

    renderHook(() => useAuthSync());

    expect(mockTrack).not.toHaveBeenCalled();
  });
});
