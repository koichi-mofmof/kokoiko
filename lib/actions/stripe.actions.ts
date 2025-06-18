"use server";

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// 型定義
interface CreateCheckoutSessionParams {
  userId: string;
  priceId: string;
  returnUrl: string;
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
}: CreateCheckoutSessionParams): Promise<{ url: string } | { error: string }> {
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
      throw new Error(
        "ユーザーのメールアドレス取得エラー: " +
          (userError?.message || "email not found")
      );
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
      if (insertError)
        throw new Error("DB初期レコード作成エラー: " + insertError.message);
      // 再取得
      ({ data: sub, error: subError } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id, trial_start")
        .eq("user_id", userId)
        .single());
    }
    if (subError) throw new Error("DB取得エラー: " + subError.message);

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
      if (updateError) throw new Error("DB更新エラー: " + updateError.message);
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
          // その他のStripeエラーは再スロー
          throw stripeError;
        }
      }
    }

    // 3. Checkout Session作成
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: returnUrl,
      cancel_url: returnUrl,
      subscription_data: {
        metadata: { user_id: userId },
        ...(alreadyTrialed ? {} : { trial_period_days: 14 }),
      },
      metadata: { user_id: userId },
      allow_promotion_codes: true,
    });

    return { url: session.url! };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Checkoutセッション作成エラー";
    console.error(message);
    return { error: message };
  }
}

export async function createCustomerPortalSession(
  userId: string
): Promise<{ url: string } | { error: string }> {
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
      throw new Error(
        `Stripe顧客IDが見つかりません。 (user: ${userId}, error: ${subError?.message})`
      );
    }

    const stripe = createStripeClient();

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`;

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: returnUrl,
      });

      if (!portalSession.url) {
        throw new Error(
          "カスタマーポータルセッションのURLが取得できませんでした。"
        );
      }

      return { url: portalSession.url };
    } catch (stripeError: unknown) {
      // カスタマーが存在しない場合の特別な処理
      if (
        stripeError instanceof Stripe.errors.StripeInvalidRequestError &&
        stripeError.message.includes("No such customer")
      ) {
        throw new Error(
          "お客様のアカウント情報に問題があります。サポートまでお問い合わせください。"
        );
      }
      throw stripeError;
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Portalセッション作成エラー";
    console.error(`[Error] createCustomerPortalSession: ${message}`);
    return { error: message };
  }
}

/**
 * 無効なStripeカスタマーIDをクリーンアップする関数
 * @param userId Supabase AuthのユーザーID
 */
export async function cleanupInvalidCustomer(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const stripe = createStripeClient();

  try {
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      return {
        success: false,
        message: "サブスクリプション情報が見つかりませんでした。",
      };
    }

    // Stripeカスタマーの存在確認
    try {
      await stripe.customers.retrieve(subscription.stripe_customer_id);
      return {
        success: true,
        message: "カスタマーIDは有効です。",
      };
    } catch (stripeError: unknown) {
      if (
        stripeError instanceof Stripe.errors.StripeInvalidRequestError &&
        stripeError.message.includes("No such customer")
      ) {
        // 無効なカスタマーIDをクリア
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            stripe_customer_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateError) {
          return {
            success: false,
            message: "データベースの更新に失敗しました。",
          };
        }

        return {
          success: true,
          message: "無効なカスタマーIDをクリーンアップしました。",
        };
      }
      throw stripeError;
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "予期しないエラーが発生しました。";
    console.error(`[Error] cleanupInvalidCustomer: ${message}`);
    return {
      success: false,
      message,
    };
  }
}
