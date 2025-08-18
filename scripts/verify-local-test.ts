/**
 * ローカル環境での買い切りプラン動作確認スクリプト
 * 本番環境との差異を検証
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyLocalTest() {
  console.log("🔍 ローカル環境での買い切りプラン動作確認");

  // 現在の環境確認
  console.log("\n📍 現在の環境:");
  console.log(
    `NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`
  );
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(
    `Stripe Key Type: ${
      process.env.STRIPE_SECRET_KEY?.startsWith("sk_test") ? "TEST" : "LIVE"
    }`
  );

  // ローカルで作成されたplace_creditsレコードを確認
  console.log("\n📊 ローカル環境で作成されたplace_creditsレコード:");
  try {
    const { data: credits, error } = await supabase
      .from("place_credits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("❌ エラー:", error);
      return;
    }

    if (credits.length === 0) {
      console.log("❌ place_creditsレコードが見つかりません");
      console.log("💡 ローカルでの動作確認は実際にはWebhook経由ではなく、");
      console.log(
        "   別の方法（直接DB操作など）で行われていた可能性があります"
      );
    } else {
      console.log("✅ 発見されたレコード:");
      credits.forEach((credit, index) => {
        console.log(
          `  ${index + 1}. ${credit.credit_type} | ${credit.places_purchased}件`
        );
        console.log(`     User: ${credit.user_id}`);
        console.log(`     PaymentIntent: ${credit.stripe_payment_intent_id}`);
        console.log(`     Created: ${credit.created_at}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("❌ 検索失敗:", error);
  }

  // Stripe Payment Intentの形式確認
  console.log("\n🔍 PaymentIntent ID形式の確認:");
  try {
    const { data: credits } = await supabase
      .from("place_credits")
      .select("stripe_payment_intent_id")
      .not("stripe_payment_intent_id", "is", null)
      .limit(3);

    if (credits && credits.length > 0) {
      credits.forEach((credit) => {
        const pi = credit.stripe_payment_intent_id;
        if (pi?.startsWith("pi_test_")) {
          console.log(`  ✅ TEST PaymentIntent: ${pi}`);
        } else if (pi?.startsWith("pi_live_") || pi?.startsWith("pi_1")) {
          console.log(`  🔴 LIVE PaymentIntent: ${pi}`);
        } else {
          console.log(`  ❓ 不明な形式: ${pi}`);
        }
      });
    }
  } catch (error) {
    console.error("❌ PaymentIntent形式確認失敗:", error);
  }
}

verifyLocalTest().catch(console.error);
