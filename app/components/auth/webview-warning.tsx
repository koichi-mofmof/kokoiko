"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useI18n } from "@/hooks/use-i18n";
import {
  getExternalBrowserAdviceKey,
  isGoogleOAuthBlocked,
} from "@/lib/utils/browser-detection";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export function WebViewWarning() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [adviceKey, setAdviceKey] = useState("");
  const { t } = useI18n();

  useEffect(() => {
    setIsBlocked(isGoogleOAuthBlocked());
    setAdviceKey(getExternalBrowserAdviceKey());
  }, []);

  if (!isBlocked) {
    return null;
  }

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900">
        {t("auth.webview.googleLoginBlocked.title")}
      </AlertTitle>
      <AlertDescription className="space-y-3 text-orange-800">
        <p>{t("auth.webview.googleLoginBlocked.desc")}</p>
        <p>{t(adviceKey)}</p>
      </AlertDescription>
    </Alert>
  );
}
