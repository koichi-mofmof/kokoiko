import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getActiveSubscription } from "@/lib/dal/subscriptions";
import { createClient } from "@/lib/supabase/server";
import {
  getPlanName,
  getPlanStatus,
  SubscriptionStatus,
} from "@/lib/utils/subscription-utils";
import { format } from "date-fns";
import { ManagePlanButton } from "./_components/ManagePlanButton";

export default async function BillingSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6 px-0 sm:px-4">
        <h2 className="text-xl font-semibold mb-1">サブスクリプション設定</h2>
        <p>ログインしてください。</p>
      </div>
    );
  }

  const subscription = await getActiveSubscription(user.id);

  const planName = getPlanName(subscription?.stripe_price_id);
  const planStatus = getPlanStatus(subscription?.status as SubscriptionStatus);

  const renderSubscriptionDetails = () => {
    if (!subscription) {
      return (
        <p className="text-muted-foreground">現在有効なプランはありません。</p>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">プラン</span>
          <span className="flex items-center gap-2">
            {planName}{" "}
            <Badge variant={planStatus.variant}>{planStatus.text}</Badge>
          </span>
        </div>
        {subscription.current_period_end && (
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {subscription.status === "canceled" ? "有効期限" : "次回の請求日"}
            </span>
            <span>
              {format(
                new Date(subscription.current_period_end),
                "yyyy年MM月dd日"
              )}
            </span>
          </div>
        )}
        {subscription.cancel_at_period_end && (
          <p className="text-sm text-yellow-600">
            現在の請求期間の終わりにプランがキャンセルされます。
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 px-0 sm:px-4">
      <Card>
        <CardHeader>
          <CardTitle>サブスクリプション設定</CardTitle>
          <CardDescription>
            現在のプラン情報を確認し、プランの変更やお支払い方法の更新ができます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderSubscriptionDetails()}
          {subscription?.stripe_customer_id && (
            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                プランの変更、お支払い方法の更新、ご解約手続きは、Stripeが提供する安全なカスタマーポータルで行うことができます。「プランを管理する」ボタンをクリックしてポータルサイトへお進みください。
              </p>
              <ManagePlanButton userId={user.id} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
