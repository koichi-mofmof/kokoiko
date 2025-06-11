import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

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
  {
    url: "/tokushoho",
    lastModified: new Date(),
    changeFrequency: "yearly" as const,
    priority: 0.3,
  },
];

// 認証不要の匿名Supabaseクライアントを作成（静的生成用）
function createAnonymousClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
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
      .limit(100); // 最大100件に制限してパフォーマンス確保

    if (error) {
      console.error("Error fetching public lists:", error);
      return [];
    }

    return publicLists || [];
  } catch (error) {
    console.error("Error in getPublicLists:", error);
    return [];
  }
}

// 公開リスト内の場所を取得する関数（簡略化版）
async function getPublicListPlaces() {
  try {
    const supabase = createAnonymousClient();

    // 公開リストのIDを取得
    const { data: publicListIds, error: listsError } = await supabase
      .from("place_lists")
      .select("id")
      .eq("is_public", true)
      .limit(50); // パフォーマンスのため制限

    if (listsError || !publicListIds) {
      console.error("Error fetching public list IDs:", listsError);
      return [];
    }

    // 公開リストに含まれる場所を取得
    const { data: publicPlaces, error: placesError } = await supabase
      .from("list_places")
      .select("list_id, place_id, updated_at")
      .in(
        "list_id",
        publicListIds.map((list) => list.id)
      )
      .order("updated_at", { ascending: false })
      .limit(200); // 最大200件に制限

    if (placesError) {
      console.error("Error fetching public list places:", placesError);
      return [];
    }

    return publicPlaces || [];
  } catch (error) {
    console.error("Error in getPublicListPlaces:", error);
    return [];
  }
}

export async function generateSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const entries: MetadataRoute.Sitemap = [];

  // 静的ページを追加
  for (const page of staticPages) {
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
        lastModified: list.updated_at ? new Date(list.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    // 公開リスト内の場所詳細ページを追加
    const publicPlaces = await getPublicListPlaces();

    for (const place of publicPlaces) {
      entries.push({
        url: `${baseUrl}/lists/${place.list_id}/place/${place.place_id}`,
        lastModified: place.updated_at
          ? new Date(place.updated_at)
          : new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error("Error adding dynamic content to sitemap:", error);
    // エラー時も静的ページだけは返す
  }

  return entries;
}
