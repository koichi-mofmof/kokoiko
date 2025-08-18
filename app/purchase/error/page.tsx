import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { createServerT, loadMessages, normalizeLocale } from "@/lib/i18n";
import { cookies } from "next/headers";

interface PurchaseErrorPageProps {
  searchParams: Promise<{
    error_type?: string;
    plan_type?: string;
  }>;
}

export default async function PurchaseErrorPage({
  searchParams,
}: PurchaseErrorPageProps) {
  const { error_type, plan_type } = await searchParams;

  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);

  const getErrorMessage = (errorType?: string) => {
    switch (errorType) {
      case "payment_failed":
        return {
          title: t("purchase.error.paymentFailed.title"),
          description: t("purchase.error.paymentFailed.description"),
          suggestion: t("purchase.error.paymentFailed.suggestion"),
        };
      case "session_expired":
        return {
          title: t("purchase.error.sessionExpired.title"),
          description: t("purchase.error.sessionExpired.description"),
          suggestion: t("purchase.error.sessionExpired.suggestion"),
        };
      case "invalid_plan":
        return {
          title: t("purchase.error.invalidPlan.title"),
          description: t("purchase.error.invalidPlan.description"),
          suggestion: t("purchase.error.invalidPlan.suggestion"),
        };
      default:
        return {
          title: t("purchase.error.generic.title"),
          description: t("purchase.error.generic.description"),
          suggestion: t("purchase.error.generic.suggestion"),
        };
    }
  };

  const errorInfo = getErrorMessage(error_type);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center space-y-6">
        {/* エラーアイコンとメッセージ */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-red-800">
              {errorInfo.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {errorInfo.description}
            </p>
          </div>
        </div>

        {/* エラー詳細 */}
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">
              {t("purchase.error.whatHappened")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{errorInfo.suggestion}</p>
          </CardContent>
        </Card>

        {/* 次のステップ */}
        <Card>
          <CardHeader>
            <CardTitle>{t("purchase.error.nextSteps.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {plan_type && (
                <Link href={`/?plan=${plan_type}`}>
                  <Button className="w-full justify-between" size="lg">
                    <RefreshCw className="h-4 w-4" />
                    {t("purchase.error.nextSteps.tryAgain")}
                  </Button>
                </Link>
              )}

              <Link href="/settings/billing">
                <Button variant="outline" className="w-full justify-between">
                  <ArrowLeft className="h-4 w-4" />
                  {t("purchase.error.nextSteps.backToBilling")}
                </Button>
              </Link>

              <Link href="/help">
                <Button variant="outline" className="w-full">
                  {t("purchase.error.nextSteps.contactSupport")}
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              {t("purchase.error.nextSteps.description")}
            </p>
          </CardContent>
        </Card>

        {/* デバッグ情報（開発環境のみ） */}
        {process.env.NODE_ENV === "development" &&
          (error_type || plan_type) && (
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="text-xs text-gray-500 space-y-1">
                  {error_type && <p>Error Type: {error_type}</p>}
                  {plan_type && <p>Plan Type: {plan_type}</p>}
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
