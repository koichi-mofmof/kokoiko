// Google MapsのURL形式から位置情報を取得する関数
export async function getLocationFromGoogleMapsUrl(url: string): Promise<{
  name: string;
  address: string;
  latitude: number;
  longitude: number;
} | null> {
  // URLからプレースIDやクエリパラメータを抽出
  const placeId = extractPlaceId(url);
  const query = extractQuery(url);

  if (!placeId && !query) {
    return null;
  }

  // 実際の実装ではGoogle Maps APIを使用して位置情報を取得
  // このモックでは常に成功すると仮定
  // Google Maps Places APIを使う実際の実装に置き換えることができます

  // モックデータを返す
  return {
    name: query || "Unknown Place",
    address: "東京都渋谷区",
    latitude: 35.66151,
    longitude: 139.70062,
  };
}

// Google Maps URLからプレースIDを抽出する関数
function extractPlaceId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get("place_id");
  } catch {
    return null;
  }
}

// Google Maps URLからクエリを抽出する関数
function extractQuery(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get("q");
  } catch {
    return null;
  }
}

// Google Maps Static APIのURLを生成する関数
export function getStaticMapUrl(
  latitude: number,
  longitude: number,
  zoom: number = 15,
  width: number = 600,
  height: number = 300
): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${latitude},${longitude}&key=${apiKey}`;
}
