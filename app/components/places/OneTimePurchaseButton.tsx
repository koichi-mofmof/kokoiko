"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";

import {
  formatPrice,
  inferCurrencyFromLocale,
  type OneTimePurchaseType,
} from "@/lib/constants/config/subscription";
import { createClient } from "@/lib/supabase/client";
import { ShoppingCart, Loader2 } from "lucide-react";

interface OneTimePurchaseButtonProps {
  planType: OneTimePurchaseType;
  price: number;
  places: number;
  recommended?: boolean;
  className?: string;

  onError?: (error: string) => void;
}

export function OneTimePurchaseButton({
  planType,
  price,
  places,
  recommended = false,
  className = "",

  onError,
}: OneTimePurchaseButtonProps) {
  const { t, locale } = useI18n();
  const currency = inferCurrencyFromLocale(locale);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);

    try {
      const supabase = createClient();

      // ユーザー認証確認
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        onError?.(t("errors.common.unauthorized"));
        return;
      }

      // 買い切り決済API呼び出し
      const response = await fetch("/api/stripe/one-time-purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          planType,
          currency,
          returnUrl: window.location.href,
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Purchase failed");
      }

      // Stripe Checkoutにリダイレクト
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: unknown) {
      console.error("One-time purchase error:", error);
      onError?.((error as Error)?.message || t("errors.stripe.purchaseFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePurchase}
      disabled={loading}
      className={`relative ${
        recommended ? "bg-amber-500 hover:bg-amber-600 border-amber-300" : ""
      } ${className}`}
      variant={recommended ? "default" : "outline"}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <ShoppingCart className="w-4 h-4 mr-2" />
      )}

      <div className="text-left">
        <div className="font-semibold">
          {formatPrice(price, currency, locale)}
        </div>
        <div className="text-xs opacity-80">+{places}件</div>
      </div>

      {recommended && (
        <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-semibold">
          {t("home.pricing.oneTime.recommended")}
        </span>
      )}
    </Button>
  );
}
