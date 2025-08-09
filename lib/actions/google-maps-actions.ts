"use server";

import {
  autocompleteSchema,
  placeDetailsSchema,
} from "@/lib/validators/google-maps";
import {
  extractHierarchicalRegionSafe,
  type HierarchicalRegion,
} from "@/lib/utils/hierarchical-region-extraction";
import { fetchWithRateLimitServer } from "@/lib/utils/rate-limit-handler";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

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

interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
  languageCode: string;
}

interface PlaceDetailsResult {
  id: string; // placeId
  formattedAddress?: string;
  location?: {
    // geometry.location だったもの
    latitude: number;
    longitude: number;
  };
  addressComponents?: AddressComponent[];
  hierarchicalRegion?: HierarchicalRegion;
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
): Promise<{
  predictions?: ClientAutocompletePrediction[];
  error?: string;
  errorKey?: string;
}> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps APIキーが設定されていません。");
    return { errorKey: "errors.maps.apiKeyMissing" };
  }

  const validatedFields = autocompleteSchema.safeParse({
    query: formData.get("query"),
    sessionToken: formData.get("sessionToken"),
    languageCode: (formData.get("languageCode") as string) || "ja",
  });

  if (!validatedFields.success) {
    return { errorKey: "errors.validation.invalidInput" };
  }

  const { query, sessionToken, languageCode } = validatedFields.data;

  const url = `https://places.googleapis.com/v1/places:autocomplete`;

  const requestBody = {
    input: query,
    sessionToken: sessionToken,
    languageCode: languageCode,
  };

  try {
    const response = await fetchWithRateLimitServer(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        },
        body: JSON.stringify(requestBody),
      },
      {
        maxRetries: 2, // Google Maps APIは制限が厳しいため少なめに設定
      }
    );

    const data = (await response.json()) as {
      suggestions?: AutocompleteSuggestion[];
      error?: { message?: string; details?: Array<{ reason?: string }> };
    };

    if (!response.ok) {
      console.error("Google Maps Autocomplete API (New) error:", data);
      return { errorKey: "errors.maps.autocompleteFailed" };
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
    return { errorKey: "errors.network.autocompleteFailed" };
  }
}

export async function getPlaceDetails(
  prevState: unknown,
  formData: FormData
): Promise<{
  placeDetails?: PlaceDetailsResult;
  error?: string;
  errorKey?: string;
}> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps APIキーが設定されていません。");
    return { errorKey: "errors.maps.apiKeyMissing" };
  }

  const validatedFields = placeDetailsSchema.safeParse({
    placeId: formData.get("placeId"),
    sessionToken: formData.get("sessionToken"),
    languageCode: (formData.get("languageCode") as string) || "ja",
    regionCode: (formData.get("regionCode") as string) || "JP",
  });

  if (!validatedFields.success) {
    return { errorKey: "errors.validation.invalidInput" };
  }

  const { placeId, sessionToken, languageCode, regionCode } =
    validatedFields.data;

  const fields = "id,formattedAddress,location,addressComponents";

  const url = `https://places.googleapis.com/v1/places/${placeId}?sessionToken=${sessionToken}&languageCode=${languageCode}&regionCode=${regionCode}`;

  try {
    const response = await fetchWithRateLimitServer(
      url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask": fields,
        },
      },
      {
        maxRetries: 2,
      }
    );

    const data = (await response.json()) as {
      id?: string;
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
      addressComponents?: AddressComponent[];
      error?: { message?: string; details?: Array<{ reason?: string }> };
    };

    if (!response.ok) {
      console.error("Google Maps Place Details API (New) error:", data);
      return { errorKey: "errors.maps.placeDetailsFailed" };
    }

    // 階層地域情報の抽出
    const hierarchicalRegion = data.addressComponents
      ? extractHierarchicalRegionSafe(data.addressComponents)
      : null;

    const clientPlaceDetails: PlaceDetailsResult = {
      id: data.id || "",
      formattedAddress: data.formattedAddress,
      location: data.location
        ? {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          }
        : undefined,
      addressComponents: data.addressComponents,
      hierarchicalRegion: hierarchicalRegion || undefined,
    };

    return { placeDetails: clientPlaceDetails };
  } catch (error) {
    console.error(
      "Network error calling Google Maps Place Details API (New):",
      error
    );
    return { errorKey: "errors.network.placeDetailsFailed" };
  }
}
