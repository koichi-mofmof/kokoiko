/**
 * auth.ts のセキュリティ・ゲート（CSRF / 再認証 / 認可）を中心に検証する。
 * 既存の auth.test.js は zod 全体をモックしているため、こちらは実バリデータを使う別ファイルとする。
 */
import {
  checkUserSubscriptionStatus,
  loginWithCredentials,
  loginWithGoogle,
  updateUserPassword,
} from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getCSRFTokenServer,
  verifyCSRFTokenServer,
} from "@/lib/utils/csrf-server";
import { recordCSRFViolation } from "@/lib/utils/security-monitor";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/utils/csrf-server", () => ({
  getCSRFTokenServer: jest.fn(),
  verifyCSRFTokenServer: jest.fn(),
}));
jest.mock("@/lib/utils/security-monitor", () => ({
  recordCSRFViolation: jest.fn(),
}));
jest.mock("@/lib/actions/lists", () => ({ bookmarkList: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("next/headers", () => ({
  headers: jest.fn(async () => ({
    get: (k: string) =>
      k === "x-forwarded-for" ? "127.0.0.1" : k === "user-agent" ? "ua" : null,
  })),
  cookies: jest.fn(async () => ({ get: () => undefined })),
}));

const mockCreateClient = createClient as jest.Mock;
const mockVerifyCSRF = verifyCSRFTokenServer as jest.Mock;
const mockGetCSRF = getCSRFTokenServer as jest.Mock;
const mockRecordCSRF = recordCSRFViolation as jest.Mock;

const initialState = { message: null, errors: {}, success: false };

function formDataOf(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

/** subscriptions テーブルの await 結果を返す thenable ビルダー */
function subscriptionsBuilder(result: { data: any; error: any }) {
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    order: jest.fn(() => builder),
    then: (resolve: (v: any) => any) => resolve(result),
  };
  return builder;
}

describe("loginWithCredentials: CSRF ゲート", () => {
  beforeEach(() => jest.clearAllMocks());

  it("CSRF 検証に失敗したら違反を記録しエラーを返す", async () => {
    mockVerifyCSRF.mockResolvedValue(false);
    mockGetCSRF.mockResolvedValue(null);
    mockCreateClient.mockResolvedValue({ auth: {} });

    const result = await loginWithCredentials(
      initialState as any,
      formDataOf({ csrf_token: "bad", email: "a@example.com" })
    );

    expect(result.success).toBe(false);
    expect(result.messageKey).toBe("errors.request.invalid");
    expect(mockRecordCSRF).toHaveBeenCalledWith(
      "127.0.0.1",
      "ua",
      expect.objectContaining({ endpoint: "/login", csrfTokenPresent: true })
    );
  });

  it("フォームに CSRF が無い場合は Cookie から補完を試みる", async () => {
    mockVerifyCSRF.mockResolvedValue(false);
    mockGetCSRF.mockResolvedValue(null);
    mockCreateClient.mockResolvedValue({ auth: {} });

    const result = await loginWithCredentials(
      initialState as any,
      formDataOf({ email: "a@example.com" })
    );

    expect(mockGetCSRF).toHaveBeenCalled();
    expect(result.messageKey).toBe("errors.request.invalid");
    // csrf がまったく無いので csrfTokenPresent は false
    expect(mockRecordCSRF).toHaveBeenCalledWith(
      "127.0.0.1",
      "ua",
      expect.objectContaining({ csrfTokenPresent: false })
    );
  });
});

describe("updateUserPassword: 再認証ゲート", () => {
  beforeEach(() => jest.clearAllMocks());

  const setUser = (user: any, signInError: any = null, updateError: any = null) =>
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user },
          error: user ? null : { message: "no" },
        }),
        signInWithPassword: jest
          .fn()
          .mockResolvedValue({ error: signInError }),
        updateUser: jest.fn().mockResolvedValue({ error: updateError }),
      },
    });

  it("未認証なら unauthorized", async () => {
    setUser(null);
    const result = await updateUserPassword(
      undefined,
      formDataOf({ currentPassword: "x", newPassword: "Abcdef1!" })
    );
    expect(result.success).toBe(false);
    expect(result.messageKey).toBe("errors.common.unauthorized");
  });

  it("現在のパスワードが誤っていれば currentIncorrect", async () => {
    setUser({ id: "u1", email: "a@example.com" }, { message: "bad" });
    const result = await updateUserPassword(
      undefined,
      formDataOf({ currentPassword: "wrong", newPassword: "Abcdef1!" })
    );
    expect(result.messageKey).toBe("auth.password.currentIncorrect");
  });

  it("新パスワードが要件を満たさなければ checkInput", async () => {
    setUser({ id: "u1", email: "a@example.com" });
    const result = await updateUserPassword(
      undefined,
      formDataOf({ currentPassword: "ok", newPassword: "weak" })
    );
    expect(result.messageKey).toBe("errors.validation.checkInput");
  });

  it("正常な変更は success を返す", async () => {
    setUser({ id: "u1", email: "a@example.com" });
    const result = await updateUserPassword(
      undefined,
      formDataOf({ currentPassword: "ok", newPassword: "Abcdef1!" })
    );
    expect(result.success).toBe(true);
    expect(result.messageKey).toBe("auth.password.updateSuccess");
  });

  it("Supabase 更新エラー（汎用）は updateFailed を返す", async () => {
    setUser({ id: "u1", email: "a@example.com" }, null, {
      message: "Unexpected server error",
    });
    const result = await updateUserPassword(
      undefined,
      formDataOf({ currentPassword: "ok", newPassword: "Abcdef1!" })
    );
    expect(result.success).toBe(false);
    expect(result.messageKey).toBe("auth.password.updateFailed");
  });

  it("新旧同一パスワードのエラーは newMustDiffer を返す", async () => {
    setUser({ id: "u1", email: "a@example.com" }, null, {
      message: "same as the old password",
    });
    const result = await updateUserPassword(
      undefined,
      formDataOf({ currentPassword: "ok", newPassword: "Abcdef1!" })
    );
    expect(result.success).toBe(false);
    expect(result.messageKey).toBe("validation.auth.password.newMustDiffer");
  });
});

describe("checkUserSubscriptionStatus: 認可ゲート", () => {
  beforeEach(() => jest.clearAllMocks());

  it("未認証なら unauthorized", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: null }, error: { message: "no" } }),
      },
    });
    const result = await checkUserSubscriptionStatus();
    expect(result.hasActiveSubscription).toBe(false);
    expect(result.messageKey).toBe("errors.common.unauthorized");
  });

  it("active なサブスクがあれば activeBlocking を返す", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: "u1" } }, error: null }),
      },
      from: jest.fn(() =>
        subscriptionsBuilder({
          data: [
            {
              status: "active",
              cancel_at_period_end: false,
              price_id: "price_1",
            },
          ],
          error: null,
        })
      ),
    });

    const result = await checkUserSubscriptionStatus();
    expect(result.hasActiveSubscription).toBe(true);
    expect(result.subscriptionStatus).toBe("active");
    expect(result.messageKey).toBe("subscription.activeBlocking");
  });

  it("すべてキャンセル済みなら allCanceled", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: "u1" } }, error: null }),
      },
      from: jest.fn(() =>
        subscriptionsBuilder({
          data: [{ status: "active", cancel_at_period_end: true }],
          error: null,
        })
      ),
    });

    const result = await checkUserSubscriptionStatus();
    expect(result.hasActiveSubscription).toBe(false);
    expect(result.messageKey).toBe("subscription.allCanceled");
  });

  it("サブスクが無ければ noneActive", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: "u1" } }, error: null }),
      },
      from: jest.fn(() => subscriptionsBuilder({ data: [], error: null })),
    });

    const result = await checkUserSubscriptionStatus();
    expect(result.hasActiveSubscription).toBe(false);
    expect(result.messageKey).toBe("subscription.noneActive");
  });
});

describe("loginWithGoogle", () => {
  beforeEach(() => jest.clearAllMocks());

  it("成功時は googleUrl を返す", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        signInWithOAuth: jest.fn().mockResolvedValue({
          data: { url: "https://accounts.google.com/o/oauth2" },
          error: null,
        }),
      },
    });

    const result = await loginWithGoogle("/lists");
    expect(result.success).toBe(true);
    expect(result.googleUrl).toBe("https://accounts.google.com/o/oauth2");
  });

  it("エラー時は startFailed を返す", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        signInWithOAuth: jest
          .fn()
          .mockResolvedValue({ data: {}, error: { message: "oauth down" } }),
      },
    });

    const result = await loginWithGoogle();
    expect(result.success).toBe(false);
    expect(result.messageKey).toBe("auth.google.startFailed");
  });
});
