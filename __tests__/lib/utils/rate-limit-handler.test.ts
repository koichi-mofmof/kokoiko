import {
  fetchWithRateLimit,
  isRateLimitError,
  getRetryDelay,
  fetchWithRateLimitServer,
} from "@/lib/utils/rate-limit-handler";

// fetchをモック
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe("fetchWithRateLimit", () => {
  it("通常の200レスポンスなら即時返す", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    const res = await fetchWithRateLimit("/api/test");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });

  it("429が返るとリトライし、最終的にレスポンスを返す", async () => {
    const retryResponse = new Response("rate limit", {
      status: 429,
      headers: { "Retry-After": "1" },
    });
    const okResponse = new Response("ok", { status: 200 });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(retryResponse)
      .mockResolvedValueOnce(okResponse);
    const res = await fetchWithRateLimit(
      "/api/test",
      {},
      { maxRetries: 1, baseDelay: 10 }
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });

  it("リトライ上限で429を返す", async () => {
    const retryResponse = new Response("rate limit", {
      status: 429,
      headers: { "Retry-After": "0" },
    });
    global.fetch = jest.fn().mockResolvedValue(retryResponse);
    const res = await fetchWithRateLimit(
      "/api/test",
      {},
      { maxRetries: 1, baseDelay: 1 }
    );
    expect(res.status).toBe(429);
    expect(isRateLimitError(res)).toBe(true);
  });

  it("Retry-Afterヘッダーが無い場合はデフォルト60秒", () => {
    const res = new Response("", { status: 429 });
    expect(getRetryDelay(res)).toBe(60);
  });
});

describe("fetchWithRateLimit (追加テスト)", () => {
  it("maxRetries分だけリトライしてから返す", async () => {
    const retryResponse = new Response("rate limit", {
      status: 429,
      headers: { "Retry-After": "0" },
    });
    const okResponse = new Response("ok", { status: 200 });
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(retryResponse)
      .mockResolvedValueOnce(retryResponse)
      .mockResolvedValueOnce(okResponse);
    global.fetch = fetchMock;
    const res = await fetchWithRateLimit(
      "/api/test",
      {},
      { maxRetries: 2, baseDelay: 1 }
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(res.status).toBe(200);
  });

  it("showToast: false でトーストが発火しない", async () => {
    // トースト関数をモック
    jest.resetModules();
    const toastSpy = jest.fn();
    jest.doMock("@/hooks/use-toast", () => ({ toast: toastSpy }));
    const { fetchWithRateLimit } = await import(
      "@/lib/utils/rate-limit-handler"
    );
    global.fetch = jest.fn().mockResolvedValue(
      new Response("rate limit", {
        status: 429,
        headers: { "Retry-After": "0" },
      })
    );
    await fetchWithRateLimit(
      "/api/test",
      {},
      { maxRetries: 0, showToast: false }
    );
    expect(toastSpy).not.toHaveBeenCalled();
    jest.dontMock("@/hooks/use-toast");
  });

  it("fetchWithRateLimitServerはトーストを発火しない", async () => {
    jest.resetModules();
    const toastSpy = jest.fn();
    jest.doMock("@/hooks/use-toast", () => ({ toast: toastSpy }));
    const { fetchWithRateLimitServer } = await import(
      "@/lib/utils/rate-limit-handler"
    );
    global.fetch = jest.fn().mockResolvedValue(
      new Response("rate limit", {
        status: 429,
        headers: { "Retry-After": "0" },
      })
    );
    await fetchWithRateLimitServer("/api/test", {}, { maxRetries: 0 });
    expect(toastSpy).not.toHaveBeenCalled();
    jest.dontMock("@/hooks/use-toast");
  });
});
