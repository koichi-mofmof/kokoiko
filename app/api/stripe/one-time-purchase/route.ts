"use server";

import {
  getOneTimePriceId,
  ONE_TIME_PURCHASE_PLANS,
  type OneTimePurchaseType,
  type SupportedCurrency,
} from "@/lib/constants/config/subscription";
import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import Stripe from "stripe";

// CloudFlare Workers環境でStripeクライアントを初期化
function createStripeClient(): Stripe {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-05-28.basil",
    httpClient: Stripe.createFetchHttpClient(), // CloudFlare Workers対応
  });
  return stripe;
}

// 言語に応じた商品名・説明を生成
function getLocalizedProductInfo(
  planType: OneTimePurchaseType,
  placesCount: number,
  language: string = "en"
): { name: string; description: string } {
  const lowerLang = language.toLowerCase();
  let lang = "en"; // デフォルトは英語

  if (lowerLang.startsWith("ja")) {
    lang = "ja";
  } else if (lowerLang.startsWith("fr")) {
    lang = "fr";
  } else if (lowerLang.startsWith("es")) {
    lang = "es";
  } else if (lowerLang.startsWith("de")) {
    lang = "de";
  }

  const productInfo = {
    ja: {
      small_pack: {
        name: `${placesCount}件パック - 地点追加クレジット`,
        description: `アカウントに${placesCount}件の地点を追加できるクレジットです`,
      },
      regular_pack: {
        name: `${placesCount}件パック - 地点追加クレジット`,
        description: `アカウントに${placesCount}件の地点を追加できるクレジットです`,
      },
    },
    en: {
      small_pack: {
        name: `${placesCount} Places Pack - Additional Place Credits`,
        description: `Credits to add ${placesCount} places to your account`,
      },
      regular_pack: {
        name: `${placesCount} Places Pack - Additional Place Credits`,
        description: `Credits to add ${placesCount} places to your account`,
      },
    },
    fr: {
      small_pack: {
        name: `Pack ${placesCount} Lieux - Crédits de Lieu Supplémentaires`,
        description: `Crédits pour ajouter ${placesCount} lieux à votre compte`,
      },
      regular_pack: {
        name: `Pack ${placesCount} Lieux - Crédits de Lieu Supplémentaires`,
        description: `Crédits pour ajouter ${placesCount} lieux à votre compte`,
      },
    },
    es: {
      small_pack: {
        name: `Paquete ${placesCount} Lugares - Créditos de Lugar Adicionales`,
        description: `Créditos para agregar ${placesCount} lugares a tu cuenta`,
      },
      regular_pack: {
        name: `Paquete ${placesCount} Lugares - Créditos de Lugar Adicionales`,
        description: `Créditos para agregar ${placesCount} lugares a tu cuenta`,
      },
    },
    de: {
      small_pack: {
        name: `${placesCount}-Orte-Paket - Zusätzliche Ort-Guthaben`,
        description: `Guthaben um ${placesCount} Orte zu Ihrem Konto hinzuzufügen`,
      },
      regular_pack: {
        name: `${placesCount}-Orte-Paket - Zusätzliche Ort-Guthaben`,
        description: `Guthaben um ${placesCount} Orte zu Ihrem Konto hinzuzufügen`,
      },
    },
  };

  return productInfo[lang as keyof typeof productInfo][planType];
}

interface OneTimePurchaseRequest {
  userId: string;
  planType: OneTimePurchaseType;
  currency: SupportedCurrency;
  language?: string; // 言語パラメータ（オプショナル）
  returnUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OneTimePurchaseRequest = await request.json();
    const { userId, planType, currency, language = "en", returnUrl } = body;

    // バリデーション
    const allowedPlans: OneTimePurchaseType[] = ["small_pack", "regular_pack"];
    const allowedCurrencies: SupportedCurrency[] = ["JPY", "USD", "EUR"];

    if (
      !allowedPlans.includes(planType) ||
      !allowedCurrencies.includes(currency) ||
      !userId ||
      !returnUrl
    ) {
      return Response.json(
        {
          error: "Invalid parameters",
          errorKey: "errors.validation.invalidInput",
        },
        { status: 400 }
      );
    }

    // Supabase Admin Client（service_role_key使用）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ユーザー情報取得
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      return Response.json(
        {
          error: "User not found",
          errorKey: "errors.stripe.userEmailNotFound",
        },
        { status: 404 }
      );
    }
    const userEmail = userData.user.email;

    // Stripe Price ID取得（プランベース、通貨はパラメータで指定）
    const priceId = getOneTimePriceId(planType);
    if (!priceId) {
      return Response.json(
        {
          error: "Price ID not configured",
          errorKey: "errors.stripe.priceIdNotFound",
        },
        { status: 500 }
      );
    }

    // CloudFlare Workers対応のStripe Client
    const stripe = createStripeClient();

    // プラン情報取得
    const planInfo = ONE_TIME_PURCHASE_PLANS[planType];

    // 言語に応じた商品情報取得
    const productInfo = getLocalizedProductInfo(
      planType,
      planInfo.places,
      language
    );

    // Checkout Session作成
    const session = await stripe.checkout.sessions.create({
      mode: "payment", // 一回限りの支払い
      payment_method_types: ["card"],
      currency: currency.toLowerCase(), // 通貨を明示的に指定
      locale: language as Stripe.Checkout.SessionCreateParams.Locale,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: productInfo.name,
              description: productInfo.description,
            },
            unit_amount:
              planInfo.prices[currency] * (currency === "JPY" ? 1 : 100), // JPYは円単位、他は cents/pence
          },
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      success_url: `${new URL(
        "/purchase/success",
        returnUrl
      ).toString()}?session_id={CHECKOUT_SESSION_ID}&plan_type=${planType}`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        type: "one_time_purchase",
        user_id: userId,
        plan_type: planType,
        currency: currency,
        places_count: planInfo.places.toString(),
      },
      payment_intent_data: {
        metadata: {
          type: "one_time_purchase",
          user_id: userId,
          plan_type: planType,
          currency: currency,
          places_count: planInfo.places.toString(),
        },
      },
    });

    if (!session.url) {
      return Response.json(
        {
          error: "Failed to create checkout session",
          errorKey: "errors.stripe.checkoutSessionFailed",
        },
        { status: 500 }
      );
    }

    return Response.json({ url: session.url });
  } catch (error: unknown) {
    console.error("One-time purchase API error:", error);
    return Response.json(
      { error: "Internal server error", errorKey: "errors.stripe.unknown" },
      { status: 500 }
    );
  }
}
