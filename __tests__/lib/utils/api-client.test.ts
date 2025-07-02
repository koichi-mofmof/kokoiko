import { apiClient, ApiError } from "@/lib/utils/api-client";

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe("apiClient", () => {
  it("GET: 正常レスポンスでデータを返す", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ foo: "bar" }), { status: 200 })
      );
    const data = await apiClient.get<{ foo: string }>("/api/test");
    expect(data.foo).toBe("bar");
  });

  it("POST: エラー時はApiErrorをthrow", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response("fail", { status: 400 }));
    await expect(apiClient.post("/api/test", { a: 1 })).rejects.toThrow(
      ApiError
    );
  });

  it("DELETE: 空レスポンスはundefinedを返す", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 200 }));
    const data = await apiClient.delete("/api/test");
    expect(data).toBeUndefined();
  });
});

describe("apiClient (追加テスト)", () => {
  it("PUT: 正常レスポンスでデータを返す", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ updated: true }), { status: 200 })
      );
    const data = await apiClient.put<{ updated: boolean }>("/api/test", {
      foo: "bar",
    });
    expect(data.updated).toBe(true);
  });

  it("PUT: エラー時はApiErrorをthrow", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response("fail", { status: 500 }));
    await expect(apiClient.put("/api/test", { foo: "bar" })).rejects.toThrow(
      ApiError
    );
  });

  it("型安全性: get/post/put/deleteで型が伝播する", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ a: 1 }), { status: 200 })
      );
    const getData = await apiClient.get<{ a: number }>("/api/test");
    expect(typeof getData.a).toBe("number");

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ a: 1 }), { status: 200 })
      );
    const postData = await apiClient.post<{ a: number }>("/api/test", { a: 1 });
    expect(typeof postData.a).toBe("number");

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ a: 1 }), { status: 200 })
      );
    const putData = await apiClient.put<{ a: number }>("/api/test", { a: 1 });
    expect(typeof putData.a).toBe("number");

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 200 }));
    const delData = await apiClient.delete<void>("/api/test");
    expect(delData).toBeUndefined();
  });
});
