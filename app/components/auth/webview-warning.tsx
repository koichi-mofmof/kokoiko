"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getExternalBrowserAdvice,
  isGoogleOAuthBlocked,
} from "@/lib/utils/browser-detection";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export function WebViewWarning() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [advice, setAdvice] = useState("");

  useEffect(() => {
    setIsBlocked(isGoogleOAuthBlocked());
    setAdvice(getExternalBrowserAdvice());
  }, []);

  if (!isBlocked) {
    return null;
  }

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900">
        Googleログインが制限されています
      </AlertTitle>
      <AlertDescription className="space-y-3 text-orange-800">
        <p>
          アプリ内ブラウザからのGoogleログインは、セキュリティの理由により制限されています。
        </p>
        <p>{advice}</p>
      </AlertDescription>
    </Alert>
  );
}
