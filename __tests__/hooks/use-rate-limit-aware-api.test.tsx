import { renderHook, act } from "@testing-library/react";
import { useRateLimitAwareApi } from "@/hooks/use-rate-limit-aware-api";

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe("useRateLimitAwareApi", () => {
  it("正常時はdataに値が入り、loadingとerrorが正しく遷移", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ foo: "bar" }), { status: 200 })
      );
    const { result } = renderHook(() =>
      useRateLimitAwareApi<{ foo: string }>()
    );
    await act(async () => {
      await result.current.execute(async () => {
        const res = await fetch("/api/test");
        return res.json();
      });
    });
    expect(result.current.data).toEqual({ foo: "bar" });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("エラー時はerrorにメッセージが入る", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response("fail", { status: 500 }));
    const { result } = renderHook(() => useRateLimitAwareApi());
    await act(async () => {
      await expect(
        result.current.execute(async () => {
          const res = await fetch("/api/test");
          if (!res.ok) throw new Error("サーバーエラー");
          return res.json();
        })
      ).rejects.toThrow("サーバーエラー");
    });
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toContain("サーバーエラー");
  });
});

describe("useRateLimitAwareApi (追加テスト)", () => {
  it("resetで状態が初期化される", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ foo: "bar" }), { status: 200 })
      );
    const { result } = renderHook(() =>
      useRateLimitAwareApi<{ foo: string }>()
    );
    await act(async () => {
      await result.current.execute(async () => {
        const res = await fetch("/api/test");
        return res.json();
      });
    });
    expect(result.current.data).not.toBeNull();
    act(() => {
      result.current.reset();
    });
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("複数回連続実行で状態が正しく遷移", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ foo: 1 }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ foo: 2 }), { status: 200 })
      );
    const { result } = renderHook(() =>
      useRateLimitAwareApi<{ foo: number }>()
    );
    await act(async () => {
      await result.current.execute(async () =>
        (await fetch("/api/test")).json()
      );
    });
    expect(result.current.data?.foo).toBe(1);
    await act(async () => {
      await result.current.execute(async () =>
        (await fetch("/api/test")).json()
      );
    });
    expect(result.current.data?.foo).toBe(2);
  });

  it("エラー→リカバリのシナリオ", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response("fail", { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ foo: "ok" }), { status: 200 })
      );
    const { result } = renderHook(() =>
      useRateLimitAwareApi<{ foo: string }>()
    );
    await act(async () => {
      await expect(
        result.current.execute(async () => {
          const res = await fetch("/api/test");
          if (!res.ok) throw new Error("サーバーエラー");
          return res.json();
        })
      ).rejects.toThrow("サーバーエラー");
    });
    expect(result.current.error).toContain("サーバーエラー");
    await act(async () => {
      await result.current.execute(async () =>
        (await fetch("/api/test")).json()
      );
    });
    expect(result.current.data?.foo).toBe("ok");
    expect(result.current.error).toBeNull();
  });
});
