/**
 * SupabaseのストレージからパブリックURLを生成するヘルパー関数
 * @param path ストレージ内のファイルパス（例: 'user_id/avatar.jpg'）
 * @param bucket バケット名（デフォルト: 'profile_images'）
 * @param isServer サーバーサイドでの実行かどうか（デフォルト: true）
 * @returns フルパスのパブリックURL
 */
export async function getStoragePublicUrl(
  path: string | null,
  bucket: string = "profile_images"
): Promise<string | undefined> {
  if (!path) return undefined;

  // GoogleのアバターURLかチェック（http/httpsで始まる場合はそのまま返す）
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Supabase SDKのgetPublicUrlはクライアント生成不要の純関数ではないため、
  // 安全にフォールバックURLを組み立てる（公開バケット前提の軽量処理）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return undefined;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
