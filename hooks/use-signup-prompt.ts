"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

// localStorage キー定数
const STORAGE_KEYS = {
  PROMPT_SHOWN: "clippy_signup_prompt_shown",
  PROMPT_DISMISSED: "clippy_signup_prompt_dismissed",
} as const;

// ダイアログ表示までの遅延時間（ミリ秒）
// 動的に設定を取得、デフォルトは10秒（10000ms）
const getPromptDelay = async (): Promise<number> => {
  if (typeof window === "undefined") return 10000;

  try {
    // 動的に設定を取得
    const response = await fetch("/api/config/signup-prompt-delay");
    if (response.ok) {
      const data = (await response.json()) as { delay: string };
      const delay = parseInt(data.delay, 10);
      if (!isNaN(delay) && delay >= 0) {
        return delay;
      }
    }
  } catch (error) {
    console.warn("Failed to fetch signup prompt delay config:", error);
  }

  return 10000; // デフォルト: 10秒
};

// セッション ID 生成
const generateSessionId = () => {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  // フォールバック: Date.now() + ランダム文字列
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export function useSignupPrompt() {
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // ポップアップを非表示にする
  const hidePrompt = useCallback(() => {
    setShouldShow(false);

    // localStorage に表示履歴を記録
    if (typeof window !== "undefined") {
      const sessionId = generateSessionId();
      localStorage.setItem(STORAGE_KEYS.PROMPT_SHOWN, sessionId);
      localStorage.setItem(
        STORAGE_KEYS.PROMPT_DISMISSED,
        new Date().toISOString()
      );
    }
  }, []);

  // 手動でプロンプトを表示する関数
  const showPrompt = useCallback(() => {
    // ログイン済みユーザーには表示しない
    if (isLoggedIn) return;

    // 即時表示
    setShouldShow(true);

    // localStorage に表示履歴を記録
    if (typeof window !== "undefined") {
      const sessionId = generateSessionId();
      localStorage.setItem(STORAGE_KEYS.PROMPT_SHOWN, sessionId);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const initializePrompt = async () => {
      // クライアントサイドでのみ実行
      if (typeof window === "undefined") return;

      try {
        // 1. ユーザー認証状況を確認
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setIsLoggedIn(!!user);

        // ログインユーザーには表示しない
        if (user) {
          return;
        }

        // 2. セッション内で既に表示済みかチェック
        const currentSessionId =
          sessionStorage.getItem("session_id") || generateSessionId();
        sessionStorage.setItem("session_id", currentSessionId);

        const lastShownSession = localStorage.getItem(
          STORAGE_KEYS.PROMPT_SHOWN
        );
        if (lastShownSession === currentSessionId) {
          return;
        }

        // 3. 最近表示していないかチェック（24時間以内は再表示しない）
        const lastDismissed = localStorage.getItem(
          STORAGE_KEYS.PROMPT_DISMISSED
        );
        if (lastDismissed) {
          const lastDismissedTime = new Date(lastDismissed).getTime();
          const now = Date.now();
          const hoursPassed = (now - lastDismissedTime) / (1000 * 60 * 60);

          if (hoursPassed < 24) {
            return;
          }
        }

        // 4. 設定された秒数後に表示（環境変数 NEXT_PUBLIC_SIGNUP_PROMPT_DELAY_MS で制御可能、デフォルト5秒）
        timeoutId = setTimeout(() => {
          setShouldShow(true);
        }, await getPromptDelay()); // 環境変数またはデフォルト5秒
      } catch (error) {
        console.error("Error initializing signup prompt:", error);
      }
    };

    initializePrompt();

    // クリーンアップ
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // ページの可視性が変わった時の処理（バックグラウンドに行った時にタイマーをリセット）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setShouldShow(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return {
    shouldShow: shouldShow && isLoggedIn === false, // 非ログインユーザーのみ
    hidePrompt,
    showPrompt,
    isLoggedIn,
  };
}
