import { getActiveSubscription } from "../../../lib/dal/subscriptions";

jest.mock("@supabase/supabase-js", () => {
  return {
    createClient: () => ({
      from: () => {
        let _userId: string | undefined;
        return {
          select: function () {
            return this;
          },
          eq: function (col: string, val: string) {
            if (col === "user_id") this._userId = val;
            return this;
          },
          in: function () {
            return this;
          },
          single: async function () {
            if (this._userId === "test-user-id") {
              return {
                data: {
                  id: "sub_123",
                  user_id: "test-user-id",
                  stripe_customer_id: "cus_123",
                  stripe_subscription_id: "stripe_sub_123",
                  stripe_price_id: "price_abc",
                  status: "active",
                  current_period_start: "2024-01-01T00:00:00Z",
                  current_period_end: "2024-02-01T00:00:00Z",
                  cancel_at_period_end: false,
                  canceled_at: null,
                  trial_start: null,
                  trial_end: null,
                  created_at: "2024-01-01T00:00:00Z",
                  updated_at: "2024-01-01T00:00:00Z",
                },
                error: null,
              };
            } else {
              return { data: null, error: { code: "PGRST116" } };
            }
          },
          _userId,
        };
      },
    }),
  };
});

describe("getActiveSubscription", () => {
  it("指定ユーザーIDで有効な契約情報を正しく取得できること", async () => {
    const result = await getActiveSubscription("test-user-id");
    expect(result).toMatchObject({
      id: "sub_123",
      user_id: "test-user-id",
      status: "active",
    });
  });

  it("存在しないユーザーIDではnullを返すこと", async () => {
    const result = await getActiveSubscription("not-exist-id");
    expect(result).toBeNull();
  });
});
