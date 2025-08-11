"use server";

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import {
  PRICE_IDS_BY_CURRENCY,
  type SupportedCurrency,
  type BillingInterval,
} from "@/lib/constants/config/subscription";

// 型定義
interface CreateCheckoutSessionParams {
  userId: string;
  priceId: string;
  returnUrl: string;
  locale?: "ja" | "en";
  currency?: "JPY" | "USD" | "EUR";
}

// CloudFlare Workers環境でStripeクライアントを初期化
function createStripeClient(): Stripe {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-05-28.basil",
    // CloudFlare Workers環境では必須：fetch APIを使用
    httpClient: Stripe.createFetchHttpClient(),
  });
  return stripe;
}

export async function createCheckoutSession({
  userId,
  priceId,
  returnUrl,
  locale,
  currency,
}: CreateCheckoutSessionParams): Promise<
  { url: string } | { errorKey: string; error?: string }
> {
  // Supabase Admin Client（service_role_key使用）
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // CloudFlare Workers対応のStripe Client
  const stripe = createStripeClient();

  try {
    // Supabase Authからユーザー情報を取得
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      return { errorKey: "errors.stripe.userEmailNotFound" };
    }
    const userEmail = userData.user.email;

    // 1. ユーザーのstripe_customer_idと過去のトライアル利用履歴を取得
    let { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, trial_start")
      .eq("user_id", userId)
      .single();

    // レコードがなければinsertして再取得
    if (subError && subError.code === "PGRST116") {
      // Not found
      const { error: insertError } = await supabase
        .from("subscriptions")
        .insert({ user_id: userId });
      if (insertError) return { errorKey: "errors.stripe.dbInitFailed" };
      // 再取得
      ({ data: sub, error: subError } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id, trial_start")
        .eq("user_id", userId)
        .single());
    }
    if (subError) return { errorKey: "errors.stripe.dbFetchFailed" };

    let stripeCustomerId = sub?.stripe_customer_id;
    const alreadyTrialed = !!sub?.trial_start;

    // 2. 顧客IDがなければStripeで新規作成し、DBに保存
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { user_id: userId },
      });
      stripeCustomerId = customer.id;
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("user_id", userId);
      if (updateError) return { errorKey: "errors.stripe.dbUpdateFailed" };
    } else {
      // 既存Customerが存在するかどうか確認し、emailが異なる場合は同期
      try {
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        if (
          customer &&
          typeof customer === "object" &&
          "email" in customer &&
          customer.email !== userEmail
        ) {
          await stripe.customers.update(stripeCustomerId, { email: userEmail });
        }
      } catch (stripeError: unknown) {
        // カスタマーが存在しない場合（例：削除済み）は新規作成
        if (
          stripeError instanceof Stripe.errors.StripeInvalidRequestError &&
          stripeError.message.includes("No such customer")
        ) {
          console.log(
            `Customer ${stripeCustomerId} does not exist, creating new customer for user ${userId}`
          );

          const customer = await stripe.customers.create({
            email: userEmail,
            metadata: { user_id: userId },
          });
          stripeCustomerId = customer.id;

          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({ stripe_customer_id: stripeCustomerId })
            .eq("user_id", userId);
          if (updateError)
            throw new Error("DB更新エラー: " + updateError.message);
        } else {
          return { errorKey: "errors.stripe.unknown" };
        }
      }
    }

    // 3. カスタマー既存サブスクの通貨に合わせてPriceを強制（混在通貨エラー回避）
    function resolveIntervalFromPriceId(id: string): BillingInterval | null {
      for (const ccy of Object.keys(
        PRICE_IDS_BY_CURRENCY
      ) as SupportedCurrency[]) {
        const ids = PRICE_IDS_BY_CURRENCY[ccy];
        if (ids.monthly && ids.monthly === id) return "monthly";
        if (ids.yearly && ids.yearly === id) return "yearly";
      }
      return null;
    }

    function resolveCurrencyFromPriceId(id: string): SupportedCurrency | null {
      for (const ccy of Object.keys(
        PRICE_IDS_BY_CURRENCY
      ) as SupportedCurrency[]) {
        const ids = PRICE_IDS_BY_CURRENCY[ccy];
        if (ids.monthly === id || ids.yearly === id) return ccy;
      }
      return null;
    }

    let effectivePriceId = priceId;
    const requestedInterval = resolveIntervalFromPriceId(priceId);
    const requestedCurrency = resolveCurrencyFromPriceId(priceId);

    if (stripeCustomerId) {
      const existing = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "all",
        limit: 1,
      });
      const firstItem = existing.data?.[0]?.items?.data?.[0];
      const existingCurrencyRaw = firstItem?.price?.currency;
      if (existingCurrencyRaw && requestedInterval) {
        const existingCurrency =
          existingCurrencyRaw.toUpperCase() as SupportedCurrency;
        // 既存通貨と異なる通貨のPriceが指定された場合は、同一intervalの既存通貨Priceに強制
        if (requestedCurrency && existingCurrency !== requestedCurrency) {
          const mapped =
            PRICE_IDS_BY_CURRENCY[existingCurrency]?.[requestedInterval];
          if (mapped) {
            effectivePriceId = mapped;
          } else {
            return { errorKey: "errors.stripe.currencyConflict" };
          }
        }
      }
    }

    // 4. Checkout Session作成
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: stripeCustomerId,
      line_items: [
        {
          price: effectivePriceId,
          quantity: 1,
        },
      ],
      success_url: returnUrl,
      cancel_url: returnUrl,
      locale: (locale?.startsWith("en")
        ? "en"
        : "ja") as Stripe.Checkout.SessionCreateParams.Locale,
      subscription_data: {
        metadata: { user_id: userId },
        ...(alreadyTrialed ? {} : { trial_period_days: 14 }),
      },
      metadata: { user_id: userId, currency: currency || "" },
      allow_promotion_codes: true,
    });

    return { url: session.url! };
  } catch (err: unknown) {
    console.error("createCheckoutSession failed", err);
    return { errorKey: "errors.stripe.checkoutSessionFailed" };
  }
}

export async function createCustomerPortalSession(
  userId: string
): Promise<{ url: string } | { errorKey: string; error?: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      return { errorKey: "errors.stripe.customerIdNotFound" };
    }

    const stripe = createStripeClient();

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`;

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: returnUrl,
      });

      if (!portalSession.url) {
        return { errorKey: "errors.stripe.portalUrlMissing" };
      }

      return { url: portalSession.url };
    } catch (stripeError: unknown) {
      // カスタマーが存在しない場合の特別な処理
      if (
        stripeError instanceof Stripe.errors.StripeInvalidRequestError &&
        stripeError.message.includes("No such customer")
      ) {
        return { errorKey: "errors.stripe.accountIssue" };
      }
      return { errorKey: "errors.stripe.unknown" };
    }
  } catch (err: unknown) {
    console.error(`[Error] createCustomerPortalSession:`, err);
    return { errorKey: "errors.stripe.portalSessionFailed" };
  }
}
