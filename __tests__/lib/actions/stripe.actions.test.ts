import {
  createCheckoutSession,
  createCustomerPortalSession,
} from "@/lib/actions/stripe.actions";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// ---- Stripe モック ----
// jest.mock はホイストされるため、インスタンスとエラークラスは mock 接頭辞 or factory 内で定義する
const mockStripeInstance = {
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
  },
  subscriptions: { list: jest.fn() },
  checkout: { sessions: { create: jest.fn() } },
  billingPortal: { sessions: { create: jest.fn() } },
};

jest.mock("stripe", () => {
  class StripeInvalidRequestError extends Error {}
  const StripeMock: any = jest
    .fn()
    .mockImplementation(() => mockStripeInstance);
  StripeMock.createFetchHttpClient = jest.fn();
  StripeMock.errors = { StripeInvalidRequestError };
  return { __esModule: true, default: StripeMock };
});

const stripeInstance = mockStripeInstance;
// モック化された Stripe のエラークラス（顧客不在エラーの判定に使用）
const StripeInvalidRequestError = (Stripe as any).errors
  .StripeInvalidRequestError as new (msg: string) => Error;

// ---- Supabase Admin クライアントモック ----
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.Mock;

/**
 * subscriptions テーブル中心の Supabase モックを生成する。
 */
function makeSupabase(opts: {
  getUserResult?: any;
  selectResult?: { data: any; error: any };
  insertError?: any;
  updateError?: any;
}) {
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    single: jest.fn(() =>
      Promise.resolve(opts.selectResult ?? { data: null, error: null })
    ),
    insert: jest.fn(() =>
      Promise.resolve({ error: opts.insertError ?? null })
    ),
    update: jest.fn(() => builder),
  };
  // update().eq() を await する経路用に then を生やす
  builder.then = (resolve: (v: any) => any) =>
    resolve({ error: opts.updateError ?? null });

  return {
    auth: {
      admin: {
        getUserById: jest.fn(() =>
          Promise.resolve(
            opts.getUserResult ?? {
              data: { user: { email: "user@example.com" } },
              error: null,
            }
          )
        ),
      },
    },
    from: jest.fn(() => builder),
  };
}

describe("createCustomerPortalSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
  });

  it("stripe_customer_id が無ければ customerIdNotFound を返す", async () => {
    mockCreateClient.mockReturnValue(
      makeSupabase({ selectResult: { data: null, error: { message: "x" } } })
    );

    const result = await createCustomerPortalSession("user-1");

    expect(result).toEqual({ errorKey: "errors.stripe.customerIdNotFound" });
  });

  it("ポータルセッションの URL を返す", async () => {
    mockCreateClient.mockReturnValue(
      makeSupabase({
        selectResult: { data: { stripe_customer_id: "cus_1" }, error: null },
      })
    );
    stripeInstance.billingPortal.sessions.create.mockResolvedValue({
      url: "https://portal.stripe.com/s",
    });

    const result = await createCustomerPortalSession("user-1", "ja");

    expect(result).toEqual({ url: "https://portal.stripe.com/s" });
    expect(stripeInstance.billingPortal.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_1", locale: "ja" })
    );
  });

  it("Stripe に顧客が存在しない場合は accountIssue を返す", async () => {
    mockCreateClient.mockReturnValue(
      makeSupabase({
        selectResult: { data: { stripe_customer_id: "cus_x" }, error: null },
      })
    );
    stripeInstance.billingPortal.sessions.create.mockRejectedValue(
      new StripeInvalidRequestError("No such customer: cus_x")
    );

    const result = await createCustomerPortalSession("user-1");

    expect(result).toEqual({ errorKey: "errors.stripe.accountIssue" });
  });
});

describe("createCheckoutSession", () => {
  const baseParams = {
    userId: "user-1",
    priceId: "price_unknown",
    returnUrl: "https://app.example.com/return",
    locale: "ja",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ユーザーのメールが取得できなければ userEmailNotFound を返す", async () => {
    mockCreateClient.mockReturnValue(
      makeSupabase({
        getUserResult: { data: { user: null }, error: { message: "no user" } },
      })
    );

    const result = await createCheckoutSession(baseParams);

    expect(result).toEqual({ errorKey: "errors.stripe.userEmailNotFound" });
  });

  it("既存顧客でチェックアウト URL を返す", async () => {
    mockCreateClient.mockReturnValue(
      makeSupabase({
        selectResult: {
          data: { stripe_customer_id: "cus_1", trial_start: null },
          error: null,
        },
      })
    );
    stripeInstance.customers.retrieve.mockResolvedValue({
      id: "cus_1",
      email: "user@example.com",
    });
    stripeInstance.subscriptions.list.mockResolvedValue({ data: [] });
    stripeInstance.checkout.sessions.create.mockResolvedValue({
      url: "https://checkout.stripe.com/s",
    });

    const result = await createCheckoutSession(baseParams);

    expect(result).toEqual({ url: "https://checkout.stripe.com/s" });
    // トライアルは廃止したため trial_period_days は付与されない（即時課金）
    expect(stripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_1",
        mode: "subscription",
        subscription_data: expect.not.objectContaining({
          trial_period_days: expect.anything(),
        }),
      })
    );
  });

  it("顧客IDが無ければ Stripe 顧客を新規作成する", async () => {
    mockCreateClient.mockReturnValue(
      makeSupabase({
        selectResult: {
          data: { stripe_customer_id: null, trial_start: "2024-01-01" },
          error: null,
        },
      })
    );
    stripeInstance.customers.create.mockResolvedValue({ id: "cus_new" });
    stripeInstance.subscriptions.list.mockResolvedValue({ data: [] });
    stripeInstance.checkout.sessions.create.mockResolvedValue({
      url: "https://checkout.stripe.com/new",
    });

    const result = await createCheckoutSession(baseParams);

    expect(stripeInstance.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "user@example.com" })
    );
    expect(result).toEqual({ url: "https://checkout.stripe.com/new" });
    // 過去トライアル済みのため trial_period_days は付与されない
    expect(stripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_data: expect.not.objectContaining({
          trial_period_days: expect.anything(),
        }),
      })
    );
  });

  it("Stripe 呼び出しが失敗したら checkoutSessionFailed を返す", async () => {
    mockCreateClient.mockReturnValue(
      makeSupabase({
        selectResult: {
          data: { stripe_customer_id: "cus_1", trial_start: null },
          error: null,
        },
      })
    );
    stripeInstance.customers.retrieve.mockResolvedValue({
      id: "cus_1",
      email: "user@example.com",
    });
    stripeInstance.subscriptions.list.mockResolvedValue({ data: [] });
    stripeInstance.checkout.sessions.create.mockRejectedValue(
      new Error("stripe down")
    );

    const result = await createCheckoutSession(baseParams);

    expect(result).toEqual({ errorKey: "errors.stripe.checkoutSessionFailed" });
  });
});
