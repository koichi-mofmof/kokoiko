"use server";

import { z } from "zod";

// 環境変数からAPIキーを取得 (安全な方法で管理されている前提)
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const autocompleteSchema = z.object({
  query: z.string().min(1, "検索クエリは必須です。"),
  sessionToken: z.string().uuid("無効なセッショントークンです。"),
  languageCode: z.string().optional().default("ja"),
  regionCode: z.string().optional().default("JP"),
});

const placeDetailsSchema = z.object({
  placeId: z.string().min(1, "Place IDは必須です。"),
  sessionToken: z.string().uuid("無効なセッショントークンです。"),
  languageCode: z.string().optional().default("ja"),
  regionCode: z.string().optional().default("JP"),
});

interface AutocompleteSuggestion {
  placePrediction: {
    place: string;
    placeId: string;
    text: {
      text: string;
      matches: Array<{ endOffset: number }>;
    };
    structuredFormat?: {
      mainText?: { text: string; matches: Array<{ endOffset: number }> };
      secondaryText?: { text: string; matches: Array<{ endOffset: number }> };
    };
  };
}

interface PlaceDetailsResult {
  id: string; // placeId
  formattedAddress?: string;
  location?: {
    // geometry.location だったもの
    latitude: number;
    longitude: number;
  };
}

interface ClientAutocompletePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export async function searchPlaces(
  prevState: unknown,
  formData: FormData
): Promise<{ predictions?: ClientAutocompletePrediction[]; error?: string }> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps APIキーが設定されていません。");
    return {
      error: "サーバー設定エラーが発生しました。管理者に連絡してください。",
    };
  }

  const validatedFields = autocompleteSchema.safeParse({
    query: formData.get("query"),
    sessionToken: formData.get("sessionToken"),
    languageCode: formData.get("languageCode") || "ja",
  });

  if (!validatedFields.success) {
    return {
      error:
        validatedFields.error.flatten().fieldErrors.query?.[0] ||
        validatedFields.error.flatten().fieldErrors.sessionToken?.[0] ||
        "入力内容に誤りがあります。",
    };
  }

  const { query, sessionToken, languageCode } = validatedFields.data;

  const url = `https://places.googleapis.com/v1/places:autocomplete`;

  const requestBody = {
    input: query,
    sessionToken: sessionToken,
    languageCode: languageCode,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Google Maps Autocomplete API (New) error:", data);
      const detail = data.error?.details?.[0];
      let errorMessage = "場所の検索中にエラーが発生しました。";
      if (detail?.reason) errorMessage += ` (${detail.reason})`;
      return { error: data.error?.message || errorMessage };
    }

    const clientPredictions: ClientAutocompletePrediction[] = (
      data.suggestions || []
    )
      .map((suggestion: AutocompleteSuggestion) => ({
        place_id: suggestion.placePrediction.placeId,
        description: suggestion.placePrediction.text.text,
        structured_formatting: {
          main_text:
            suggestion.placePrediction.structuredFormat?.mainText?.text ||
            suggestion.placePrediction.text.text,
          secondary_text:
            suggestion.placePrediction.structuredFormat?.secondaryText?.text ||
            "",
        },
      }))
      .filter((p: ClientAutocompletePrediction) => p.place_id && p.description);

    return { predictions: clientPredictions };
  } catch (error) {
    console.error(
      "Network error calling Google Maps Autocomplete API (New):",
      error
    );
    return {
      error: "ネットワークエラーが発生しました。場所を検索できませんでした。",
    };
  }
}

export async function getPlaceDetails(
  prevState: unknown,
  formData: FormData
): Promise<{ placeDetails?: PlaceDetailsResult; error?: string }> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps APIキーが設定されていません。");
    return {
      error: "サーバー設定エラーが発生しました。管理者に連絡してください。",
    };
  }

  const validatedFields = placeDetailsSchema.safeParse({
    placeId: formData.get("placeId"),
    sessionToken: formData.get("sessionToken"),
    languageCode: formData.get("languageCode") || "ja",
    regionCode: formData.get("regionCode") || "JP",
  });

  if (!validatedFields.success) {
    return {
      error:
        validatedFields.error.flatten().fieldErrors.placeId?.[0] ||
        validatedFields.error.flatten().fieldErrors.sessionToken?.[0] ||
        "入力内容に誤りがあります。",
    };
  }

  const { placeId, sessionToken, languageCode, regionCode } =
    validatedFields.data;

  const fields = "id,formattedAddress,location";

  const url = `https://places.googleapis.com/v1/places/${placeId}?sessionToken=${sessionToken}&languageCode=${languageCode}&regionCode=${regionCode}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": fields,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Google Maps Place Details API (New) error:", data);
      const detail = data.error?.details?.[0];
      let errorMessage = "場所の詳細取得中にエラーが発生しました。";
      if (detail?.reason) errorMessage += ` (${detail.reason})`;
      return { error: data.error?.message || errorMessage };
    }

    const clientPlaceDetails: PlaceDetailsResult = {
      id: data.id,
      formattedAddress: data.formattedAddress,
      location: data.location
        ? {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          }
        : undefined,
    };

    return { placeDetails: clientPlaceDetails };
  } catch (error) {
    console.error(
      "Network error calling Google Maps Place Details API (New):",
      error
    );
    return {
      error:
        "ネットワークエラーが発生しました。場所の詳細を取得できませんでした。",
    };
  }
}
