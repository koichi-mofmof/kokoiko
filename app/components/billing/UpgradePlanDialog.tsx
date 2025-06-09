"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";
import { useState, ReactNode } from "react";

type UpgradePlanDialogProps = {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function UpgradePlanDialog({
  trigger,
  open,
  onOpenChange,
}: UpgradePlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");

  // 価格IDをプランごとに切り替え
  const priceId =
    plan === "monthly"
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY!
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY!;

  // プランごとの表示内容
  const planInfo = {
    monthly: {
      label: "月額プラン",
      price: "500",
      sub: "14日間無料／その後毎月500円",
      note: "いつでもキャンセル可能",
    },
    yearly: {
      label: "年額プラン",
      price: "4,200",
      sub: "14日間無料／その後毎年4,200円",
      note: "いつでもキャンセル可能",
    },
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("ログインが必要です");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          priceId,
          returnUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "セッション作成に失敗しました");
        setLoading(false);
      }
    } catch (e: any) {
      setError(e.message || "不明なエラーが発生しました");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <div onClick={() => onOpenChange?.(true)}>{trigger}</div>
      ) : (
        <DialogTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            data-testid="upgrade-dialog-trigger"
          >
            アップグレード
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>プレミアムプランにアップグレード</DialogTitle>
          <DialogDescription>
            すべての機能を無制限でご利用いただけます。
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={plan}
          onValueChange={(v) => setPlan(v as "monthly" | "yearly")}
        >
          <TabsList className="flex mb-4 border-b bg-transparent p-0">
            <TabsTrigger
              value="monthly"
              data-testid="plan-tab-monthly"
              className={`flex-1 py-2 text-center text-sm font-medium border-b-2 transition-colors ${
                plan === "monthly"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              月額
            </TabsTrigger>
            <TabsTrigger
              value="yearly"
              data-testid="plan-tab-yearly"
              className={`flex-1 py-2 text-center text-sm font-medium border-b-2 transition-colors ${
                plan === "yearly"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              年額
              <span className="ml-2 align-middle">
                <Badge className="font-bold px-2 py-0.5 text-xs">
                  30%お得！
                </Badge>
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            {/* 月額プラン内容 */}
            <Card className="my-4 p-0 border rounded-xl bg-neutral-50 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <div className="text-base font-bold text-primary-700 mb-1 text-center">
                  {planInfo.monthly.label}
                </div>
                <div className="text-2xl font-extrabold text-neutral-900 mb-1 text-center">
                  {planInfo.monthly.price}
                  <span className="text-base ml-1 font-normal">円</span>
                </div>
                <div className="text-xs text-neutral-500 text-center mb-1">
                  {planInfo.monthly.sub}
                </div>
              </CardHeader>
              <CardContent className="pt-2 pb-4 border-t border-neutral-200">
                <ul className="mb-0 mt-2 text-sm text-neutral-700 space-y-2 px-2">
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    登録地点数：上限なし
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    共有可能なリスト数：無制限
                  </li>
                  {/* <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    広告表示：なし
                  </li> */}
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    14日間無料トライアル付き
                  </li>
                </ul>
                <div className="text-xs text-neutral-500 text-center mt-2">
                  {planInfo.monthly.note}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="yearly">
            {/* 年額プラン内容 */}
            <Card className="my-4 p-0 border rounded-xl bg-neutral-50 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-center mb-2">
                  <Badge className="font-bold px-2 py-0.5 text-xs">
                    月額プランより30%お得！
                  </Badge>
                </div>
                <div className="text-base font-bold text-primary-700 mb-1 text-center">
                  {planInfo.yearly.label}
                </div>
                <div className="text-2xl font-extrabold text-neutral-900 mb-1 text-center">
                  {planInfo.yearly.price}
                  <span className="text-base ml-1 font-normal">円</span>
                </div>
                <div className="text-xs text-neutral-900 text-center mb-1 font-bold">
                  ※1か月あたり350円
                </div>
                <div className="text-xs text-neutral-500 text-center mb-1">
                  {planInfo.yearly.sub}
                </div>
              </CardHeader>
              <CardContent className="pt-2 pb-4 border-t border-neutral-200">
                <ul className="mb-0 mt-2 text-sm text-neutral-700 space-y-2 px-2">
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    登録地点数：上限なし
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    共有可能なリスト数：無制限
                  </li>
                  {/* <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    広告表示：なし
                  </li> */}
                  <li className="flex items-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-500 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                    </div>
                    14日間無料トライアル付き
                  </li>
                </ul>
                <div className="text-xs text-neutral-500 text-center mt-2">
                  {planInfo.yearly.note}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button
            variant="default"
            className="w-full"
            onClick={handleCheckout}
            disabled={loading}
            data-testid="checkout-button"
          >
            {loading
              ? "リダイレクト中..."
              : `${planInfo[plan].label}に申し込む`}
          </Button>
        </DialogFooter>
        {error && (
          <div className="text-red-500 text-xs text-center mt-2">{error}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
