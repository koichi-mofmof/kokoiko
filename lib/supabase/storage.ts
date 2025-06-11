import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

/**
 * SupabaseのストレージからパブリックURLを生成するヘルパー関数
 * @param path ストレージ内のファイルパス（例: 'user_id/avatar.jpg'）
 * @param bucket バケット名（デフォルト: 'profile_images'）
 * @param isServer サーバーサイドでの実行かどうか（デフォルト: true）
 * @returns フルパスのパブリックURL
 */
export async function getStoragePublicUrl(
  path: string | null,
  bucket: string = "profile_images",
  isServer: boolean = true
): Promise<string | undefined> {
  if (!path) return undefined;

  // GoogleのアバターURLかチェック（http/httpsで始まる場合はそのまま返す）
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  try {
    // サーバーサイドかクライアントサイドかによって適切なクライアントを使用
    const supabase = isServer
      ? await createServerClient()
      : createBrowserClient();

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return data?.publicUrl;
  } catch (error) {
    console.error("Error getting public URL:", error);

    // フォールバック: 手動でURLを構築（エラー時のみ）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return undefined;
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  }
}
