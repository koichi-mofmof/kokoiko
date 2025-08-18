import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
  // CloudFlare Workers環境では必須：fetch APIを使用
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET!;

// Security: Explicitly reject non-POST methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      console.error(`[${requestId}] Missing Stripe signature header`);
      return NextResponse.json(
        { error: "Missing signature header" },
        { status: 400 }
      );
    }

    const buf = await req.arrayBuffer();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        Buffer.from(buf),
        sig,
        endpointSecret
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(
        `[${requestId}] Webhook signature verification failed: ${errorMessage}`
      );
      return NextResponse.json(
        { error: `Webhook Error: ${errorMessage}` },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Processing webhook event: ${event.type}`);

    // イベントごとの処理分岐
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.user_id as string;
        const purchaseType = session.metadata?.type;

        console.log(`[${requestId}] Checkout session completed`, {
          sessionId: session.id,
          userId: !!userId,
          subscriptionId: !!subscriptionId,
          purchaseType,
          paymentStatus: session.payment_status,
        });

        // 買い切りプランの場合はpayment_intent.succeededで処理するためスキップ
        if (purchaseType === "one_time_purchase") {
          console.log(
            `[${requestId}] One-time purchase checkout completed, waiting for payment_intent.succeeded event`
          );
          break;
        }

        // サブスクリプションの場合の処理
        if (!userId || !subscriptionId) {
          console.error(
            `[${requestId}] Missing user_id or subscriptionId in session.metadata for subscription`,
            {
              userId: !!userId,
              subscriptionId: !!subscriptionId,
              sessionId: session.id,
              purchaseType,
            }
          );
          break;
        }

        try {
          // サブスクリプション詳細を取得
          const subscription = (await stripe.subscriptions.retrieve(
            subscriptionId
          )) as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const priceId = subscription.items.data[0]?.price.id;
          const status = subscription.status;
          const trialStart = subscription.trial_start
            ? new Date(subscription.trial_start * 1000)
            : null;
          const trialEnd = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null;

          const firstItem = subscription.items.data[0];
          const currentPeriodStart = firstItem?.current_period_start
            ? new Date(firstItem.current_period_start * 1000)
            : null;
          const currentPeriodEnd = firstItem?.current_period_end
            ? new Date(firstItem.current_period_end * 1000)
            : null;

          // Upsert subscriptionsテーブル
          const { error: upsertError } = await supabase
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                stripe_price_id: priceId,
                status,
                trial_start: trialStart,
                trial_end: trialEnd,
                current_period_start: currentPeriodStart,
                current_period_end: currentPeriodEnd,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );

          if (upsertError) {
            console.error(
              `[${requestId}] Failed to upsert subscription:`,
              upsertError
            );
          } else {
            console.log(
              `[${requestId}] Successfully processed checkout.session.completed for user ${userId}`
            );
          }
        } catch (error) {
          console.error(
            `[${requestId}] Error processing checkout.session.completed:`,
            error
          );
        }
        break;
      }
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        const customerId = subscription.customer as string;

        try {
          // カスタマーIDからuser_idを取得
          const { data: existing, error: fetchError } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (fetchError) {
            if (fetchError.code === "PGRST116") {
              console.error(
                `[${requestId}] No subscription record found for customer ${customerId}, cannot process subscription.created`
              );
            } else {
              console.error(
                `[${requestId}] Error fetching subscription for customer ${customerId}:`,
                fetchError
              );
            }
            break;
          }

          if (!existing) {
            console.error(
              `[${requestId}] No user found for customer ${customerId}`
            );
            break;
          }

          const userId = existing.user_id;
          const firstItem = subscription.items.data[0];
          const priceId = firstItem?.price.id;
          const status = subscription.status;
          const trialStart = subscription.trial_start
            ? new Date(subscription.trial_start * 1000)
            : null;
          const trialEnd = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null;
          const currentPeriodStart = firstItem?.current_period_start
            ? new Date(firstItem.current_period_start * 1000)
            : null;
          const currentPeriodEnd = firstItem?.current_period_end
            ? new Date(firstItem.current_period_end * 1000)
            : null;

          // サブスクリプション情報を更新
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId,
              status,
              trial_start: trialStart,
              trial_end: trialEnd,
              current_period_start: currentPeriodStart,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (updateError) {
            console.error(
              `[${requestId}] Failed to update subscription for subscription.created:`,
              updateError
            );
          } else {
            console.log(
              `[${requestId}] Successfully processed customer.subscription.created for user ${userId}`
            );
          }
        } catch (error) {
          console.error(
            `[${requestId}] Error processing customer.subscription.created:`,
            error
          );
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        try {
          // サブスクリプションの該当DBレコードを更新
          const firstItem = subscription.items.data[0];
          const priceId = firstItem?.price.id;
          const status = subscription.status;
          const trialStart = subscription.trial_start
            ? new Date(subscription.trial_start * 1000)
            : null;
          const trialEnd = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null;
          const currentPeriodStart = firstItem?.current_period_start
            ? new Date(firstItem.current_period_start * 1000)
            : null;
          const currentPeriodEnd = firstItem?.current_period_end
            ? new Date(firstItem.current_period_end * 1000)
            : null;
          const cancelAtPeriodEnd = subscription.cancel_at_period_end ?? false;
          const canceledAt = subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : null;

          // user_id取得のためDBから既存レコードを取得
          const { data: existing, error: fetchError } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (fetchError || !existing) {
            console.error(
              `[${requestId}] subscriptionsテーブルに該当レコードがありません`,
              {
                subscriptionId,
                error: fetchError,
              }
            );
            break;
          }

          const userId = existing.user_id;
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              status,
              stripe_price_id: priceId,
              trial_start: trialStart,
              trial_end: trialEnd,
              current_period_start: currentPeriodStart,
              current_period_end: currentPeriodEnd,
              cancel_at_period_end: cancelAtPeriodEnd,
              canceled_at: canceledAt,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (updateError) {
            console.error(
              `[${requestId}] Failed to update subscription:`,
              updateError
            );
          } else {
            console.log(
              `[${requestId}] Successfully processed customer.subscription.updated for user ${userId}`
            );
          }
        } catch (error) {
          console.error(
            `[${requestId}] Error processing customer.subscription.updated:`,
            error
          );
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        const canceledAt = subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : new Date();

        try {
          // user_id取得のためDBから既存レコードを取得
          const { data: existing, error: fetchError } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (fetchError || !existing) {
            console.error(
              `[${requestId}] subscriptionsテーブルに該当レコードがありません`,
              {
                subscriptionId,
                error: fetchError,
              }
            );
            break;
          }

          const userId = existing.user_id;
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              stripe_subscription_id: null, // 削除されたサブスクリプションIDはクリア
              canceled_at: canceledAt,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (updateError) {
            console.error(
              `[${requestId}] Failed to update subscription deletion:`,
              updateError
            );
          } else {
            console.log(
              `[${requestId}] Successfully processed customer.subscription.deleted for user ${userId}`
            );
          }
        } catch (error) {
          console.error(
            `[${requestId}] Error processing customer.subscription.deleted:`,
            error
          );
        }
        break;
      }
      case "invoice.payment_succeeded": {
        // Stripe公式ドキュメントに従いsubscriptionプロパティを型補助で扱う
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | null;
        };
        const subscriptionId = invoice.subscription;

        if (!subscriptionId) {
          console.error(`[${requestId}] invoiceにsubscriptionIdがありません`, {
            invoiceId: invoice.id,
          });
          break;
        }

        try {
          // 最新のサブスクリプション情報を取得
          const subscription = (await stripe.subscriptions.retrieve(
            subscriptionId
          )) as Stripe.Subscription;
          const firstItem = subscription.items.data[0];
          const priceId = firstItem?.price.id;
          const status = "active";
          const trialStart = subscription.trial_start
            ? new Date(subscription.trial_start * 1000)
            : null;
          const trialEnd = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null;
          const currentPeriodStart = firstItem?.current_period_start
            ? new Date(firstItem.current_period_start * 1000)
            : null;
          const currentPeriodEnd = firstItem?.current_period_end
            ? new Date(firstItem.current_period_end * 1000)
            : null;

          // user_id取得のためDBから既存レコードを取得
          const { data: existing, error: fetchError } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (fetchError || !existing) {
            console.error(
              `[${requestId}] subscriptionsテーブルに該当レコードがありません`,
              {
                subscriptionId,
                error: fetchError,
              }
            );
            break;
          }

          const userId = existing.user_id;
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              status,
              stripe_price_id: priceId,
              trial_start: trialStart,
              trial_end: trialEnd,
              current_period_start: currentPeriodStart,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (updateError) {
            console.error(
              `[${requestId}] Failed to update subscription payment success:`,
              updateError
            );
          } else {
            console.log(
              `[${requestId}] Successfully processed invoice.payment_succeeded for user ${userId}`
            );
          }
        } catch (error) {
          console.error(
            `[${requestId}] Error processing invoice.payment_succeeded:`,
            error
          );
        }
        break;
      }
      case "invoice.payment_failed": {
        // Stripe公式ドキュメントに従いsubscriptionプロパティを型補助で扱う
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | null;
        };
        const subscriptionId = invoice.subscription;

        if (!subscriptionId) {
          console.error(`[${requestId}] invoiceにsubscriptionIdがありません`, {
            invoiceId: invoice.id,
          });
          break;
        }

        try {
          // 最新のサブスクリプション情報を取得
          const subscription = (await stripe.subscriptions.retrieve(
            subscriptionId
          )) as Stripe.Subscription;
          const firstItem = subscription.items.data[0];
          const priceId = firstItem?.price.id;
          const status = subscription.status; // 例: past_due, incomplete など
          const trialStart = subscription.trial_start
            ? new Date(subscription.trial_start * 1000)
            : null;
          const trialEnd = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null;
          const currentPeriodStart = firstItem?.current_period_start
            ? new Date(firstItem.current_period_start * 1000)
            : null;
          const currentPeriodEnd = firstItem?.current_period_end
            ? new Date(firstItem.current_period_end * 1000)
            : null;

          // user_id取得のためDBから既存レコードを取得
          const { data: existing, error: fetchError } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (fetchError || !existing) {
            console.error(
              `[${requestId}] subscriptionsテーブルに該当レコードがありません`,
              {
                subscriptionId,
                error: fetchError,
              }
            );
            break;
          }

          const userId = existing.user_id;
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              status,
              stripe_price_id: priceId,
              trial_start: trialStart,
              trial_end: trialEnd,
              current_period_start: currentPeriodStart,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (updateError) {
            console.error(
              `[${requestId}] Failed to update subscription payment failure:`,
              updateError
            );
          } else {
            console.log(
              `[${requestId}] Successfully processed invoice.payment_failed for user ${userId}`
            );
          }
        } catch (error) {
          console.error(
            `[${requestId}] Error processing invoice.payment_failed:`,
            error
          );
        }
        break;
      }
      case "customer.deleted": {
        const customer = event.data.object as Stripe.Customer;
        const customerId = customer.id;

        try {
          // customer_id を使って該当するユーザーを検索し、stripe_customer_id をクリア
          const { data: existing, error: fetchError } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (fetchError) {
            if (fetchError.code === "PGRST116") {
              // レコードが見つからない場合は無視（既に削除済みまたは存在しない）
              console.log(
                `[${requestId}] Customer ${customerId} not found in subscriptions table, ignoring deletion event`
              );
            } else {
              console.error(
                `[${requestId}] Error fetching subscription for customer deletion:`,
                fetchError
              );
            }
            break;
          }

          if (!existing) {
            console.log(
              `[${requestId}] No subscription found for deleted customer ${customerId}`
            );
            break;
          }

          const userId = existing.user_id;
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              stripe_customer_id: null, // カスタマーが削除されたためIDをクリア
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (updateError) {
            console.error(
              `[${requestId}] Failed to clear customer ID for deleted customer:`,
              updateError
            );
          } else {
            console.log(
              `[${requestId}] Successfully processed customer.deleted for user ${userId}, cleared customer ID ${customerId}`
            );
          }
        } catch (error) {
          console.error(
            `[${requestId}] Error processing customer.deleted:`,
            error
          );
        }
        break;
      }
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        console.log(
          `[${requestId}] PaymentIntent succeeded: ${paymentIntent.id}`,
          {
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            metadata: paymentIntent.metadata,
          }
        );

        // 買い切り購入の場合のみ処理
        if (paymentIntent.metadata?.type === "one_time_purchase") {
          const userId = paymentIntent.metadata.user_id;
          const planType = paymentIntent.metadata.plan_type as
            | "small_pack"
            | "regular_pack";
          const placesCount = parseInt(
            paymentIntent.metadata.places_count || "0"
          );

          if (!userId || !planType || !placesCount) {
            console.error(
              `[${requestId}] Missing metadata in payment_intent for one_time_purchase`,
              {
                userId: !!userId,
                planType: !!planType,
                placesCount: !!placesCount,
                paymentIntentId: paymentIntent.id,
                fullMetadata: paymentIntent.metadata,
              }
            );
            break;
          }

          console.log(
            `[${requestId}] Processing one_time_purchase for user ${userId}`,
            {
              planType,
              placesCount,
              paymentIntentId: paymentIntent.id,
            }
          );

          try {
            // place_creditsテーブルにクレジットを追加
            const { error: insertError } = await supabase
              .from("place_credits")
              .insert({
                user_id: userId,
                credit_type:
                  planType === "small_pack"
                    ? "one_time_small"
                    : "one_time_regular",
                places_purchased: placesCount,
                places_consumed: 0,
                stripe_payment_intent_id: paymentIntent.id,
                purchased_at: new Date().toISOString(),
                is_active: true,
                metadata: {
                  payment_intent_id: paymentIntent.id,
                  amount: paymentIntent.amount,
                  currency: paymentIntent.currency,
                },
              });

            if (insertError) {
              console.error(
                `[${requestId}] Failed to insert place credit:`,
                insertError
              );
            } else {
              console.log(
                `[${requestId}] Successfully added ${placesCount} place credits for user ${userId} (${planType})`
              );
            }
          } catch (error) {
            console.error(
              `[${requestId}] Error processing payment_intent.succeeded for one_time_purchase:`,
              error
            );
          }
        } else {
          console.log(
            `[${requestId}] PaymentIntent succeeded but not one_time_purchase type`,
            {
              paymentIntentId: paymentIntent.id,
              metadataType: paymentIntent.metadata?.type,
            }
          );
        }
        break;
      }
      default:
        // 他のイベントはログのみ
        console.log(`[${requestId}] Unhandled event type: ${event.type}`);
        break;
    }

    // Success response with security headers
    const response = NextResponse.json({ received: true });
    response.headers.set("X-Request-ID", requestId);
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");

    return response;
  } catch (error) {
    console.error(`[${requestId}] Unexpected error in webhook handler:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "X-Request-ID": requestId,
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  }
}
