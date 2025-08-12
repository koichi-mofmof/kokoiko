import { createClient } from "@supabase/supabase-js";

// CloudFlare Workers + OpenNext環境での環境変数取得ヘルパー関数
export function getBaseUrl(env?: Record<string, string>): string {
  // 本番環境の確実な判定（最優先）
  const isProduction =
    (env && env.NODE_ENV === "production") ||
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    (typeof globalThis !== "undefined" && "ASSETS" in globalThis) ||
    (typeof process !== "undefined" && process.env.CF_PAGES === "1");

  if (isProduction) {
    return "https://clippymap.com";
  }

  // OpenNext推奨の環境変数取得順序（開発環境のみ）

  // 1. CloudFlare Workers env オブジェクト
  if (env && env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL;
  }

  // 2. process.env（通常のNext.js環境）
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 3. 開発環境フォールバック
  if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
    return "http://localhost:3000";
  }

  // 4. 最終フォールバック（本番環境）
  return "https://clippymap.com";
}

// 静的ページの定義
export const staticPages = [
  {
    url: "",
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 1,
  },
  {
    url: "/help",
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  },
  {
    url: "/privacy",
    lastModified: new Date(),
    changeFrequency: "yearly" as const,
    priority: 0.5,
  },
  {
    url: "/terms",
    lastModified: new Date(),
    changeFrequency: "yearly" as const,
    priority: 0.5,
  },
];

// サンプルページの定義
// sampleページは現在未提供のため空
export const samplePages: Array<never> = [];

// 認証不要の匿名Supabaseクライアントを作成（静的生成用）
export function createAnonymousClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Supabase環境変数が設定されていません");
    throw new Error("Supabase environment variables are not set");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // セッション保持を無効化
      autoRefreshToken: false,
    },
  });
}

/**
 * 公開リストの総件数を取得
 */
export async function countPublicListsTotal(): Promise<number> {
  try {
    const supabase = createAnonymousClient();
    const { count, error } = await supabase
      .from("place_lists")
      .select("id", { count: "exact", head: true })
      .eq("is_public", true);

    if (error) {
      console.error("❌ 公開リスト総数取得エラー:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("❌ countPublicListsTotal実行エラー:", error);
    return 0;
  }
}

/**
 * 公開リストのページング取得
 */
export async function getPublicListsPaged(
  page: number,
  pageSize: number
): Promise<{ id: string; updated_at: string | null }[]> {
  try {
    const supabase = createAnonymousClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("place_lists")
      .select("id, updated_at")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("❌ 公開リストページ取得エラー:", error);
      return [];
    }

    return (data as { id: string; updated_at: string | null }[]) || [];
  } catch (error) {
    console.error("❌ getPublicListsPaged実行エラー:", error);
    return [];
  }
}
