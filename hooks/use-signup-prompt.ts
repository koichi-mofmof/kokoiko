"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

export function useSignupPrompt() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [shouldShowBanner, setShouldShowBanner] = useState(false);

  // バナーを非表示にする
  const hideBanner = useCallback(() => {
    setShouldShowBanner(false);

    // セッションストレージにバナー非表示フラグを記録
    if (typeof window !== "undefined") {
      sessionStorage.setItem("clippy_banner_dismissed", "true");
    }
  }, []);

  useEffect(() => {
    const initializeBanner = async () => {
      // クライアントサイドでのみ実行
      if (typeof window === "undefined") return;

      try {
        // ユーザー認証状況を確認
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setIsLoggedIn(!!user);

        // ログインユーザーには表示しない
        if (user) {
          return;
        }

        // バナー表示ロジック：セッション中に閉じられていなければ表示
        const bannerDismissed = sessionStorage.getItem(
          "clippy_banner_dismissed"
        );
        if (!bannerDismissed) {
          setShouldShowBanner(true);
        }
      } catch (error) {
        console.error("Error initializing signup banner:", error);
      }
    };

    initializeBanner();
  }, []);

  // ページの可視性が変わった時の処理（バックグラウンドに行った時にバナーを隠す）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setShouldShowBanner(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return {
    isLoggedIn,
    shouldShowBanner: shouldShowBanner && isLoggedIn === false, // 非ログインユーザーのみ
    hideBanner,
  };
}
