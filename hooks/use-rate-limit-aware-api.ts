/**
 * React Hook: レート制限対応API呼び出し
 */

import { useState, useCallback } from "react";
import { apiClient, ApiError } from "@/lib/utils/api-client";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useRateLimitAwareApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      console.error("API呼び出しエラー:", error);

      let errorMessage = "不明なエラーが発生しました";

      if (error instanceof ApiError) {
        if (error.isRateLimit) {
          errorMessage =
            "アクセス制限に達しました。しばらく時間をおいてからお試しください。";
        } else if (error.isServerError) {
          errorMessage =
            "サーバーエラーが発生しました。しばらく時間をおいてからお試しください。";
        } else if (error.isClientError) {
          errorMessage =
            "リクエストエラーが発生しました。入力内容をご確認ください。";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * 具体的なAPI呼び出し用のカスタムフック
 */
export function useListApi() {
  const api = useRateLimitAwareApi<any>();

  const fetchLists = useCallback(() => {
    return api.execute(() => apiClient.get("/api/lists"));
  }, [api]);

  const createList = useCallback(
    (listData: any) => {
      return api.execute(() => apiClient.post("/api/lists", listData));
    },
    [api]
  );

  return {
    ...api,
    fetchLists,
    createList,
  };
}

/**
 * Google Maps API用のカスタムフック
 */
export function useGoogleMapsApi() {
  const api = useRateLimitAwareApi<any>();

  const searchPlaces = useCallback(
    (query: string) => {
      return api.execute(() =>
        apiClient.post("/api/google-maps/search", { query })
      );
    },
    [api]
  );

  const getPlaceDetails = useCallback(
    (placeId: string) => {
      return api.execute(() =>
        apiClient.get(`/api/google-maps/details/${placeId}`)
      );
    },
    [api]
  );

  return {
    ...api,
    searchPlaces,
    getPlaceDetails,
  };
}
