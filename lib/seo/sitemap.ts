import { createClient } from "@supabase/supabase-js";
import { MetadataRoute } from "next";

// CloudFlare Workers + OpenNext環境での環境変数取得ヘルパー関数
function getBaseUrl(env?: Record<string, string>): string {
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
const staticPages = [
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
const samplePages = [
  {
    url: "/sample",
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  },
  {
    url: "/sample/sample-sunny-day",
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  },
  {
    url: "/sample/sample-osaka-trip",
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  },
  {
    url: "/sample/sample-favorite-saunas",
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  },
];

// 認証不要の匿名Supabaseクライアントを作成（静的生成用）
function createAnonymousClient() {
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

// 公開リストを取得する関数
async function getPublicLists() {
  try {
    const supabase = createAnonymousClient();

    const { data: publicLists, error } = await supabase
      .from("place_lists")
      .select("id, name, updated_at")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(50); // パフォーマンス向上のため制限を50に調整

    if (error) {
      console.error("❌ 公開リスト取得エラー:", error);
      return [];
    }

    console.log(`✅ ${publicLists?.length || 0}件の公開リストを取得`);
    return publicLists || [];
  } catch (error) {
    console.error("❌ getPublicLists実行エラー:", error);
    return [];
  }
}

export async function generateSitemapEntries(
  env?: Record<string, string>
): Promise<MetadataRoute.Sitemap> {
  // CloudFlare Workers環境での環境変数取得を改善
  const baseUrl = getBaseUrl(env);
  console.log(`🌐 サイトマップ生成開始: ${baseUrl}`);

  const entries: MetadataRoute.Sitemap = [];

  try {
    // 静的ページを追加
    for (const page of staticPages) {
      entries.push({
        url: `${baseUrl}${page.url}`,
        lastModified: page.lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }

    // サンプルページを追加
    for (const page of samplePages) {
      entries.push({
        url: `${baseUrl}${page.url}`,
        lastModified: page.lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }

    // 動的な公開リストページを追加
    try {
      const publicLists = await getPublicLists();

      for (const list of publicLists) {
        entries.push({
          url: `${baseUrl}/lists/${list.id}`,
          lastModified: list.updated_at
            ? new Date(list.updated_at)
            : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    } catch (error) {
      console.error("❌ 公開リスト処理エラー:", error);
      // エラー時も静的ページは返す
    }

    console.log(`✅ サイトマップ生成完了: ${entries.length}件のエントリー`);
    return entries;
  } catch (error) {
    console.error("❌ サイトマップ生成エラー:", error);

    // 最低限のフォールバック
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 1,
      },
    ];
  }
}
