import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
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

        if (!userId || !subscriptionId) {
          console.error(
            `[${requestId}] Missing user_id or subscriptionId in session.metadata`,
            {
              userId: !!userId,
              subscriptionId: !!subscriptionId,
              sessionId: session.id,
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
