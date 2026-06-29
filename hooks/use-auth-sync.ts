"use client";

import { trackAuthEventFromParam } from "@/lib/analytics/events";
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

  // 認証成功時のGAイベント（sign_up / login）を発火する。
  // サーバー側 redirect で付与された `auth_event` パラメータを拾い、
  // gtag のロードを待ってからイベントを送信、その後パラメータを除去する。
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("auth_event");
    if (!code) return;

    let attempts = 0;
    let timerId: ReturnType<typeof setTimeout>;

    const fireWhenReady = () => {
      if (typeof window.gtag === "function") {
        trackAuthEventFromParam(code);
        // 再発火・URL共有による誤計測を防ぐためパラメータを除去
        url.searchParams.delete("auth_event");
        window.history.replaceState({}, "", url.toString());
        return;
      }
      // gtag 未ロードのときは最大 ~3 秒リトライ
      if (attempts++ < 20) {
        timerId = setTimeout(fireWhenReady, 150);
      }
    };

    fireWhenReady();

    return () => clearTimeout(timerId);
  }, []);
}

/**
 * OAuth認証開始時に呼び出すヘルパー関数
 * 認証コールバック待機状態をマーク
 */
export function markAuthCallbackPending() {
  sessionStorage.setItem("auth_callback_pending", "true");
}
