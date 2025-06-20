import { renderHook, act, waitFor } from "@testing-library/react";
import { useOptimisticUpdates } from "@/hooks/use-optimistic-updates";

// React 18のuseOptimisticとuseTransitionをモック
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useOptimistic: jest.fn(),
  useTransition: jest.fn(),
}));

import { useOptimistic, useTransition } from "react";

describe("useOptimisticUpdates", () => {
  const mockAddOptimistic = jest.fn();
  const mockStartTransition = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useOptimistic as jest.Mock).mockReturnValue([
      {}, // optimisticState
      mockAddOptimistic,
    ]);

    (useTransition as jest.Mock).mockReturnValue([
      false, // isPending
      mockStartTransition,
    ]);

    // startTransitionをすぐに実行するようにモック
    mockStartTransition.mockImplementation((callback) => {
      if (typeof callback === "function") {
        return callback();
      }
    });
  });

  it("optimisticUpdateListが正常に動作すること", async () => {
    const { result } = renderHook(() => useOptimisticUpdates());

    const mockServerAction = jest.fn().mockResolvedValue({ success: true });
    const listId = "test-list-id";
    const updates = { name: "更新されたリスト名" };

    await act(async () => {
      result.current.optimisticUpdateList(listId, updates, mockServerAction);
    });

    // 楽観的更新が呼ばれることを確認
    expect(mockAddOptimistic).toHaveBeenCalledWith({
      type: "UPDATE_LIST",
      listId,
      updates,
    });

    // サーバーアクションが呼ばれることを確認
    expect(mockServerAction).toHaveBeenCalled();
  });

  it("optimisticAddPlaceが正常に動作すること", async () => {
    const { result } = renderHook(() => useOptimisticUpdates());

    const mockServerAction = jest.fn().mockResolvedValue({ success: true });
    const listId = "test-list-id";
    const place = { id: "place-1", name: "新しい場所" };

    await act(async () => {
      result.current.optimisticAddPlace(listId, place, mockServerAction);
    });

    expect(mockAddOptimistic).toHaveBeenCalledWith({
      type: "ADD_PLACE",
      listId,
      place,
    });

    expect(mockServerAction).toHaveBeenCalled();
  });

  it("optimisticDeletePlaceが正常に動作すること", async () => {
    const { result } = renderHook(() => useOptimisticUpdates());

    const mockServerAction = jest.fn().mockResolvedValue({ success: true });
    const listId = "test-list-id";
    const placeId = "place-to-delete";

    await act(async () => {
      result.current.optimisticDeletePlace(listId, placeId, mockServerAction);
    });

    expect(mockAddOptimistic).toHaveBeenCalledWith({
      type: "DELETE_PLACE",
      listId,
      placeId,
    });

    expect(mockServerAction).toHaveBeenCalled();
  });

  it("フック関数の呼び出しでstartTransitionが実行されること", () => {
    const { result } = renderHook(() => useOptimisticUpdates());

    const mockServerAction = jest.fn().mockResolvedValue({ success: true });
    const listId = "test-list-id";
    const updates = { name: "テスト更新" };

    act(() => {
      result.current.optimisticUpdateList(listId, updates, mockServerAction);
    });

    // startTransitionが呼ばれることを確認
    expect(mockStartTransition).toHaveBeenCalled();
  });

  it("フック関数が正しく提供されること", () => {
    const { result } = renderHook(() => useOptimisticUpdates());

    // 楽観的更新関数が正しく提供されることを確認
    expect(typeof result.current.optimisticUpdateList).toBe("function");
    expect(typeof result.current.optimisticAddPlace).toBe("function");
    expect(typeof result.current.optimisticDeletePlace).toBe("function");
    expect(typeof result.current.isPending).toBe("boolean");
    expect(typeof result.current.optimisticState).toBe("object");
  });

  it("isPendingの状態が正しく返されること", () => {
    (useTransition as jest.Mock).mockReturnValue([
      true, // isPending = true
      mockStartTransition,
    ]);

    const { result } = renderHook(() => useOptimisticUpdates());

    expect(result.current.isPending).toBe(true);
  });

  it("optimisticStateが正しく返されること", () => {
    const mockState = {
      "optimistic-list-test": {
        action: { type: "UPDATE_LIST", listId: "test", updates: {} },
        timestamp: Date.now(),
        pending: true,
      },
    };

    (useOptimistic as jest.Mock).mockReturnValue([
      mockState,
      mockAddOptimistic,
    ]);

    const { result } = renderHook(() => useOptimisticUpdates());

    expect(result.current.optimisticState).toBe(mockState);
  });
});
