import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, CreditCard } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { createServerT, loadMessages, normalizeLocale } from "@/lib/i18n";
import { cookies } from "next/headers";
import { getTotalAvailablePlaces } from "@/lib/utils/subscription-utils";
import {
  ONE_TIME_PURCHASE_PLANS,
  formatPrice,
  inferCurrencyFromLocale,
} from "@/lib/constants/config/subscription";

interface PurchaseSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
    plan_type?: string;
  }>;
}

export default async function PurchaseSuccessPage({
  searchParams,
}: PurchaseSuccessPageProps) {
  const { session_id, plan_type } = await searchParams;

  if (!session_id || !plan_type) {
    notFound();
  }

  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  const currency = inferCurrencyFromLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ユーザーの現在の地点利用状況を取得
  const placeAvailability = await getTotalAvailablePlaces(supabase, user.id);

  // プランタイプの検証
  const validPlanTypes = ["small_pack", "regular_pack"] as const;
  if (!validPlanTypes.includes(plan_type as (typeof validPlanTypes)[number])) {
    notFound();
  }

  const planDetails =
    ONE_TIME_PURCHASE_PLANS[plan_type as keyof typeof ONE_TIME_PURCHASE_PLANS];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center space-y-6">
        {/* 成功アイコンとメッセージ */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-800">
              {t("purchase.success.title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("purchase.success.subtitle")}
            </p>
          </div>
        </div>

        {/* 購入内容詳細 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t("purchase.success.details.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {t("purchase.success.details.product")}
              </span>
              <div className="text-right">
                <p className="font-semibold">
                  {plan_type === "small_pack"
                    ? t("home.pricing.oneTime.small.title")
                    : t("home.pricing.oneTime.regular.title")}
                </p>
                <Badge variant="secondary">
                  {t("purchase.success.details.oneTimePurchase")}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">
                {t("purchase.success.details.placesAdded")}
              </span>
              <span className="text-lg font-bold text-green-600">
                +{planDetails.places.toLocaleString()}{" "}
                {t("settings.billing.placeUsage.places")}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">
                {t("purchase.success.details.amount")}
              </span>
              <span className="text-lg font-semibold">
                {formatPrice(planDetails.prices[currency], currency, locale)}
              </span>
            </div>

            <hr className="my-4" />

            <div className="flex items-center justify-between">
              <span className="font-medium">
                {t("purchase.success.details.newTotal")}
              </span>
              <span className="text-lg font-bold">
                {placeAvailability.totalLimit === Infinity
                  ? "∞"
                  : placeAvailability.totalLimit.toLocaleString()}{" "}
                {t("settings.billing.placeUsage.places")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 次のステップ */}
        <Card>
          <CardHeader>
            <CardTitle>{t("purchase.success.nextSteps.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Link href="/lists">
                <Button className="w-full justify-between" size="lg">
                  {t("purchase.success.nextSteps.addPlaces")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/settings/billing">
                <Button variant="outline" className="w-full">
                  {t("purchase.success.nextSteps.viewUsage")}
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              {t("purchase.success.nextSteps.description")}
            </p>
          </CardContent>
        </Card>

        {/* セッション情報（デバッグ用） */}
        {process.env.NODE_ENV === "development" && (
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <p className="text-xs text-gray-500">Session ID: {session_id}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
