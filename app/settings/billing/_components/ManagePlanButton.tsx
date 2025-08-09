"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { createCustomerPortalSession } from "@/lib/actions/stripe.actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ManagePlanButtonProps {
  userId: string;
}

export function ManagePlanButton({ userId }: ManagePlanButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  const handleManagePlan = async () => {
    setLoading(true);
    try {
      const result = await createCustomerPortalSession(userId);
      if ("url" in result && result.url) {
        router.push(result.url);
      } else if ("error" in result && result.error) {
        toast({
          title: t("common.error"),
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description:
          error instanceof Error ? error.message : t("common.unexpectedError"),
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleManagePlan}
      disabled={loading}
      className="w-full sm:w-auto"
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {t("settings.billing.managePlan")}
    </Button>
  );
}
