import {
  GUEST_PREVIEW_PLACE_LIMIT,
  getSharedListPreview,
} from "@/lib/actions/share-preview";

// service_role クライアントをモックする
const mockFrom = jest.fn();
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({ from: (table: string) => mockFrom(table) })),
}));

type TokenRow = {
  list_id: string;
  default_permission: string;
  is_active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number | null;
  list_name: string | null;
  owner_name: string | null;
  owner_id: string | null;
};

const validToken: TokenRow = {
  list_id: "list-1",
  default_permission: "edit",
  is_active: true,
  expires_at: null,
  max_uses: null,
  current_uses: 0,
  list_name: "八王子会お店リスト",
  owner_name: "aki k",
  owner_id: "owner-1",
};

/** list_share_tokens の single() と list_places の select を組み立てる */
function setupSupabase({
  token,
  tokenError = null,
  places = [] as Array<{ places: { id: string; name: string } | null }>,
  placeCount = 0,
}: {
  token: TokenRow | null;
  tokenError?: unknown;
  places?: Array<{ places: { id: string; name: string } | null }>;
  placeCount?: number;
}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === "list_share_tokens") {
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: token, error: tokenError }),
          }),
        }),
      };
    }
    if (table === "list_places") {
      // 地点と総数を1回の問い合わせで取得する
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({
                data: places,
                count: placeCount,
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    throw new Error(`unexpected table: ${table}`);
  });
}

describe("getSharedListPreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  });

  it("有効なトークンならリスト名・オーナー名・権限を返す", async () => {
    setupSupabase({ token: validToken, placeCount: 0 });

    const result = await getSharedListPreview("tok");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.listId).toBe("list-1");
    expect(result.listName).toBe("八王子会お店リスト");
    expect(result.ownerName).toBe("aki k");
    expect(result.permission).toBe("edit");
  });

  it("リストの地点を（未ログインでも）プレビューとして返す", async () => {
    setupSupabase({
      token: validToken,
      placeCount: 3,
      places: [
        { places: { id: "p1", name: "喫茶ネグラ" } },
        { places: { id: "p2", name: "八王子ラーメン" } },
        { places: { id: "p3", name: "夢庵" } },
      ],
    });

    const result = await getSharedListPreview("tok");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.placeCount).toBe(3);
    expect(result.places.map((p) => p.name)).toEqual([
      "喫茶ネグラ",
      "八王子ラーメン",
      "夢庵",
    ]);
  });

  it("プレビュー件数には上限がある（全件は見せない）", async () => {
    expect(GUEST_PREVIEW_PLACE_LIMIT).toBeGreaterThan(0);
    expect(GUEST_PREVIEW_PLACE_LIMIT).toBeLessThanOrEqual(10);
  });

  it("住所や座標は返さない（未ログインへの露出を最小化する）", async () => {
    setupSupabase({
      token: validToken,
      placeCount: 1,
      places: [{ places: { id: "p1", name: "喫茶ネグラ" } }],
    });

    const result = await getSharedListPreview("tok");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(Object.keys(result.places[0]).sort()).toEqual(["id", "name"]);
  });

  it("空トークンは失敗する", async () => {
    const result = await getSharedListPreview("");

    expect(result.success).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("存在しないトークンは失敗する", async () => {
    setupSupabase({ token: null, tokenError: { message: "not found" } });

    const result = await getSharedListPreview("tok");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.reasonKey).toBe("errors.common.notFound");
  });

  it("無効化されたトークンは失敗する", async () => {
    setupSupabase({ token: { ...validToken, is_active: false } });

    const result = await getSharedListPreview("tok");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.reasonKey).toBe("errors.common.forbidden");
  });

  it("期限切れトークンは失敗する", async () => {
    setupSupabase({
      token: { ...validToken, expires_at: "2000-01-01T00:00:00Z" },
    });

    const result = await getSharedListPreview("tok");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.reasonKey).toBe("errors.common.linkExpired");
  });

  it("利用上限に達したトークンは失敗する", async () => {
    setupSupabase({
      token: { ...validToken, max_uses: 3, current_uses: 3 },
    });

    const result = await getSharedListPreview("tok");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.reasonKey).toBe("errors.common.limitReached");
  });

  it("service_role キー未設定なら地点を漏らさず失敗する", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const result = await getSharedListPreview("tok");

    expect(result.success).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
