"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * OAuth認証後のセッション状態を同期するフック
 * URLに認証成功のパラメータがある場合、セッション状態を確認して画面を更新
 */
export function useAuthSync() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // URLパラメータから認証成功を検出
      const url = new URL(window.location.href);
      const isFromAuthCallback =
        url.searchParams.has("code") ||
        document.referrer.includes("/auth/callback") ||
        sessionStorage.getItem("auth_callback_pending") === "true";

      if (isFromAuthCallback) {
        // セッション状態をクライアントサイドで確認
        const supabase = createClient();

        try {
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser();

          if (!error && user) {
            // 認証成功：画面を強制リフレッシュしてサーバー状態と同期
            sessionStorage.removeItem("auth_callback_pending");
            router.refresh();
          }
        } catch (error) {
          console.error("Auth sync error:", error);
        }
      }
    };

    // 少し遅延させて実行（リダイレクト直後の処理を確実にするため）
    const timer = setTimeout(handleAuthCallback, 100);

    return () => clearTimeout(timer);
  }, [router]);
}

/**
 * OAuth認証開始時に呼び出すヘルパー関数
 * 認証コールバック待機状態をマーク
 */
export function markAuthCallbackPending() {
  sessionStorage.setItem("auth_callback_pending", "true");
}
