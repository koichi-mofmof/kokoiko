/**
 * 買い切りプラン購入の診断スクリプト
 * 本番環境での問題を特定するためのデバッグツール
 */

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// 環境変数チェック
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SIGNING_SECRET",
];

console.log("🔍 環境変数チェック");
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error("❌ 欠如している環境変数:", missingEnvVars);
  process.exit(1);
} else {
  console.log("✅ 必要な環境変数はすべて設定済み");
}

// Supabase接続テスト
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Stripe接続テスト
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
  httpClient: Stripe.createFetchHttpClient(),
});

async function debugOnTimePurchase(userId?: string, paymentIntentId?: string) {
  console.log("\n🔍 買い切りプラン購入診断開始");

  // 1. Supabase接続テスト
  console.log("\n1. Supabase接続テスト");
  try {
    const { error } = await supabase
      .from("place_credits")
      .select("count")
      .limit(1);
    if (error) {
      console.error("❌ Supabase接続エラー:", error);
      return;
    }
    console.log("✅ Supabase接続正常");
  } catch (error) {
    console.error("❌ Supabase接続失敗:", error);
    return;
  }

  // 2. Stripe接続テスト
  console.log("\n2. Stripe接続テスト");
  try {
    await stripe.customers.list({ limit: 1 });
    console.log("✅ Stripe接続正常");
  } catch (error) {
    console.error("❌ Stripe接続エラー:", error);
    return;
  }

  // 3. 既存のplace_creditsレコード確認
  console.log("\n3. 既存place_creditsレコード確認");
  try {
    const { data: credits, error } = await supabase
      .from("place_credits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("❌ place_credits検索エラー:", error);
      return;
    }

    console.log(`📊 最新10件のplace_creditsレコード (${credits.length}件):`);
    credits.forEach((credit, index) => {
      console.log(
        `  ${index + 1}. ${credit.credit_type} | ${
          credit.places_purchased
        }件 | ${credit.user_id} | ${credit.created_at}`
      );
    });
  } catch (error) {
    console.error("❌ place_credits検索失敗:", error);
    return;
  }

  // 4. 特定ユーザーのクレジット確認
  if (userId) {
    console.log(`\n4. ユーザー ${userId} のクレジット確認`);
    try {
      const { data: userCredits, error } = await supabase
        .from("place_credits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ ユーザークレジット検索エラー:", error);
      } else {
        console.log(
          `📊 ユーザー ${userId} のクレジット (${userCredits.length}件):`
        );
        userCredits.forEach((credit, index) => {
          console.log(
            `  ${index + 1}. ${credit.credit_type} | ${
              credit.places_purchased
            }件 | ${credit.stripe_payment_intent_id} | ${credit.created_at}`
          );
        });
      }
    } catch (error) {
      console.error("❌ ユーザークレジット検索失敗:", error);
    }
  }

  // 5. 特定PaymentIntentの調査
  if (paymentIntentId) {
    console.log(`\n5. PaymentIntent ${paymentIntentId} の調査`);
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );
      console.log("💳 PaymentIntent詳細:");
      console.log(`  ID: ${paymentIntent.id}`);
      console.log(`  Status: ${paymentIntent.status}`);
      console.log(
        `  Amount: ${paymentIntent.amount} ${paymentIntent.currency}`
      );
      console.log(
        `  Created: ${new Date(paymentIntent.created * 1000).toISOString()}`
      );
      console.log(`  Metadata:`, paymentIntent.metadata);

      // 対応するplace_creditレコードを確認
      const { data: matchingCredit, error } = await supabase
        .from("place_credits")
        .select("*")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("❌ 対応するplace_creditレコードが見つかりません");
        } else {
          console.error("❌ place_credit検索エラー:", error);
        }
      } else {
        console.log("✅ 対応するplace_creditレコード:", matchingCredit);
      }
    } catch (error) {
      console.error("❌ PaymentIntent取得エラー:", error);
    }
  }

  // 6. 最近のWebhookイベント確認
  console.log("\n6. 最近のWebhookイベント確認");
  try {
    const events = await stripe.events.list({
      limit: 20,
      types: ["payment_intent.succeeded"],
    });

    console.log(`📨 最新20件のpayment_intent.succeededイベント:`);
    events.data.forEach((event, index) => {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.log(
        `  ${index + 1}. ${pi.id} | ${event.created} | ${
          pi.metadata?.type || "N/A"
        } | ${pi.metadata?.user_id || "N/A"}`
      );
    });
  } catch (error) {
    console.error("❌ Webhookイベント取得エラー:", error);
  }

  console.log("\n🏁 診断完了");
}

// コマンドライン引数の処理
const args = process.argv.slice(2);
const userId = args.find((arg) => arg.startsWith("--user="))?.split("=")[1];
const paymentIntentId = args
  .find((arg) => arg.startsWith("--payment="))
  ?.split("=")[1];

// 診断実行
debugOnTimePurchase(userId, paymentIntentId).catch(console.error);
