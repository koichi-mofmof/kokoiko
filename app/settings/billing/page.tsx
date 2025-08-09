import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getActiveSubscription } from "@/lib/dal/subscriptions";
import {
  createServerT,
  getDateFnsLocale,
  loadMessages,
  normalizeLocale,
} from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import {
  getPlanName,
  getPlanStatus,
  SubscriptionStatus,
} from "@/lib/utils/subscription-utils";
import { format } from "date-fns";
// date-fns locale は i18nユーティリティ経由で取得するため直接のimportは不要
import { cookies } from "next/headers";
import { ManagePlanButton } from "./_components/ManagePlanButton";

export default async function BillingSettingsPage() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6 px-0 sm:px-4">
        <h2 className="text-xl font-semibold mb-1">
          {t("settings.billing.title")}
        </h2>
        <p>{t("settings.billing.loginPlease")}</p>
      </div>
    );
  }

  const subscription = await getActiveSubscription(user.id);

  const planName = getPlanName(subscription?.stripe_price_id);
  const planStatus = getPlanStatus(subscription?.status as SubscriptionStatus);

  const renderSubscriptionDetails = () => {
    if (!subscription) {
      return (
        <p className="text-muted-foreground">
          {t("settings.billing.noActivePlan")}
        </p>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">{t("settings.billing.plan")}</span>
          <span className="flex items-center gap-2">
            {planName}{" "}
            <Badge variant={planStatus.variant}>{planStatus.text}</Badge>
          </span>
        </div>
        {subscription.current_period_end && (
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {subscription.status === "canceled"
                ? t("settings.billing.expiresAt")
                : t("settings.billing.nextBillingDate")}
            </span>
            <span>
              {format(new Date(subscription.current_period_end), "PPP", {
                locale: getDateFnsLocale(locale),
              })}
            </span>
          </div>
        )}
        {subscription.cancel_at_period_end && (
          <p className="text-sm text-yellow-600">
            {t("settings.billing.willCancelAtPeriodEnd")}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 px-0 sm:px-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.billing.title")}</CardTitle>
          <CardDescription>{t("settings.billing.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderSubscriptionDetails()}
          {subscription?.stripe_customer_id && (
            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                {t("settings.billing.portalNote")}
              </p>
              <div className="flex justify-center sm:justify-end w-full">
                <ManagePlanButton userId={user.id} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
