"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/use-i18n";

type ErrorMessageToastProps = {
  errorMessage?: string;
};

export function ErrorMessageToast({ errorMessage }: ErrorMessageToastProps) {
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    if (errorMessage) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: errorMessage,
      });
    }
  }, [errorMessage, toast, t]);

  return null; // This component does not render anything itself
}
